// src/components/CategoryPage.jsx
import { useState, useEffect } from "react";

function CategoryPage({ categories, onCreate, onUpdate, onDelete, loading }) {
  // STATE
  const [modalOpen, setModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editId, setEditId] = useState(null);

  // Form Fields
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [description, setDescription] = useState("");
  const [usefulLife, setUsefulLife] = useState(0);
  
  // STATE BARU: STATUS PENYUSUTAN
  const [isDepreciable, setIsDepreciable] = useState(true); 

  const [formError, setFormError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // UI STATE
  const [deleteModal, setDeleteModal] = useState({ open: false, category: null });
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  // Helper Toast
  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 3000);
  };

  const openAddModal = () => {
    setIsEditMode(false);
    setEditId(null);
    setName(""); setCode(""); setDescription(""); setUsefulLife(0);
    setIsDepreciable(true); // Default True
    setFormError("");
    setModalOpen(true);
  };

  const openEditModal = (cat) => {
    setIsEditMode(true);
    setEditId(cat.id);
    setName(cat.name);
    setCode(cat.code || "");
    setDescription(cat.description || "");
    setUsefulLife(cat.useful_life || 0);
    setIsDepreciable(cat.is_depreciable); // Load status dari DB
    setFormError("");
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setFormError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError("");
    setIsSubmitting(true);

    if (!name.trim()) {
      setFormError("Nama kategori wajib diisi");
      setIsSubmitting(false);
      return;
    }

    const payload = {
      name,
      code,
      description,
      // Jika tidak disusutkan, paksa umur jadi 0
      useful_life: isDepreciable ? (parseInt(usefulLife) || 0) : 0,
      is_depreciable: isDepreciable // Kirim status ke BE
    };

    try {
      if (isEditMode) {
        await onUpdate(editId, payload);
        showToast("Perubahan berhasil disimpan", "success");
      } else {
        await onCreate(payload);
        showToast("Kategori berhasil dibuat", "success");
      }
      handleCloseModal();
    } catch (err) {
      setFormError(err.message || "Terjadi kesalahan sistem");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteAction = async () => {
    const cat = deleteModal.category;
    if (!cat) return;
    try {
      await onDelete(cat.id);
      setDeleteModal({ open: false, category: null });
      showToast("Kategori berhasil dihapus", "success");
    } catch (err) {
      setDeleteModal({ open: false, category: null });
      showToast(err.message || "Gagal menghapus kategori", "error");
    }
  };

  return (
    <div className="space-y-6 font-sans">
      
      {/* Toast */}
      {toast.show && (
        <div className={`fixed top-5 right-5 z-[70] px-4 py-3 rounded-lg shadow-xl border flex items-center gap-3 animate-fade-in ${
            toast.type === 'success' ? 'bg-green-50 border-green-200 text-green-700' : 'bg-red-50 border-red-200 text-red-700'
        }`}>
            <span className="text-xl">{toast.type === 'success' ? '✅' : '❌'}</span>
            <span className="text-sm font-medium">{toast.message}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Kategori Aset</h1>
          <p className="text-xs text-slate-500 mt-1">Atur pengelompokan dan standar umur ekonomis aset yayasan.</p>
        </div>
        <button onClick={openAddModal} className="px-4 py-2 bg-[#009846] hover:bg-[#007b3a] text-white rounded-lg text-sm font-medium shadow-md transition-all flex items-center gap-2">
          <span>+</span> Tambah Kategori
        </button>
      </div>

      {/* Tabel */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        {loading ? (
           <div className="p-12 text-center text-slate-500 text-sm">Sedang memuat data...</div>
        ) : categories.length === 0 ? (
          <div className="p-12 text-center flex flex-col items-center justify-center">
            <div className="text-4xl mb-3">🗂️</div>
            <p className="text-slate-500 text-sm">Belum ada kategori aset.</p>
            <button onClick={openAddModal} className="mt-4 text-[#009846] text-xs font-bold hover:underline">Tambah Sekarang</button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 font-semibold uppercase text-xs tracking-wider">
                <tr>
                  <th className="p-4 w-1/4">Nama Kategori</th>
                  <th className="p-4 w-1/6">Kode</th>
                  <th className="p-4 w-1/6">Penyusutan</th>
                  <th className="p-4">Deskripsi</th>
                  <th className="p-4 text-right w-32">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {categories.map((cat) => (
                  <tr key={cat.id} className="hover:bg-slate-50/80 transition-colors group">
                    <td className="p-4 font-medium text-slate-800">{cat.name}</td>
                    <td className="p-4">
                        {cat.code ? <span className="font-mono text-xs bg-slate-100 px-2 py-1 rounded text-slate-600 border border-slate-200">{cat.code}</span> : <span className="text-slate-300">-</span>}
                    </td>
                    <td className="p-4">
                        {cat.is_depreciable ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700">
                                {cat.useful_life} Tahun
                            </span>
                        ) : (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-50 text-orange-700 border border-orange-100">
                                Tidak Disusutkan
                            </span>
                        )}
                    </td>
                    <td className="p-4 text-slate-500 truncate max-w-xs">{cat.description || "-"}</td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => openEditModal(cat)} className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125" /></svg>
                        </button>
                        <button onClick={() => { setDeleteModal({ open: true, category: cat }); }} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" /></svg>
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

      {/* Modal Form */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in" onClick={handleCloseModal}>
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden transform scale-100 transition-all" onClick={e => e.stopPropagation()}>
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center">
                <h3 className="text-lg font-bold text-slate-800">{isEditMode ? "Edit Kategori" : "Tambah Kategori Baru"}</h3>
                <button onClick={handleCloseModal} className="text-slate-400 hover:text-red-500">✕</button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
                {formError && <div className="p-3 bg-red-50 text-red-600 text-xs rounded border border-red-100">{formError}</div>}
                
                <div className="grid grid-cols-3 gap-4">
                    <div className="col-span-2">
                        <label className="block text-xs font-semibold text-slate-600 mb-1.5">Nama Kategori <span className="text-red-500">*</span></label>
                        <input className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#009846] focus:border-[#009846] outline-none" placeholder="Contoh: Tanah" value={name} onChange={e => setName(e.target.value)} autoFocus />
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1.5">Kode</label>
                        <input className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#009846] focus:border-[#009846] outline-none" placeholder="TNH" value={code} onChange={e => setCode(e.target.value.toUpperCase())} />
                    </div>
                </div>

                {/* === FITUR BARU: TOGGLE DEPRESIASI === */}
                <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 space-y-3">
                    <div className="flex items-center justify-between">
                        <label className="text-xs font-bold text-slate-700">Apakah aset ini disusutkan?</label>
                        {/* Custom Toggle Checkbox */}
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input type="checkbox" className="sr-only peer" checked={isDepreciable} onChange={(e) => setIsDepreciable(e.target.checked)} />
                          <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#009846]"></div>
                        </label>
                    </div>

                    {isDepreciable ? (
                        <div className="relative animate-fade-in">
                            <label className="block text-xs font-semibold text-slate-600 mb-1.5">Standar Umur Ekonomis</label>
                            <input type="number" min="0" className="w-full border border-slate-300 rounded-lg pl-3 pr-16 py-2 text-sm focus:ring-2 focus:ring-[#009846] outline-none" placeholder="0" value={usefulLife} onChange={e => setUsefulLife(e.target.value)} />
                            <div className="absolute top-[26px] right-0 flex items-center pr-3 pointer-events-none text-slate-500 text-xs font-medium bg-slate-100 border-l border-slate-300 rounded-r-lg px-3 py-2.5">Tahun</div>
                            <p className="text-[10px] text-slate-400 mt-1">Aset akan mengalami penyusutan nilai setiap tahun.</p>
                        </div>
                    ) : (
                        <div className="text-xs text-orange-600 bg-orange-50 p-2 rounded border border-orange-100 animate-fade-in">
                            ℹ️ Aset dalam kategori ini (seperti Tanah/Emas) nilainya <b>tetap atau naik</b>. Tidak ada perhitungan penyusutan.
                        </div>
                    )}
                </div>

                <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5">Deskripsi</label>
                    <textarea className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#009846] outline-none resize-none" rows={3} placeholder="Keterangan..." value={description} onChange={e => setDescription(e.target.value)} />
                </div>

                <div className="pt-4 flex justify-end gap-3 border-t border-slate-100 mt-2">
                    <button type="button" onClick={handleCloseModal} className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 rounded-lg border border-slate-300">Batal</button>
                    <button type="submit" disabled={isSubmitting} className="px-6 py-2 text-sm font-bold text-white bg-[#009846] hover:bg-[#007b3a] rounded-lg shadow-md disabled:opacity-70">{isSubmitting ? "Menyimpan..." : (isEditMode ? "Simpan Perubahan" : "Buat Kategori")}</button>
                </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Modal (Sama) */}
      {deleteModal.open && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in" onClick={() => setDeleteModal({ open: false, category: null })}>
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="bg-red-50 p-6 flex flex-col items-center text-center gap-3">
              <h3 className="text-lg font-bold text-slate-800">Hapus Kategori?</h3>
              <p className="text-sm text-slate-600">Anda yakin ingin menghapus <span className="font-bold">{deleteModal.category?.name}</span>?</p>
            </div>
            <div className="flex p-4 gap-3 bg-slate-50 border-t border-slate-100">
                <button onClick={() => setDeleteModal({ open: false, category: null })} className="flex-1 px-4 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-300 rounded-lg">Batal</button>
                <button onClick={handleDeleteAction} className="flex-1 px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700">Ya, Hapus</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default CategoryPage;