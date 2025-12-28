/* backend/migrations/[timestamp]_create_audit_logs_table.js */

export const shorthands = undefined;

export async function up(pgm) {
  pgm.sql(`
    CREATE TABLE IF NOT EXISTS audit_logs (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES users(id) ON DELETE SET NULL, -- Siapa
      action VARCHAR(50) NOT NULL,        -- Apa (CREATE, UPDATE, DELETE, LOGIN)
      entity_type VARCHAR(50) NOT NULL,   -- Objek apa (ASSET, USER, CATEGORY)
      entity_id INTEGER,                  -- ID Objeknya
      details JSONB,                      -- Detail (Snapshot data lama/baru)
      ip_address VARCHAR(45),             -- IP User
      user_agent TEXT,                    -- Browser/Device info
      created_at TIMESTAMP DEFAULT NOW()  -- Kapan
    );

    -- Index biar searching cepat
    CREATE INDEX idx_audit_user ON audit_logs(user_id);
    CREATE INDEX idx_audit_action ON audit_logs(action);
    CREATE INDEX idx_audit_created ON audit_logs(created_at);
  `);
}

export async function down(pgm) {
  pgm.sql(`DROP TABLE IF EXISTS audit_logs CASCADE;`);
}