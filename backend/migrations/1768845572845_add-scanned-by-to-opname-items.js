/* eslint-disable camelcase */

export const shorthands = undefined;

export async function up(pgm) {
  // ... (Bagian UP biarkan sama seperti sebelumnya) ...
  pgm.addColumns('opname_items', {
    scanned_by: { 
      type: 'integer', 
      references: 'users', 
      onDelete: 'SET NULL' 
    },
  });
  
  pgm.createIndex('opname_items', 'scanned_by');

  pgm.createIndex('opname_items', ['opname_session_id', 'asset_id'], { 
    unique: true,
    name: 'unique_asset_per_session_idx' 
  });
}

// 👇 UBAH BAGIAN INI SAJA 👇
export async function down(pgm) {
  // Tambahkan { ifExists: true } agar tidak error jika index memang tidak ada
  pgm.dropIndex('opname_items', [], { 
    name: 'unique_asset_per_session_idx', 
    ifExists: true 
  });

  // Tambahkan { ifExists: true } juga untuk kolom biar aman
  pgm.dropColumns('opname_items', ['scanned_by'], { 
    ifExists: true 
  });
}