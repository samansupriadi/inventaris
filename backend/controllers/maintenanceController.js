// backend/controllers/maintenanceController.js
import pool from "../db.js";

// 1. GET ALL
export const getMaintenances = async (req, res) => {
  try {
    // 👇 UPDATE QUERY: Tambahkan 'a.condition' dan 'a.status'
    const result = await pool.query(`
      SELECT m.*, 
             a.name as asset_name, 
             a.code as asset_code, 
             a.location,
             a.condition as asset_condition, -- Tambah ini (Kondisi Aset Saat Ini)
             a.status as asset_status        -- Tambah ini (Status Aset Saat Ini)
      FROM maintenances m
      JOIN assets a ON m.asset_id = a.id
      ORDER BY m.created_at DESC
    `);
    res.json(result.rows);
  } catch (err) {
    console.error("[ERROR] Get Maintenances:", err.message);
    res.status(500).json({ message: "Terjadi kesalahan server" });
  }
};

// 2. GET BY ASSET ID
export const getMaintenanceByAssetId = async (req, res) => {
  const { assetId } = req.params;
  try {
    const result = await pool.query(
      `SELECT * FROM maintenances WHERE asset_id = $1 ORDER BY created_at DESC`,
      [assetId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error("[ERROR] Get History:", err.message);
    res.status(500).json({ message: "Gagal mengambil data" });
  }
};

// 3. CREATE
export const createMaintenance = async (req, res) => {
  const { asset_id, issue_description, vendor_name, report_date } = req.body;

  if (!asset_id || !issue_description) {
    return res.status(400).json({ message: "Aset & Keluhan wajib diisi!" });
  }

  try {
    const assetCheck = await pool.query("SELECT id FROM assets WHERE id = $1", [asset_id]);
    if (assetCheck.rows.length === 0) return res.status(404).json({ message: "Aset tidak ditemukan" });

    const newMaint = await pool.query(
      `INSERT INTO maintenances (asset_id, issue_description, vendor_name, report_date, status)
       VALUES ($1, $2, $3, $4, 'pending') RETURNING *`,
      [asset_id, issue_description, vendor_name, report_date || new Date()]
    );

    await pool.query("UPDATE assets SET status = 'maintenance', condition = 'maintenance' WHERE id = $1", [asset_id]);

    res.status(201).json(newMaint.rows[0]);
  } catch (err) {
    console.error("[ERROR] Create Maintenance:", err.message);
    res.status(500).json({ message: "Gagal membuat laporan" });
  }
};

// 4. UPDATE (SUDAH DIPERBAIKI)
export const updateMaintenance = async (req, res) => {
  const { id } = req.params;
  
  // 👇 PERHATIKAN BARIS INI: final_condition SAYA TAMBAHKAN DISINI
  const { 
    status, completion_date, cost, solution_description, technician_name, 
    final_condition // <--- INI YANG TADI HILANG/UNDEFINED
  } = req.body;

  const proof_photo = req.file ? `/uploads/${req.file.filename}` : null;

  try {
    let query, values;

    // 1. Update Data Maintenance (Simpan ke tabel maintenances)
    if (proof_photo) {
      query = `
        UPDATE maintenances 
        SET status=$1, completion_date=$2, cost=$3, solution_description=$4, technician_name=$5, proof_photo=$6, updated_at=NOW()
        WHERE id=$7 RETURNING *`;
      values = [status, completion_date, cost || 0, solution_description, technician_name, proof_photo, id];
    } else {
      query = `
        UPDATE maintenances 
        SET status=$1, completion_date=$2, cost=$3, solution_description=$4, technician_name=$5, updated_at=NOW()
        WHERE id=$6 RETURNING *`;
      values = [status, completion_date, cost || 0, solution_description, technician_name, id];
    }

    const result = await pool.query(query, values);

    if (result.rows.length === 0) {
        return res.status(404).json({ message: "Data maintenance tidak ditemukan" });
    }

    const maintenanceData = result.rows[0];

    // 2. LOGIKA UPDATE STATUS ASET (Menggunakan final_condition)
    if (status === 'finished') {
       
       let newAssetStatus = 'available'; // Default: Kembali ke gudang
       
       // Ambil nilai final_condition, kalau kosong anggap 'baik'
       let newAssetCondition = final_condition || 'baik'; 

       // Jika user pilih 'rusak', status aset jadi 'broken' (Mati Total/Afkir)
       if (newAssetCondition === 'rusak') {
          newAssetStatus = 'rusak'; 
       }

       // Update Tabel Assets
       await pool.query(
         `UPDATE assets 
          SET status = $1, condition = $2 
          WHERE id = $3`,
         [newAssetStatus, newAssetCondition, maintenanceData.asset_id]
       );
    }

    res.json(maintenanceData);
  } catch (err) {
    console.error("[ERROR UPDATE]", err.message);
    res.status(500).json({ message: "Gagal update maintenance: " + err.message });
  }
};

// 5. DELETE
export const deleteMaintenance = async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query("DELETE FROM maintenances WHERE id = $1", [id]);
    if (result.rowCount === 0) return res.status(404).json({ message: "Data tidak ditemukan" });
    res.json({ message: "Berhasil dihapus" });
  } catch (err) {
    res.status(500).json({ message: "Gagal menghapus data" });
  }
};