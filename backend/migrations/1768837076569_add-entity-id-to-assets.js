/* eslint-disable camelcase */

export const shorthands = undefined;

export const up = (pgm) => {
  // 1. Tambah Kolom entity_id ke tabel assets
  pgm.addColumns('assets', {
    entity_id: {
      type: 'integer',
      references: 'entities', // Foreign Key ke tabel entities
      onDelete: 'SET NULL',   // Jika entitas dihapus, data di aset jadi NULL (aman)
      default: null,
      comment: 'Foreign key untuk menghubungkan aset ke entitas/yayasan'
    }
  });

  // 2. Tambah Index biar query cepat
  pgm.createIndex('assets', 'entity_id');
};

export const down = (pgm) => {
  // Rollback: Hapus kolom jika migrate:down
  pgm.dropColumns('assets', ['entity_id']);
};