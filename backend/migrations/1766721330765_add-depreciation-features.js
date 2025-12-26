/* backend/migrations/1766721330765_add-depreciation-features.js */

export const shorthands = undefined;

export async function up(pgm) {
  pgm.sql(`
    -- 1. Tambah kolom di Kategori
    ALTER TABLE asset_categories 
    ADD COLUMN useful_life INTEGER DEFAULT 0,
    ADD COLUMN is_depreciable BOOLEAN DEFAULT TRUE;

    -- 2. Tambah kolom di Aset
    -- KITA HAPUS "ADD COLUMN value" KARENA SUDAH ADA DI INIT-SCHEMA
    ALTER TABLE assets 
    ADD COLUMN useful_life INTEGER DEFAULT 0,
    ADD COLUMN residual_value NUMERIC(18,2) DEFAULT 0;

    -- (Opsional) Jika ingin mengubah default kolom value yang sudah ada jadi 0
    ALTER TABLE assets ALTER COLUMN value SET DEFAULT 0;

    -- 3. Update data existing
    UPDATE asset_categories SET useful_life = 4 WHERE name ILIKE '%Elektronik%' OR name ILIKE '%Laptop%';
  `);
}

export async function down(pgm) {
  pgm.sql(`
    -- Hapus kolom jika rollback
    -- JANGAN DROP COLUMN value, KARENA ITU KOLOM ASLI DARI SCHEMA AWAL
    ALTER TABLE assets 
    DROP COLUMN useful_life,
    DROP COLUMN residual_value;

    ALTER TABLE asset_categories 
    DROP COLUMN useful_life,
    DROP COLUMN is_depreciable;
  `);
}