// src/components/FundingSourcePage.jsx
import React, { useEffect, useState } from "react";
import {
  fetchBudgetCodes,
  createBudgetCode,
  updateBudgetCode,
  deleteBudgetCode,
} from "../api";

function FundingSourcePage({
  fundingSources,
  entities,
  onCreate,
  onUpdate,
  onDelete,
}) {
  // --- STATE UTAMA ---
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [entityId, setEntityId] = useState("");
  const [editingId, setEditingId] = useState(null);
  
  // State Edit
  const [editName, setEditName] = useState("");
  const [editCode, setEditCode] = useState("");
  const [editEntityId, setEditEntityId] = useState("");
  
  const [error, setError] = useState("");

  // --- STATE KMA (Sub-Table) ---
  const [budgetCodes, setBudgetCodes] = useState([]);
  const [expandedSourceId, setExpandedSourceId] = useState(null); // Accordion logic

  // Form KMA
  const [kmaCode, setKmaCode] = useState("");
  const [kmaName, setKmaName] = useState("");
  const [kmaFundingSourceId, setKmaFundingSourceId] = useState(null);
  const [kmaEditingId, setKmaEditingId] = useState(null);
  const [kmaError, setKmaError] = useState("");

  // --- UI STATE (Toast & Modal) ---
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
  const [deleteModal, setDeleteModal] = useState({ open: false, type: null, data: null }); 
  // type: 'source' | 'kma'

  // Helper Toast
  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 3000);
  };

  // LOAD DATA
  const loadBudgetCodes = async () => {
    try {
      const data = await fetchBudgetCodes();
      setBudgetCodes(data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadBudgetCodes();
  }, []);

  const getEntityName = (id) => {
    if (!id || !entities) return "-";
    const ent = entities.find((e) => String(e.id) === String(id));
    return ent ? ent.name : "-";
  };

  // --- HANDLERS SUMBER DANA ---
  const resetForm = () => {
    setName(""); setCode(""); setEntityId("");
    setEditingId(null); setEditName(""); setEditCode(""); setEditEntityId("");
    setError("");
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setError("");
    if (!name || !code || !entityId) return setError("Semua field wajib diisi");

    try {
      await onCreate({ name, code, entity_id: entityId });
      resetForm();
      showToast("Sumber dana berhasil dibuat", "success");
    } catch (err) {
      setError(err.message);
      showToast("Gagal membuat data", "error");
    }
  };

  const startEdit = (fs) => {
    setEditingId(fs.id);
    setEditName(fs.name);
    setEditCode(fs.code || "");
    setEditEntityId(fs.entity_id || "");
    setError("");
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!editName || !editCode || !editEntityId) return setError("Semua field wajib diisi");

    try {
      await onUpdate(editingId, { name: editName, code: editCode, entity_id: editEntityId });
      resetForm();
      showToast("Perubahan disimpan", "success");
    } catch (err) {
      setError(err.message);
      showToast("Gagal update data", "error");
    }
  };

  // --- HANDLERS KMA ---
  const resetKmaForm = () => {
    setKmaCode(""); setKmaName(""); setKmaFundingSourceId(null);
    setKmaEditingId(null); setKmaError("");
  };

  const handleOpenKmaForSource = (fsId) => {
    if (expandedSourceId === fsId) {
        setExpandedSourceId(null); // Close
    } else {
        setExpandedSourceId(fsId); // Open
        setKmaFundingSourceId(fsId); // Auto select parent
    }
    resetKmaForm();
  };

  const handleSubmitKma = async (e) => {
    e.preventDefault();
    setKmaError("");
    if (!kmaCode || !kmaName || !expandedSourceId) return setKmaError("Kode dan Nama Anggaran wajib diisi");

    const payload = { code: kmaCode, name: kmaName, funding_source_id: expandedSourceId };

    try {
      if (kmaEditingId) {
        await updateBudgetCode(kmaEditingId, payload);
        showToast("KMA berhasil diupdate", "success");
      } else {
        await createBudgetCode(payload);
        showToast("KMA berhasil ditambah", "success");
      }
      await loadBudgetCodes();
      resetKmaForm();
      setKmaFundingSourceId(expandedSourceId); 
    } catch (err) {
      setKmaError(err.message);
    }
  };

  const handleEditKma = (kma) => {
    setKmaEditingId(kma.id);
    setKmaCode(kma.code);
    setKmaName(kma.name);
    setKmaFundingSourceId(kma.funding_source_id);
  };

  // --- DELETE LOGIC (MODAL) ---
  const confirmDelete = (type, data) => {
    setDeleteModal({ open: true, type, data });
  };

  const executeDelete = async () => {
    const { type, data } = deleteModal;
    if (!data) return;

    try {
      if (type === 'source') {
        await onDelete(data.id);
        showToast("Sumber dana dihapus", "success");
      } else if (type === 'kma') {
        await deleteBudgetCode(data.id);
        await loadBudgetCodes();
        showToast("KMA dihapus", "success");
      }
      setDeleteModal({ open: false, type: null, data: null });
    } catch (err) {
      setDeleteModal({ open: false, type: null, data: null });
      showToast(err.message || "Gagal menghapus data", "error");
    }
  };

  return (
    <div className="space-y-6 font-sans relative">
      
      {/* TOAST */}
      {toast.show && (
        <div className={`fixed top-5 right-5 z-[60] px-4 py-3 rounded-lg shadow-lg border flex items-center gap-3 animate-bounce-in transition-all ${
            toast.type === 'success' ? 'bg-green-50 border-green-200 text-green-700' : 'bg-red-50 border-red-200 text-red-700'
        }`}>
            <span>{toast.type === 'success' ? '✅' : '❌'}</span>
            <span className="text-sm font-medium">{toast.message}</span>
        </div>
      )}

      {/* HEADER */}
      <div>
        <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Sumber Dana & Anggaran</h1>
        <p className="text-xs text-slate-500 mt-1">
          Kelola sumber dana (Zakat, Wakaf, dll) dan Kode Mata Anggaran (KMA) terkait.
        </p>
      </div>

      {/* FORM UTAMA (SUMBER DANA) */}
      <div className={`bg-white rounded-xl shadow-sm border p-5 transition-all duration-300 ${
          editingId 
            ? 'border-[#F68D2E]/50 ring-1 ring-[#F68D2E]/30' // ORANYE SAAT EDIT
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
                {editingId ? "Edit Sumber Dana" : "Tambah Sumber Dana Baru"}
            </h2>
        </div>

        {error && <div className="text-xs text-red-600 mb-3 bg-red-50 p-2 rounded">{error}</div>}

        <form onSubmit={editingId ? handleEditSubmit : handleCreate} className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
            <div className="md:col-span-1">
                <label className="block text-xs font-medium text-slate-700 mb-1">Nama Sumber Dana</label>
                <input 
                    className="border border-slate-300 rounded-lg w-full px-3 py-2 focus:ring-2 focus:ring-[#009846] focus:border-[#009846] outline-none transition-all"
                    placeholder="Misal: WAKAF"
                    value={editingId ? editName : name}
                    onChange={(e) => editingId ? setEditName(e.target.value) : setName(e.target.value)}
                />
            </div>
            <div className="md:col-span-1">
                <label className="block text-xs font-medium text-slate-700 mb-1">Kode (Singkatan)</label>
                <input 
                    className="border border-slate-300 rounded-lg w-full px-3 py-2 focus:ring-2 focus:ring-[#009846] focus:border-[#009846] outline-none transition-all"
                    placeholder="Misal: W"
                    value={editingId ? editCode : code}
                    onChange={(e) => editingId ? setEditCode(e.target.value) : setCode(e.target.value)}
                />
            </div>
            <div className="md:col-span-1">
                <label className="block text-xs font-medium text-slate-700 mb-1">Entitas</label>
                <select 
                    className="border border-slate-300 rounded-lg w-full px-3 py-2 focus:ring-2 focus:ring-[#009846] focus:border-[#009846] outline-none bg-white transition-all"
                    value={editingId ? editEntityId : entityId}
                    onChange={(e) => editingId ? setEditEntityId(e.target.value) : setEntityId(e.target.value)}
                >
                    <option value="">Pilih Entitas...</option>
                    {entities?.map(ent => (
                        <option key={ent.id} value={ent.id}>{ent.name}</option>
                    ))}
                </select>
            </div>
            <div className="flex items-end gap-2">
                {/* TOMBOL DIPERBAIKI: SELALU HIJAU SF */}
                <button 
                    type="submit" 
                    className="px-4 py-2 text-xs font-medium rounded-lg text-white shadow-sm transition-all flex-shrink-0 bg-[#009846] hover:bg-[#007033]"
                >
                    {editingId ? "Simpan Perubahan" : "Tambah"}
                </button>
                {editingId && (
                    <button type="button" onClick={resetForm} className="px-3 py-2 text-xs font-medium rounded-lg border border-slate-300 text-slate-600 hover:bg-slate-50 transition-all">
                        Batal
                    </button>
                )}
            </div>
        </form>
      </div>

      {/* TABEL DATA */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
            <h2 className="text-sm font-bold text-slate-800">Daftar Sumber Dana</h2>
            <span className="text-xs font-medium text-slate-500 bg-white px-2 py-1 rounded border">
                Total: <b>{fundingSources.length}</b>
            </span>
        </div>

        <div className="overflow-x-auto">
            <table className="w-full text-xs md:text-sm">
                <thead className="bg-[#009846]/5 border-b border-[#009846]/10">
                    <tr>
                        <th className="text-left p-3 font-bold text-[#007033]">Tipe Dana</th>
                        <th className="text-left p-3 font-bold text-[#007033]">Entitas</th>
                        <th className="text-left p-3 font-bold text-[#007033]">Kode</th>
                        <th className="text-right p-3 font-bold text-[#007033] w-48">Aksi</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                    {fundingSources.map((fs) => {
                        const isExpanded = expandedSourceId === fs.id;
                        const kmaCount = budgetCodes.filter(k => k.funding_source_id === fs.id).length;

                        return (
                            <React.Fragment key={fs.id}>
                                <tr className={`hover:bg-slate-50 transition-colors ${editingId === fs.id ? 'bg-orange-50/40' : ''}`}>
                                    <td className="p-3 font-medium text-slate-700">
                                        {fs.name}
                                        {editingId === fs.id && <span className="ml-2 text-[10px] text-[#F68D2E] font-bold">(Edit)</span>}
                                    </td>
                                    <td className="p-3">
                                        <span className="px-2 py-0.5 rounded text-[10px] bg-blue-50 text-blue-600 font-medium border border-blue-100">
                                            {getEntityName(fs.entity_id)}
                                        </span>
                                    </td>
                                    <td className="p-3 font-mono text-slate-500">{fs.code}</td>
                                    <td className="p-3 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <button 
                                                onClick={() => handleOpenKmaForSource(fs.id)}
                                                className={`px-2 py-1 text-[10px] font-medium rounded border transition-colors flex items-center gap-1 ${isExpanded ? 'bg-slate-200 border-slate-300 text-slate-700' : 'bg-white border-slate-300 text-slate-600 hover:bg-slate-50'}`}
                                            >
                                                {isExpanded ? '▼ Tutup KMA' : `▶ KMA (${kmaCount})`}
                                            </button>
                                            <button onClick={() => startEdit(fs)} className="p-1.5 text-slate-400 hover:text-blue-600 rounded hover:bg-blue-50 transition">
                                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                                            </button>
                                            <button onClick={() => confirmDelete('source', fs)} className="p-1.5 text-slate-400 hover:text-red-600 rounded hover:bg-red-50 transition">
                                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                            </button>
                                        </div>
                                    </td>
                                </tr>

                                {/* EXPANDED KMA SECTION */}
                                {isExpanded && (
                                    <tr>
                                        <td colSpan={4} className="p-0">
                                            <div className="bg-slate-50 border-y border-slate-200 p-4 shadow-inner">
                                                <div className="flex items-center gap-2 mb-3">
                                                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Sub-Anggaran (KMA)</span>
                                                    <div className="h-px bg-slate-200 flex-1"></div>
                                                </div>

                                                {/* Form KMA */}
                                                <form onSubmit={handleSubmitKma} className="flex gap-2 mb-4 items-start">
                                                    <input 
                                                        className="border border-slate-300 rounded px-2 py-1.5 text-xs w-32 focus:ring-1 focus:ring-[#009846] outline-none"
                                                        placeholder="Kode (Ex: 101)"
                                                        value={kmaCode} onChange={e => setKmaCode(e.target.value)}
                                                    />
                                                    <input 
                                                        className="border border-slate-300 rounded px-2 py-1.5 text-xs flex-1 focus:ring-1 focus:ring-[#009846] outline-none"
                                                        placeholder="Nama Anggaran (Ex: Inventaris Kantor)"
                                                        value={kmaName} onChange={e => setKmaName(e.target.value)}
                                                    />
                                                    <button type="submit" className="px-3 py-1.5 rounded bg-slate-800 text-white text-xs hover:bg-slate-900 transition">
                                                        {kmaEditingId ? "Simpan" : "Tambah"}
                                                    </button>
                                                    {kmaEditingId && (
                                                        <button type="button" onClick={resetKmaForm} className="px-3 py-1.5 rounded border border-slate-300 text-slate-600 text-xs hover:bg-white transition">
                                                            Batal
                                                        </button>
                                                    )}
                                                </form>
                                                {kmaError && <div className="text-[10px] text-red-600 mb-2">{kmaError}</div>}

                                                {/* Tabel KMA */}
                                                <div className="bg-white border rounded-lg overflow-hidden">
                                                    <table className="w-full text-xs">
                                                        <thead className="bg-slate-100 text-slate-500">
                                                            <tr>
                                                                <th className="text-left p-2 font-medium">Kode</th>
                                                                <th className="text-left p-2 font-medium">Nama Anggaran</th>
                                                                <th className="text-right p-2 font-medium w-24">Aksi</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody className="divide-y divide-slate-100">
                                                            {budgetCodes.filter(k => k.funding_source_id === fs.id).length === 0 ? (
                                                                <tr><td colSpan={3} className="p-3 text-center text-slate-400 italic">Belum ada KMA</td></tr>
                                                            ) : (
                                                                budgetCodes.filter(k => k.funding_source_id === fs.id).map(kma => (
                                                                    <tr key={kma.id} className="hover:bg-blue-50/30">
                                                                        <td className="p-2 font-mono text-slate-600">{kma.code}</td>
                                                                        <td className="p-2 text-slate-700">{kma.name}</td>
                                                                        <td className="p-2 text-right">
                                                                            <button onClick={() => handleEditKma(kma)} className="text-[10px] text-blue-600 hover:underline mr-2">Edit</button>
                                                                            <button onClick={() => confirmDelete('kma', kma)} className="text-[10px] text-red-600 hover:underline">Hapus</button>
                                                                        </td>
                                                                    </tr>
                                                                ))
                                                            )}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </React.Fragment>
                        );
                    })}
                </tbody>
            </table>
        </div>
      </div>

      {/* MODAL DELETE */}
      {deleteModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in" onClick={() => setDeleteModal({ open: false, type: null, data: null })}>
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm overflow-hidden" onClick={e => e.stopPropagation()}>
                <div className="bg-red-50 p-4 flex items-center gap-3 border-b border-red-100">
                    <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center text-red-600">⚠</div>
                    <div>
                        <h3 className="text-lg font-bold text-red-700">Hapus Data?</h3>
                        <p className="text-xs text-red-500">Tindakan ini tidak bisa dibatalkan.</p>
                    </div>
                </div>
                <div className="p-5 text-sm text-slate-600">
                    <p>Anda akan menghapus {deleteModal.type === 'source' ? 'Sumber Dana' : 'KMA'}:</p>
                    <div className="mt-2 bg-slate-50 p-3 rounded border border-slate-200 font-bold text-slate-800">
                        {deleteModal.data?.name} <span className="font-normal text-slate-500">({deleteModal.data?.code})</span>
                    </div>
                </div>
                <div className="flex justify-end gap-3 p-4 border-t bg-slate-50">
                    <button onClick={() => setDeleteModal({ open: false, type: null, data: null })} className="px-4 py-2 text-sm font-medium text-slate-600 bg-white border rounded hover:bg-slate-100">Batal</button>
                    <button onClick={executeDelete} className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded hover:bg-red-700 shadow-md">Ya, Hapus</button>
                </div>
            </div>
        </div>
      )}

    </div>
  );
}

export default FundingSourcePage;