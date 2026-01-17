// routes/permissionRoutes.js
import express from "express";
import pool from "../db.js";
import { verifyToken, authorize } from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(verifyToken);

// LIST Permissions -> Ganti jadi 'manage_roles'
router.get("/", authorize("manage_roles"), async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT * FROM permissions ORDER BY group_name NULLS LAST, name ASC`
    );
    res.json(result.rows);
  } catch (err) {
    console.error("GET /api/permissions error:", err);
    res.status(500).json({ message: "Gagal mengambil permissions" });
  }
});

// CREATE Permission -> Ganti jadi 'manage_roles'
router.post("/", authorize("manage_roles"), async (req, res) => {
  const { name, slug, group_name } = req.body;
  if (!name || !slug) return res.status(400).json({ message: "Nama & slug wajib diisi" });

  try {
    const result = await pool.query(
      `INSERT INTO permissions (name, slug, group_name) VALUES ($1, $2, $3) RETURNING *`,
      [name, slug, group_name || null]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error("POST /api/permissions error:", err);
    if (err.code === "23505") return res.status(409).json({ message: "Slug permission sudah ada" });
    res.status(500).json({ message: "Gagal membuat permission" });
  }
});

// UPDATE Permission -> Ganti jadi 'manage_roles'
router.put("/:id", authorize("manage_roles"), async (req, res) => {
  const id = req.params.id;
  const { name, slug, group_name } = req.body;
  if (!name || !slug) return res.status(400).json({ message: "Nama & slug wajib diisi" });

  try {
    const result = await pool.query(
      `UPDATE permissions SET name=$1, slug=$2, group_name=$3, updated_at=NOW() WHERE id=$4 RETURNING *`,
      [name, slug, group_name || null, id]
    );
    if (result.rowCount === 0) return res.status(404).json({ message: "Permission tidak ditemukan" });
    res.json(result.rows[0]);
  } catch (err) {
    console.error("PUT /api/permissions/:id error:", err);
    if (err.code === "23505") return res.status(409).json({ message: "Slug permission sudah ada" });
    res.status(500).json({ message: "Gagal update permission" });
  }
});

// DELETE Permission -> Ganti jadi 'manage_roles'
router.delete("/:id", authorize("manage_roles"), async (req, res) => {
  const id = req.params.id;
  try {
    const result = await pool.query("DELETE FROM permissions WHERE id = $1", [id]);
    if (result.rowCount === 0) return res.status(404).json({ message: "Permission tidak ditemukan" });
    res.json({ success: true });
  } catch (err) {
    console.error("DELETE /api/permissions/:id error:", err);
    res.status(500).json({ message: "Gagal menghapus permission" });
  }
});

export default router;