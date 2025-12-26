/* backend/migrations/[timestamp]_add_missing_depreciation_columns.js */

export const shorthands = undefined;

export async function up(pgm) {
  // Kita gunakan IF NOT EXISTS agar aman dijalankan di server
  // meskipun kondisi server tidak sinkron
  pgm.sql(`
    -- 1. Perbaiki Tabel Kategori (asset_categories)
    ALTER TABLE asset_categories 
    ADD COLUMN IF NOT EXISTS useful_life INTEGER DEFAULT 0,
    ADD COLUMN IF NOT EXISTS is_depreciable BOOLEAN DEFAULT TRUE;

    -- 2. Perbaiki Tabel Aset (assets) - Jaga-jaga jika di server juga belum ada
    ALTER TABLE assets 
    ADD COLUMN IF NOT EXISTS value NUMERIC(18,2) DEFAULT 0,
    ADD COLUMN IF NOT EXISTS useful_life INTEGER DEFAULT 0,
    ADD COLUMN IF NOT EXISTS residual_value NUMERIC(18,2) DEFAULT 0;
  `);
}

export async function down(pgm) {
  // Rollback jika perlu
  pgm.sql(`
    ALTER TABLE asset_categories 
    DROP COLUMN IF EXISTS useful_life,
    DROP COLUMN IF EXISTS is_depreciable;

    ALTER TABLE assets 
    DROP COLUMN IF EXISTS value,
    DROP COLUMN IF EXISTS useful_life,
    DROP COLUMN IF EXISTS residual_value;
  `);
}