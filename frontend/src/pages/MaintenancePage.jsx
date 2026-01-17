// src/components/MaintenancePage.jsx
import { useState, useEffect } from "react";
import { fetchMaintenances, updateMaintenance, API_BASE_URL } from "../api";
import Swal from "sweetalert2";

function MaintenancePage() {
  const [maintenances, setMaintenances] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // State untuk Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5; // 👈 Ubah angka ini jika ingin menampilkan lebih banyak baris

  // State untuk Modal & Form
  const [selectedItem, setSelectedItem] = useState(null);
  const [finishModalOpen, setFinishModalOpen] = useState(false);
  
  // Form Inputs
  const [cost, setCost] = useState("");
  const [solution, setSolution] = useState("");
  const [technician, setTechnician] = useState("");
  const [proofFile, setProofFile] = useState(null); 
  const [finalCondition, setFinalCondition] = useState("baik");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await fetchMaintenances();
      setMaintenances(data);
      setCurrentPage(1); // Reset ke halaman 1 setiap reload data
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // --- LOGIKA PAGINATION ---
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = maintenances.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(maintenances.length / itemsPerPage);

  const goToNextPage = () => {
    if (currentPage < totalPages) setCurrentPage(currentPage + 1);
  };

  const goToPrevPage = () => {
    if (currentPage > 1) setCurrentPage(currentPage - 1);
  };
  // -------------------------

  const handleOpenFinish = (item) => {
    setSelectedItem(item);
    setCost("");
    setSolution("");
    setTechnician("");
    setFinalCondition("baik");
    setProofFile(null); 
    setFinishModalOpen(true);
  };

  const handleSubmitFinish = async (e) => {
    e.preventDefault();
    if (!selectedItem) return;

    try {
      const formData = new FormData();
      formData.append("status", "finished");
      formData.append("completion_date", new Date().toISOString().split('T')[0]); 
      formData.append("cost", cost);
      formData.append("solution_description", solution);
      formData.append("technician_name", technician);
      formData.append("final_condition", finalCondition);
      
      if (proofFile) {
        formData.append("proof_photo", proofFile);
      }

      Swal.fire({
        title: 'Menyimpan...',
        text: 'Mohon tunggu sebentar',
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading();
        }
      });

      await updateMaintenance(selectedItem.id, formData);

      Swal.fire({
        icon: 'success',
        title: 'Selesai!',
        text: 'Data maintenance berhasil diperbarui.',
        confirmButtonColor: '#009846', 
        confirmButtonText: 'Mantap'
      });

      setFinishModalOpen(false);
      loadData();
    } catch (err) {
      console.error(err);
      Swal.fire({
        icon: 'error',
        title: 'Gagal',
        text: err.message || "Terjadi kesalahan server",
        confirmButtonColor: '#d33'
      });
    }
  };

  // Helper Warna Badge Status
  const getStatusBadge = (status) => {
    switch (status) {
      case 'pending': return <span className="px-2.5 py-0.5 rounded-md bg-yellow-100 text-yellow-800 text-[10px] font-bold border border-yellow-200">Menunggu</span>;
      case 'in_progress': return <span className="px-2.5 py-0.5 rounded-md bg-blue-100 text-blue-800 text-[10px] font-bold border border-blue-200">Sedang Dikerjakan</span>;
      case 'finished': return <span className="px-2.5 py-0.5 rounded-md bg-green-100 text-green-800 text-[10px] font-bold border border-green-200">Selesai</span>;
      default: return <span className="px-2.5 py-0.5 rounded-md bg-gray-100 text-gray-800 text-[10px] border border-gray-200">{status}</span>;
    }
  };

  return (
    <div className="p-6 font-sans animate-fade-in space-y-6">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">🔧 Maintenance & Perbaikan</h1>
          <p className="text-sm text-slate-500 mt-1">Pantau proses servis aset, biaya, dan riwayat perbaikan.</p>
        </div>
        <button 
          onClick={loadData} 
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-[#009846] bg-green-50 rounded-lg border border-[#009846] hover:bg-[#009846] hover:text-white transition-all shadow-sm"
        >
          🔄 Refresh Data
        </button>
      </div>

      {/* TABEL DATA */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-[#009846]/5 text-[#007033] border-b border-[#009846]/10 uppercase text-[11px] font-bold tracking-wider">
              <tr>
                <th className="p-4">Tanggal & Aset</th>
                <th className="p-4">Masalah & Solusi</th>
                <th className="p-4">Status & Teknisi</th>
                <th className="p-4 text-right">Biaya</th>
                <th className="p-4 text-center">Bukti</th> 
                <th className="p-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {loading ? (
                <tr>
                    <td colSpan="6" className="p-12 text-center">
                        <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-[#009846] border-t-transparent"></div>
                        <p className="mt-2 text-slate-400 text-xs">Memuat data...</p>
                    </td>
                </tr>
              ) : maintenances.length === 0 ? (
                <tr>
                    <td colSpan="6" className="p-12 text-center text-slate-400 italic flex flex-col items-center">
                        <span className="text-3xl mb-2">🛠️</span>
                        Belum ada riwayat maintenance.
                    </td>
                </tr>
              ) : (
                /* Ubah map maintenances jadi map currentItems */
                currentItems.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/80 transition-colors group">
                    {/* TANGGAL & ASET */}
                    <td className="p-4 align-top">
                      <div className="text-[10px] text-slate-400 font-mono mb-1">
                        {new Date(item.report_date).toLocaleDateString("id-ID", { day: 'numeric', month: 'short', year: 'numeric' })}
                      </div>
                      <div className="font-bold text-slate-800 text-sm">{item.asset_name}</div>
                      <div className="text-[11px] text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded inline-block border border-slate-200 mt-1">
                        {item.asset_code}
                      </div>
                    </td>

                    {/* MASALAH & SOLUSI */}
                    <td className="p-4 align-top max-w-[250px]">
                      <div className="mb-2">
                        <span className="text-[10px] font-bold text-red-600 uppercase tracking-wide">Masalah:</span>
                        <p className="text-slate-700 text-xs leading-relaxed">{item.issue_description}</p>
                      </div>
                      {item.solution_description && (
                        <div className="mt-2 bg-green-50 p-2 rounded border border-green-100">
                          <span className="text-[10px] font-bold text-green-700 uppercase tracking-wide">Solusi:</span>
                          <p className="text-slate-600 text-xs leading-relaxed italic">{item.solution_description}</p>
                        </div>
                      )}
                    </td>

                    {/* STATUS & TEKNISI */}
                    <td className="p-4 align-top">
                      <div className="mb-2">{getStatusBadge(item.status)}</div>
                      
                      {item.status === 'finished' && (
                          <div className="mb-2">
                            {item.asset_condition === 'baik' ? (
                                <span className="inline-flex items-center gap-1 px-2 py-1 rounded bg-green-50 border border-green-200 text-green-700 text-[10px] font-bold">
                                    ✅ Aset Baik
                                </span>
                            ) : (item.asset_condition === 'rusak' || item.asset_status === 'rusak') ? ( 
                                /* 👆 Perhatikan bagian ini: item.asset_status === 'rusak' */
                                <span className="inline-flex items-center gap-1 px-2 py-1 rounded bg-red-50 border border-red-200 text-red-700 text-[10px] font-bold">
                                    ❌ Rusak Berat
                                </span>
                            ) : (
                                <span className="text-[10px] text-slate-500 capitalize">
                                    Kondisi: {item.asset_condition}
                                </span>
                            )}
                          </div>
                      )}

                      <div className="space-y-1">
                        {item.technician_name && (
                            <div className="text-[11px] text-slate-500 flex items-center gap-1">
                                👨‍🔧 <span className="font-medium text-slate-700">{item.technician_name}</span>
                            </div>
                        )}
                        {item.vendor_name && (
                             <div className="text-[11px] text-slate-400 flex items-center gap-1">
                                🏢 {item.vendor_name}
                             </div>
                        )}
                      </div>
                    </td>

                    {/* BIAYA */}
                    <td className="p-4 align-top text-right font-mono text-slate-700 font-medium">
                      {item.cost > 0 ? `Rp ${Number(item.cost).toLocaleString("id-ID")}` : "-"}
                    </td>
                    
                    {/* BUKTI FOTO */}
                    <td className="p-4 align-top text-center">
                      {item.proof_photo ? (
                        <a 
                          href={`${API_BASE_URL}${item.proof_photo}`} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="inline-flex flex-col items-center gap-1 group/link"
                          title="Lihat Bukti"
                        >
                           <div className="w-8 h-8 rounded bg-slate-100 border border-slate-200 flex items-center justify-center text-lg shadow-sm group-hover/link:bg-blue-50 group-hover/link:border-blue-200 transition-colors">
                                🧾
                           </div>
                           <span className="text-[10px] text-blue-600 group-hover/link:underline">Lihat</span>
                        </a>
                      ) : (
                        <span className="text-[10px] text-slate-300 italic">-</span>
                      )}
                    </td>

                    {/* AKSI */}
                    <td className="p-4 align-top text-center">
                      {item.status !== 'finished' ? (
                        <button 
                          onClick={() => handleOpenFinish(item)}
                          className="w-full inline-flex items-center justify-center gap-1 px-3 py-1.5 text-[11px] font-bold rounded-lg bg-[#009846] text-white hover:bg-[#007b3a] shadow-sm hover:-translate-y-0.5 transition-all"
                        >
                          ✅ Selesai
                        </button>
                      ) : (
                        <div className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-400 select-none">
                            <span>🔒 Closed</span>
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* FOOTER PAGINATION (Baru) */}
        {maintenances.length > 0 && (
          <div className="flex items-center justify-between p-4 border-t border-slate-100 bg-slate-50">
            <div className="text-xs text-slate-500">
              Menampilkan <b>{indexOfFirstItem + 1}</b> - <b>{Math.min(indexOfLastItem, maintenances.length)}</b> dari <b>{maintenances.length}</b> data
            </div>
            <div className="flex gap-2">
              <button
                onClick={goToPrevPage}
                disabled={currentPage === 1}
                className={`px-3 py-1 text-xs font-bold rounded border ${
                  currentPage === 1 
                    ? 'bg-slate-100 text-slate-300 border-slate-200 cursor-not-allowed' 
                    : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-100'
                }`}
              >
                &lt; Sebelumnya
              </button>
              <span className="px-3 py-1 text-xs font-bold bg-[#009846] text-white rounded">
                Halaman {currentPage} / {totalPages}
              </span>
              <button
                onClick={goToNextPage}
                disabled={currentPage === totalPages}
                className={`px-3 py-1 text-xs font-bold rounded border ${
                  currentPage === totalPages 
                    ? 'bg-slate-100 text-slate-300 border-slate-200 cursor-not-allowed' 
                    : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-100'
                }`}
              >
                Berikutnya &gt;
              </button>
            </div>
          </div>
        )}
      </div>

      {/* MODAL PENYELESAIAN (FINISH) */}
      {finishModalOpen && selectedItem && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-100 animate-scale-up">
            
            {/* Modal Header */}
            <div className="bg-slate-50 px-6 py-4 border-b border-slate-100 flex justify-between items-center">
                <div>
                    <h2 className="text-lg font-bold text-slate-800">Selesaikan Perbaikan</h2>
                    <p className="text-xs text-slate-500 mt-0.5">Input detail pengerjaan untuk aset ini.</p>
                </div>
                <button onClick={() => setFinishModalOpen(false)} className="text-slate-400 hover:text-red-500 transition-colors">
                    ✕
                </button>
            </div>
            
            <div className="p-6">
                {/* Info Aset Singkat */}
                <div className="flex items-center gap-3 bg-blue-50 p-3 rounded-lg border border-blue-100 mb-5">
                    <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-lg shadow-sm">🔧</div>
                    <div>
                        <div className="text-xs text-blue-600 font-bold uppercase tracking-wider">Sedang Memperbaiki</div>
                        <div className="font-bold text-slate-800">{selectedItem.asset_name}</div>
                        <div className="text-xs text-slate-500">{selectedItem.asset_code}</div>
                    </div>
                </div>

                <form onSubmit={handleSubmitFinish} className="space-y-4">
                  
                  {/* Grid Baris 1: Biaya & Teknisi */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-600 uppercase mb-1.5">Total Biaya (Rp) <span className="text-red-500">*</span></label>
                        <div className="relative">
                            <span className="absolute left-3 top-2.5 text-slate-400 text-sm font-bold">Rp</span>
                            <input 
                              type="number" 
                              required
                              className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-[#009846] focus:border-[#009846] outline-none transition-all"
                              value={cost}
                              onChange={e => setCost(e.target.value)}
                              placeholder="0"
                            />
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-600 uppercase mb-1.5">Nama Teknisi</label>
                        <input 
                          type="text" 
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-[#009846] focus:border-[#009846] outline-none transition-all"
                          value={technician}
                          onChange={e => setTechnician(e.target.value)}
                          placeholder="Nama Teknisi / Bengkel"
                        />
                      </div>
                  </div>

                  {/* Solusi */}
                  <div>
                    <label className="block text-xs font-bold text-slate-600 uppercase mb-1.5">Solusi / Tindakan <span className="text-red-500">*</span></label>
                    <textarea 
                      required
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-[#009846] focus:border-[#009846] outline-none transition-all"
                      rows="3"
                      value={solution}
                      onChange={e => setSolution(e.target.value)}
                      placeholder="Jelaskan apa saja yang diperbaiki atau diganti..."
                    ></textarea>
                  </div>

                  {/* Dropdown Kondisi Aset */}
                  <div>
                    <label className="block text-xs font-bold text-slate-600 uppercase mb-1.5">
                      Kondisi Aset Setelah Servis <span className="text-red-500">*</span>
                    </label>
                    <select
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-[#009846] outline-none bg-white cursor-pointer"
                      value={finalCondition}
                      onChange={(e) => setFinalCondition(e.target.value)}
                    >
                      <option value="baik">✅ Berhasil - Kondisi Baik</option>
                      <option value="rusak">❌ Gagal - Kondisi Rusak</option>
                    </select>
                  </div>

                  {/* Upload Bukti */}
                  <div>
                    <label className="block text-xs font-bold text-slate-600 uppercase mb-1.5">Upload Bukti / Kwitansi (Opsional)</label>
                    <div className={`border-2 border-dashed rounded-xl p-4 transition-all text-center group ${proofFile ? 'border-[#009846] bg-green-50' : 'border-slate-300 hover:border-[#009846] hover:bg-slate-50'}`}>
                        <input 
                          type="file" 
                          id="fileUpload"
                          accept="image/*,application/pdf"
                          className="hidden" 
                          onChange={e => setProofFile(e.target.files[0])}
                        />
                        
                        {!proofFile ? (
                            <label htmlFor="fileUpload" className="cursor-pointer flex flex-col items-center gap-1">
                                <span className="text-2xl text-slate-400 group-hover:scale-110 transition-transform">📸</span>
                                <span className="text-xs font-medium text-slate-600 group-hover:text-[#009846]">Klik untuk upload foto struk/nota</span>
                                <span className="text-xs text-slate-400 block mt-1">Format: JPG, PNG, PDF (Max 10MB)</span>
                            </label>
                        ) : (
                            <div className="flex items-center justify-between px-2">
                                <div className="flex items-center gap-2">
                                    <span className="text-xl">📄</span>
                                    <div className="text-left">
                                        <div className="text-xs font-bold text-slate-800 truncate max-w-[150px]">{proofFile.name}</div>
                                        <div className="text-[10px] text-green-600">Siap diupload</div>
                                    </div>
                                </div>
                                <button 
                                    type="button"
                                    onClick={() => setProofFile(null)}
                                    className="p-1.5 bg-white border border-red-100 text-red-500 rounded-lg hover:bg-red-50 transition-colors"
                                    title="Hapus file"
                                >
                                    ✕
                                </button>
                            </div>
                        )}
                    </div>
                  </div>

                  {/* Tombol Aksi */}
                  <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 mt-2">
                    <button 
                      type="button"
                      onClick={() => setFinishModalOpen(false)}
                      className="px-4 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
                    >
                      Batal
                    </button>
                    <button 
                      type="submit"
                      className="px-5 py-2 text-sm font-bold text-white bg-[#009846] rounded-lg hover:bg-[#007b3a] shadow-md hover:shadow-lg transition-all flex items-center gap-2"
                    >
                      <span>💾</span> Simpan & Selesai
                    </button>
                  </div>
                </form>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default MaintenancePage;