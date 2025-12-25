// src/components/CategoryPage.jsx
import { useState, useEffect } from "react";

function CategoryPage({ categories, onCreate, onUpdate, onDelete }) {
  // FORM STATE
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [description, setDescription] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState("");
  const [editCode, setEditCode] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [error, setError] = useState("");

  // UI STATE (Modal & Toast)
  const [deleteModal, setDeleteModal] = useState({ open: false, category: null });
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  // Helper Toast
  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 3000);
  };

  const resetForm = () => {
    setName("");
    setCode("");
    setDescription("");
    setError("");
  };

  // --- HANDLERS ---

  const handleCreate = async (e) => {
    e.preventDefault();
    setError("");

    if (!name) {
      setError("Nama kategori wajib diisi");
      return;
    }

    try {
      await onCreate({ name, code, description });
      resetForm();
      showToast("Kategori berhasil dibuat", "success");
    } catch (err) {
      setError(err.message || "Gagal membuat kategori baru");
      showToast("Gagal membuat kategori", "error");
    }
  };

  const startEdit = (cat) => {
    setEditingId(cat.id);
    setEditName(cat.name);
    setEditCode(cat.code || "");
    setEditDescription(cat.description || "");
    setError("");
    // Scroll ke form di atas (opsional, UX bagus)
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!editName) {
      setError("Nama kategori wajib diisi");
      return;
    }

    try {
      await onUpdate(editingId, {
        name: editName,
        code: editCode,
        description: editDescription,
      });
      setEditingId(null);
      setEditName("");
      setEditCode("");
      setEditDescription("");
      showToast("Perubahan disimpan", "success");
    } catch (err) {
      setError(err.message);
      showToast("Gagal update kategori", "error");
    }
  };

  // Buka Modal Hapus
  const confirmDelete = (cat) => {
    setDeleteModal({ open: true, category: cat });
  };

  // Eksekusi Hapus
  const handleDeleteAction = async () => {
    const cat = deleteModal.category;
    if (!cat) return;

    try {
      await onDelete(cat.id);
      setDeleteModal({ open: false, category: null });
      showToast("Kategori dihapus", "success");
    } catch (err) {
      // Tutup modal dulu baru kasih error toast, atau biarkan modal terbuka
      setDeleteModal({ open: false, category: null });
      showToast(err.message || "Gagal menghapus kategori", "error");
    }
  };

  return (
    <div className="space-y-6 font-sans relative">
      
      {/* TOAST NOTIFICATION */}
      {toast.show && (
        <div className={`fixed top-5 right-5 z-[60] px-4 py-3 rounded-lg shadow-lg border flex items-center gap-3 animate-bounce-in transition-all ${
            toast.type === 'success' 
            ? 'bg-green-50 border-green-200 text-green-700' 
            : 'bg-red-50 border-red-200 text-red-700'
        }`}>
            <span className="text-xl">
                {toast.type === 'success' ? '✅' : '❌'}
            </span>
            <span className="text-sm font-medium">{toast.message}</span>
        </div>
      )}

      {/* HEADER */}
      <div>
        <h1 className="text-2xl font-bold text-slate-800 tracking-tight">
          Kategori Aset
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Kelola pengelompokan aset (Contoh: Elektronik, Furniture, Kendaraan).
        </p>
      </div>

      {/* FORM TAMBAH / EDIT */}
      <div 
        className={`bg-white rounded-xl shadow-sm border p-5 transition-all duration-300 ${
          editingId 
            ? 'border-[#F68D2E]/50 ring-1 ring-[#F68D2E]/30' // Mode Edit: Border Oranye Lembut
            : 'border-slate-100' // Mode Tambah: Standar
        }`}
      >
        <div className="flex items-center gap-2 mb-4">
            {/* Ikon: Hijau saat Tambah, Oranye saat Edit */}
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${
                editingId 
                ? 'bg-orange-100 text-[#F68D2E]' 
                : 'bg-green-100 text-[#009846]'
            }`}>
                {editingId ? '✎' : '+'}
            </div>
            <h2 className="text-sm font-bold text-slate-800">
                {editingId ? "Edit Kategori" : "Tambah Kategori Baru"}
            </h2>
        </div>

        {error && (
          <div className="text-xs text-red-600 mb-3 bg-red-50 p-2 rounded border border-red-100">{error}</div>
        )}

        <form
          onSubmit={editingId ? handleEditSubmit : handleCreate}
          className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm"
        >
          {/* NAMA */}
          <div className="md:col-span-1">
            <label className="block text-xs font-medium text-slate-700 mb-1">Nama Kategori <span className="text-red-500">*</span></label>
            <input
              className="border border-slate-300 rounded-lg w-full px-3 py-2 focus:ring-2 focus:ring-[#009846] focus:border-[#009846] outline-none transition-all"
              value={editingId ? editName : name}
              onChange={(e) =>
                editingId
                  ? setEditName(e.target.value)
                  : setName(e.target.value)
              }
              placeholder="Contoh: Elektronik"
            />
          </div>

          {/* KODE */}
          <div className="md:col-span-1">
            <label className="block text-xs font-medium text-slate-700 mb-1">Kode (Singkatan)</label>
            <input
              className="border border-slate-300 rounded-lg w-full px-3 py-2 focus:ring-2 focus:ring-[#009846] focus:border-[#009846] outline-none transition-all"
              value={editingId ? editCode : code}
              onChange={(e) =>
                editingId
                  ? setEditCode(e.target.value)
                  : setCode(e.target.value)
              }
              placeholder="Contoh: ELK / IKE"
            />
          </div>

          {/* DESKRIPSI */}
          <div className="md:col-span-2">
            <label className="block text-xs font-medium text-slate-700 mb-1">Deskripsi</label>
            <div className="flex gap-2">
                <input
                className="border border-slate-300 rounded-lg w-full px-3 py-2 focus:ring-2 focus:ring-[#009846] focus:border-[#009846] outline-none transition-all"
                value={editingId ? editDescription : description}
                onChange={(e) =>
                    editingId
                    ? setEditDescription(e.target.value)
                    : setDescription(e.target.value)
                }
                placeholder="Keterangan tambahan..."
                />
                
                {/* TOMBOL SIMPAN / TAMBAH - SEKARANG KONSISTEN HIJAU SF */}
                <button
                    type="submit"
                    className="px-4 py-2 text-xs font-medium rounded-lg text-white shadow-sm transition-all flex-shrink-0 bg-[#009846] hover:bg-[#007033]"
                >
                    {editingId ? "Simpan" : "Tambah"}
                </button>

                {editingId && (
                    <button
                    type="button"
                    onClick={() => {
                        setEditingId(null);
                        setEditName("");
                        setEditCode("");
                        setEditDescription("");
                        setError("");
                    }}
                    className="px-3 py-2 text-xs font-medium rounded-lg border border-slate-300 text-slate-600 hover:bg-slate-50 transition-all flex-shrink-0"
                    >
                    Batal
                    </button>
                )}
            </div>
          </div>
        </form>
      </div>

      {/* TABEL KATEGORI */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
            <h2 className="text-sm font-bold text-slate-800">
            Daftar Kategori
            </h2>
            <span className="text-xs text-slate-500 bg-white px-2 py-1 rounded border">
                Total: <b>{categories.length}</b>
            </span>
        </div>

        {categories.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-sm text-slate-400">
              Belum ada kategori aset. Silakan tambah di atas.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs md:text-sm">
              {/* HEADER HIJAU SF */}
              <thead className="bg-[#009846]/5 border-b border-[#009846]/10">
                <tr>
                  <th className="text-left p-3 font-bold text-[#007033]">Nama Kategori</th>
                  <th className="text-left p-3 font-bold text-[#007033]">Kode</th>
                  <th className="text-left p-3 font-bold text-[#007033]">Deskripsi</th>
                  <th className="text-left p-3 font-bold text-[#007033]">Dibuat</th>
                  <th className="text-right p-3 font-bold text-[#007033] w-32">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {categories.map((cat) => (
                  <tr key={cat.id} className={`hover:bg-slate-50 transition-colors ${editingId === cat.id ? 'bg-blue-50/60' : ''}`}>
                    <td className="p-3 font-medium text-slate-700">
                        {cat.name}
                        {editingId === cat.id && <span className="ml-2 text-[10px] text-blue-600 font-bold">(Sedang diedit)</span>}
                    </td>
                    <td className="p-3 font-mono text-slate-600">{cat.code || "-"}</td>
                    <td className="p-3 text-slate-500">
                      {cat.description || "-"}
                    </td>
                    <td className="p-3 text-slate-500">
                      {cat.created_at
                        ? new Date(cat.created_at).toLocaleDateString("id-ID", { day: 'numeric', month: 'short', year: 'numeric'})
                        : "-"}
                    </td>
                    <td className="p-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => startEdit(cat)}
                          className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                          title="Edit"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125" />
                          </svg>
                        </button>
                        <button
                          type="button"
                          onClick={() => confirmDelete(cat)}
                          className="p-1.5 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                          title="Hapus"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL DELETE */}
      {deleteModal.open && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in"
          onClick={() => setDeleteModal({ open: false, category: null })}
        >
          <div 
            className="bg-white rounded-xl shadow-2xl w-full max-w-sm overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-red-50 p-4 flex items-center gap-3 border-b border-red-100">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center text-red-600">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-bold text-red-700">Hapus Kategori?</h3>
                <p className="text-xs text-red-500">Tindakan ini permanen.</p>
              </div>
            </div>

            <div className="p-5 text-sm text-slate-600">
              <p>Anda akan menghapus kategori:</p>
              <div className="mt-2 bg-slate-50 p-3 rounded border border-slate-200 font-bold text-slate-800">
                {deleteModal.category?.name}
              </div>
              <p className="mt-3 text-xs text-slate-400">
                *Pastikan tidak ada aset yang menggunakan kategori ini, atau penghapusan akan gagal.
              </p>
            </div>

            <div className="flex justify-end gap-3 p-4 border-t bg-slate-50">
              <button
                onClick={() => setDeleteModal({ open: false, category: null })}
                className="px-4 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-300 rounded hover:bg-slate-100 transition"
              >
                Batal
              </button>
              <button
                onClick={handleDeleteAction}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded hover:bg-red-700 shadow-md transition flex items-center gap-2"
              >
                Ya, Hapus
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default CategoryPage;