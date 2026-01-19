// src/components/AssetDetailModal.jsx
import QRCode from "react-qr-code";
import { useState, useEffect, useMemo } from "react";
import { API_BASE_URL, createMaintenance, fetchMaintenanceByAsset } from "../api";
import { calculateBookValue, formatRupiah } from "../utils/depreciation";
import Swal from "sweetalert2"; 
import { hasPermission } from "../utils/auth";

function AssetDetailModal({
  asset,
  loans = [],
  fundingSources,
  locations,
  categories = [],
  entities = [],
  onClose,
  onUpdate,
}) {
  // === 1. SEMUA HOOKS (useState & useEffect) ===
  
  // State Lama
  const [previewImage, setPreviewImage] = useState(null);

  // State Baru (Maintenance)
  const [activeTab, setActiveTab] = useState("detail");
  const [maintenanceHistory, setMaintenanceHistory] = useState([]);
  const [isServiceMode, setIsServiceMode] = useState(false);
  const [issue, setIssue] = useState("");
  const [vendor, setVendor] = useState("");
  const [loading, setLoading] = useState(false);

  // Load Maintenance History
  useEffect(() => {
    if (asset?.id) {
        fetchMaintenanceByAsset(asset.id)
            .then(data => setMaintenanceHistory(data))
            .catch(err => console.error("Gagal load history maintenance:", err));
    }
  }, [asset]);

  // === LOGIC BARU: HITUNG RINGKASAN SERVIS ===
  const maintenanceSummary = useMemo(() => {
    const totalCount = maintenanceHistory.length;
    // Hitung total biaya
    const totalCost = maintenanceHistory.reduce((acc, curr) => acc + Number(curr.cost || 0), 0);
    return { totalCount, totalCost };
  }, [maintenanceHistory]);

  // === 2. EARLY RETURN ===
  if (!asset) return null;

  // === 3. LOGIC VARIABEL ===
  
  // Filter & Sort History Peminjaman
  const assetLoans = loans
    .filter((l) => l.asset_id === asset.id)
    .sort((a, b) => new Date(b.borrowed_at) - new Date(a.borrowed_at));

  // Lookup Data Master
  const funding = asset.funding_source_id
    ? fundingSources.find((f) => f.id === asset.funding_source_id)
    : null;

  const locationMaster = asset.location_id
    ? locations.find((l) => l.id === asset.location_id)
    : null;

  const category = asset?.category_id
    ? categories?.find((c) => c.id === asset.category_id)
    : null;

  const entity = asset.entity_id
    ? entities.find((e) => e.id === asset.entity_id)
    : null;

  // Helper URL
  const fullUrl = (path) => {
    if (!path) return null;
    if (path.startsWith("http")) return path;
    return `${API_BASE_URL}${path}`;
  };

  // Cari PIC Terakhir
  let lastBorrower = asset.last_borrower || "-";
  if (!asset.last_borrower && assetLoans.length > 0) {
    lastBorrower = assetLoans[0].borrower || "-";
  }

  // Data QR Code
  const buildQrPayload = () => {
    return [
      `Nama: ${asset.name}`,
      `Kode: ${asset.code}`,
      `Kondisi: ${asset.condition || "-"}`,
      `Status: ${asset.status || "-"}`,
      `PIC: ${lastBorrower}`,
    ].join("\n");
  };

  // Hitung Depresiasi
  const currentBookValue = calculateBookValue(asset);

  // === HANDLER LAPOR KERUSAKAN (SWEETALERT VERSION) ===
  const handleReportService = async (e) => {
    e.preventDefault();
    
    // Validasi Input
    if (!issue) {
        return Swal.fire({
            icon: 'warning',
            title: 'Data Belum Lengkap',
            text: 'Deskripsi kerusakan wajib diisi!',
            confirmButtonColor: '#f59e0b'
        });
    }

    setLoading(true);

    try {
      // Tampilkan Loading
      Swal.fire({
        title: 'Mengirim Laporan...',
        text: 'Mohon tunggu sebentar',
        allowOutsideClick: false,
        didOpen: () => Swal.showLoading()
      });

      // Kirim Data ke API
      await createMaintenance({
        asset_id: asset.id,
        issue_description: issue,
        vendor_name: vendor,
        report_date: new Date().toISOString().split('T')[0]
      });

      // Tampilkan Sukses
      await Swal.fire({
        icon: 'success',
        title: 'Laporan Terkirim!',
        text: "Status aset kini berubah menjadi 'Maintenance'.",
        confirmButtonColor: '#009846',
        confirmButtonText: 'Oke'
      });
      
      // Reset State
      setIsServiceMode(false);
      setIssue("");
      setVendor("");

      // Refresh Data Induk & Tutup Modal
      if (onUpdate) onUpdate(); 
      onClose(); 

    } catch (err) {
      console.error(err);
      Swal.fire({
        icon: 'error',
        title: 'Gagal',
        text: err.message || "Terjadi kesalahan saat mengirim laporan.",
        confirmButtonColor: '#d33'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl flex flex-col max-h-[90vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* === HEADER MODAL === */}
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <div>
            <h2 className="text-xl font-bold text-slate-800">Detail Aset</h2>
            <div className="flex items-center gap-2 mt-0.5">
                <p className="text-xs text-[#009846] font-medium">{asset.code}</p>
                
                {/* LOGIKA BADGE STATUS (REVISI: LEBIH STRICT) */}
                {(() => {
                    // Normalisasi string (biar aman dari huruf besar/kecil)
                    const status = (asset.status || '').toLowerCase();
                    const condition = (asset.condition || '').toLowerCase();

                    let badgeClass = 'bg-slate-100 text-slate-600'; // Default
                    let label = status.toUpperCase();

                    // 1. Prioritas HILANG (Abu Gelap)
                    if (status === 'hilang' || condition === 'hilang') {
                        badgeClass = 'bg-slate-600 text-white shadow-sm';
                        label = 'ASET HILANG';
                    }
                    // 2. Prioritas RUSAK (Merah)
                    else if ((status === 'rusak' || condition === 'rusak') && status !== 'maintenance') {
                        badgeClass = 'bg-red-600 text-white shadow-sm';
                        label = 'RUSAK BERAT';
                    }
                    // 3. Maintenance (Kuning)
                    else if (status === 'maintenance') {
                        badgeClass = 'bg-yellow-100 text-yellow-800 border border-yellow-200';
                        label = 'MAINTENANCE';
                    }
                    // 4. Dipinjam (Orange)
                    else if (status === 'borrowed') {
                        badgeClass = 'bg-orange-100 text-orange-700 border border-orange-200';
                        label = 'DIPINJAM';
                    }
                    // 5. Available / Baik (Hijau)
                    else if (status === 'available' || condition === 'baik') {
                        badgeClass = 'bg-green-100 text-green-700 border border-green-200';
                        label = 'AVAILABLE';
                    }

                    return (
                        <span className={`text-[10px] px-2 py-0.5 rounded uppercase font-bold ${badgeClass}`}>
                            {label}
                        </span>
                    );
                })()}
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-white border border-slate-200 text-slate-400 hover:bg-red-50 hover:text-red-500 hover:border-red-200 transition-all shadow-sm"
          >
            ✕
          </button>
        </div>

        {/* === TAB NAVIGATION === */}
        <div className="flex border-b border-slate-200 px-6 pt-2 bg-slate-50/30">
            <button 
                onClick={() => { setActiveTab("detail"); setIsServiceMode(false); }}
                className={`pb-3 pt-2 px-4 text-sm font-bold border-b-2 transition-colors ${activeTab === 'detail' && !isServiceMode ? 'border-[#009846] text-[#009846]' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
            >
                📄 Informasi Aset
            </button>
            <button 
                onClick={() => { setActiveTab("maintenance"); setIsServiceMode(false); }}
                className={`pb-3 pt-2 px-4 text-sm font-bold border-b-2 transition-colors ${activeTab === 'maintenance' ? 'border-[#009846] text-[#009846]' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
            >
                🔧 Riwayat Servis
            </button>
            <button 
                onClick={() => { setActiveTab("loans"); setIsServiceMode(false); }}
                className={`pb-3 pt-2 px-4 text-sm font-bold border-b-2 transition-colors ${activeTab === 'loans' ? 'border-[#009846] text-[#009846]' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
            >
                🔄 Riwayat Peminjaman
            </button>
        </div>

        {/* === CONTENT SCROLLABLE === */}
        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
          
          {/* === LOGIC: FORM SERVICE === */}
          {isServiceMode ? (
            <div className="max-w-2xl mx-auto bg-yellow-50 p-6 rounded-xl border border-yellow-200 shadow-sm animate-fade-in">
                <h3 className="font-bold text-yellow-800 mb-4 flex items-center gap-2 text-lg">
                    ⚠️ Lapor Kerusakan / Maintenance
                </h3>
                <form onSubmit={handleReportService} className="space-y-5">
                    <div>
                        <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Keluhan / Kerusakan</label>
                        <textarea 
                            required autoFocus
                            className="w-full border border-slate-300 rounded-lg p-3 focus:ring-2 focus:ring-yellow-500 outline-none"
                            rows="4"
                            placeholder="Jelaskan detail kerusakan..."
                            value={issue}
                            onChange={e => setIssue(e.target.value)}
                        ></textarea>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Vendor / Tempat Servis (Opsional)</label>
                        <input 
                            type="text"
                            className="w-full border border-slate-300 rounded-lg p-3 focus:ring-2 focus:ring-yellow-500 outline-none"
                            placeholder="Nama Toko / Bengkel"
                            value={vendor}
                            onChange={e => setVendor(e.target.value)}
                        />
                    </div>
                    <div className="flex gap-4 pt-2">
                        <button 
                            type="button" 
                            onClick={() => setIsServiceMode(false)}
                            className="flex-1 py-3 bg-white border border-slate-300 rounded-lg text-slate-600 hover:bg-slate-50 font-bold"
                        >
                            Batal
                        </button>
                        <button 
                            type="submit" 
                            disabled={loading}
                            className="flex-1 py-3 bg-yellow-600 text-white rounded-lg font-bold hover:bg-yellow-700 shadow-lg disabled:opacity-50"
                        >
                            {loading ? "Menyimpan..." : "Kirim Laporan"}
                        </button>
                    </div>
                </form>
            </div>
          ) : (
            <>
              {/* === TAB 1: DETAIL === */}
              {activeTab === 'detail' && (
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-fade-in">
                    {/* KOLOM KIRI: INFO TEKS */}
                    <div className="lg:col-span-2 space-y-6">
                      
                      <div className="bg-slate-50 p-5 rounded-xl border border-slate-100">
                        <h3 className="text-lg font-bold text-slate-800 mb-4 border-b border-slate-200 pb-2">
                          {asset.name}
                        </h3>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-8 text-sm">
                          <div>
                            <span className="block text-xs text-slate-400 mb-1">Entitas / Yayasan</span>
                            <span className="font-medium text-slate-700">{entity?.name || "-"}</span>
                          </div>
                          
                          <div>
                            <span className="block text-xs text-slate-400 mb-1">Kategori</span>
                            <span className="font-medium text-slate-700">
                              {category ? `${category.name} ${category.code ? `(${category.code})` : ''}` : "-"}
                            </span>
                          </div>
                          <div>
                            <span className="block text-xs text-slate-400 mb-1">Sumber Dana</span>
                            <span className="font-medium text-slate-700">{funding?.name || "-"}</span>
                          </div>
                          <div>
                            <span className="block text-xs text-slate-400 mb-1">Lokasi Induk</span>
                            <span className="font-medium text-slate-700">{locationMaster?.name || "-"}</span>
                          </div>
                          <div>
                            <span className="block text-xs text-slate-400 mb-1">Detail Lokasi</span>
                            <span className="font-medium text-slate-700">{asset.location || "-"}</span>
                          </div>
                          <div>
                            <span className="block text-xs text-slate-400 mb-1">PIC Terakhir</span>
                            <span className="font-medium text-slate-700">{lastBorrower}</span>
                          </div>
                          <div>
                            <span className="block text-xs text-slate-400 mb-1">Tanggal Pembelian</span>
                            <span className="font-medium text-slate-700">
                                {asset.purchase_date ? new Date(asset.purchase_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : "-"}
                            </span>
                          </div>
                        </div>

                        {/* INFO NILAI & PENYUSUTAN */}
                        <div className="mt-5 bg-white p-4 rounded-lg border border-slate-200 shadow-sm relative overflow-hidden">
                            <div className="absolute top-0 left-0 w-1 h-full bg-[#009846]"></div>
                            <h4 className="text-xs font-bold text-slate-500 uppercase mb-3 tracking-wider">Informasi Nilai Aset</h4>
                            
                            <div className="grid grid-cols-2 gap-6">
                                <div>
                                    <span className="block text-[10px] text-slate-400 uppercase">Harga Perolehan (Beli)</span>
                                    <span className="text-base font-semibold text-slate-700">
                                        {formatRupiah(asset.value)}
                                    </span>
                                </div>
                                <div>
                                    <span className="block text-[10px] text-slate-400 uppercase">Nilai Buku Saat Ini</span>
                                    <span className="text-lg font-bold text-[#009846]">
                                        {formatRupiah(currentBookValue)}
                                    </span>
                                </div>
                            </div>
                            
                            <div className="mt-3 pt-3 border-t border-slate-100 flex gap-6 text-xs text-slate-500">
                                <span>Umur Ekonomis: <strong>{asset.useful_life || 0} Tahun</strong></span>
                                <span>Nilai Residu: <strong>{formatRupiah(asset.residual_value)}</strong></span>
                            </div>
                        </div>
                      </div>

                      {/* Status & Kondisi Badges */}
                      <div className="flex gap-4">
                        
                        {/* 1. BADGE STATUS (Body) */}
                        <div className="flex-1 bg-white border border-slate-200 rounded-lg p-3 text-center shadow-sm">
                          <span className="block text-xs text-slate-400 mb-1">Status</span>
                          <span className={`inline-block px-2 py-1 rounded text-xs font-bold uppercase tracking-wider ${
                            asset.status === 'hilang' ? 'bg-slate-600 text-white' : // 👈 Abu Gelap
                            asset.status === 'rusak' ? 'bg-red-600 text-white' :    // 👈 Merah Solid
                            asset.status === 'maintenance' ? 'bg-yellow-100 text-yellow-800 border border-yellow-200' :
                            asset.status === 'borrowed' ? 'bg-orange-100 text-orange-600 border border-orange-200' : 
                            'bg-green-100 text-green-600 border border-green-200' // Available
                          }`}>
                            {asset.status || "-"}
                          </span>
                        </div>

                        {/* 2. BADGE KONDISI (Body) */}
                        <div className="flex-1 bg-white border border-slate-200 rounded-lg p-3 text-center shadow-sm">
                          <span className="block text-xs text-slate-400 mb-1">Kondisi</span>
                          <span className={`inline-block px-2 py-1 rounded text-xs font-bold uppercase tracking-wider ${
                            asset.condition === 'hilang' ? 'bg-slate-600 text-white' : // 👈 Abu Gelap (Biar match sama status)
                            asset.condition === 'rusak' ? 'bg-red-600 text-white' :    // 👈 Merah Solid
                            asset.condition === 'baik' ? 'bg-green-100 text-green-600 border border-green-200' : 
                            'bg-gray-100 text-gray-600'
                          }`}>
                            {asset.condition || "-"}
                          </span>
                        </div>

                      </div>
                      
                      {/* Catatan */}
                      {asset.notes && (
                          <div className="bg-yellow-50 border border-yellow-100 p-3 rounded-lg text-sm text-yellow-800">
                              <span className="font-bold block text-xs uppercase mb-1">Catatan:</span>
                              {asset.notes}
                          </div>
                      )}

                      {/* TOMBOL ACTION */}
                      <div className="pt-4 border-t border-slate-100">
                        {hasPermission('create_maintenance') && (
                            <button 
                              onClick={() => setIsServiceMode(true)}
                              disabled={asset.status === 'maintenance'}
                              className={`w-full py-3 rounded-xl font-bold flex items-center justify-center gap-2 shadow-sm transition-all ${
                                  asset.status === 'maintenance' 
                                  ? 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200' 
                                  : 'bg-red-50 text-red-600 border border-red-200 hover:bg-red-600 hover:text-white hover:shadow-red-200'
                              }`}
                          >
                              {asset.status === 'maintenance' ? (
                                  <>🚫 Sedang Dalam Perbaikan</>
                              ) : (
                                  <>🔧 Lapor Kerusakan / Ajukan Servis</>
                              )}
                          </button>
                        )}
                      </div>

                    </div>

                    {/* KOLOM KANAN: MEDIA */}
                    <div className="space-y-4">
                      {/* Foto Aset */}
                      <div 
                        className="group relative rounded-xl overflow-hidden border border-slate-200 bg-slate-50 h-48 cursor-pointer shadow-sm hover:shadow-md transition-all"
                        onClick={() => asset.photo_url && setPreviewImage(fullUrl(asset.photo_url))}
                      >
                        {asset.photo_url ? (
                          <>
                            <img src={fullUrl(asset.photo_url)} alt="Aset" className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all flex items-center justify-center">
                              <span className="opacity-0 group-hover:opacity-100 bg-white/90 px-2 py-1 rounded text-xs font-medium shadow">🔍 Zoom</span>
                            </div>
                          </>
                        ) : (
                          <div className="w-full h-full flex flex-col items-center justify-center text-slate-300">
                            <span className="text-3xl">📷</span>
                            <span className="text-xs mt-1">No Image</span>
                          </div>
                        )}
                        <div className="absolute bottom-0 left-0 right-0 bg-white/80 backdrop-blur-sm p-1.5 text-[10px] text-center font-medium text-slate-600 border-t border-slate-100">
                          Foto Aset
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        {/* Foto Kwitansi */}
                        <div 
                          className="group relative rounded-xl overflow-hidden border border-slate-200 bg-slate-50 h-32 cursor-pointer shadow-sm hover:shadow-md transition-all"
                          onClick={() => asset.receipt_url && setPreviewImage(fullUrl(asset.receipt_url))}
                        >
                          {asset.receipt_url ? (
                            <>
                              <img src={fullUrl(asset.receipt_url)} alt="Kwitansi" className="w-full h-full object-cover" />
                              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all flex items-center justify-center">
                                <span className="opacity-0 group-hover:opacity-100 bg-white/90 px-2 py-1 rounded text-[10px] font-medium shadow">🔍 Zoom</span>
                              </div>
                            </>
                          ) : (
                            <div className="w-full h-full flex flex-col items-center justify-center text-slate-300">
                              <span className="text-xl">📄</span>
                              <span className="text-[10px] mt-1">No Receipt</span>
                            </div>
                          )}
                          <div className="absolute bottom-0 left-0 right-0 bg-white/80 backdrop-blur-sm p-1 text-[10px] text-center font-medium text-slate-600 border-t border-slate-100">
                            Kwitansi
                          </div>
                        </div>

                        {/* QR Code */}
                        <div 
                          className="rounded-xl border border-slate-200 bg-white h-32 flex flex-col items-center justify-center p-2 cursor-pointer hover:border-[#009846] transition-colors shadow-sm"
                          onClick={() => setPreviewImage("QR")} 
                        >
                          <QRCode value={buildQrPayload()} size={64} className="mb-1" />
                          <span className="text-[10px] text-[#009846] font-medium">Klik utk Zoom</span>
                        </div>
                      </div>
                    </div>
                  </div>
              )}

              {/* === TAB 2: RIWAYAT SERVIS === */}
              {activeTab === 'maintenance' && (
                  <div className="animate-fade-in space-y-4">
                      {/* Ringkasan Statistik */}
                      <div className="grid grid-cols-2 gap-4">
                          <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                              <span className="text-xs font-bold text-blue-400 uppercase tracking-wider">Total Servis</span>
                              <div className="flex items-baseline gap-1 mt-1">
                                <span className="text-2xl font-bold text-blue-700">{maintenanceSummary.totalCount}</span>
                                <span className="text-xs text-blue-500 font-medium">Kali</span>
                              </div>
                          </div>
                          <div className="bg-orange-50 p-4 rounded-xl border border-orange-100">
                              <span className="text-xs font-bold text-orange-400 uppercase tracking-wider">Total Biaya Servis</span>
                              <div className="mt-1">
                                <span className="text-xl font-bold text-orange-700">{formatRupiah(maintenanceSummary.totalCost)}</span>
                              </div>
                          </div>
                      </div>

                      <div className="flex justify-between items-center mb-2">
                          <h4 className="text-sm font-bold text-slate-800">Riwayat Perbaikan Aset</h4>
                          <button 
                            onClick={() => setIsServiceMode(true)}
                            disabled={asset.status === 'maintenance'}
                            className="text-xs text-[#009846] font-bold hover:underline disabled:text-slate-400"
                          >
                              + Lapor Baru
                          </button>
                      </div>

                      {maintenanceHistory.length === 0 ? (
                          <div className="text-center py-12 border border-slate-200 border-dashed rounded-xl text-slate-400 bg-slate-50">
                              <span className="text-2xl block mb-2">🔧</span>
                              Belum ada riwayat servis untuk aset ini.
                          </div>
                      ) : (
                          <ul className="space-y-3">
                              {maintenanceHistory.map((m) => (
                                  <li key={m.id} className="border border-slate-200 rounded-xl p-4 bg-white shadow-sm hover:shadow-md transition-shadow">
                                      <div className="flex justify-between items-start mb-2">
                                          <span className="text-xs font-mono text-slate-500 bg-slate-100 px-2 py-1 rounded">
                                            {new Date(m.report_date).toLocaleDateString("id-ID", {dateStyle: 'full'})}
                                          </span>
                                          <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase tracking-wide ${
                                              m.status === 'finished' ? 'bg-green-100 text-green-700' : 
                                              m.status === 'in_progress' ? 'bg-blue-100 text-blue-700' :
                                              'bg-yellow-100 text-yellow-700'
                                          }`}>{m.status.replace('_', ' ')}</span>
                                      </div>
                                      <p className="text-sm font-bold text-slate-800 mb-1">{m.issue_description}</p>
                                      <p className="text-xs text-slate-500 mb-3">Vendor: {m.vendor_name || "-"}</p>
                                      
                                      {/* GANTI BAGIAN YANG MENAMPILKAN SOLUSI/BIAYA DENGAN INI: */}
                                          {m.status === 'finished' ? (
                                              <div className="bg-green-50/50 rounded-lg p-3 border border-green-100 mt-2">
                                                  <div className="flex items-start gap-2">
                                                      <span className="text-green-600 mt-0.5">✅</span>
                                                      <div>
                                                          <span className="block text-[10px] font-bold text-green-700 uppercase">Solusi & Hasil</span>
                                                          <p className="text-sm text-slate-700 font-medium leading-relaxed">{m.solution_description}</p>
                                                      </div>
                                                  </div>
                                                  <div className="flex items-center gap-2 mt-3 pt-3 border-t border-green-200/50">
                                                      <span className="text-[10px] font-bold text-slate-400 uppercase">Biaya:</span>
                                                      <span className="text-sm font-bold text-slate-800 font-mono">{formatRupiah(m.cost)}</span>
                                                  </div>
                                              </div>
                                          ) : (
                                              <div className="bg-yellow-50 rounded-lg p-3 border border-yellow-100 text-xs text-yellow-800 italic mt-2">
                                                  Sedang dalam pengerjaan...
                                              </div>
                                          )}
                                  </li>
                              ))}
                          </ul>
                      )}
                  </div>
              )}

              {/* === TAB 3: RIWAYAT PEMINJAMAN === */}
              {activeTab === 'loans' && (
                  <div className="animate-fade-in">
                    <h4 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
                      <span className="w-1 h-4 bg-[#009846] rounded-full"></span>
                      Log Peminjaman & Pengembalian
                    </h4>

                    {/* WRAPPER TABEL */}
                    <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-sm">
                      <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
                        <table className="w-full text-xs text-left">
                          <thead className="bg-slate-50 text-slate-600 font-semibold sticky top-0 z-10 shadow-sm">
                            <tr>
                              <th className="p-3 border-b border-slate-200 whitespace-nowrap">Peminjam</th>
                              <th className="p-3 border-b border-slate-200 whitespace-nowrap">Tanggal Pinjam</th>
                              <th className="p-3 border-b border-slate-200 whitespace-nowrap">Tanggal Kembali</th>
                              <th className="p-3 border-b border-slate-200 whitespace-nowrap">Catatan</th>
                              <th className="p-3 border-b border-slate-200 whitespace-nowrap text-center">Kondisi</th>
                              <th className="p-3 border-b border-slate-200 whitespace-nowrap text-center">Bukti Foto</th>
                            </tr>
                          </thead>

                          <tbody className="divide-y divide-slate-100">
                            {assetLoans.length === 0 ? (
                              <tr>
                                <td colSpan="6" className="p-8 text-center text-slate-400 italic">
                                  Belum ada riwayat peminjaman.
                                </td>
                              </tr>
                            ) : (
                              assetLoans.map((loan) => (
                                <tr key={loan.id} className="hover:bg-slate-50 transition-colors align-top">
                                  {/* 1. PEMINJAM */}
                                  <td className="p-3">
                                    <div className="font-medium text-slate-700">{loan.borrower}</div>
                                    <div className="text-[10px] text-slate-400 mt-0.5">ID: {loan.id}</div>
                                  </td>

                                  {/* 2. TANGGAL PINJAM */}
                                  <td className="p-3 text-slate-500">
                                    {loan.borrowed_at ? new Date(loan.borrowed_at).toLocaleString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : "-"}
                                  </td>

                                  {/* 3. TANGGAL KEMBALI */}
                                  <td className="p-3 text-slate-500">
                                    {loan.returned_at ? (
                                      new Date(loan.returned_at).toLocaleString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
                                    ) : (
                                      <span className="bg-orange-100 text-orange-600 px-2 py-0.5 rounded text-[10px] font-bold">Sedang Dipinjam</span>
                                    )}
                                  </td>
                                  
                                  {/* 4. CATATAN */}
                                  <td className="p-3 text-slate-600 max-w-[200px]">
                                    {loan.notes && (
                                      <div className="mb-1">
                                        <span className="text-[10px] font-bold text-slate-400 uppercase mr-1">Pinjam:</span>
                                        <span className="text-xs">{loan.notes}</span>
                                      </div>
                                    )}
                                    
                                    {loan.notes_return && (
                                      <div className="mt-1 pt-1 border-t border-slate-100">
                                        <span className="text-[10px] font-bold text-green-600 uppercase mr-1">Kembali:</span>
                                        <span className="text-xs text-slate-700">{loan.notes_return}</span>
                                      </div>
                                    )}
                                    
                                    {!loan.notes && !loan.notes_return && <span className="text-slate-300">-</span>}
                                  </td>

                                  {/* 5. KONDISI */}
                                  <td className="p-3 text-center">
                                      <div className="flex flex-col gap-1 items-center">
                                          <span className="px-2 py-0.5 rounded text-[10px] bg-slate-100 border text-slate-600 w-full">
                                              Awal: <b>{loan.condition_before || "?"}</b>
                                          </span>
                                          {loan.condition_after && (
                                              <span className={`px-2 py-0.5 rounded text-[10px] border w-full font-bold ${
                                                  loan.condition_after === 'rusak' ? 'bg-red-50 border-red-200 text-red-600' : 'bg-green-50 border-green-200 text-green-600'
                                              }`}>
                                                  Akhir: {loan.condition_after}
                                              </span>
                                          )}
                                      </div>
                                  </td>

                                  {/* 6. BUKTI FOTO */}
                                  <td className="p-3 text-center">
                                    <div className="flex justify-center gap-2">
                                      {/* Foto Pinjam */}
                                      {loan.before_photo_url ? (
                                          <button 
                                              onClick={() => setPreviewImage(fullUrl(loan.before_photo_url))}
                                              className="group relative w-10 h-10 rounded-lg border border-slate-200 overflow-hidden hover:scale-105 transition-transform shadow-sm bg-slate-50"
                                              title="Foto Saat Pinjam"
                                          >
                                              <img src={fullUrl(loan.before_photo_url)} className="w-full h-full object-cover" alt="Before" />
                                              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 flex items-center justify-center transition-all">
                                                  <span className="text-[8px] text-white opacity-0 group-hover:opacity-100">🔍</span>
                                              </div>
                                          </button>
                                      ) : null}

                                      {/* Foto Kembali */}
                                      {loan.after_photo_url ? (
                                          <button 
                                              onClick={() => setPreviewImage(fullUrl(loan.after_photo_url))}
                                              className="group relative w-10 h-10 rounded-lg border border-green-200 overflow-hidden hover:scale-105 transition-transform shadow-sm bg-green-50"
                                              title="Foto Saat Kembali"
                                          >
                                              <img src={fullUrl(loan.after_photo_url)} className="w-full h-full object-cover" alt="After" />
                                              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 flex items-center justify-center transition-all">
                                                  <span className="text-[8px] text-white opacity-0 group-hover:opacity-100">🔍</span>
                                              </div>
                                          </button>
                                      ) : null}

                                      {!loan.before_photo_url && !loan.after_photo_url && (
                                          <span className="text-slate-300 text-xs">-</span>
                                      )}
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
              )}
            </>
          )}

        </div>

        {/* === FOOTER === */}
        <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-slate-800 text-white text-sm font-medium rounded-lg hover:bg-slate-700 transition-colors shadow-lg"
          >
            Tutup
          </button>
        </div>
      </div>

      {/* === MODAL PREVIEW GAMBAR / QR === */}
      {previewImage && (
        <div 
            className="fixed inset-0 z-[60] bg-black/90 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in"
            onClick={() => setPreviewImage(null)}
        >
            <div className="relative max-w-4xl max-h-[90vh]">
                <button 
                  className="absolute -top-10 right-0 text-white hover:text-red-400 font-bold"
                  onClick={() => setPreviewImage(null)}
                >
                    TUTUP ✕
                </button>
                
                {previewImage === "QR" ? (
                    <div className="bg-white p-8 rounded-2xl flex flex-col items-center">
                        <QRCode value={buildQrPayload()} size={256} />
                        <p className="mt-4 text-slate-500 text-sm font-mono">{asset.code}</p>
                        <p className="text-slate-800 font-bold text-lg mt-1">{asset.name}</p>
                    </div>
                ) : (
                    <img 
                        src={previewImage} 
                        alt="Preview" 
                        className="max-w-full max-h-[85vh] rounded-lg shadow-2xl object-contain border border-slate-700"
                    />
                )}
            </div>
        </div>
      )}
    </div>
  );
}

export default AssetDetailModal;