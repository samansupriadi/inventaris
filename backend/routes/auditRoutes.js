// backend/routes/auditRoutes.js
import express from "express";
import pool from "../db.js";
// Import middleware autentikasi
import { verifyToken, authorize } from "../middleware/authMiddleware.js"; 

const router = express.Router();

// Proteksi route ini!
// 1. verifyToken: Pastikan user sudah login
// 2. authorize('view_audit_logs'): (Opsional) Pastikan user punya permission untuk lihat audit log
// Jika belum ada permission 'view_audit_logs' di database, cukup pakai verifyToken dulu atau buat permission baru.
router.get("/", verifyToken, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        l.*, 
        u.name as user_name, 
        u.email as user_email
      FROM audit_logs l
      LEFT JOIN users u ON l.user_id = u.id
      ORDER BY l.created_at DESC
      LIMIT 100 
    `);
    
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Gagal mengambil audit log" });
  }
});

export default router;