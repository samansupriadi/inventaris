// src/components/LocationPage.jsx
import { useState } from "react";

function LocationPage({ locations, onCreate, onUpdate, onDelete }) {
  // STATE FORM
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState("");
  const [editCode, setEditCode] = useState("");
  const [error, setError] = useState("");

  // STATE UI (Modal & Toast)
  const [deleteModal, setDeleteModal] = useState({ open: false, location: null });
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  // Helper Toast
  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 3000);
  };

  const resetForm = () => {
    setName("");
    setCode("");
    setError("");
  };

  // --- HANDLERS ---

  const handleCreate = async (e) => {
    e.preventDefault();
    setError("");

    if (!name) {
      setError("Nama lokasi wajib diisi");
      return;
    }

    try {
      await onCreate({ name, code });
      resetForm();
      showToast("Lokasi berhasil ditambahkan", "success");
    } catch (err) {
      setError(err.message || "Gagal menambah lokasi");
      showToast("Gagal menambah lokasi", "error");
    }
  };

  const startEdit = (loc) => {
    setEditingId(loc.id);
    setEditName(loc.name);
    setEditCode(loc.code || "");
    setError("");
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!editName) {
      setError("Nama lokasi wajib diisi");
      return;
    }

    try {
      await onUpdate(editingId, {
        name: editName,
        code: editCode,
      });
      setEditingId(null);
      setEditName("");
      setEditCode("");
      showToast("Lokasi berhasil diperbarui", "success");
    } catch (err) {
      setError(err.message || "Gagal update lokasi");
      showToast("Gagal update lokasi", "error");
    }
  };

  // Buka Modal Hapus
  const confirmDelete = (loc) => {
    setDeleteModal({ open: true, location: loc });
  };

  // Eksekusi Hapus
  const handleDeleteAction = async () => {
    const loc = deleteModal.location;
    if (!loc) return;

    try {
      await onDelete(loc.id);
      setDeleteModal({ open: false, location: null });
      showToast("Lokasi berhasil dihapus", "success");
    } catch (err) {
      setDeleteModal({ open: false, location: null });
      showToast(err.message || "Gagal menghapus lokasi", "error");
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
        <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Lokasi Aset</h1>
        <p className="text-xs text-slate-500 mt-1">
          Kelola master lokasi fisik penyimpanan aset (misal: Kantor Pusat, Gudang A, dll).
        </p>
      </div>

      {/* FORM TAMBAH / EDIT */}
      <div className={`bg-white rounded-xl shadow-sm border p-5 transition-all duration-300 ${
          editingId 
            ? 'border-[#F68D2E]/50 ring-1 ring-[#F68D2E]/30' 
            : 'border-slate-100'
        }`}
      >
        <div className="flex items-center gap-2 mb-4">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${
                editingId 
                ? 'bg-orange-100 text-[#F68D2E]' 
                : 'bg-green-100 text-[#009846]'
            }`}>
                {editingId ? '✎' : '+'}
            </div>
            <h2 className="text-sm font-bold text-slate-800">
                {editingId ? "Edit Lokasi" : "Tambah Lokasi Baru"}
            </h2>
        </div>

        {error && (
          <div className="text-xs text-red-600 mb-3 bg-red-50 p-2 rounded border border-red-100">{error}</div>
        )}

        <form
          onSubmit={editingId ? handleEditSubmit : handleCreate}
          className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm"
        >
          {/* NAMA */}
          <div className="md:col-span-1">
            <label className="block text-xs font-medium text-slate-700 mb-1">Nama Lokasi <span className="text-red-500">*</span></label>
            <input
              className="border border-slate-300 rounded-lg w-full px-3 py-2 focus:ring-2 focus:ring-[#009846] focus:border-[#009846] outline-none transition-all"
              value={editingId ? editName : name}
              onChange={(e) =>
                editingId
                  ? setEditName(e.target.value)
                  : setName(e.target.value)
              }
              placeholder="Misal: Kantor Pusat"
            />
          </div>

          {/* KODE */}
          <div className="md:col-span-1">
            <label className="block text-xs font-medium text-slate-700 mb-1">Kode (Opsional)</label>
            <input
              className="border border-slate-300 rounded-lg w-full px-3 py-2 focus:ring-2 focus:ring-[#009846] focus:border-[#009846] outline-none transition-all"
              value={editingId ? editCode : code}
              onChange={(e) =>
                editingId
                  ? setEditCode(e.target.value)
                  : setCode(e.target.value)
              }
              placeholder="Misal: KPUSAT"
            />
          </div>

          {/* TOMBOL AKSI */}
          <div className="md:col-span-1 flex items-end gap-2">
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
                  setError("");
                }}
                className="px-3 py-2 text-xs font-medium rounded-lg border border-slate-300 text-slate-600 hover:bg-slate-50 transition-all flex-shrink-0"
              >
                Batal
              </button>
            )}
          </div>
        </form>
      </div>

      {/* TABEL LOKASI */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
            <h2 className="text-sm font-bold text-slate-800">Daftar Lokasi</h2>
            <span className="text-xs font-medium text-slate-500 bg-white px-2 py-1 rounded border">
                Total: <b>{locations.length}</b>
            </span>
        </div>

        {locations.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-sm text-slate-400">
              Belum ada lokasi. Silakan tambahkan di atas.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs md:text-sm">
              {/* HEADER HIJAU SF */}
              <thead className="bg-[#009846]/5 border-b border-[#009846]/10">
                <tr>
                  <th className="text-left p-3 font-bold text-[#007033]">Nama Lokasi</th>
                  <th className="text-left p-3 font-bold text-[#007033]">Kode</th>
                  <th className="text-left p-3 font-bold text-[#007033]">Dibuat Pada</th>
                  <th className="text-right p-3 font-bold text-[#007033] w-32">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {locations.map((loc) => (
                  <tr key={loc.id} className={`hover:bg-slate-50 transition-colors ${editingId === loc.id ? 'bg-orange-50/40' : ''}`}>
                    <td className="p-3 font-medium text-slate-700">
                        {loc.name}
                        {editingId === loc.id && <span className="ml-2 text-[10px] text-[#F68D2E] font-bold">(Edit)</span>}
                    </td>
                    <td className="p-3 font-mono text-slate-600">{loc.code || "-"}</td>
                    <td className="p-3 text-slate-500">
                      {loc.created_at
                        ? new Date(loc.created_at).toLocaleDateString("id-ID", { day: 'numeric', month: 'short', year: 'numeric' })
                        : "-"}
                    </td>
                    <td className="p-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => startEdit(loc)}
                          className="p-1.5 text-slate-400 hover:text-blue-600 rounded hover:bg-blue-50 transition"
                          title="Edit"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                        </button>
                        <button
                          type="button"
                          onClick={() => confirmDelete(loc)}
                          className="p-1.5 text-slate-400 hover:text-red-600 rounded hover:bg-red-50 transition"
                          title="Hapus"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in" onClick={() => setDeleteModal({ open: false, location: null })}>
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm overflow-hidden" onClick={e => e.stopPropagation()}>
                <div className="bg-red-50 p-4 flex items-center gap-3 border-b border-red-100">
                    <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center text-red-600">⚠</div>
                    <div>
                        <h3 className="text-lg font-bold text-red-700">Hapus Lokasi?</h3>
                        <p className="text-xs text-red-500">Tindakan ini tidak bisa dibatalkan.</p>
                    </div>
                </div>
                <div className="p-5 text-sm text-slate-600">
                    <p>Anda akan menghapus lokasi:</p>
                    <div className="mt-2 bg-slate-50 p-3 rounded border border-slate-200 font-bold text-slate-800">
                        {deleteModal.location?.name}
                    </div>
                    <p className="mt-3 text-xs text-slate-400">
                        *Pastikan tidak ada aset yang tersimpan di lokasi ini sebelum menghapus.
                    </p>
                </div>
                <div className="flex justify-end gap-3 p-4 border-t bg-slate-50">
                    <button onClick={() => setDeleteModal({ open: false, location: null })} className="px-4 py-2 text-sm font-medium text-slate-600 bg-white border rounded hover:bg-slate-100">Batal</button>
                    <button onClick={handleDeleteAction} className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded hover:bg-red-700 shadow-md">Ya, Hapus</button>
                </div>
            </div>
        </div>
      )}

    </div>
  );
}

export default LocationPage;