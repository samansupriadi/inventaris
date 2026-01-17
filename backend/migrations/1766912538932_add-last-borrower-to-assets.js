export const shorthands = undefined;

export async function up(pgm) {
  pgm.addColumns('assets', {
    last_borrower: { 
      type: 'text',
      comment: 'Menyimpan nama peminjam terakhir agar tidak perlu join tabel loans terus menerus' 
    },
  });
}

export async function down(pgm) {
  pgm.dropColumns('assets', ['last_borrower']);
}