// routes/authRoutes.js
import express from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import pool from "../db.js";
import { loginLimiter } from "../middleware/limiter.js";
import { verifyToken } from "../middleware/authMiddleware.js"; // 👈 Import ini untuk endpoint /me
import { logActivity } from "../utils/logger.js"; // 👈 Import Logger

const router = express.Router();

/**
 * 1. LOGIN
 * Menerima email & password, mengembalikan User Data & Set HttpOnly Cookie
 */
router.post("/login", loginLimiter, async (req, res) => {
  let { email, password } = req.body;
  if (email) email = email.trim();
  if (password) password = password.trim();
  const invalidCredentialsMsg = "Email atau password salah";

  if (!email || !password) {
    return res.status(400).json({ message: "Email dan password wajib diisi" });
  }

  try {
    // A. Ambil user dasar
    const userRes = await pool.query(
      `SELECT id, name, email, password_hash, entity_id
       FROM users
       WHERE email = $1 AND deleted_at IS NULL
       LIMIT 1`,
      [email]
    );

    if (userRes.rowCount === 0) {
      return res.status(401).json({ message: invalidCredentialsMsg });
    }

    const row = userRes.rows[0];

    // B. Cek Password
    const match = await bcrypt.compare(password, row.password_hash || "");
    // 👇 DEBUG LOG (Hapus nanti kalau sudah fix)
    console.log(`🔍 Cek Login User: ${row.email}`);
    console.log(`   Input Password: ${password}`);
    console.log(`   Hash di DB: ${row.password_hash}`);
    console.log(`   Hasil Match: ${match}`);
    if (!match) {
      return res.status(401).json({ message: invalidCredentialsMsg });
    }

    // C. Ambil Roles
    const rolesRes = await pool.query(
      `SELECT r.id, r.name, r.slug
       FROM roles r
       JOIN user_roles ur ON ur.role_id = r.id
       WHERE ur.user_id = $1`,
      [row.id]
    );
    const roles = rolesRes.rows;

    // D. Ambil Permissions (Flatten ke array slug)
    const permsRes = await pool.query(
      `SELECT DISTINCT p.slug
       FROM permissions p
       JOIN role_permissions rp ON rp.permission_id = p.id
       JOIN user_roles ur ON ur.role_id = rp.role_id
       WHERE ur.user_id = $1`,
      [row.id]
    );
    const permissions = permsRes.rows.map(r => r.slug);

    // E. Ambil Entity (Jika ada)
    let entity = null;
    if (row.entity_id) {
      const entRes = await pool.query(
        `SELECT id, name, code FROM entities WHERE id = $1`,
        [row.entity_id]
      );
      if (entRes.rowCount > 0) entity = entRes.rows[0];
    }

    // F. Generate Token
    const secret = process.env.JWT_SECRET || "rahasia_default";
    const token = jwt.sign(
      { 
        id: row.id, 
        email: row.email,
        roleSlugs: roles.map(r => r.slug) 
      },
      secret,
      { expiresIn: "1d" }
    );

    // G. Set Cookie
    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 24 * 60 * 60 * 1000, // 1 Hari
    });

    // H. Audit Log Login
    // Kita panggil manual karena req.user belum ada di middleware login
    // Tapi kita bisa mock object req-nya atau buat log manual
    // (Opsional, tapi bagus untuk tracking)
    /* await logActivity({ user: { id: row.id, email: row.email } }, {
       action: "LOGIN",
       entity_type: "AUTH",
       entity_id: row.id,
       details: { ip: req.ip }
    });
    */

    // I. Response
    const user = {
      id: row.id,
      name: row.name,
      email: row.email,
      entity,
      roles,
      permissions,
    };

    res.json({
      message: "Login berhasil",
      user,
    });

  } catch (err) {
    console.error("POST /api/login error:", err);
    res.status(500).json({ message: "Terjadi kesalahan pada server" });
  }
});

/**
 * 2. CEK SESSION (GET /me) - 🔥 WAJIB DITAMBAHKAN 🔥
 * Dipanggil saat User Refresh Halaman (F5) untuk mengembalikan data user
 * tanpa perlu login ulang (selama cookie masih valid).
 */
router.get("/me", verifyToken, async (req, res) => {
  try {
    const userId = req.user.id; // Dari verifyToken middleware

    // Logic ambil datanya SAMA PERSIS dengan Login, tapi tanpa password check
    // 1. User Info
    const userRes = await pool.query(
      `SELECT id, name, email, entity_id FROM users WHERE id = $1 AND deleted_at IS NULL`,
      [userId]
    );
    
    if (userRes.rowCount === 0) {
      // Kasus aneh: Token valid, tapi user dihapus DB
      res.clearCookie("token");
      return res.status(401).json({ message: "User tidak ditemukan" });
    }
    const row = userRes.rows[0];

    // 2. Roles
    const rolesRes = await pool.query(
      `SELECT r.id, r.name, r.slug FROM roles r JOIN user_roles ur ON ur.role_id = r.id WHERE ur.user_id = $1`,
      [userId]
    );

    // 3. Permissions
    const permsRes = await pool.query(
      `SELECT DISTINCT p.slug FROM permissions p 
       JOIN role_permissions rp ON rp.permission_id = p.id 
       JOIN user_roles ur ON ur.role_id = rp.role_id 
       WHERE ur.user_id = $1`,
      [userId]
    );

    // 4. Entity
    let entity = null;
    if (row.entity_id) {
      const entRes = await pool.query(`SELECT id, name, code FROM entities WHERE id = $1`, [row.entity_id]);
      if (entRes.rowCount > 0) entity = entRes.rows[0];
    }

    const user = {
      id: row.id,
      name: row.name,
      email: row.email,
      entity,
      roles: rolesRes.rows,
      permissions: permsRes.rows.map(r => r.slug),
    };

    res.json({ user });

  } catch (err) {
    console.error("GET /me error:", err);
    res.status(500).json({ message: "Gagal memuat sesi pengguna" });
  }
});

/**
 * 3. LOGOUT
 */
router.post("/logout", (req, res) => {
  // Audit Log Logout (Optional - butuh verifyToken di route ini jika ingin log ID user)
  res.clearCookie("token", {
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production"
  });
  res.json({ message: "Logout berhasil" });
});

export default router;