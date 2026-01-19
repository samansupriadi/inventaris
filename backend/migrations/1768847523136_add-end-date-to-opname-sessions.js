/* eslint-disable camelcase */

export const shorthands = undefined;

export async function up(pgm) {
  // Tambahkan kolom 'end_date' ke tabel 'opname_sessions'
  pgm.addColumns('opname_sessions', {
    end_date: {
      type: 'date', // Tipe DATE karena kita cuma butuh tanggalnya
    },
  });
}

export async function down(pgm) {
  // Rollback: Hapus kolom jika migrasi dibatalkan
  pgm.dropColumns('opname_sessions', ['end_date']);
}