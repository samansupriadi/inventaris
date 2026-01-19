// backend/routes/importRoutes.js
import express from "express";
import multer from "multer";
import ExcelJS from "exceljs";
import pool from "../db.js";
import { verifyToken, authorize } from "../middleware/authMiddleware.js";

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

router.use(verifyToken);

// ==========================================
// 1. DOWNLOAD SMART TEMPLATE (STRICT MODE)
// ==========================================
router.get("/template", authorize("import_data"), async (req, res) => {
  try {
    const [locations, categories, fundings, entities, budgetCodes] = await Promise.all([
      pool.query("SELECT name FROM locations ORDER BY name ASC"),
      pool.query("SELECT name FROM asset_categories ORDER BY name ASC"),
      pool.query("SELECT name FROM funding_sources ORDER BY name ASC"),
      pool.query("SELECT name FROM entities ORDER BY name ASC"),
      pool.query("SELECT name, code FROM budget_codes ORDER BY code ASC"),
    ]);

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Input Data Aset");

    // HEADER: Sesuai Request (Wajib)
    sheet.columns = [
      { header: "Nama Aset (Wajib)", key: "name", width: 30 },
      { header: "Kategori (Wajib)", key: "category", width: 25 },
      { header: "Lokasi (Wajib)", key: "location", width: 25 },
      { header: "Entitas (Wajib)", key: "entity", width: 20 },
      { header: "Sumber Dana (Wajib)", key: "funding", width: 25 },
      { header: "KMA / Anggaran (Wajib)", key: "budget", width: 30 },
      { header: "Tanggal Beli (Wajib)", key: "date", width: 20 },
      { header: "Harga (Wajib)", key: "value", width: 20 },
      { header: "Keterangan (Wajib)", key: "notes", width: 30 },
    ];

    sheet.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };
    sheet.getRow(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF009846" } };

    // --- REFERENCE DATA ---
    const refSheet = workbook.addWorksheet("ReferenceData");
    refSheet.state = "hidden";

    // Helper isi kolom
    const fillColumn = (colIndex, dataRows, valueKey = 'name') => {
        dataRows.forEach((row, index) => {
            refSheet.getCell(index + 1, colIndex).value = row[valueKey];
        });
    };

    fillColumn(1, categories.rows);
    fillColumn(2, locations.rows);
    fillColumn(3, entities.rows);
    fillColumn(4, fundings.rows);
    
    // KMA Format: CODE - NAME
    const kmaList = budgetCodes.rows.map(b => `${b.code} - ${b.name}`);
    kmaList.forEach((val, idx) => { refSheet.getCell(idx + 1, 5).value = val; });

    const catCount = Math.max(categories.rows.length, 1);
    const locCount = Math.max(locations.rows.length, 1);
    const entCount = Math.max(entities.rows.length, 1);
    const fundCount = Math.max(fundings.rows.length, 1);
    const kmaCount = Math.max(budgetCodes.rows.length, 1);

    // Validasi untuk 1000 baris
    for (let i = 2; i <= 1000; i++) {
        sheet.getCell(`B${i}`).dataValidation = { type: 'list', allowBlank: false, formulae: [`ReferenceData!$A$1:$A$${catCount}`] };
        sheet.getCell(`C${i}`).dataValidation = { type: 'list', allowBlank: false, formulae: [`ReferenceData!$B$1:$B$${locCount}`] };
        sheet.getCell(`D${i}`).dataValidation = { type: 'list', allowBlank: false, formulae: [`ReferenceData!$C$1:$C$${entCount}`] };
        sheet.getCell(`E${i}`).dataValidation = { type: 'list', allowBlank: false, formulae: [`ReferenceData!$D$1:$D$${fundCount}`] };
        sheet.getCell(`F${i}`).dataValidation = { type: 'list', allowBlank: false, formulae: [`ReferenceData!$E$1:$E$${kmaCount}`] };

        // Tanggal
        sheet.getCell(`G${i}`).numFmt = 'yyyy-mm-dd';
        sheet.getCell(`G${i}`).dataValidation = {
            type: 'date',
            allowBlank: false,
            operator: 'between',
            formulae: [new Date('1990-01-01'), new Date('2099-12-31')],
            showErrorMessage: true,
            error: 'Format Tanggal Salah (YYYY-MM-DD)'
        };

        // Harga
        sheet.getCell(`H${i}`).numFmt = '#,##0';
        sheet.getCell(`H${i}`).dataValidation = {
            type: 'decimal',
            allowBlank: false,
            operator: 'greaterThanOrEqual',
            formulae: [0],
            error: 'Harga harus angka positif'
        };

        // Notes
        sheet.getCell(`I${i}`).dataValidation = {
            type: 'textLength',
            allowBlank: false,
            operator: 'greaterThan',
            formulae: [0],
            error: 'Keterangan wajib diisi (- jika kosong)'
        };
    }

    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader("Content-Disposition", "attachment; filename=Template_Aset_Sinergi_Wajib.xlsx");
    await workbook.xlsx.write(res);
    res.end();

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Gagal membuat template" });
  }
});

// ==========================================
// 2. PROCESS IMPORT (FIXED SCHEMA)
// ==========================================
router.post("/assets", verifyToken, authorize("import_data"), upload.single("file"), async (req, res) => {
  if (!req.file) return res.status(400).json({ message: "File Excel wajib diupload." });

  const client = await pool.connect();
  try {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(req.file.buffer);
    const sheet = workbook.getWorksheet(1);

    if (!sheet || sheet.rowCount < 2) throw new Error("File Excel kosong.");

    await client.query("BEGIN");

    // A. History Header
    const historyRes = await client.query(
      `INSERT INTO import_histories (user_id, filename, total_rows) VALUES ($1, $2, 0) RETURNING id`,
      [req.user.id, req.file.originalname]
    );
    const historyId = historyRes.rows[0].id;

    // B. Cache Maps (Lookup ID)
    const getMap = async (table) => {
        // Ambil code juga untuk generate nomor aset
        const res = await client.query(`SELECT id, LOWER(name) as name, code FROM ${table}`);
        const map = new Map();
        res.rows.forEach(r => map.set(r.name, r));
        return map;
    };
    
    // Khusus KMA (Map key: "code - name")
    const getKmaMap = async () => {
        const res = await client.query(`SELECT id, code, name FROM budget_codes`);
        const map = new Map();
        res.rows.forEach(r => {
            map.set(`${r.code} - ${r.name}`.toLowerCase(), r);
            map.set(r.name.toLowerCase(), r); // Backup match by name
        });
        return map;
    };

    const [catMap, locMap, entMap, fundMap, kmaMap] = await Promise.all([
        getMap('asset_categories'),
        getMap('locations'),
        getMap('entities'),
        getMap('funding_sources'),
        getKmaMap()
    ]);

    let successCount = 0;
    const errors = [];
    
    // C. Get Global Sequence
    const lastAssetRes = await client.query(`SELECT sequence_no FROM assets ORDER BY sequence_no DESC LIMIT 1`);
    let currentSequence = lastAssetRes.rows.length > 0 ? (lastAssetRes.rows[0].sequence_no || 0) : 0;

    // D. Loop Data
    sheet.eachRow((row, rowNumber) => {
        if (rowNumber === 1) return; // Skip Header

        const getVal = (idx) => {
            const cell = row.getCell(idx);
            const val = cell.value && typeof cell.value === 'object' ? cell.value.result || cell.value.text : cell.value;
            return val ? String(val).trim() : "";
        };

        const namaAset = getVal(1);
        if (!namaAset) return; // Skip baris kosong

        // Ambil Data
        const catName  = getVal(2).toLowerCase();
        const locName  = getVal(3).toLowerCase();
        const entName  = getVal(4).toLowerCase();
        const fundName = getVal(5).toLowerCase();
        const kmaName  = getVal(6).toLowerCase();
        
        const rawDate  = row.getCell(7).value; // Cell Object
        const priceVal = row.getCell(8).value;
        const notes    = getVal(9);

        // Lookup ID
        const catData  = catMap.get(catName);
        const locData  = locMap.get(locName);
        const entData  = entMap.get(entName);
        const fundData = fundMap.get(fundName);
        const kmaData  = kmaMap.get(kmaName);

        // Validasi Strict
        let rowErrors = [];
        if (!catData) rowErrors.push(`Kategori "${getVal(2)}" tidak ditemukan`);
        if (!locData) rowErrors.push(`Lokasi "${getVal(3)}" tidak ditemukan`);
        if (!entData) rowErrors.push(`Entitas "${getVal(4)}" tidak ditemukan`);
        if (!fundData) rowErrors.push(`Sumber Dana "${getVal(5)}" tidak ditemukan`);
        if (!kmaData) rowErrors.push(`KMA "${getVal(6)}" tidak ditemukan`);
        if (!rawDate) rowErrors.push("Tanggal kosong");
        
        if (rowErrors.length > 0) {
            errors.push(`Baris ${rowNumber}: ${rowErrors.join(", ")}`);
            return; // Skip Insert
        }

        // Auto Generate Code: [SEQ]/[FUND]-[CAT]/[MM]-[YYYY]
        currentSequence++;
        const seqStr = String(currentSequence).padStart(4, '0');
        
        // Parsing Tanggal yang aman
        const purchaseDate = rawDate instanceof Date ? rawDate : new Date(rawDate);
        if (isNaN(purchaseDate.getTime())) {
             errors.push(`Baris ${rowNumber}: Format tanggal salah`);
             return;
        }

        const month = String(purchaseDate.getMonth() + 1).padStart(2, '0');
        const year = purchaseDate.getFullYear();
        const fundCode = fundData.code || "X";
        const catCode = catData.code || "AST";
        const finalCode = `${seqStr}/${fundCode}-${catCode}/${month}-${year}`;

        // INSERT DB (Sesuai Struktur Tabel Anda)
        client.query(
            `INSERT INTO assets 
             (name, code, sequence_no, category_id, location_id, entity_id, funding_source_id, budget_code_id, 
              purchase_date, value, condition, notes, status, import_history_id, useful_life, residual_value)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'baik', $11, 'available', $12, 4, 0)
             ON CONFLICT (code) DO NOTHING`,
            [
                namaAset,       // $1
                finalCode,      // $2
                currentSequence,// $3
                catData.id,     // $4
                locData.id,     // $5
                entData.id,     // $6 (entity_id ADA)
                fundData.id,    // $7
                kmaData.id,     // $8
                purchaseDate,   // $9
                priceVal || 0,  // $10
                notes,          // $11
                historyId       // $12
            ]
        );
        successCount++;
    });

    // E. Update History
    await client.query(
      `UPDATE import_histories SET total_rows = $1, success_count = $2 WHERE id = $3`,
      [successCount, successCount, historyId]
    );

    await client.query("COMMIT");
    
    if (errors.length > 0) {
        res.json({ success: true, message: `Selesai. Sukses: ${successCount}. Gagal: ${errors.length}.`, warnings: errors.slice(0, 10) });
    } else {
        res.json({ success: true, message: `Sukses import ${successCount} aset.` });
    }

  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Import Error:", err);
    res.status(500).json({ message: "Gagal import: " + err.message });
  } finally {
    client.release();
  }
});

// GET HISTORY & ROLLBACK (Standard)
router.get("/history", verifyToken, authorize("import_data"), async (req, res) => {
  try {
    const result = await pool.query(`SELECT h.*, u.name as user_name FROM import_histories h LEFT JOIN users u ON u.id = h.user_id ORDER BY h.created_at DESC LIMIT 10`);
    res.json(result.rows);
  } catch (err) { res.status(500).json({ message: "Gagal load history" }); }
});

router.delete("/history/:id", verifyToken, authorize("import_data"), async (req, res) => {
  const id = req.params.id;
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const del = await client.query(`DELETE FROM assets WHERE import_history_id = $1`, [id]);
    await client.query(`DELETE FROM import_histories WHERE id = $1`, [id]);
    await client.query("COMMIT");
    res.json({ success: true, message: `Rollback sukses! ${del.rowCount} data dihapus.` });
  } catch (err) {
    await client.query("ROLLBACK");
    res.status(500).json({ message: "Gagal rollback" });
  } finally { client.release(); }
});

export default router;