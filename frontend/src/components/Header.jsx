// src/components/Header.jsx
import { getUser } from "../utils/auth"; // Helper

function Header({ title, onLogout, onToggleSidebar }) {
  const user = getUser();

  return (
    <header className="h-20 bg-white border-b border-slate-100 flex items-center justify-between px-6 sticky top-0 z-10 shadow-sm/50 backdrop-blur-md bg-white/90">
      
      {/* KIRI: Toggle Mobile & Judul Halaman */}
      <div className="flex items-center gap-4">
        {/* Tombol Hamburger (Hanya muncul di Mobile lewat CSS parent) */}
        <button 
          onClick={onToggleSidebar}
          className="md:hidden p-2 text-slate-500 hover:bg-slate-50 rounded-lg"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
        </button>

        <div>
          <h2 className="text-xl font-bold text-slate-800 tracking-tight">{title}</h2>
          <p className="text-xs text-slate-400 hidden sm:block">
            {new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>
      </div>

      {/* KANAN: User Profile & Logout */}
      <div className="flex items-center gap-4">
        
        {/* User Info (Hidden di Mobile kecil) */}
        <div className="hidden md:flex flex-col items-end">
          <span className="text-sm font-bold text-slate-700">{user?.name || "Tamu"}</span>
          <span className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium border border-green-200">
            {user?.roles?.[0]?.name || "No Role"}
          </span>
        </div>

        {/* Separator */}
        <div className="h-8 w-px bg-slate-200 hidden md:block"></div>

        {/* Logout Button */}
        <button
          onClick={onLogout}
          className="flex items-center gap-2 px-3 py-2 rounded-lg text-slate-500 hover:text-red-600 hover:bg-red-50 transition-all text-sm font-medium group"
          title="Keluar Aplikasi"
        >
          <svg className="w-5 h-5 group-hover:-translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
          <span className="hidden sm:inline">Logout</span>
        </button>
      </div>
    </header>
  );
}

export default Header;