export const shorthands = undefined;

export async function up(pgm) {
  // Menambahkan kolom detail_location ke tabel loans
  pgm.addColumns('loans', {
    detail_location: { 
      type: 'text',
      comment: 'Menyimpan detail lokasi spesifik (misal: Meja No 5, Rak B)' 
    },
  });
}

export async function down(pgm) {
  // Menghapus kolom jika rollback
  pgm.dropColumns('loans', ['detail_location']);
}