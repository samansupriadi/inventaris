// backend/routes/reportRoutes.js
import express from "express";
import pool from "../db.js";
import { verifyToken } from "../middleware/authMiddleware.js";
import { calculateBookValue } from "../utils/depreciation.js";

const router = express.Router();

router.use(verifyToken);

router.get("/summary", async (req, res) => {
  try {
    // TAMBAHKAN funding_source_id dan budget_code_id
    const { category_id, condition, status, start_date, end_date, funding_source_id, budget_code_id, location_id } = req.query;

    // 1. Update Query: Join ke Funding & Budget Code agar namanya bisa diambil (opsional)
    // Dan tambahkan filtering logic
    let query = `
      SELECT a.id, a.name, a.code, a.value, a.useful_life, a.residual_value, a.purchase_date,
             c.name as category_name, a.location, a.condition, a.status,
             fs.name as funding_source_name,
             bc.code as budget_code, bc.name as budget_name
      FROM assets a
      LEFT JOIN asset_categories c ON a.category_id = c.id
      LEFT JOIN funding_sources fs ON a.funding_source_id = fs.id
      LEFT JOIN budget_codes bc ON a.budget_code_id = bc.id
      WHERE a.deleted_at IS NULL
    `;
    
    const params = [];
    const whereClauses = [];

    // Filter Kategori
    if (category_id) {
      params.push(category_id);
      whereClauses.push(`a.category_id = $${params.length}`);
    }

    // Filter Kondisi
    if (condition) {
      params.push(condition);
      whereClauses.push(`a.condition = $${params.length}`);
    }

    // Filter Status
    if (status) {
      params.push(status);
      whereClauses.push(`a.status = $${params.length}`);
    }

    // Filter Tanggal Beli
    if (start_date && end_date) {
      params.push(start_date);
      whereClauses.push(`a.purchase_date >= $${params.length}`);
      params.push(end_date);
      whereClauses.push(`a.purchase_date <= $${params.length}`);
    }

    // === FILTER BARU: SUMBER DANA ===
    if (funding_source_id) {
        params.push(funding_source_id);
        whereClauses.push(`a.funding_source_id = $${params.length}`);
    }

    // === FILTER BARU: KMA (Budget Code) ===
    if (budget_code_id) {
        params.push(budget_code_id);
        whereClauses.push(`a.budget_code_id = $${params.length}`);
    }
    
    // === FILTER BARU: LOKASI ===
    if (location_id) {
        params.push(location_id);
        whereClauses.push(`a.location_id = $${params.length}`);
    }

    if (whereClauses.length > 0) {
      query += ` AND ${whereClauses.join(" AND ")}`;
    }

    query += ` ORDER BY a.purchase_date DESC`;

    // 2. Eksekusi Query
    const result = await pool.query(query, params);
    const assets = result.rows;

    // 3. Hitung Agregat
    let totalAcquisition = 0;
    let totalBookValue = 0;

    const enrichedAssets = assets.map(asset => {
        const bookVal = calculateBookValue(asset);
        
        totalAcquisition += Number(asset.value || 0);
        totalBookValue += Number(bookVal || 0);

        return {
            ...asset,
            book_value: bookVal
        };
    });

    res.json({
        summary: {
            total_items: assets.length,
            total_acquisition_value: totalAcquisition,
            total_book_value: totalBookValue,
            generated_at: new Date()
        },
        data: enrichedAssets
    });

  } catch (err) {
    console.error("[REPORT_API_ERROR]", err);
    res.status(500).json({ message: "Gagal memproses laporan" });
  }
});

export default router;