// seed.js
import pool from "./db.js";
import bcrypt from "bcrypt";

// Cek apakah user menjalankan dengan flag --fresh
const isFresh = process.argv.includes("--fresh");

const seed = async () => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // =================================================
    // 0. MEMBERSIHKAN DATABASE (Jika mode --fresh)
    // =================================================
    if (isFresh) {
      console.log("🧹 Membersihkan seluruh data database (Fresh Mode)...");
      
      const tables = [
        "audit_logs",
        "loans",
        "assets",
        "user_roles",
        "role_permissions",
        "users",
        "roles",
        "permissions",
        "funding_sources",
        "locations",
        "asset_categories", 
        "entities",
        "budget_codes",
        "import_histories",
        "maintenances",
        "stock_opnames", 
        "opname_items"
      ];

      await client.query(
        `TRUNCATE TABLE ${tables.join(", ")} RESTART IDENTITY CASCADE`
      );
      console.log("✨ Database bersih kinclong!");
    }

    console.log("🌱 Mulai Seeding Data...");

    // =================================================
    // 1. SEED PERMISSIONS
    // =================================================
    const permissions = [
      // 1. DASHBOARD
      { name: "Lihat Dashboard", slug: "view_dashboard", group: "Dashboard" },

      // 2. ASET & INVENTARIS
      { name: "Lihat Aset", slug: "view_assets", group: "Assets" },
      { name: "Lihat Nilai Aset (Harga)", slug: "view_asset_price", group: "Assets" },
      { name: "Tambah Aset", slug: "create_assets", group: "Assets" },
      { name: "Edit Aset", slug: "update_assets", group: "Assets" }, 
      { name: "Hapus Aset", slug: "delete_assets", group: "Assets" },
      
      // 3. TRANSAKSI (PEMINJAMAN)
      { name: "Pinjam Aset", slug: "borrow_asset", group: "Transaction" },
      { name: "Kembalikan Aset", slug: "return_asset", group: "Transaction" },
      { name: "Approve Peminjaman", slug: "approve_loan", group: "Transaction" },

      // 4. MAINTENANCE (PERBAIKAN)
      { name: "Lihat Maintenance", slug: "view_maintenance", group: "Maintenance" },
      { name: "Buat Laporan Rusak", slug: "create_maintenance", group: "Maintenance" },
      { name: "Update Status Perbaikan", slug: "update_maintenance", group: "Maintenance" },

      // 5. STOCK OPNAME (AUDIT FISIK)
      { name: "Lihat Stock Opname", slug: "view_opname", group: "Audit" },
      { name: "Buat Sesi Opname", slug: "create_opname", group: "Audit" },
      { name: "Eksekusi Opname (Scan)", slug: "execute_opname", group: "Audit" },
      { name: "Finalisasi Opname", slug: "finalize_opname", group: "Audit" },

      // 6. MASTER DATA
      { name: "Kelola Entitas", slug: "manage_entities", group: "Master Data" },
      { name: "Kelola Lokasi", slug: "manage_locations", group: "Master Data" },
      { name: "Kelola Kategori", slug: "manage_categories", group: "Master Data" },
      { name: "Kelola Sumber Dana", slug: "manage_funding_sources", group: "Master Data" },

      // 7. LAPORAN & LOG
      { name: "Lihat Laporan", slug: "view_reports", group: "Reports" },
      { name: "Lihat Audit Log System", slug: "view_audit_logs", group: "Reports" },

      // 8. PENGATURAN USER & SYSTEM
      { name: "Kelola User", slug: "manage_users", group: "Settings" },
      { name: "Kelola Role & Permission", slug: "manage_roles", group: "Settings" },
      { name: "Import Data Excel", slug: "import_data", group: "Settings" },
    ];

    console.log(`... Mengisi ${permissions.length} permissions`);

    for (const p of permissions) {
      await client.query(
        `INSERT INTO permissions (name, slug, group_name) 
         VALUES ($1, $2, $3) 
         ON CONFLICT (slug) DO UPDATE SET 
           name = EXCLUDED.name, 
           group_name = EXCLUDED.group_name`, 
        [p.name, p.slug, p.group]
      );
    }

    // =================================================
    // 2. SEED ROLES
    // =================================================
    console.log("... Mengisi Roles");
    
    const rolesData = [
        { name: 'Super Admin', slug: 'admin', desc: 'Full Akses Sistem' },
        { name: 'General Affair (GA)', slug: 'ga', desc: 'Pengelola Aset Operasional' },
        { name: 'Finance', slug: 'finance', desc: 'Akses Data Keuangan & Nilai Aset' },
        { name: 'Auditor', slug: 'auditor', desc: 'Pemeriksa Stok & Log Sistem' },
        { name: 'Staff', slug: 'staff', desc: 'User Biasa / Peminjam' }
    ];

    const roleMap = {}; 

    for (const r of rolesData) {
      const res = await client.query(
        `INSERT INTO roles (name, slug, description) 
         VALUES ($1, $2, $3) 
         ON CONFLICT (slug) DO UPDATE SET description = EXCLUDED.description
         RETURNING id, slug`,
        [r.name, r.slug, r.desc]
      );
      if (res.rows[0]) {
        roleMap[r.slug] = res.rows[0].id;
      } else {
        const existing = await client.query("SELECT id FROM roles WHERE slug = $1", [r.slug]);
        roleMap[r.slug] = existing.rows[0].id;
      }
    }

    // =================================================
    // 3. ASSIGN PERMISSIONS TO ROLES
    // =================================================
    console.log("... Mengatur Hak Akses (Role Permissions)");

    const assignPerms = async (roleSlug, permSlugs) => {
      const roleId = roleMap[roleSlug];
      let ids = [];
      
      if (!permSlugs) {
        const res = await client.query("SELECT id FROM permissions");
        ids = res.rows.map(r => r.id);
      } else {
        const res = await client.query(
          `SELECT id FROM permissions WHERE slug = ANY($1::text[])`, 
          [permSlugs]
        );
        ids = res.rows.map(r => r.id);
      }

      if (ids.length > 0) {
        await client.query("DELETE FROM role_permissions WHERE role_id = $1", [roleId]);
        const values = ids.map((pid, i) => `($1, $${i + 2})`).join(",");
        await client.query(
          `INSERT INTO role_permissions (role_id, permission_id) VALUES ${values} ON CONFLICT DO NOTHING`,
          [roleId, ...ids]
        );
      }
    };

    // 1. ADMIN (ALL ACCESS)
    await assignPerms('admin', null); 

    // 2. GA (Full Operasional)
    await assignPerms('ga', [
        'view_dashboard', 
        'view_assets', 'create_assets', 'update_assets', 'delete_assets', 
        'borrow_asset', 'return_asset', 'approve_loan', 
        'view_maintenance', 'create_maintenance', 'update_maintenance',
        'view_opname', 'create_opname', 'execute_opname', 'finalize_opname',
        'manage_locations', 'manage_categories', 'manage_entities',
        'view_reports', 'import_data', 'view_audit_logs'
    ]);

    // 3. FINANCE (View & Money)
    await assignPerms('finance', [
        'view_dashboard',
        'view_assets', 'view_asset_price',
        'manage_funding_sources', 
        'view_reports',
        'manage_categories', // View & Create Category sesuai request
        'view_opname', 'view_audit_logs'
    ]);

    // 4. AUDITOR (Checker)
    await assignPerms('auditor', [
        'view_dashboard',
        'view_assets',
        'view_opname', 'create_opname', 'execute_opname', 'finalize_opname',
        'view_audit_logs',
        'view_reports'
    ]);

    // 5. STAFF (User)
    await assignPerms('staff', [
        'view_dashboard',
        'view_assets',
        'borrow_asset', 
        'create_maintenance'
    ]);

    // =================================================
    // 4. SEED USERS (SESUAI REQUEST)
    // =================================================
    console.log("... Membuat User Default");
    const passwordHash = await bcrypt.hash("password123", 10);

    const usersToSeed = [
        // 1. ROLE ADMIN -> Saman
        { name: 'Saman Admin', email: 'saman@sinergifoundation.org', role: 'admin' },
        
        // 2. ROLE GA -> Arif
        { name: 'Arif GA', email: 'arif@sinergifoundation.org', role: 'ga' },
        
        // 3. ROLE FINANCE -> Seni
        { name: 'Seni Finance', email: 'seni@sinergifoundation.org', role: 'finance' },
        
        // 4. ROLE STAFF -> Rojak
        { name: 'Rojak Staff', email: 'rojak@sinergifoundation.org', role: 'staff' },

        // Tambahan: Auditor (Biar role auditor tidak kosong)
        { name: 'Auditor Internal', email: 'auditor@sinergifoundation.org', role: 'auditor' }
    ];

    for (const u of usersToSeed) {
        const userRes = await client.query(
            `INSERT INTO users (name, email, password_hash) 
             VALUES ($1, $2, $3) 
             ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash
             RETURNING id`,
            [u.name, u.email, passwordHash]
        );
        const userId = userRes.rows[0]?.id || 
            (await client.query("SELECT id FROM users WHERE email = $1", [u.email])).rows[0].id;
        
        // Assign Role
        await client.query(
            `INSERT INTO user_roles (user_id, role_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
            [userId, roleMap[u.role]]
        );
    }

    await client.query("COMMIT");
    console.log("✅ SEEDING SELESAI!");
    
    if (isFresh) console.log("🚀 Database sudah di-reset ulang (Fresh).");
    
    console.log("---------------------------------------------------");
    console.log("🔑 Default Password Semua User:");
    console.log("---------------------------------------------------");
    usersToSeed.forEach(u => console.log(`👤 ${u.role.toUpperCase().padEnd(8)} : ${u.email}`));
    console.log("---------------------------------------------------");

  } catch (err) {
    await client.query("ROLLBACK");
    console.error("❌ Gagal Seeding:", err);
  } finally {
    client.release();
    process.exit();
  }
};

seed();