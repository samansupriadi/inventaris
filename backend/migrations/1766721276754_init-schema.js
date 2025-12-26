/* backend/migrations/1766721276754_init-schema.js */

// Ganti "exports.shorthands" jadi "export const"
export const shorthands = undefined;

// Ganti "exports.up" jadi "export async function up"
export async function up(pgm) {
  pgm.sql(`
    -- ==========================================
    -- 1. MASTER DATA
    -- ==========================================
    
    CREATE TABLE IF NOT EXISTS entities (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      code TEXT UNIQUE,
      description TEXT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS locations (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      code TEXT UNIQUE,
      slug TEXT UNIQUE,
      description TEXT,
      created_at TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS asset_categories (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL UNIQUE,
      code TEXT UNIQUE,
      slug TEXT UNIQUE,
      description TEXT,
      created_at TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS funding_sources (
      id SERIAL PRIMARY KEY,
      entity_id INTEGER REFERENCES entities(id) ON DELETE RESTRICT,
      name TEXT NOT NULL UNIQUE,
      code TEXT UNIQUE,
      slug TEXT UNIQUE,
      description TEXT,
      created_at TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS budget_codes (
      id SERIAL PRIMARY KEY,
      funding_source_id INTEGER NOT NULL REFERENCES funding_sources(id) ON DELETE CASCADE,
      code TEXT NOT NULL,
      name TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT NOW(),
      UNIQUE(funding_source_id, code)
    );

    -- ==========================================
    -- 2. USERS & ROLES
    -- ==========================================

    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      entity_id INTEGER REFERENCES entities(id) ON DELETE SET NULL,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      phone VARCHAR(50),
      is_active BOOLEAN DEFAULT TRUE NOT NULL,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW(),
      deleted_at TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS roles (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL UNIQUE,
      slug TEXT NOT NULL UNIQUE,
      description TEXT,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS permissions (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL UNIQUE,
      slug TEXT NOT NULL UNIQUE,
      group_name TEXT,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS user_roles (
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      role_id INTEGER NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
      PRIMARY KEY (user_id, role_id)
    );

    CREATE TABLE IF NOT EXISTS role_permissions (
      role_id INTEGER NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
      permission_id INTEGER NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
      PRIMARY KEY (role_id, permission_id)
    );

    -- ==========================================
    -- 3. IMPORT HISTORY
    -- ==========================================
    CREATE TABLE IF NOT EXISTS import_histories (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
      filename TEXT NOT NULL,
      total_rows INTEGER DEFAULT 0,
      success_count INTEGER DEFAULT 0,
      created_at TIMESTAMP DEFAULT NOW()
    );

    -- ==========================================
    -- 4. ASSETS
    -- ==========================================
    CREATE TABLE IF NOT EXISTS assets (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      code TEXT NOT NULL UNIQUE,
      
      location TEXT, 
      location_id INTEGER REFERENCES locations(id),

      category_id INTEGER REFERENCES asset_categories(id),
      funding_source_id INTEGER REFERENCES funding_sources(id),
      budget_code_id INTEGER REFERENCES budget_codes(id),
      import_history_id INTEGER REFERENCES import_histories(id) ON DELETE SET NULL,

      condition TEXT,
      status TEXT DEFAULT 'available',
      value NUMERIC(18,2),
      purchase_date DATE,
      
      photo_url TEXT,
      receipt_url TEXT,
      notes TEXT,
      sequence_no INTEGER,
      
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP,
      deleted_at TIMESTAMP
    );
    
    CREATE INDEX IF NOT EXISTS idx_assets_deleted_at ON assets USING btree (deleted_at);

    -- ==========================================
    -- 5. TRANSACTIONS
    -- ==========================================

    CREATE TABLE IF NOT EXISTS loans (
      id SERIAL PRIMARY KEY,
      asset_id INTEGER NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
      borrower TEXT NOT NULL,
      borrower_user_id INTEGER REFERENCES users(id),
      usage_location_id INTEGER REFERENCES locations(id),
      
      borrowed_at TIMESTAMP DEFAULT NOW(),
      due_date DATE,
      returned_at TIMESTAMP,
      
      status TEXT DEFAULT 'borrowed',
      notes TEXT,
      notes_return TEXT,
      
      condition_before TEXT,
      condition_after TEXT,
      before_photo_url TEXT,
      after_photo_url TEXT
    );

    CREATE TABLE IF NOT EXISTS opname_sessions (
      id SERIAL PRIMARY KEY,
      title TEXT NOT NULL,
      status TEXT DEFAULT 'On Progress',
      location_id INTEGER REFERENCES locations(id),
      created_by INTEGER REFERENCES users(id),
      verified_by INTEGER REFERENCES users(id),
      total_assets INTEGER DEFAULT 0,
      scanned_assets INTEGER DEFAULT 0,
      created_at TIMESTAMP DEFAULT NOW(),
      finalized_at TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS opname_items (
      id SERIAL PRIMARY KEY,
      opname_session_id INTEGER REFERENCES opname_sessions(id) ON DELETE CASCADE,
      asset_id INTEGER REFERENCES assets(id),
      status TEXT DEFAULT 'Missing',
      condition_actual TEXT,
      notes TEXT,
      scanned_at TIMESTAMP,
      updated_at TIMESTAMP DEFAULT NOW()
    );
  `);
}

// Ganti "exports.down" jadi "export async function down"
export async function down(pgm) {
  pgm.sql(`
    DROP TABLE IF EXISTS opname_items CASCADE;
    DROP TABLE IF EXISTS opname_sessions CASCADE;
    DROP TABLE IF EXISTS loans CASCADE;
    DROP TABLE IF EXISTS assets CASCADE;
    DROP TABLE IF EXISTS import_histories CASCADE;
    DROP TABLE IF EXISTS role_permissions CASCADE;
    DROP TABLE IF EXISTS user_roles CASCADE;
    DROP TABLE IF EXISTS permissions CASCADE;
    DROP TABLE IF EXISTS roles CASCADE;
    DROP TABLE IF EXISTS users CASCADE;
    DROP TABLE IF EXISTS budget_codes CASCADE;
    DROP TABLE IF EXISTS funding_sources CASCADE;
    DROP TABLE IF EXISTS asset_categories CASCADE;
    DROP TABLE IF EXISTS locations CASCADE;
    DROP TABLE IF EXISTS entities CASCADE;
  `);
}