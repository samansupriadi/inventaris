/* eslint-disable camelcase */

export const shorthands = undefined;

export async function up(pgm) {
  pgm.createTable('maintenances', {
    id: 'id', // Otomatis SERIAL PRIMARY KEY
    
    // Relasi ke tabel Assets
    asset_id: {
      type: 'integer',
      notNull: true,
      references: '"assets"',
      onDelete: 'CASCADE', 
    },

    // Info Laporan
    report_date: { 
      type: 'date', 
      notNull: true, 
      default: pgm.func('current_date') 
    },
    issue_description: { type: 'text', notNull: true }, // Keluhan
    
    // Info Pengerjaan
    vendor_name: { type: 'varchar(255)' },
    technician_name: { type: 'varchar(255)' },
    
    // Penyelesaian
    completion_date: { type: 'date' },
    cost: { type: 'numeric(15, 2)', default: 0 },
    solution_description: { type: 'text' },
    
    // Bukti
    photo_url: { type: 'text' },
    
    // Status
    status: { 
      type: 'varchar(50)', 
      notNull: true, 
      default: 'pending' // pending, in_progress, finished, cancelled
    },

    created_at: {
      type: 'timestamp',
      notNull: true,
      default: pgm.func('current_timestamp'),
    },
    updated_at: {
      type: 'timestamp',
      notNull: true,
      default: pgm.func('current_timestamp'),
    },
  });

  // Indexing
  pgm.createIndex('maintenances', 'asset_id');
  pgm.createIndex('maintenances', 'status');
}

export async function down(pgm) {
  pgm.dropTable('maintenances');
}