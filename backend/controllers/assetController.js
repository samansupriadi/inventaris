// backend/controllers/assetController.js
import pool from "../db.js";
import { logActivity } from "../utils/logger.js";

// --- HELPER ---
const parseNumber = (val) => {
  const num = parseFloat(val);
  return isNaN(num) ? 0 : num;
};

// 1. GET ALL ASSETS
export const getAssets = async (req, res) => {
  const { entity_id, include_deleted } = req.query;
  try {
    let query = `
      SELECT a.* FROM assets a
    `;
    const params = [];
    const where = [];

    if (include_deleted !== "true") {
      where.push(`a.deleted_at IS NULL`);
    }

    if (entity_id) {
      query += ` JOIN funding_sources fs ON fs.id = a.funding_source_id `;
      params.push(entity_id);
      where.push(`fs.entity_id = $${params.length}`);
    }

    if (where.length) query += ` WHERE ${where.join(" AND ")} `;
    query += ` ORDER BY a.created_at DESC`;

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    console.error("[GET_ASSETS]", err);
    res.status(500).json({ message: "Gagal mengambil data aset" });
  }
};

// 2. GET SINGLE ASSET
export const getAssetById = async (req, res) => {
    const { id } = req.params;
    try {
        const result = await pool.query("SELECT * FROM assets WHERE id = $1", [id]);
        if (result.rows.length === 0) return res.status(404).json({ message: "Aset tidak ditemukan" });
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ message: "Gagal mengambil detail aset" });
    }
};

// 3. CREATE ASSET
export const createAsset = async (req, res) => {
  const {
    name, location, location_id, condition, funding_source_id,
    category_id, budget_code_id, notes, purchase_date,
    value, useful_life, residual_value
  } = req.body;

  if (!name) return res.status(400).json({ message: "Nama aset wajib diisi" });

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // Generate Code Logic
    const fsRes = await client.query(`SELECT code FROM funding_sources WHERE id = $1`, [funding_source_id]);
    const catRes = await client.query(`SELECT code, useful_life FROM asset_categories WHERE id = $1`, [category_id]);
    
    if (fsRes.rowCount === 0 || catRes.rowCount === 0) throw new Error("Data Master tidak valid");

    const fsCode = fsRes.rows[0].code;
    const catCode = catRes.rows[0].code;
    const catLife = parseNumber(catRes.rows[0].useful_life);

    const seqRes = await client.query(
        `SELECT COALESCE(MAX(sequence_no), 0) + 1 AS next_seq FROM assets WHERE funding_source_id = $1 AND category_id = $2`,
        [funding_source_id, category_id]
    );
    const seq = seqRes.rows[0].next_seq;
    
    const date = purchase_date ? new Date(purchase_date) : new Date();
    const code = `${String(seq).padStart(4, "0")}/${fsCode}-${catCode}/${String(date.getMonth()+1).padStart(2,"0")}-${date.getFullYear()}`;

    const insertRes = await client.query(
      `INSERT INTO assets 
       (name, code, location, location_id, condition, status, funding_source_id, category_id, budget_code_id, notes, purchase_date, sequence_no, value, useful_life, residual_value)
       VALUES ($1, $2, $3, $4, $5, 'available', $6, $7, $8, $9, $10, $11, $12, $13, $14)
       RETURNING *`,
      [name, code, location, location_id, condition || 'baik', funding_source_id, category_id, budget_code_id, notes, date, seq, parseNumber(value), useful_life || catLife, parseNumber(residual_value)]
    );

    await client.query("COMMIT");

    await logActivity(req, { action: "CREATE", entity_type: "ASSET", entity_id: insertRes.rows[0].id, details: { name } });

    res.status(201).json(insertRes.rows[0]);
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("[CREATE_ASSET]", err);
    res.status(500).json({ message: err.message });
  } finally {
    client.release();
  }
};

// 4. UPDATE ASSET
export const updateAsset = async (req, res) => {
    const { id } = req.params;
    const { name, location, location_id, condition, status, funding_source_id, category_id, budget_code_id, notes, purchase_date, value, useful_life, residual_value } = req.body;

    try {
        const result = await pool.query(
            `UPDATE assets SET 
             name=$1, location=$2, location_id=$3, condition=$4, status=COALESCE($5, status), 
             funding_source_id=$6, category_id=$7, budget_code_id=$8, notes=$9, purchase_date=$10, 
             value=$11, useful_life=$12, residual_value=$13, updated_at=NOW()
             WHERE id=$14 RETURNING *`,
            [name, location, location_id, condition, status, funding_source_id, category_id, budget_code_id, notes, purchase_date, parseNumber(value), parseNumber(useful_life), parseNumber(residual_value), id]
        );
        
        if (result.rowCount === 0) return res.status(404).json({ message: "Aset tidak ditemukan" });
        
        await logActivity(req, { action: "UPDATE", entity_type: "ASSET", entity_id: id, details: { changes: req.body } });
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ message: "Gagal update aset" });
    }
};

// 5. DELETE ASSET
export const deleteAsset = async (req, res) => {
    const { id } = req.params;
    try {
        await pool.query("UPDATE assets SET deleted_at = NOW() WHERE id = $1", [id]);
        await logActivity(req, { action: "DELETE", entity_type: "ASSET", entity_id: id, details: { type: "Soft Delete" } });
        res.json({ message: "Aset dihapus" });
    } catch (err) {
        res.status(500).json({ message: "Gagal hapus aset" });
    }
};

// 6. RESTORE ASSET
export const restoreAsset = async (req, res) => {
    const { id } = req.params;
    try {
        await pool.query("UPDATE assets SET deleted_at = NULL WHERE id = $1", [id]);
        await logActivity(req, { action: "RESTORE", entity_type: "ASSET", entity_id: id, details: { type: "Restore" } });
        res.json({ message: "Aset dipulihkan" });
    } catch (err) {
        res.status(500).json({ message: "Gagal restore aset" });
    }
};

// 7. UPLOAD PHOTO
export const uploadAssetPhoto = async (req, res) => {
    const { id } = req.params;
    if (!req.file) return res.status(400).json({ message: "File wajib ada" });
    try {
        const path = `/uploads/${req.file.filename}`;
        await pool.query("UPDATE assets SET photo_url = $1 WHERE id = $2", [path, id]);
        res.json({ photo_url: path });
    } catch (err) {
        res.status(500).json({ message: "Gagal upload foto" });
    }
};

// 8. UPLOAD RECEIPT
export const uploadAssetReceipt = async (req, res) => {
    const { id } = req.params;
    if (!req.file) return res.status(400).json({ message: "File wajib ada" });
    try {
        const path = `/uploads/${req.file.filename}`;
        await pool.query("UPDATE assets SET receipt_url = $1 WHERE id = $2", [path, id]);
        res.json({ receipt_url: path });
    } catch (err) {
        res.status(500).json({ message: "Gagal upload kwitansi" });
    }
};



// backend/controllers/assetController.js

// ... (kode atas sama) ...

// ==========================================
// 🚀 PERBAIKAN: FITUR PINJAM (DEBUGGING FOTO)
// ==========================================
export const borrowAsset = async (req, res) => {
    const { id } = req.params;
    const { borrower_user_id, usage_location_id, due_date, notes, condition_now, detail_location } = req.body;
    
    // DEBUG: Cek apakah file masuk
    console.log("--> Request Body:", req.body);
    console.log("--> Request File:", req.file); 

    // Pastikan path foto benar. Jika pakai Windows, path separator beda, jadi kita standarkan pakai '/'
    const photoPath = req.file ? `/uploads/${req.file.filename}` : null;
  
    try {
      const assetCheck = await pool.query("SELECT * FROM assets WHERE id = $1", [id]);
      if (assetCheck.rows.length === 0) return res.status(404).json({ message: "Aset tidak ditemukan" });
      const asset = assetCheck.rows[0];
  
      if (asset.status === 'borrowed') {
        return res.status(400).json({ message: "Gagal! Aset ini statusnya MASIH DIPINJAM orang lain." });
      }
      if (asset.status !== 'available') {
        return res.status(400).json({ message: `Aset tidak tersedia. Status: ${asset.status}` });
      }
  
      const userRes = await pool.query("SELECT name FROM users WHERE id = $1", [borrower_user_id]);
      const borrowerName = userRes.rows[0]?.name || "Unknown";
  
      await pool.query(
        `INSERT INTO loans (
            asset_id, borrower_user_id, borrower, usage_location_id, 
            borrowed_at, due_date, notes, condition_before, detail_location, 
            before_photo_url, status
         )
         VALUES ($1, $2, $3, $4, NOW(), $5, $6, $7, $8, $9, 'borrowed')`,
        [id, borrower_user_id, borrowerName, usage_location_id, due_date || null, notes, condition_now, detail_location, photoPath]
      );
  
      await pool.query(
        `UPDATE assets SET status = 'borrowed', last_borrower = $1, location_id = $2, location = $3 WHERE id = $4`,
        [borrowerName, usage_location_id, detail_location || asset.location, id]
      );
  
      await logActivity(req, { action: "BORROW", entity_type: "ASSET", entity_id: id, details: { borrower: borrowerName } });
  
      res.json({ message: "Peminjaman berhasil dicatat" });
    } catch (err) {
      console.error("[BORROW_ERROR]", err);
      res.status(500).json({ message: err.message || "Gagal memproses peminjaman" });
    }
};

// ==========================================
// 🚀 UPDATE: FITUR KEMBALI (MENERIMA STATUS DARI FRONTEND)
// ==========================================
export const returnAsset = async (req, res) => {
    const { id } = req.params; 
    const { 
        condition_after, 
        return_location_id, 
        return_detail_location, 
        notes_return,
        update_asset_location,
        new_status // 👈 1. Tangkap parameter ini dari Frontend
    } = req.body;
    
    console.log("--> Return Body:", req.body);
    console.log("--> Return File:", req.file);

    const photoPath = req.file ? `/uploads/${req.file.filename}` : null;

    try {
        // 1. Cek apakah aset sedang dipinjam
        const loanCheck = await pool.query(
            `SELECT id FROM loans WHERE asset_id = $1 AND status = 'borrowed' ORDER BY borrowed_at DESC LIMIT 1`,
            [id]
        );

        if (loanCheck.rows.length === 0) {
            return res.status(400).json({ message: "Aset ini tidak sedang dipinjam (tidak ada data loan aktif)" });
        }
        const loanId = loanCheck.rows[0].id;

        // 2. Update status peminjaman jadi 'returned'
        await pool.query(
            `UPDATE loans SET 
                returned_at = NOW(), 
                condition_after = $1, 
                notes_return = $2,
                after_photo_url = $3,
                status = 'returned'
             WHERE id = $4`,
            [condition_after, notes_return, photoPath, loanId]
        );

        // 3. TENTUKAN STATUS ASET BARU
        // Prioritaskan 'new_status' dari frontend. Jika null, pakai logika fallback.
        let statusToUpdate = new_status;
        
        if (!statusToUpdate) {
            // Fallback Logic (Jika frontend lupa kirim new_status)
            if (condition_after === 'rusak') statusToUpdate = 'rusak';
            else if (condition_after === 'hilang') statusToUpdate = 'hilang';
            else statusToUpdate = 'available';
        }

        // 4. Siapkan Query Update Aset
        let updateAssetQuery = `
            UPDATE assets 
            SET status = $1, 
                condition = $2,
                last_borrower = NULL -- Kosongkan peminjam karena sudah kembali
        `;
        let updateAssetParams = [statusToUpdate, condition_after];

        // 5. Cek apakah lokasi perlu diupdate?
        // (Logic: Jika user mengirim lokasi baru, kita update. Jika tidak, lokasi tetap yg lama)
        if (return_location_id) {
            updateAssetQuery += `, location_id = $3, location = $4`;
            updateAssetParams.push(return_location_id, return_detail_location);
        }

        // Tambahkan WHERE clause
        updateAssetQuery += ` WHERE id = $${updateAssetParams.length + 1}`;
        updateAssetParams.push(id);

        // Eksekusi Update Aset
        await pool.query(updateAssetQuery, updateAssetParams);

        // Log Aktivitas
        await logActivity(req, { 
            action: "RETURN", 
            entity_type: "ASSET", 
            entity_id: id, 
            details: { condition: condition_after, status_baru: statusToUpdate } 
        });

        res.json({ message: "Aset berhasil dikembalikan", status: statusToUpdate });

    } catch (err) {
        console.error("[RETURN_ERROR]", err);
        res.status(500).json({ message: "Gagal memproses pengembalian" });
    }
};