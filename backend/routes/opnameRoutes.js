// backend/routes/opnameRoutes.js
import express from "express";
import pool from "../db.js";
import { verifyToken, authorize } from "../middleware/authMiddleware.js";
import { logActivity } from "../utils/logger.js";

const router = express.Router();

// Pasang Satpam Global (Semua route di bawah ini butuh login)
router.use(verifyToken);

// ==========================================
// 1. BUAT SESI OPNAME BARU (START)
// ==========================================
router.post("/", authorize("create_opname"), async (req, res) => {
  const { title, location_id } = req.body;
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // A. Buat Session Header
    const sessionRes = await client.query(
      `INSERT INTO opname_sessions (title, location_id, created_by, status) 
       VALUES ($1, $2, $3, 'On Progress') RETURNING id`,
      [title, location_id, req.user.id]
    );
    const sessionId = sessionRes.rows[0].id;

    // B. Ambil semua aset di lokasi tersebut (Snapshot Awal)
    // Hanya aset yang aktif (tidak terhapus)
    const assetsRes = await client.query(
      `SELECT id, condition FROM assets WHERE location_id = $1 AND deleted_at IS NULL`,
      [location_id]
    );

    // C. Masukkan ke tabel opname_items sebagai daftar "To-Do"
    // Status awal = 'Missing' (Belum discan)
    if (assetsRes.rows.length > 0) {
      const values = assetsRes.rows.map(a => 
        `(${sessionId}, ${a.id}, 'Missing', '${a.condition}')`
      ).join(",");
      
      await client.query(
        `INSERT INTO opname_items (opname_session_id, asset_id, status, condition_actual) 
         VALUES ${values}`
      );
    }

    // D. Update total count di header sesi
    await client.query(
      `UPDATE opname_sessions SET total_assets = $1 WHERE id = $2`,
      [assetsRes.rows.length, sessionId]
    );

    await client.query("COMMIT");

    // Log Aktivitas
    await logActivity(req, {
        action: "OPNAME_START",
        entity_type: "OPNAME",
        entity_id: sessionId,
        details: { title, location_id }
    });

    res.json({ success: true, message: "Sesi Opname dimulai!", id: sessionId });

  } catch (err) {
    await client.query("ROLLBACK");
    console.error(err);
    res.status(500).json({ message: err.message || "Gagal membuat sesi opname" });
  } finally {
    client.release();
  }
});

// ==========================================
// 2. GET LIST SESI (DAFTAR OPNAME)
// ==========================================
router.get("/", authorize("view_opname"), async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT s.*, l.name as location_name, u.name as auditor_name 
       FROM opname_sessions s
       LEFT JOIN locations l ON l.id = s.location_id
       LEFT JOIN users u ON u.id = s.created_by
       ORDER BY s.created_at DESC`
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ==========================================
// 3. GET DETAIL SESI & ITEM LIST
// ==========================================
router.get("/:id", authorize("view_opname"), async (req, res) => {
  try {
    // Header Sesi
    const sessionRes = await pool.query(
      `SELECT s.*, l.name as location_name FROM opname_sessions s
       LEFT JOIN locations l ON l.id = s.location_id
       WHERE s.id = $1`, [req.params.id]
    );
    
    if (sessionRes.rows.length === 0) return res.status(404).json({message: "Sesi tidak ditemukan"});

    // List Item
    // Kita join ke tabel assets untuk dapat nama, kode, dan foto
    const itemsRes = await pool.query(
      `SELECT i.*, a.name as asset_name, a.code as asset_code, a.photo_url
       FROM opname_items i
       JOIN assets a ON a.id = i.asset_id
       WHERE i.opname_session_id = $1
       ORDER BY 
          CASE WHEN i.status = 'Matched' THEN 1 
               WHEN i.status = 'Moved' THEN 2
               ELSE 3 END, 
          a.name ASC`, 
      [req.params.id]
    );

    res.json({ session: sessionRes.rows[0], items: itemsRes.rows });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ==========================================
// 4. SCAN ITEM (VERIFIKASI & CATAT TEMUAN)
// ==========================================
router.post("/sessions/:id/scan", authorize("execute_opname"), async (req, res) => {
  const sessionId = req.params.id;
  const { asset_code, condition, status, notes } = req.body; 
  // Params dari body:
  // asset_code: Kode QR yang discan
  // condition: 'baik' | 'rusak' | 'hilang' (Inputan user dari popup)
  // status (optional): 'Matched' (default)

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // A. Cek Status Sesi
    const sessionRes = await client.query(`SELECT status, location_id FROM opname_sessions WHERE id = $1`, [sessionId]);
    if (sessionRes.rowCount === 0) throw new Error("Sesi tidak ditemukan");
    if (sessionRes.rows[0].status === 'Finalized') throw new Error("Sesi opname sudah ditutup");
    
    const sessionLocationId = sessionRes.rows[0].location_id;

    // B. Cari Aset di Master Database
    const assetRes = await client.query(`SELECT id, location_id FROM assets WHERE code = $1 AND deleted_at IS NULL`, [asset_code]);
    if (assetRes.rowCount === 0) throw new Error("Kode aset tidak terdaftar di sistem");
    
    const asset = assetRes.rows[0];

    // C. Tentukan Status Scan (Matched vs Moved)
    let finalStatus = 'Matched';
    // Jika lokasi aset di master BEDA dengan lokasi sesi opname -> MOVED (Barang Pindah)
    if (sessionLocationId && asset.location_id !== sessionLocationId) {
        finalStatus = 'Moved';
    }

    // D. Simpan ke opname_items (UPSERT: Insert or Update)
    // Jika barang sudah ada di list (Missing), update jadi Matched/Moved.
    // Jika barang belum ada (Barang pindahan), insert baru.
    await client.query(
      `INSERT INTO opname_items (opname_session_id, asset_id, status, condition_actual, notes, scanned_by, scanned_at)
       VALUES ($1, $2, $3, $4, $5, $6, NOW())
       ON CONFLICT (opname_session_id, asset_id) 
       DO UPDATE SET 
          status = EXCLUDED.status, 
          condition_actual = EXCLUDED.condition_actual, 
          notes = EXCLUDED.notes, 
          scanned_at = NOW(),
          scanned_by = EXCLUDED.scanned_by`,
      [sessionId, asset.id, finalStatus, condition || 'baik', notes || '', req.user.id]
    );

    // E. Update Counter Scanned Assets di Header
    await client.query(
        `UPDATE opname_sessions 
         SET scanned_assets = (SELECT COUNT(*) FROM opname_items WHERE opname_session_id = $1 AND status IN ('Matched', 'Moved'))
         WHERE id = $1`,
        [sessionId]
    );

    await client.query("COMMIT");
    
    res.json({ 
        success: true, 
        message: finalStatus === 'Moved' ? "Aset Pindahan Terdeteksi!" : "Aset Terverifikasi",
        status: finalStatus,
        asset_id: asset.id
    });

  } catch (err) {
    await client.query("ROLLBACK");
    res.status(400).json({ message: err.message });
  } finally {
    client.release();
  }
});

// ==========================================
// 5. FINALISASI (REKONSILIASI OTOMATIS)
// ==========================================
router.post("/:id/finalize", authorize("finalize_opname"), async (req, res) => {
  const sessionId = req.params.id;
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // 1. Ambil Info Sesi (Untuk target lokasi pemindahan aset 'Moved')
    const sessionRes = await client.query(
        `SELECT location_id FROM opname_sessions WHERE id = $1`, 
        [sessionId]
    );
    if (sessionRes.rows.length === 0) throw new Error("Sesi tidak ditemukan");
    
    // Pastikan sesi belum finalized
    // (Opsional cek status dulu biar aman)

    const targetLocationId = sessionRes.rows[0].location_id;

    // 2. Ambil Semua Item Hasil Scan di Sesi Ini
    // Join ke assets untuk tahu status 'borrowed' saat ini
    const itemsRes = await client.query(
        `SELECT oi.*, a.status as current_master_status 
         FROM opname_items oi
         JOIN assets a ON oi.asset_id = a.id
         WHERE oi.opname_session_id = $1`, 
        [sessionId]
    );
    const items = itemsRes.rows;

    if (items.length === 0) throw new Error("Belum ada aset yang discan.");

    let updateCount = 0;
    
    // 3. LOOPING REKONSILIASI
    for (const item of items) {
        
        // --- KASUS A: MISSING (Tidak Ditemukan) ---
        // Barang ada di list tapi tidak discan -> Tandai HILANG
        if (item.status === 'Missing') {
            await client.query(
                `UPDATE assets 
                 SET status = 'lost', condition = 'hilang', updated_at = NOW() 
                 WHERE id = $1`, 
                [item.asset_id]
            );
        }
        
        // --- KASUS B: MATCHED & MOVED (Ditemukan) ---
        else {
            // Tentukan status aset baru berdasarkan kondisi fisik & status lama
            let newStatus = 'available'; // Default
            
            // Logika Status:
            // 1. Jika Fisik RUSAK -> Status jadi 'rusak' (Mutlak, biar ga bisa dipinjam)
            if (item.condition_actual === 'rusak') {
                newStatus = 'rusak';
            } 
            // 2. Jika Fisik BAIK
            else if (item.condition_actual === 'baik') {
                // Cek status master saat ini
                if (item.current_master_status === 'borrowed') {
                    newStatus = 'borrowed'; // TETAP DIPINJAM (Hormati peminjaman)
                } else {
                    newStatus = 'available'; // Sisanya (hilang/rusak/available) jadi available kembali
                }
            }
            // 3. Jika Fisik Hilang (Kasus jarang, user input manual hilang)
            else if (item.condition_actual === 'hilang') {
                newStatus = 'lost';
            }

            // Query Dasar Update
            let updateQuery = `
                UPDATE assets 
                SET condition = $1, status = $2, updated_at = NOW() 
            `;
            let params = [item.condition_actual, newStatus];

            // KHUSUS MOVED: Update Lokasinya juga!
            if (item.status === 'Moved' && targetLocationId) {
                updateQuery += `, location_id = $3 `;
                params.push(targetLocationId);
                params.push(item.asset_id); // ID geser ke index 4
                updateQuery += `WHERE id = $4`;
            } else {
                // Matched Biasa (Lokasi Tetap)
                params.push(item.asset_id); // ID di index 3
                updateQuery += `WHERE id = $3`;
            }

            await client.query(updateQuery, params);
        }
        
        updateCount++;
    }

    // 4. Tutup Sesi Opname
    await client.query(
        `UPDATE opname_sessions 
         SET status = 'Finalized', finalized_at = NOW(), verified_by = $1, end_date = CURRENT_DATE
         WHERE id = $2`,
        [req.user.id, sessionId]
    );

    await client.query("COMMIT");

    // Log Audit
    await logActivity(req, {
        action: "OPNAME_FINALIZE",
        entity_type: "OPNAME",
        entity_id: sessionId,
        details: { 
            updated_assets: updateCount, 
            note: "Rekonsiliasi otomatis: Missing->Lost, Moved->Pindah Lokasi, Rusak->Status Rusak" 
        }
    });

    res.json({ success: true, message: `Opname selesai! ${updateCount} aset telah disinkronisasi ke Master Data.` });

  } catch (err) {
    await client.query("ROLLBACK");
    console.error(err);
    res.status(500).json({ message: err.message || "Gagal finalisasi opname" });
  } finally {
    client.release();
  }
});

export default router;