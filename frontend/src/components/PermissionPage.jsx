// src/components/PermissionPage.jsx
import React, { useState, useMemo } from "react";

function PermissionPage({ permissions, onCreate, onUpdate, onDelete }) {
  // === STATE MANAGEMENT ===
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [groupName, setGroupName] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // === HELPER FUNCTIONS ===

  // Generate Slug: "Lihat Data" -> "lihat_data"
  const generateSlug = (text) => {
    return text
      .toString()
      .toLowerCase()
      .trim()
      .replace(/[\s\W-]+/g, "_")
      .replace(/^_|_$/g, "");
  };

  const resetForm = () => {
    setName("");
    setSlug("");
    setGroupName("");
    setEditingId(null);
    setError("");
  };

  const startEdit = (perm) => {
    setEditingId(perm.id);
    setName(perm.name);
    setSlug(perm.slug);
    setGroupName(perm.group_name || "");
    setError("");
    // Scroll ke form
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!name || !slug) {
      setError("Nama dan Slug wajib diisi.");
      return;
    }

    const payload = {
      name,
      slug,
      group_name: groupName || null,
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
      setError(err.message || "Gagal menyimpan permission.");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClick = async (perm) => {
    if (!window.confirm(`Yakin ingin menghapus permission "${perm.name}"?`)) return;

    try {
      await onDelete(perm.id);
    } catch (err) {
      alert(err.message || "Gagal menghapus permission.");
    }
  };

  // === DATA PROCESSING ===

  // Mengelompokkan permission berdasarkan group_name
  const permissionsByGroup = useMemo(() => {
    return permissions.reduce((acc, p) => {
      const key = p.group_name || "Lainnya (Uncategorized)";
      if (!acc[key]) acc[key] = [];
      acc[key].push(p);
      return acc;
    }, {});
  }, [permissions]);

  // Mendapatkan daftar unik Group Name untuk fitur Autocomplete/Suggestion
  const uniqueGroups = useMemo(() => {
    const groups = permissions.map((p) => p.group_name).filter(Boolean);
    return [...new Set(groups)].sort();
  }, [permissions]);

  const sortedGroups = Object.keys(permissionsByGroup).sort();

  return (
    <div className="space-y-8 animate-fade-in pb-20">
      
      {/* HEADER PAGE */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Permission Management</h1>
          <p className="text-sm text-slate-500 mt-1">
            Daftar fitur teknis yang bisa diakses (Granular Access Control).
          </p>
        </div>
        <div className="text-right hidden md:block">
           <span className="bg-slate-100 text-slate-600 px-3 py-1 rounded-full text-xs font-semibold border border-slate-200">
             Total: {permissions.length} Item
           </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        
        {/* === KOLOM KIRI: FORM (STICKY) === */}
        <div className="lg:col-span-1 space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden sticky top-6">
                <div className="px-5 py-3 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
                    <h3 className="font-semibold text-slate-700 text-sm">
                        {editingId ? "Edit Permission" : "Buat Permission Baru"}
                    </h3>
                    {editingId && (
                        <button onClick={resetForm} className="text-xs text-red-500 hover:underline">Batal</button>
                    )}
                </div>

                <div className="p-5">
                    {error && (
                        <div className="mb-4 bg-red-50 text-red-600 text-xs p-3 rounded-lg border border-red-100 flex items-center gap-2">
                            <span>⚠️</span> {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        
                        {/* NAMA PERMISSION */}
                        <div>
                            <label className="block text-xs font-medium text-slate-700 mb-1">Nama Permission</label>
                            <input 
                                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#009846] focus:border-[#009846] outline-none transition-all"
                                placeholder="Contoh: Lihat Laporan Keuangan"
                                value={name}
                                onChange={e => {
                                    const val = e.target.value;
                                    setName(val);
                                    // Auto Slug jika mode tambah baru
                                    if (!editingId) {
                                        setSlug(generateSlug(val));
                                    }
                                }}
                            />
                        </div>

                        {/* SLUG */}
                        <div>
                            <label className="block text-xs font-medium text-slate-700 mb-1">Slug (Kode Sistem)</label>
                            <input 
                                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#009846] focus:border-[#009846] outline-none transition-all bg-slate-50 font-mono text-slate-600"
                                placeholder="contoh: view_financial_report"
                                value={slug}
                                onChange={e => setSlug(generateSlug(e.target.value))}
                            />
                            <p className="text-[10px] text-slate-400 mt-1">Digunakan oleh middleware backend.</p>
                        </div>

                        {/* GROUP NAME (WITH DATALIST SUGGESTION) */}
                        <div>
                            <label className="block text-xs font-medium text-slate-700 mb-1">Grup / Kategori</label>
                            <input 
                                list="group-suggestions"
                                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#009846] focus:border-[#009846] outline-none transition-all"
                                placeholder="Ketik atau pilih grup..."
                                value={groupName}
                                onChange={e => setGroupName(e.target.value)}
                            />
                            {/* Fitur Auto Suggestion agar nama grup konsisten */}
                            <datalist id="group-suggestions">
                                {uniqueGroups.map(g => (
                                    <option key={g} value={g} />
                                ))}
                            </datalist>
                        </div>

                        <button 
                            type="submit" 
                            disabled={loading}
                            className="w-full bg-[#009846] hover:bg-[#007b3a] text-white text-sm font-medium py-2.5 rounded-lg shadow-sm hover:shadow transition-all disabled:opacity-70 disabled:cursor-not-allowed flex justify-center items-center gap-2 mt-2"
                        >
                            {loading ? (
                                <>
                                    <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Menyimpan...
                                </>
                            ) : (
                                editingId ? "Simpan Perubahan" : "Buat Permission"
                            )}
                        </button>
                    </form>
                </div>
            </div>
        </div>

        {/* === KOLOM KANAN: LIST PERMISSION (GROUPED) === */}
        <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                   <h3 className="font-bold text-slate-800 text-sm">Daftar Hak Akses</h3>
                </div>

                {permissions.length === 0 ? (
                    <div className="p-8 text-center text-slate-400 italic">
                        Belum ada permission. Tambahkan minimal untuk User, Role, dan Aset.
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider font-semibold border-b border-slate-100">
                                    <th className="px-6 py-3 w-5/12">Nama Permission</th>
                                    <th className="px-6 py-3 w-5/12">Slug / Kode</th>
                                    <th className="px-6 py-3 w-2/12 text-right">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 text-sm">
                                {sortedGroups.map(group => (
                                    <React.Fragment key={group}>
                                        {/* GROUP HEADER ROW */}
                                        <tr className="bg-slate-100/70 border-b border-slate-100">
                                            <td colSpan="3" className="px-6 py-2">
                                                <div className="flex items-center gap-2">
                                                    <span className="w-2 h-2 rounded-full bg-slate-400"></span>
                                                    <span className="text-xs font-bold text-slate-700 uppercase tracking-wide">
                                                        {group}
                                                    </span>
                                                </div>
                                            </td>
                                        </tr>

                                        {/* PERMISSION ROWS */}
                                        {permissionsByGroup[group].map(perm => (
                                            <tr key={perm.id} className="hover:bg-slate-50 transition-colors group">
                                                <td className="px-6 py-3 text-slate-700 font-medium">
                                                    {perm.name}
                                                </td>
                                                <td className="px-6 py-3">
                                                    <code className="text-[11px] bg-slate-50 text-slate-500 border border-slate-200 px-1.5 py-0.5 rounded font-mono break-all">
                                                        {perm.slug}
                                                    </code>
                                                </td>
                                                <td className="px-6 py-3 text-right">
                                                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <button 
                                                            onClick={() => startEdit(perm)}
                                                            className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                                                            title="Edit"
                                                        >
                                                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                                                        </button>
                                                        <button 
                                                            onClick={() => handleDeleteClick(perm)}
                                                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                                                            title="Hapus"
                                                        >
                                                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </React.Fragment>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>

      </div>
    </div>
  );
}

export default PermissionPage;