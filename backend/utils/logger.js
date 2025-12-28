// backend/utils/logger.js
import pool from "../db.js";

export const logActivity = async (req, { action, entity_type, entity_id, details }) => {
  try {
    // Ambil User ID dari Token (pastikan middleware verifyToken sudah jalan)
    const userId = req.user ? req.user.id : null; 
    
    // Ambil IP & User Agent
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    const userAgent = req.get('User-Agent');

    await pool.query(
      `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details, ip_address, user_agent)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [userId, action, entity_type, entity_id, JSON.stringify(details), ip, userAgent]
    );
    
    console.log(`[AUDIT] ${action} on ${entity_type} ID:${entity_id}`);
  } catch (err) {
    // Jangan sampai error logging bikin aplikasi crash
    console.error("[AUDIT LOG ERROR]", err); 
  }
};