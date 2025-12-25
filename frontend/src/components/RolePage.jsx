// src/components/RolePage.jsx
import { useState } from "react";

function RolePage({
  roles = [],
  permissions = [],
  onCreate,
  onUpdate,
  onDelete,
}) {
  // === STATE MANAGEMENT ===
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // State untuk Permission Manager (Panel Kanan)
  const [selectedRoleId, setSelectedRoleId] = useState(null);
  const [selectedPermissionIds, setSelectedPermissionIds] = useState([]);
  const [permLoading, setPermLoading] = useState(false);

  // === HELPER FUNCTIONS ===

  // Generate Slug Otomatis (Huruf kecil, spasi jadi underscore)
  const generateSlug = (text) => {
    return text
      .toString()
      .toLowerCase()
      .trim()
      .replace(/[\s\W-]+/g, "_") // Ganti spasi & simbol aneh jadi _
      .replace(/^_|_$/g, "");    // Hapus _ di awal/akhir
  };

  const resetForm = () => {
    setName("");
    setSlug("");
    setDescription("");
    setEditingId(null);
    setError("");
  };

  const startEdit = (role) => {
    setEditingId(role.id);
    setName(role.name);
    setSlug(role.slug);
    setDescription(role.description || "");
    setError("");
    // Tutup panel permission agar fokus edit info dasar
    setSelectedRoleId(null); 
  };

  // === HANDLERS (CRUD) ===

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!name || !slug) {
      setError("Nama dan Slug role wajib diisi.");
      return;
    }

    const payload = {
      name,
      slug,
      description,
      permission_ids: undefined, // Permission diatur terpisah
    };

    setLoading(true);
    try {
      if (editingId) {
        await onUpdate(editingId, payload);
      } else {
        await onCreate(payload);
      }
      resetForm();
    } catch (err) {
      setError(err.message || "Gagal menyimpan role.");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClick = async (role) => {
    if (!window.confirm(`Yakin ingin menghapus role "${role.name}"?`)) return;
    try {
      await onDelete(role.id);
      if (selectedRoleId === role.id) setSelectedRoleId(null);
    } catch (err) {
      alert(err.message || "Gagal menghapus role.");
    }
  };

  // === PERMISSION HANDLERS ===

  const startManagePermissions = (role) => {
    resetForm(); // Tutup form edit/create
    setSelectedRoleId(role.id);
    // Ambil permission yang sudah dimiliki role ini
    const ids = (role.permissions || []).map((p) => p.id);
    setSelectedPermissionIds(ids);
    
    // Auto scroll ke panel kanan (UX)
    setTimeout(() => {
        document.getElementById("permission-panel")?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  };

  const togglePermission = (permId) => {
    setSelectedPermissionIds((prev) =>
      prev.includes(permId)
        ? prev.filter((id) => id !== permId)
        : [...prev, permId]
    );
  };

  const toggleGroup = (groupIds, allSelected) => {
      if (allSelected) {
          // Uncheck All
          setSelectedPermissionIds(prev => prev.filter(id => !groupIds.includes(id)));
      } else {
          // Check All (tambahkan yg belum ada)
          setSelectedPermissionIds(prev => [...new Set([...prev, ...groupIds])]);
      }
  };

  const saveRolePermissions = async () => {
    if (!selectedRoleId) return;
    const role = roles.find((r) => r.id === selectedRoleId);
    if (!role) return;

    setPermLoading(true);
    try {
      await onUpdate(selectedRoleId, {
        name: role.name,
        slug: role.slug,
        description: role.description,
        permission_ids: selectedPermissionIds,
      });
      alert("Hak akses berhasil diperbarui!");
      setSelectedRoleId(null); // Tutup panel setelah sukses
    } catch (err) {
      alert(err.message || "Gagal menyimpan hak akses.");
    } finally {
      setPermLoading(false);
    }
  };

  // Grouping Permissions (Untuk tampilan Matrix)
  const permissionsByGroup = (permissions || []).reduce((acc, p) => {
    const key = p.group_name || "Lainnya";
    if (!acc[key]) acc[key] = [];
    acc[key].push(p);
    return acc;
  }, {});

  const currentPermissionRole =
    (roles || []).find((r) => r.id === selectedRoleId) || null;

  // === RENDER ===
  return (
    <div className="space-y-8 animate-fade-in pb-20">
      
      {/* HEADER PAGE */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Roles & Hak Akses</h1>
          <p className="text-sm text-slate-500 mt-1">
            Atur peran pengguna dan batasan akses aplikasi (RBAC).
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        
        {/* === KOLOM KIRI: FORM & LIST ROLE === */}
        <div className="lg:col-span-1 space-y-6">
            
            {/* 1. CARD FORM ROLE */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="px-5 py-3 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
                    <h3 className="font-semibold text-slate-700 text-sm">
                        {editingId ? "Edit Role" : "Buat Role Baru"}
                    </h3>
                    {editingId && (
                        <button onClick={resetForm} className="text-xs text-red-500 hover:underline">Batal Edit</button>
                    )}
                </div>
                
                <div className="p-5">
                    {error && (
                        <div className="mb-4 bg-red-50 text-red-600 text-xs p-3 rounded-lg border border-red-100">
                            {error}
                        </div>
                    )}
                    <form onSubmit={handleSubmit} className="space-y-4">
                        
                        {/* NAMA ROLE (AUTO SLUG) */}
                        <div>
                            <label className="block text-xs font-medium text-slate-700 mb-1">Nama Role</label>
                            <input 
                                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#009846] focus:border-[#009846] outline-none transition-all"
                                placeholder="Contoh: Super Admin"
                                value={name}
                                onChange={e => {
                                    const val = e.target.value;
                                    setName(val);
                                    // Auto generate slug hanya jika sedang mode Tambah Baru
                                    if (!editingId) {
                                        setSlug(generateSlug(val));
                                    }
                                }}
                            />
                        </div>

                        {/* SLUG (AUTO FORMAT) */}
                        <div>
                            <label className="block text-xs font-medium text-slate-700 mb-1">Slug (Kode Unik)</label>
                            <input 
                                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#009846] focus:border-[#009846] outline-none transition-all bg-slate-50 font-mono text-slate-600"
                                placeholder="contoh: super_admin"
                                value={slug}
                                onChange={e => setSlug(generateSlug(e.target.value))} // Paksa format slug saat diketik manual
                            />
                            <p className="text-[10px] text-slate-400 mt-1">Otomatis terisi dari nama role.</p>
                        </div>

                        <div>
                            <label className="block text-xs font-medium text-slate-700 mb-1">Keterangan</label>
                            <textarea 
                                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#009846] focus:border-[#009846] outline-none transition-all"
                                placeholder="Deskripsi peran ini..."
                                rows={2}
                                value={description}
                                onChange={e => setDescription(e.target.value)}
                            />
                        </div>

                        <button 
                            type="submit" 
                            disabled={loading}
                            className="w-full bg-[#009846] hover:bg-[#007b3a] text-white text-sm font-medium py-2.5 rounded-lg shadow-sm hover:shadow transition-all disabled:opacity-70 disabled:cursor-not-allowed flex justify-center items-center gap-2"
                        >
                            {loading ? "Menyimpan..." : (editingId ? "Simpan Perubahan" : "Buat Role")}
                        </button>
                    </form>
                </div>
            </div>

            {/* 2. CARD LIST ROLE */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="px-5 py-3 bg-slate-50 border-b border-slate-100">
                    <h3 className="font-semibold text-slate-700 text-sm">Daftar Role Tersedia</h3>
                </div>
                <div className="divide-y divide-slate-100 max-h-[500px] overflow-y-auto custom-scrollbar">
                    {roles.length === 0 ? (
                        <div className="p-5 text-center text-sm text-slate-400">Belum ada data role.</div>
                    ) : (
                        roles.map(role => (
                            <div key={role.id} className={`p-4 hover:bg-slate-50 transition-colors ${selectedRoleId === role.id ? 'bg-green-50/50 border-l-4 border-[#009846]' : ''}`}>
                                <div className="flex justify-between items-start mb-2">
                                    <div>
                                        <h4 className="text-sm font-bold text-slate-800">{role.name}</h4>
                                        <span className="text-[10px] font-mono text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">{role.slug}</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <button 
                                            onClick={() => startEdit(role)}
                                            className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                                            title="Edit Info"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                                        </button>
                                        <button 
                                            onClick={() => handleDeleteClick(role)}
                                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                                            title="Hapus Role"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                                        </button>
                                    </div>
                                </div>
                                <p className="text-xs text-slate-500 mb-3 line-clamp-2">
                                    {role.description || "Tidak ada keterangan."}
                                </p>
                                <button 
                                    onClick={() => startManagePermissions(role)}
                                    className={`w-full py-2 text-xs font-medium rounded-lg border transition-all flex items-center justify-center gap-2 ${
                                        selectedRoleId === role.id 
                                        ? "bg-[#009846] text-white border-[#009846]" 
                                        : "bg-white text-slate-600 border-slate-200 hover:border-[#009846] hover:text-[#009846]"
                                    }`}
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
                                    {selectedRoleId === role.id ? "Sedang Mengatur Akses" : "Atur Hak Akses"}
                                </button>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>

        {/* === KOLOM KANAN: PERMISSION MANAGER === */}
        <div className="lg:col-span-2" id="permission-panel">
            {currentPermissionRole ? (
                <div className="bg-white rounded-xl shadow-lg border border-[#009846]/20 overflow-hidden relative animate-fade-in-up">
                    {/* Header Panel */}
                    <div className="px-6 py-4 bg-gradient-to-r from-slate-50 to-white border-b border-slate-200 flex justify-between items-center sticky top-0 z-10">
                        <div>
                            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                                <span className="text-[#009846]">🛡️</span> Hak Akses: {currentPermissionRole.name}
                            </h2>
                            <p className="text-xs text-slate-500 mt-1">
                                Pilih fitur apa saja yang boleh diakses oleh role ini.
                            </p>
                        </div>
                        <div className="text-right">
                            <span className="text-xs font-bold bg-green-100 text-green-700 px-3 py-1 rounded-full border border-green-200">
                                {selectedPermissionIds.length} Dipilih
                            </span>
                        </div>
                    </div>

                    {/* Content Matrix (Scrollable) */}
                    <div className="p-6 bg-slate-50/30 max-h-[600px] overflow-y-auto custom-scrollbar">
                        {Object.keys(permissionsByGroup).length === 0 ? (
                            <div className="text-center py-10 text-slate-400">
                                <p>Belum ada data permission di database.</p>
                            </div>
                        ) : (
                            <div className="space-y-6">
                                {Object.entries(permissionsByGroup).map(([groupName, perms]) => {
                                    // Cek apakah semua di grup ini terpilih
                                    const groupIds = perms.map(p => p.id);
                                    const allSelected = groupIds.every(id => selectedPermissionIds.includes(id));
                                    
                                    return (
                                        <div key={groupName} className="bg-white rounded-lg border border-slate-200 shadow-sm p-4 hover:border-slate-300 transition-colors">
                                            <div className="flex justify-between items-center mb-3 border-b border-slate-100 pb-2">
                                                <h4 className="font-bold text-sm text-slate-700 uppercase tracking-wide flex items-center gap-2">
                                                    <span className="w-1.5 h-1.5 bg-slate-400 rounded-full"></span>
                                                    {groupName}
                                                </h4>
                                                <button 
                                                    type="button"
                                                    onClick={() => toggleGroup(groupIds, allSelected)}
                                                    className={`text-[10px] font-bold uppercase hover:underline ${allSelected ? 'text-red-500' : 'text-blue-600'}`}
                                                >
                                                    {allSelected ? "Hapus Semua" : "Pilih Semua"}
                                                </button>
                                            </div>
                                            
                                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                                                {perms.map(perm => (
                                                    <label 
                                                        key={perm.id} 
                                                        className={`
                                                            flex items-start gap-3 p-2.5 rounded-lg border cursor-pointer transition-all select-none
                                                            ${selectedPermissionIds.includes(perm.id) 
                                                                ? "bg-green-50 border-[#009846] ring-1 ring-[#009846]/20 shadow-sm" 
                                                                : "bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50"}
                                                        `}
                                                    >
                                                        <div className="pt-0.5">
                                                            <input 
                                                                type="checkbox"
                                                                className="w-4 h-4 text-[#009846] border-slate-300 rounded focus:ring-[#009846] cursor-pointer"
                                                                checked={selectedPermissionIds.includes(perm.id)}
                                                                onChange={() => togglePermission(perm.id)}
                                                            />
                                                        </div>
                                                        <div>
                                                            <div className={`text-xs font-semibold ${selectedPermissionIds.includes(perm.id) ? 'text-[#009846]' : 'text-slate-700'}`}>
                                                                {perm.name}
                                                            </div>
                                                            <div className="text-[10px] text-slate-400 font-mono mt-0.5 break-all">
                                                                {perm.slug}
                                                            </div>
                                                        </div>
                                                    </label>
                                                ))}
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        )}
                    </div>

                    {/* Footer Actions */}
                    <div className="px-6 py-4 border-t border-slate-200 bg-white flex justify-end gap-3 sticky bottom-0 z-10 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
                        <button 
                            onClick={() => setSelectedRoleId(null)}
                            className="px-4 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-all"
                        >
                            Tutup
                        </button>
                        <button 
                            onClick={saveRolePermissions}
                            disabled={permLoading}
                            className="px-6 py-2 text-sm font-bold text-white bg-[#009846] rounded-lg hover:bg-[#007b3a] shadow-md hover:shadow-lg transition-all flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                        >
                            {permLoading ? (
                                <>
                                    <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Menyimpan...
                                </>
                            ) : (
                                "Simpan Perubahan"
                            )}
                        </button>
                    </div>
                </div>
            ) : (
                // Placeholder State (Saat belum ada role yang dipilih)
                <div className="h-full min-h-[400px] flex flex-col items-center justify-center bg-slate-50/50 rounded-xl border-2 border-dashed border-slate-200 p-8 text-center animate-fade-in">
                    <div className="w-20 h-20 bg-white rounded-full shadow-sm border border-slate-100 flex items-center justify-center mb-6 text-4xl">
                        👈
                    </div>
                    <h3 className="text-xl font-bold text-slate-700">Pilih Role Dahulu</h3>
                    <p className="text-sm text-slate-500 max-w-sm mt-3 leading-relaxed">
                        Klik tombol <strong>"Atur Hak Akses"</strong> pada salah satu role di daftar sebelah kiri untuk mulai mengatur izin apa saja yang dimiliki role tersebut.
                    </p>
                </div>
            )}
        </div>

      </div>
    </div>
  );
}

export default RolePage;