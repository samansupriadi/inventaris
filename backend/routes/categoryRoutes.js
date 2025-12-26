// routes/categoryRoutes.js
import express from "express";
import pool from "../db.js";

const router = express.Router();

// LIST
router.get("/", async (req, res) => {
  try {
    // Tambahkan is_depreciable
    const result = await pool.query(
      `SELECT id, name, code, description, useful_life, is_depreciable, created_at
       FROM asset_categories
       ORDER BY name ASC`
    );
    res.json(result.rows);
  } catch (err) {
    console.error("Error GET /api/categories:", err);
    res.status(500).json({ message: "Gagal mengambil daftar kategori" });
  }
});

// CREATE
router.post("/", async (req, res) => {
  const { name, code, description, useful_life, is_depreciable } = req.body; // <--- Ambil field baru

  if (!name || typeof name !== 'string' || name.trim() === "") {
    return res.status(400).json({ message: "Nama kategori wajib diisi" });
  }

  const life = useful_life ? parseInt(useful_life) : 0;
  // Default is_depreciable = true jika tidak dikirim
  const depreciable = is_depreciable !== undefined ? is_depreciable : true;

  try {
    const result = await pool.query(
      `INSERT INTO asset_categories (name, code, description, useful_life, is_depreciable)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [name.trim(), code?.trim() || null, description?.trim() || null, life, depreciable]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error("Error POST /api/categories:", err);
    if (err.code === "23505") return res.status(409).json({ message: "Nama/Kode sudah digunakan" });
    res.status(500).json({ message: "Gagal membuat kategori" });
  }
});

// UPDATE
router.put("/:id", async (req, res) => {
  const id = req.params.id;
  const { name, code, description, useful_life, is_depreciable } = req.body; // <--- Ambil field baru

  if (!name || name.trim() === "") return res.status(400).json({ message: "Nama kategori wajib diisi" });

  const life = useful_life ? parseInt(useful_life) : 0;
  // Default true kalau undefined (hati-hati dengan boolean false)
  const depreciable = is_depreciable !== undefined ? is_depreciable : true;

  try {
    const result = await pool.query(
      `UPDATE asset_categories
       SET name = $1, code = $2, description = $3, useful_life = $4, is_depreciable = $5
       WHERE id = $6
       RETURNING *`,
      [name.trim(), code?.trim() || null, description?.trim() || null, life, depreciable, id]
    );

    if (result.rowCount === 0) return res.status(404).json({ message: "Kategori tidak ditemukan" });
    res.json(result.rows[0]);
  } catch (err) {
    console.error("Error PUT /api/categories/:id:", err);
    if (err.code === "23505") return res.status(409).json({ message: "Nama/Kode sudah digunakan" });
    res.status(500).json({ message: "Gagal mengubah kategori" });
  }
});

// DELETE (Tetap sama, tidak perlu ubah)
router.delete("/:id", async (req, res) => {
  const id = req.params.id;
  try {
    const used = await pool.query("SELECT COUNT(*)::int AS c FROM assets WHERE category_id = $1", [id]);
    if (used.rows[0].c > 0) return res.status(400).json({ message: "Kategori sedang dipakai oleh aset." });
    const result = await pool.query("DELETE FROM asset_categories WHERE id = $1", [id]);
    if (result.rowCount === 0) return res.status(404).json({ message: "Kategori tidak ditemukan" });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: "Gagal menghapus kategori" });
  }
});

export default router;