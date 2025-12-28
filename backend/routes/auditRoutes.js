// backend/routes/auditRoutes.js
import express from "express";
import pool from "../db.js";
// import verifyToken from "../middleware/authMiddleware.js"; // Pasang ini nanti jika sudah ada auth

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    // Join dengan tabel users biar muncul nama, bukan cuma ID
    const result = await pool.query(`
      SELECT 
        l.*, 
        u.name as user_name, 
        u.email as user_email
      FROM audit_logs l
      LEFT JOIN users u ON l.user_id = u.id
      ORDER BY l.created_at DESC
      LIMIT 100 -- Batasi 100 terakhir agar ringan
    `);
    
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Gagal mengambil audit log" });
  }
});

export default router;