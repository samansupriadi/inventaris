// src/components/ImportPage.jsx
import { useState, useEffect } from "react";
import { importAssetsExcel, fetchImportHistory, rollbackImport, API_BASE_URL } from "../api";

function ImportPage({ onImportSuccess }) {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [history, setHistory] = useState([]);
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, title: "", message: "", type: "info", onConfirm: null });

  useEffect(() => { loadHistory(); }, []);

  const loadHistory = async () => {
    try {
      const data = await fetchImportHistory();
      setHistory(data);
    } catch (err) { console.error(err); }
  };

  // 1. DOWNLOAD TEMPLATE DARI SERVER (PENTING!)
  const handleDownloadTemplate = async () => {
    try {
        const response = await fetch(`${API_BASE_URL}/api/import/template`, {
            method: 'GET',
            credentials: 'include' // Kirim cookie auth
        });
        if (!response.ok) throw new Error("Gagal download");
        
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = "Template_Aset_Sinergi.xlsx";
        document.body.appendChild(a);
        a.click();
        a.remove();
    } catch (err) {
        setMessage({ type: 'error', text: "Gagal download template. Pastikan Anda login." });
    }
  };

  // 2. UPLOAD FILE
  const initiateImport = (e) => {
    e.preventDefault();
    if (!file) { setMessage({ type: 'error', text: "Pilih file dulu." }); return; }
    
    setConfirmModal({
      isOpen: true,
      title: "Konfirmasi Import",
      message: `Pastikan Anda menggunakan Template terbaru yang sudah memiliki Dropdown Data Master.\n\nLanjutkan import "${file.name}"?`,
      type: "info",
      onConfirm: executeImport
    });
  };

  const executeImport = async () => {
    setConfirmModal({ ...confirmModal, isOpen: false });
    setLoading(true); setMessage(null);
    try {
      const res = await importAssetsExcel(file);
      setMessage({ type: "success", text: res.message });
      setFile(null);
      document.getElementById("fileInput").value = "";
      loadHistory();
      if(onImportSuccess) onImportSuccess();
    } catch (err) {
      setMessage({ type: "error", text: err.message });
    } finally { setLoading(false); }
  };

  // 3. ROLLBACK
  const initiateRollback = (item) => {
    setConfirmModal({
      isOpen: true,
      title: "⚠️ Batalkan Import?",
      message: `PERINGATAN: ${item.success_count} aset dari file "${item.filename}" akan DIHAPUS PERMANEN.\nLanjutkan?`,
      type: "danger",
      onConfirm: async () => {
          setConfirmModal(prev => ({...prev, isOpen: false}));
          setLoading(true);
          try {
             const res = await rollbackImport(item.id);
             setMessage({ type: "success", text: res.message });
             loadHistory();
             if(onImportSuccess) onImportSuccess();
          } catch(err) {
             setMessage({ type: "error", text: err.message });
          } finally { setLoading(false); }
      }
    });
  };

  return (
    <div className="space-y-8 animate-fade-in max-w-5xl mx-auto p-6">
      <div className="border-b pb-4">
        <h1 className="text-2xl font-bold text-slate-800">Import Data Massal</h1>
        <p className="text-sm text-slate-500">Upload Excel untuk input aset cepat dengan Smart Template.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* PANEL KIRI: DOWNLOAD & UPLOAD */}
        <div className="space-y-6">
           <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <h3 className="text-lg font-bold text-slate-800 mb-4">Langkah Import</h3>
              
              {/* Pesan Alert */}
              {message && (
                <div className={`mb-4 p-3 rounded-lg text-sm flex gap-3 border ${message.type === 'success' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
                  <span>{message.type === 'success' ? '✅' : '⚠️'}</span>
                  <div>{message.text}</div>
                </div>
              )}

              <div className="space-y-4">
                  {/* Step 1 */}
                  <div className="p-4 bg-blue-50 rounded-lg border border-blue-100">
                      <div className="text-xs font-bold text-blue-600 uppercase mb-2">Langkah 1</div>
                      <button onClick={handleDownloadTemplate} className="w-full py-2 bg-white border border-blue-300 text-blue-700 rounded-lg font-bold hover:bg-blue-50 transition flex justify-center items-center gap-2">
                          <span>⬇️</span> Download Template Excel
                      </button>
                      <p className="text-[10px] text-blue-500 mt-2 text-center">*Template berisi Dropdown Kategori & Lokasi terbaru.</p>
                  </div>

                  {/* Step 2 */}
                  <form onSubmit={initiateImport} className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                      <div className="text-xs font-bold text-slate-500 uppercase mb-2">Langkah 2</div>
                      <input 
                        id="fileInput" type="file" accept=".xlsx, .xls"
                        onChange={(e) => { setFile(e.target.files[0]); setMessage(null); }}
                        className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-slate-200 file:text-slate-700 hover:file:bg-slate-300 cursor-pointer mb-3"
                      />
                      <button type="submit" disabled={loading} className="w-full py-2 bg-[#009846] text-white rounded-lg font-bold hover:bg-[#007b3a] shadow-md transition disabled:opacity-50 flex justify-center items-center gap-2">
                          {loading ? "Memproses..." : "📤 Upload & Proses"}
                      </button>
                  </form>
              </div>
           </div>
        </div>

        {/* PANEL KANAN: HISTORY */}
        <div>
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden h-full">
            <div className="px-5 py-3 bg-slate-50 border-b flex justify-between items-center">
              <h3 className="font-semibold text-slate-700 text-sm">Riwayat Import</h3>
              <button onClick={loadHistory} className="text-xs text-blue-600 hover:underline">Refresh</button>
            </div>
            <div className="divide-y divide-slate-100 max-h-[500px] overflow-y-auto">
                {history.length === 0 ? (
                    <div className="p-8 text-center text-slate-400 text-sm">Belum ada riwayat.</div>
                ) : history.map(item => (
                    <div key={item.id} className="p-4 hover:bg-slate-50 group transition">
                        <div className="flex justify-between mb-1">
                            <span className="font-bold text-slate-700 text-sm">{item.filename}</span>
                            <span className="text-[10px] text-slate-400">{new Date(item.created_at).toLocaleDateString()}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-xs text-slate-500">Sukses: <b className="text-green-600">{item.success_count}</b> Data</span>
                            <button onClick={() => initiateRollback(item)} className="text-[10px] text-red-500 border border-red-200 px-2 py-1 rounded bg-white hover:bg-red-50 opacity-0 group-hover:opacity-100 transition">Batalkan</button>
                        </div>
                    </div>
                ))}
            </div>
          </div>
        </div>
      </div>

      {/* MODAL CONFIRM */}
      {confirmModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm" onClick={() => setConfirmModal({...confirmModal, isOpen: false})}>
            <div className="bg-white rounded-xl shadow-2xl max-w-sm w-full p-6 animate-scale-up" onClick={e => e.stopPropagation()}>
                <h3 className={`text-lg font-bold mb-2 ${confirmModal.type === 'danger' ? 'text-red-600' : 'text-slate-800'}`}>{confirmModal.title}</h3>
                <p className="text-sm text-slate-600 mb-6 whitespace-pre-line">{confirmModal.message}</p>
                <div className="flex justify-end gap-3">
                    <button onClick={() => setConfirmModal({...confirmModal, isOpen: false})} className="px-4 py-2 text-sm font-medium text-slate-500 hover:bg-slate-100 rounded-lg">Batal</button>
                    <button onClick={confirmModal.onConfirm} className={`px-4 py-2 text-sm font-bold text-white rounded-lg shadow-md ${confirmModal.type === 'danger' ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-600 hover:bg-blue-700'}`}>Ya, Lanjutkan</button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
}

export default ImportPage;