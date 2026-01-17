// migrations/xxxxx_add_proof_photo_to_maintenances.js

export const shorthands = undefined;

export async function up(pgm) {
  pgm.addColumns('maintenances', {
    proof_photo: { 
      type: 'varchar(255)', 
      default: null 
    },
  });
}

export async function down(pgm) {
  pgm.dropColumns('maintenances', ['proof_photo']);
}