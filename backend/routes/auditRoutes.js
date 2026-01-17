// backend/routes/auditRoutes.js
import express from "express";
import pool from "../db.js";
import { verifyToken, authorize } from "../middleware/authMiddleware.js"; 

const router = express.Router();

// Pasang Satpam Global
router.use(verifyToken);

// GET -> WAJIB punya izin 'view_audit_logs'
router.get("/", authorize("view_audit_logs"), async (req, res) => {
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