// src/components/Sidebar.jsx
import { hasPermission, getUser } from "../utils/auth"; // Helper Security

function Sidebar({ activeMenu, onChange, className = "" }) {
  // Ambil data user untuk ditampilkan di footer sidebar
  const user = getUser(); 

  // Definisi Menu: Dikelompokkan & Diproteksi Permission
  const menuGroups = [
    {
      title: "Menu Utama",
      items: [
        { id: "dashboard", label: "Dashboard", icon: "📊", permission: null }, // null = Semua bisa akses
        { id: "assets", label: "Aset & Inventaris", icon: "📦", permission: "view_assets" },
      ]
    },
    {
      title: "Master Data",
      items: [
        { id: "entities", label: "Entitas / Unit", icon: "🏛️", permission: "view_entities" },
        { id: "locations", label: "Lokasi", icon: "🏢", permission: "view_locations" },
        { id: "categories", label: "Kategori Aset", icon: "🏷️", permission: "view_categories" },
        { id: "funding", label: "Sumber Dana", icon: "💰", permission: "view_funding_sources" },
        { id: "opname", label: "Stock Opname", icon: "📋", permission: "view_assets" },
      ]
    },
    {
      title: "Pengaturan Sistem",
      items: [
        { id: "users", label: "Users Management", icon: "👥", permission: "view_users" },
        { id: "roles", label: "Roles & Hak Akses", icon: "🛡️", permission: "view_roles" },
        { id: "permissions", label: "Permission List", icon: "🔐", permission: "view_permissions" },
        { id: "import", label: "Import Data", icon: "📥", permission: "import_data" },
      ]
    }
  ];

  return (
    <aside
      className={`
        w-64 bg-slate-900 text-slate-300 h-full flex flex-col 
        border-r border-slate-800 shadow-2xl relative z-20 
        transition-all duration-300 ease-in-out font-sans
        ${className}
      `}
    >
      {/* === BRAND HEADER === */}
      <div 
        onClick={() => onChange("dashboard")}
        className="h-20 flex items-center gap-3 px-6 border-b border-slate-800/80 bg-slate-900 cursor-pointer hover:bg-slate-800 transition-colors group"
      >
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#009846] to-[#007b3a] p-0.5 shadow-lg shadow-green-900/50 flex-shrink-0 group-hover:scale-105 transition-transform">
          <div className="w-full h-full bg-white rounded-[10px] flex items-center justify-center overflow-hidden">
             {/* Logo Fallback: Text SF jika gambar tidak ada */}
             <img 
               src="/images/logo-small.png" 
               alt="SF" 
               className="w-8 h-8 object-contain"
               onError={(e) => {
                 e.currentTarget.style.display = 'none';
                 e.currentTarget.parentNode.innerHTML = '<span class="text-[#009846] font-extrabold text-sm tracking-tighter">SF</span>';
               }}
             />
          </div>
        </div>
        <div>
          <h1 className="text-white font-bold text-base leading-none tracking-tight">Sinergi</h1>
          <p className="text-[#009846] font-bold text-[10px] tracking-widest mt-1">FOUNDATION</p>
        </div>
      </div>

      {/* === MENU LIST === */}
      <nav className="flex-1 overflow-y-auto py-6 px-3 space-y-8 custom-scrollbar">
        {menuGroups.map((group, idx) => {
          
          // Filter item: Hanya tampilkan jika permission null (publik) ATAU user punya permission tersebut
          const visibleItems = group.items.filter(item => 
            !item.permission || hasPermission(item.permission)
          );

          if (visibleItems.length === 0) return null; // Sembunyikan grup jika isinya kosong

          return (
            <div key={idx} className="animate-fade-in-up" style={{ animationDelay: `${idx * 100}ms` }}>
              <h3 className="px-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 select-none">
                {group.title}
              </h3>
              <div className="space-y-1">
                {visibleItems.map((item) => {
                  const active = activeMenu === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => onChange(item.id)}
                      className={`
                        w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group relative
                        ${active 
                          ? "bg-[#009846] text-white shadow-lg shadow-green-900/30 translate-x-1" 
                          : "text-slate-400 hover:bg-slate-800 hover:text-slate-100 hover:translate-x-1"
                        }
                      `}
                    >
                      {/* Active Indicator Line (Left) */}
                      {active && (
                        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-white/20 rounded-r-full" />
                      )}

                      <span className={`text-lg transition-transform group-hover:scale-110 ${active ? "scale-110" : "grayscale opacity-70 group-hover:grayscale-0 group-hover:opacity-100"}`}>
                        {item.icon}
                      </span>
                      <span>{item.label}</span>
                      
                      {/* Chevron Right (Hover Effect) */}
                      {!active && (
                        <span className="absolute right-3 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all text-slate-600 font-bold">
                          ›
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </nav>

      {/* === FOOTER USER INFO === */}
      <div className="p-4 border-t border-slate-800 bg-slate-900/50 backdrop-blur-sm">
        <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-800/50 border border-slate-700/50 hover:bg-slate-800 transition-colors cursor-default">
          <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-slate-600 to-slate-500 flex items-center justify-center text-xs font-bold text-white shadow-inner border border-slate-600">
             {/* Inisial User */}
             {user?.name?.charAt(0).toUpperCase() || "U"}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-white truncate">{user?.name || "Tamu"}</p>
            <p className="text-[10px] text-slate-400 truncate flex items-center gap-1">
               <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
               {user?.roles?.[0]?.name || "Online"}
            </p>
          </div>
        </div>
        <div className="text-[9px] text-center text-slate-600 mt-3 flex justify-between px-1">
          <span>v1.0.0</span>
          <span>Sinergi Foundation</span>
        </div>
      </div>
    </aside>
  );
}

export default Sidebar;