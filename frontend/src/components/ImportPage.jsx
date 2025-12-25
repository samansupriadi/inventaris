// src/components/ImportPage.jsx
import { useState, useEffect } from "react";
import * as xlsx from "xlsx";
import { importAssetsExcel, fetchImportHistory, rollbackImport } from "../api";

function ImportPage({ onImportSuccess }) {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [history, setHistory] = useState([]);

  // --- STATE MODAL KONFIRMASI (PENGGANTI ALERT) ---
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    title: "",
    message: "",
    type: "info", // 'info' (biru) atau 'danger' (merah)
    onConfirm: null, // Fungsi yang akan dijalankan jika user klik YES
  });

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    try {
      const data = await fetchImportHistory();
      setHistory(data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDownloadTemplate = () => {
    const templateData = [
      { "Nama Aset": "Laptop", "Kode Aset": "", "Kategori": "Elektronik", "Lokasi": "Gudang", "Sumber Dana": "Hibah", "Kondisi": "Baik", "Nilai": 5000000, "Tanggal Pembelian": "2025-01-01", "Keterangan": "" }
    ];
    const ws = xlsx.utils.json_to_sheet(templateData);
    const wb = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(wb, ws, "Template");
    xlsx.writeFile(wb, "Template_Aset.xlsx");
  };

  // --- 1. LOGIC IMPORT (DIPISAH) ---
  
  // A. Saat tombol diklik: Buka Modal
  const initiateImport = (e) => {
    e.preventDefault();
    if (!file) {
        // Ganti alert biasa dengan pesan error di UI (lebih halus)
        setMessage({ type: 'error', text: "Silakan pilih file Excel terlebih dahulu." });
        return;
    }

    setConfirmModal({
      isOpen: true,
      title: "Konfirmasi Import Data",
      message: `Anda akan mengimport file "${file.name}". Pastikan format kolom sudah sesuai dengan Template. Lanjutkan?`,
      type: "info",
      onConfirm: executeImport // Simpan fungsi eksekusi
    });
  };

  // B. Eksekusi Import (Dijalankan setelah konfirmasi)
  const executeImport = async () => {
    setConfirmModal({ ...confirmModal, isOpen: false }); // Tutup modal
    setLoading(true);
    setMessage(null);

    try {
      const res = await importAssetsExcel(file);
      setMessage({ type: "success", text: res.message });
      setFile(null);
      document.getElementById("fileInput").value = "";
      loadHistory();
      if (onImportSuccess) await onImportSuccess();
    } catch (err) {
      setMessage({ type: "error", text: err.message });
    } finally {
      setLoading(false);
    }
  };


  // --- 2. LOGIC ROLLBACK (DIPISAH) ---

  // A. Saat tombol diklik: Buka Modal Bahaya
  const initiateRollback = (item) => {
    setConfirmModal({
      isOpen: true,
      title: "⚠️ Batalkan Import?",
      message: `Tindakan ini BERBAHAYA.\n\nAnda akan menghapus riwayat import "${item.filename}".\nSebanyak ${item.success_count} aset yang terkait akan DIHAPUS PERMANEN dari sistem.\n\nApakah Anda yakin ingin melanjutkan?`,
      type: "danger",
      onConfirm: () => executeRollback(item.id) // Pakai arrow func untuk passing ID
    });
  };

  // B. Eksekusi Rollback
  const executeRollback = async (id) => {
    setConfirmModal({ ...confirmModal, isOpen: false });
    setLoading(true);
    
    try {
      const res = await rollbackImport(id);
      // Tampilkan pesan sukses pakai alert bawaan atau toast (opsional), 
      // di sini kita pakai message banner saja biar konsisten
      setMessage({ type: "success", text: res.message });
      loadHistory();
      if (onImportSuccess) await onImportSuccess();
    } catch (err) {
      setMessage({ type: "error", text: err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in relative">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Import Data Massal</h1>
          <p className="text-sm text-slate-500 mt-1">Upload Excel untuk input aset cepat.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* KOLOM KIRI: UPLOAD */}
        <div className="space-y-6">
           <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <h3 className="text-lg font-bold text-slate-800 mb-4">Upload File Excel</h3>
              
              {/* Pesan Error/Sukses */}
              {message && (
                <div className={`mb-4 p-4 rounded-lg text-sm flex items-start gap-3 border ${
                    message.type === 'success' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'
                }`}>
                  <span className="text-lg">{message.type === 'success' ? '✅' : '⚠️'}</span>
                  <div>{message.text}</div>
                </div>
              )}

              <form onSubmit={initiateImport} className="space-y-4">
                <input 
                  id="fileInput" type="file" accept=".xlsx, .xls"
                  onChange={(e) => {
                    setFile(e.target.files[0]);
                    setMessage(null); // Clear error lama saat pilih file baru
                  }}
                  className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
                />
                <div className="flex gap-2 pt-2">
                    <button type="button" onClick={handleDownloadTemplate} className="px-4 py-2 text-sm border border-slate-300 text-slate-600 rounded-lg hover:bg-slate-50 transition-colors font-medium">
                        Download Template
                    </button>
                    <button type="submit" disabled={loading} className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors font-bold shadow-lg shadow-blue-900/20 flex items-center gap-2">
                        {loading ? (
                             <>
                               <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                               Memproses...
                             </>
                        ) : "Mulai Import"}
                    </button>
                </div>
              </form>
           </div>
        </div>

        {/* KOLOM KANAN: RIWAYAT IMPORT */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="px-5 py-3 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
              <h3 className="font-semibold text-slate-700 text-sm">Riwayat Import Terakhir</h3>
              <button onClick={loadHistory} className="text-xs text-blue-600 hover:underline">Refresh</button>
            </div>
            
            {history.length === 0 ? (
              <div className="p-8 text-center flex flex-col items-center justify-center text-slate-400">
                <span className="text-4xl mb-2 opacity-20">📂</span>
                <span className="text-sm">Belum ada riwayat import.</span>
              </div>
            ) : (
              <div className="divide-y divide-slate-100 max-h-[400px] overflow-y-auto custom-scrollbar">
                {history.map((item) => (
                  <div key={item.id} className="p-4 hover:bg-slate-50 transition-colors group">
                    <div className="flex justify-between items-start mb-1">
                      <span className="font-bold text-slate-700 text-sm truncate max-w-[200px]" title={item.filename}>
                        {item.filename}
                      </span>
                      <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded border border-slate-200 font-mono">
                        {new Date(item.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex justify-between items-end mt-2">
                      <div className="text-xs text-slate-500">
                        <div>Oleh: <span className="text-slate-700 font-medium">{item.user_name || "Unknown"}</span></div>
                        <div className="mt-0.5">Sukses: <span className="font-bold text-green-600 bg-green-50 px-1 rounded">{item.success_count} Aset</span></div>
                      </div>
                      
                      <button 
                        onClick={() => initiateRollback(item)}
                        disabled={loading}
                        className="opacity-0 group-hover:opacity-100 transition-opacity text-xs bg-white border border-red-200 text-red-600 px-2 py-1 rounded hover:bg-red-50 font-medium shadow-sm flex items-center gap-1"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"></path><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path></svg>
                        Batalkan
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          <div className="mt-4 p-3 bg-amber-50 border border-amber-100 rounded-lg flex gap-3">
            <span className="text-lg">💡</span>
            <div className="text-xs text-amber-800 leading-relaxed">
               Fitur <strong>"Batalkan"</strong> akan menghapus seluruh aset yang dimasukkan pada sesi import tersebut. <br/>
               Data Kategori/Lokasi baru yang terbentuk otomatis <b>tidak akan dihapus</b> demi menjaga integritas data lain.
            </div>
          </div>
        </div>
      </div>

      {/* === KOMPONEN MODAL CUSTOM (LUXURY STYLE) === */}
      {confirmModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop Blur */}
            <div 
                className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity"
                onClick={() => setConfirmModal({...confirmModal, isOpen: false})}
            ></div>

            {/* Modal Card */}
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full relative z-10 overflow-hidden transform transition-all scale-100 animate-fade-in-up">
                {/* Header dengan Icon */}
                <div className={`px-6 py-6 flex items-start gap-4 ${confirmModal.type === 'danger' ? 'bg-red-50/50' : 'bg-blue-50/50'}`}>
                    <div className={`p-3 rounded-full flex-shrink-0 ${confirmModal.type === 'danger' ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'}`}>
                        {confirmModal.type === 'danger' ? (
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                        ) : (
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        )}
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-slate-800">
                            {confirmModal.title}
                        </h3>
                        <div className="mt-2 text-sm text-slate-600 whitespace-pre-line leading-relaxed">
                            {confirmModal.message}
                        </div>
                    </div>
                </div>

                {/* Footer Buttons */}
                <div className="px-6 py-4 bg-slate-50 flex justify-end gap-3 border-t border-slate-100">
                    <button 
                        onClick={() => setConfirmModal({...confirmModal, isOpen: false})}
                        className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-white hover:text-slate-800 border border-transparent hover:border-slate-200 rounded-lg transition-all"
                    >
                        Batal
                    </button>
                    <button 
                        onClick={() => confirmModal.onConfirm && confirmModal.onConfirm()}
                        className={`px-4 py-2 text-sm font-bold text-white rounded-lg shadow-md transition-all transform hover:scale-[1.02] ${
                            confirmModal.type === 'danger' 
                            ? 'bg-red-600 hover:bg-red-700 shadow-red-900/20' 
                            : 'bg-blue-600 hover:bg-blue-700 shadow-blue-900/20'
                        }`}
                    >
                        {confirmModal.type === 'danger' ? 'Ya, Hapus Data' : 'Ya, Lanjutkan'}
                    </button>
                </div>
            </div>
        </div>
      )}

    </div>
  );
}

export default ImportPage;