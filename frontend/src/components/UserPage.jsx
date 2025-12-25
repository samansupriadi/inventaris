// src/components/UserPage.jsx
import { useState } from "react";

function UserPage({ users, roles, entities, onCreate, onUpdate, onDelete }) {
  // State Management
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [entityId, setEntityId] = useState(null);
  const [selectedRoles, setSelectedRoles] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Helper: Reset Form
  const resetForm = () => {
    setName("");
    setEmail("");
    setPassword("");
    setEntityId(null);
    setSelectedRoles([]);
    setEditingId(null);
    setError("");
  };

  // Helper: Toggle Role Selection
  const handleToggleRole = (roleId) => {
    setSelectedRoles((prev) =>
      prev.includes(roleId)
        ? prev.filter((id) => id !== roleId)
        : [...prev, roleId]
    );
  };

  // Helper: Submit Handler
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!name || !email) {
      setError("Nama dan email wajib diisi.");
      return;
    }

    if (!editingId && !password) {
      setError("Password wajib diisi untuk user baru.");
      return;
    }

    const payload = {
      name,
      email,
      role_ids: selectedRoles,
      entity_id: entityId || null,
    };

    if (password) {
      payload.password = password;
    }

    setLoading(true);
    try {
      if (editingId) {
        await onUpdate(editingId, payload);
      } else {
        await onCreate(payload);
      }
      resetForm();
    } catch (err) {
      setError(err.message || "Gagal menyimpan user.");
    } finally {
      setLoading(false);
    }
  };

  // Helper: Edit User
  const startEdit = (user) => {
    setEditingId(user.id);
    setName(user.name);
    setEmail(user.email);
    setPassword(""); // Password kosongkan saat edit (opsional diisi)
    setEntityId(user.entity_id || null);
    setSelectedRoles(user.roles ? user.roles.map((r) => r.id) : []);
    setError("");
    
    // Scroll ke form
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Helper: Delete User
  const handleDeleteClick = async (user) => {
    if (!window.confirm(`Yakin ingin menghapus user "${user.name}"?`)) return;
    try {
      await onDelete(user.id);
    } catch (err) {
      alert(err.message || "Gagal menghapus user.");
    }
  };

  // Helper: Get Initials for Avatar
  const getInitials = (name) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();
  };

  return (
    <div className="space-y-8 animate-fade-in pb-20">
      
      {/* HEADER PAGE */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Users Management</h1>
          <p className="text-sm text-slate-500 mt-1">
            Kelola akun pengguna, entitas, dan hak akses (role).
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        
        {/* KOLOM KIRI: FORM USER */}
        <div className="lg:col-span-1 space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden sticky top-6">
                <div className="px-5 py-3 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
                    <h3 className="font-semibold text-slate-700 text-sm">
                        {editingId ? "Edit User" : "Tambah User Baru"}
                    </h3>
                    {editingId && (
                        <button onClick={resetForm} className="text-xs text-red-500 hover:underline">Batal Edit</button>
                    )}
                </div>
                
                <div className="p-5">
                    {error && (
                        <div className="mb-4 bg-red-50 text-red-600 text-xs p-3 rounded-lg border border-red-100 flex items-center gap-2">
                            <span>⚠️</span> {error}
                        </div>
                    )}
                    
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {/* Nama */}
                        <div>
                            <label className="block text-xs font-medium text-slate-700 mb-1">Nama Lengkap</label>
                            <input 
                                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#009846] focus:border-[#009846] outline-none transition-all"
                                placeholder="Contoh: Budi Santoso"
                                value={name}
                                onChange={e => setName(e.target.value)}
                            />
                        </div>

                        {/* Email */}
                        <div>
                            <label className="block text-xs font-medium text-slate-700 mb-1">Email Address</label>
                            <input 
                                type="email"
                                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#009846] focus:border-[#009846] outline-none transition-all"
                                placeholder="nama@sinergifoundation.org"
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                            />
                        </div>

                        {/* Password */}
                        <div>
                            <label className="block text-xs font-medium text-slate-700 mb-1">
                                Password {editingId && <span className="text-slate-400 font-normal">(Kosongkan jika tidak diubah)</span>}
                            </label>
                            <input 
                                type="password"
                                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#009846] focus:border-[#009846] outline-none transition-all"
                                placeholder="••••••••"
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                            />
                        </div>

                        {/* Entitas */}
                        <div>
                            <label className="block text-xs font-medium text-slate-700 mb-1">Entitas (Cabang/Unit)</label>
                            <select 
                                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#009846] focus:border-[#009846] outline-none transition-all bg-white"
                                value={entityId || ""}
                                onChange={e => setEntityId(e.target.value === "" ? null : Number(e.target.value))}
                            >
                                <option value="">-- Pilih Entitas --</option>
                                {entities.map(ent => (
                                    <option key={ent.id} value={ent.id}>{ent.name}</option>
                                ))}
                            </select>
                        </div>

                        {/* Role Selection (Pills Style) */}
                        <div>
                            <label className="block text-xs font-medium text-slate-700 mb-2">Role (Peran)</label>
                            <div className="flex flex-wrap gap-2">
                                {roles.map(role => {
                                    const isSelected = selectedRoles.includes(role.id);
                                    return (
                                        <div 
                                            key={role.id}
                                            onClick={() => handleToggleRole(role.id)}
                                            className={`
                                                cursor-pointer px-3 py-1.5 rounded-full text-xs font-medium border transition-all select-none
                                                ${isSelected 
                                                    ? "bg-[#009846] text-white border-[#009846] shadow-sm" 
                                                    : "bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:bg-slate-50"}
                                            `}
                                        >
                                            {role.name}
                                            {isSelected && <span className="ml-1.5 opacity-70">✓</span>}
                                        </div>
                                    )
                                })}
                            </div>
                            {roles.length === 0 && <p className="text-xs text-slate-400 italic">Belum ada data role.</p>}
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
                                editingId ? "Simpan Perubahan" : "Buat User Baru"
                            )}
                        </button>
                    </form>
                </div>
            </div>
        </div>

        {/* KOLOM KANAN: LIST USER */}
        <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                    <div>
                        <h3 className="font-bold text-slate-800 text-sm">Daftar Pengguna</h3>
                        <p className="text-xs text-slate-500 mt-0.5">Total {users.length} akun terdaftar</p>
                    </div>
                </div>
                
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider font-semibold border-b border-slate-100">
                                <th className="px-6 py-3">User</th>
                                <th className="px-6 py-3">Entitas</th>
                                <th className="px-6 py-3">Role</th>
                                <th className="px-6 py-3 text-right">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-sm">
                            {users.length === 0 ? (
                                <tr>
                                    <td colSpan="4" className="px-6 py-8 text-center text-slate-400 italic">
                                        Belum ada data user.
                                    </td>
                                </tr>
                            ) : (
                                users.map(user => (
                                    <tr key={user.id} className="hover:bg-slate-50/80 transition-colors group">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                {/* Avatar Inisial */}
                                                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-100 to-blue-200 text-blue-700 flex items-center justify-center text-xs font-bold shadow-sm border border-blue-100">
                                                    {getInitials(user.name)}
                                                </div>
                                                <div>
                                                    <div className="font-semibold text-slate-800">{user.name}</div>
                                                    <div className="text-xs text-slate-500">{user.email}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            {user.entity_name ? (
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-50 text-purple-700 border border-purple-100">
                                                    {user.entity_name}
                                                </span>
                                            ) : (
                                                <span className="text-slate-400 text-xs">-</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-wrap gap-1">
                                                {user.roles && user.roles.length > 0 ? (
                                                    user.roles.map(r => (
                                                        <span key={r.id} className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-600 border border-slate-200">
                                                            {r.name}
                                                        </span>
                                                    ))
                                                ) : (
                                                    <span className="text-slate-400 text-xs italic">No Role</span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button 
                                                    onClick={() => startEdit(user)}
                                                    className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                                                    title="Edit User"
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                                                </button>
                                                <button 
                                                    onClick={() => handleDeleteClick(user)}
                                                    className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                                                    title="Hapus User"
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>

      </div>
    </div>
  );
}

export default UserPage;