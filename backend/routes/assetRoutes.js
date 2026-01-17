// routes/assetRoutes.js
import express from "express";
import pool from "../db.js";
import { upload } from "../upload.js";
import { logActivity } from "../utils/logger.js";
import { verifyToken, authorize } from "../middleware/authMiddleware.js";
import { borrowAsset, returnAsset } from "../controllers/assetController.js";

const router = express.Router();

// --- HELPER: Validasi Angka Aman ---
const parseNumber = (val) => {
  const num = parseFloat(val);
  return isNaN(num) ? 0 : num;
};

// GET /api/assets
router.get("/", verifyToken, authorize("view_assets"), async (req, res) => {
  const { entity_id, include_deleted } = req.query;

  try {
    let query = `
      SELECT a.id, a.name, a.code, a.location, a.condition, a.status,
             a.funding_source_id, a.value, a.location_id, a.category_id,
             a.budget_code_id, a.notes, a.purchase_date, a.sequence_no,
             a.photo_url, a.receipt_url, a.created_at, a.deleted_at,
             a.useful_life, a.residual_value
      FROM assets a
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
    console.error("[GET_ASSETS_ERROR]", err);
    res.status(500).json({ message: "Terjadi kesalahan server saat mengambil data aset" });
  }
});

// POST /api/assets (TAMBAH ASET)
router.post("/", verifyToken, authorize("create_assets"), async (req, res) => {
  const {
    name, location, location_id, condition, funding_source_id,
    category_id, budget_code_id, notes, purchase_date,
    value, useful_life, residual_value
  } = req.body;

  if (!name || typeof name !== 'string' || name.trim() === "") {
    return res.status(400).json({ message: "Nama aset wajib diisi" });
  }
  if (!funding_source_id) return res.status(400).json({ message: "Sumber dana wajib dipilih" });
  if (!category_id) return res.status(400).json({ message: "Kategori aset wajib dipilih" });

  const purchaseDateStr = purchase_date || new Date().toISOString().slice(0, 10);

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // 1. Cek Sumber Dana & Kategori
    const fsRes = await client.query(`SELECT code FROM funding_sources WHERE id = $1`, [funding_source_id]);
    if (fsRes.rowCount === 0) throw new Error("Sumber dana tidak valid");
    const fsCode = fsRes.rows[0].code;

    const catRes = await client.query(`SELECT code, useful_life FROM asset_categories WHERE id = $1`, [category_id]);
    if (catRes.rowCount === 0) throw new Error("Kategori aset tidak valid");
    
    const catCode = catRes.rows[0].code;
    const catDefaultLife = parseNumber(catRes.rows[0].useful_life); 

    const inputLife = parseNumber(useful_life);
    const finalUsefulLife = inputLife > 0 ? inputLife : catDefaultLife;

    // 2. Generate Nomor Urut
    const seqRes = await client.query(
      `SELECT COALESCE(MAX(sequence_no), 0) + 1 AS next_seq 
       FROM assets WHERE funding_source_id = $1 AND category_id = $2`,
      [funding_source_id, category_id]
    );
    const seq = seqRes.rows[0].next_seq || 1;
    
    const d = new Date(purchaseDateStr);
    const monthStr = String(d.getMonth() + 1).padStart(2, "0");
    const yearStr = d.getFullYear();
    const generatedCode = `${String(seq).padStart(4, "0")}/${fsCode}-${catCode}/${monthStr}-${yearStr}`;

    // 3. Insert Data
    const insertRes = await client.query(
      `INSERT INTO assets
        (name, code, location, location_id, condition, status,
         funding_source_id, category_id, budget_code_id, notes,
         purchase_date, sequence_no,
         value, useful_life, residual_value)
       VALUES
        ($1, $2, $3, $4, $5, 'available',
         $6, $7, $8, $9,
         $10, $11,
         $12, $13, $14)
       RETURNING *`,
      [
        name.trim(), generatedCode, location ? location.trim() : null, location_id || null, condition || 'baik',
        funding_source_id, category_id, budget_code_id || null, notes ? notes.trim() : null,
        purchaseDateStr, seq, parseNumber(value), finalUsefulLife, parseNumber(residual_value)
      ]
    );

    await client.query("COMMIT");

    // LOG
    await logActivity(req, {
        action: "CREATE",
        entity_type: "ASSET",
        entity_id: insertRes.rows[0].id,
        details: { name: insertRes.rows[0].name, code: insertRes.rows[0].code }
    });

    res.status(201).json(insertRes.rows[0]);

  } catch (err) {
    await client.query("ROLLBACK");
    console.error("[CREATE_ASSET_ERROR]", err);
    res.status(500).json({ message: err.message || "Gagal membuat aset" });
  } finally {
    client.release();
  }
});

// PUT /api/assets/:id (EDIT ASET)
router.put("/:id", verifyToken, authorize("update_assets"), async (req, res) => {
  const id = req.params.id;
  const {
    name, location, location_id, condition, status,
    funding_source_id, category_id, budget_code_id,
    notes, purchase_date,
    value, useful_life, residual_value
  } = req.body;

  if (!name || name.trim() === "") return res.status(400).json({ message: "Nama aset wajib diisi" });

  try {
    const result = await pool.query(
      `UPDATE assets
       SET name = $1, location = $2, location_id = $3, condition = $4, status = COALESCE($5, status),
           funding_source_id = $6, category_id = $7, budget_code_id = $8, notes = $9, purchase_date = $10,
           value = $11, useful_life = $12, residual_value = $13, updated_at = NOW()
       WHERE id = $14 AND deleted_at IS NULL
       RETURNING *`,
      [
        name.trim(), location ? location.trim() : null, location_id || null, condition || null, status || null,
        funding_source_id || null, category_id || null, budget_code_id || null, notes ? notes.trim() : null, purchase_date || null,
        parseNumber(value), parseNumber(useful_life), parseNumber(residual_value), id
      ]
    );

    if (result.rowCount === 0) return res.status(404).json({ message: "Aset tidak ditemukan" });

    // LOG
    await logActivity(req, {
        action: "UPDATE",
        entity_type: "ASSET",
        entity_id: id,
        details: { changes: req.body }
    });

    res.json(result.rows[0]);
  } catch (err) {
    console.error("[UPDATE_ASSET_ERROR]", err);
    res.status(500).json({ message: "Gagal mengubah aset" });
  }
});

// POST /api/assets/:id/photo
router.post("/:id/photo", verifyToken, authorize("update_assets"), upload.single("photo"), async (req, res) => {
  const assetId = req.params.id;
  if (!req.file) return res.status(400).json({ message: "File foto wajib diupload" });
  const relativePath = `/uploads/${req.file.filename}`;

  try {
    const result = await pool.query(`UPDATE assets SET photo_url = $1 WHERE id = $2 RETURNING id, photo_url`, [relativePath, assetId]);
    if (result.rowCount === 0) return res.status(404).json({ message: "Aset tidak ditemukan" });

    // LOG
    await logActivity(req, {
        action: "UPDATE_PHOTO",
        entity_type: "ASSET",
        entity_id: assetId,
        details: { filename: req.file.filename }
    });

    res.json(result.rows[0]);
  } catch (err) {
    console.error("[UPLOAD_PHOTO_ERROR]", err);
    res.status(500).json({ message: "Gagal menyimpan foto" });
  }
});

// POST /api/assets/:id/receipt
router.post("/:id/receipt", verifyToken, authorize("update_assets"), upload.single("receipt"), async (req, res) => {
  const assetId = req.params.id;
  if (!req.file) return res.status(400).json({ message: "File kwitansi wajib diupload" });
  const relativePath = `/uploads/${req.file.filename}`;

  try {
    const result = await pool.query(`UPDATE assets SET receipt_url = $1 WHERE id = $2 RETURNING id, receipt_url`, [relativePath, assetId]);
    if (result.rowCount === 0) return res.status(404).json({ message: "Aset tidak ditemukan" });

    // LOG
    await logActivity(req, {
        action: "UPDATE_RECEIPT",
        entity_type: "ASSET",
        entity_id: assetId,
        details: { filename: req.file.filename }
    });

    res.json(result.rows[0]);
  } catch (err) {
    console.error("[UPLOAD_RECEIPT_ERROR]", err);
    res.status(500).json({ message: "Gagal menyimpan kwitansi" });
  }
});

// DELETE (Soft Delete)
router.delete("/:id", verifyToken, authorize("delete_assets"), async (req, res) => {
  const id = req.params.id;
  try {
    const result = await pool.query(`UPDATE assets SET deleted_at = NOW() WHERE id = $1 AND deleted_at IS NULL RETURNING id`, [id]);
    if (result.rowCount === 0) return res.status(404).json({ message: "Aset tidak ditemukan" });

    // LOG
    await logActivity(req, {
        action: "DELETE",
        entity_type: "ASSET",
        entity_id: id,
        details: { reason: "Soft delete via API" }
    });

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: "Gagal menghapus aset" });
  }
});

// RESTORE
router.post("/:id/restore", verifyToken, authorize("delete_assets"), async (req, res) => {
  const id = req.params.id;
  try {
    const result = await pool.query(`UPDATE assets SET deleted_at = NULL WHERE id = $1 AND deleted_at IS NOT NULL RETURNING id`, [id]);
    if (result.rowCount === 0) return res.status(404).json({ message: "Aset tidak ditemukan" });

    // LOG
    await logActivity(req, {
        action: "RESTORE",
        entity_type: "ASSET",
        entity_id: id,
        details: { reason: "Restore via API" }
    });

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: "Gagal restore aset" });
  }
});

router.post("/:id/borrow", verifyToken, authorize("borrow_asset"), upload.single("photo"), borrowAsset);
router.post("/:id/return", verifyToken, authorize("return_asset"), upload.single("photo"), returnAsset);

export default router;