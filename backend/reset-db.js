// backend/reset-db.js
import pool from "./db.js";

const resetDatabase = async () => {
  try {
    console.log("💣 MELEDAKKAN DATABASE (DROP SCHEMA)...");
    
    // 1. Hapus Schema Public beserta semua isinya (Cascade)
    await pool.query("DROP SCHEMA public CASCADE");
    
    // 2. Buat ulang Schema Public yang kosong
    await pool.query("CREATE SCHEMA public");
    
    // 3. (Opsional) Kembalikan permission standar
    // Ganti 'inventaris_user' dengan user DB Bapak jika perlu, atau biarkan default
    await pool.query("GRANT ALL ON SCHEMA public TO public"); 
    
    console.log("✅ Database bersih kinclong seperti baru!");
    process.exit(0);
  } catch (err) {
    console.error("❌ Gagal reset database:", err);
    process.exit(1);
  }
};

resetDatabase();