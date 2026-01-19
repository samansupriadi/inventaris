import express from "express";
import pool from "../db.js";
import { verifyToken } from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(verifyToken);

router.get("/summary", async (req, res) => {
  const client = await pool.connect();
  try {
    // 1. DATA UTAMA (Total, Nilai, Kondisi)
    // Kita hitung di database (SQL) biar ringan di frontend
    const statsRes = await client.query(`
      SELECT 
        COUNT(*) as total_assets,
        COALESCE(SUM(value), 0) as total_value,
        COUNT(CASE WHEN status = 'available' THEN 1 END) as available,
        COUNT(CASE WHEN status = 'borrowed' THEN 1 END) as borrowed,
        COUNT(CASE WHEN condition = 'rusak' THEN 1 END) as rusak,
        COUNT(CASE WHEN status = 'hilang' THEN 1 END) as hilang
      FROM assets 
      WHERE deleted_at IS NULL
    `);

    // 2. SUMBER DANA (Understanding)
    const fundingRes = await client.query(`
      SELECT f.name, COUNT(a.id) as count, COALESCE(SUM(a.value), 0) as total_value
      FROM funding_sources f
      LEFT JOIN assets a ON a.funding_source_id = f.id AND a.deleted_at IS NULL
      GROUP BY f.id, f.name
      ORDER BY total_value DESC
    `);

    // ---------------------------------------------------------
    // 🧠 BAGIAN WISDOM (ANALISA CERDAS)
    // ---------------------------------------------------------

    // 3. WISDOM: ALERT AUDIT
    // Cari lokasi yang BELUM pernah di-opname atau sudah > 6 bulan tidak di-opname
    const auditAlertRes = await client.query(`
      SELECT l.name, MAX(s.created_at) as last_opname
      FROM locations l
      LEFT JOIN opname_sessions s ON s.location_id = l.id AND s.status = 'Finalized'
      GROUP BY l.id, l.name
      HAVING MAX(s.created_at) < NOW() - INTERVAL '6 months' OR MAX(s.created_at) IS NULL
      LIMIT 3
    `);

    // 4. WISDOM: REKOMENDASI PEREMAJAAN (GANTI BARU)
    // Aset yang umurnya > 5 tahun DAN kondisinya rusak
    const replacementRes = await client.query(`
      SELECT COUNT(*) as count 
      FROM assets 
      WHERE deleted_at IS NULL 
      AND (condition = 'rusak' OR condition = 'maintenance')
      AND purchase_date < NOW() - INTERVAL '5 years'
    `);

    // 5. KNOWLEDGE: TREN AKURASI OPNAME TERAKHIR
    // Mengambil rata-rata akurasi dari 5 sesi opname terakhir
    const opnameTrendRes = await client.query(`
      SELECT s.title, s.created_at,
        ROUND((CAST(s.scanned_assets AS DECIMAL) / NULLIF(s.total_assets, 0)) * 100, 1) as accuracy
      FROM opname_sessions s
      WHERE s.status = 'Finalized'
      ORDER BY s.created_at DESC
      LIMIT 5
    `);

    res.json({
      stats: statsRes.rows[0],
      funding: fundingRes.rows,
      wisdom: {
        audit_alerts: auditAlertRes.rows, // Lokasi rawan (jarang diaudit)
        replacement_needed: replacementRes.rows[0].count, // Jumlah barang tua & rusak
      },
      knowledge: {
        opname_history: opnameTrendRes.rows // Grafik tren akurasi
      }
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  } finally {
    client.release();
  }
});

export default router;