// src/components/AssetDetailModal.jsx
import QRCode from "react-qr-code";
import { API_BASE_URL } from "../api";
import { useState } from "react";

function AssetDetailModal({
  asset,
  loans,
  fundingSources,
  locations,
  categories = [],
  onClose,
}) {
  const [previewImage, setPreviewImage] = useState(null); // State untuk zoom gambar

  if (!asset) return null;

  // Filter history khusus aset ini
  const assetLoans = loans
    .filter((l) => l.asset_id === asset.id)
    .sort((a, b) => new Date(b.borrowed_at) - new Date(a.borrowed_at)); // Urutkan terbaru

  const funding = asset.funding_source_id
    ? fundingSources.find((f) => f.id === asset.funding_source_id)
    : null;

  const locationMaster = asset.location_id
    ? locations.find((l) => l.id === asset.location_id)
    : null;

  const category = asset?.category_id
    ? categories?.find((c) => c.id === asset.category_id)
    : null;

  const formatCurrency = (num) => {
    if (num === null || num === undefined) return "-";
    const n = Number(num);
    if (Number.isNaN(n)) return "-";
    return n.toLocaleString("id-ID");
  };

  const fullUrl = (path) => {
    if (!path) return null;
    if (path.startsWith("http")) return path;
    return `${API_BASE_URL}${path}`;
  };

  // ==== PIC Terakhir ====
  let lastBorrower = asset.last_borrower || "-";
  if (!asset.last_borrower && assetLoans.length > 0) {
    lastBorrower = assetLoans[0].borrower || "-";
  }

  // ==== QR Payload ====
  const buildQrPayload = () => {
    return [
      `Nama: ${asset.name}`,
      `Kode: ${asset.code}`,
      `Kondisi: ${asset.condition || "-"}`,
      `Status: ${asset.status || "-"}`,
      `Sumber Dana: ${funding ? funding.name : "-"}`,
      `PIC: ${lastBorrower}`,
    ].join("\n");
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
            <p className="text-xs text-[#009846] font-medium mt-0.5">
              {asset.code}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-white border border-slate-200 text-slate-400 hover:bg-red-50 hover:text-red-500 hover:border-red-200 transition-all shadow-sm"
          >
            ✕
          </button>
        </div>

        {/* === CONTENT SCROLLABLE === */}
        <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
          
          {/* SECTION 1: INFORMASI UTAMA & GAMBAR */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* KOLOM KIRI: INFO TEKS */}
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-slate-50 p-5 rounded-xl border border-slate-100">
                <h3 className="text-lg font-bold text-slate-800 mb-4 border-b border-slate-200 pb-2">
                  {asset.name}
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-8 text-sm">
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
                    <span className="block text-xs text-slate-400 mb-1">Nilai Aset</span>
                    <span className="font-medium text-slate-700">Rp {formatCurrency(asset.value)}</span>
                  </div>
                  <div>
                    <span className="block text-xs text-slate-400 mb-1">PIC Terakhir</span>
                    <span className="font-medium text-slate-700">{lastBorrower}</span>
                  </div>
                </div>
              </div>

              {/* Status & Kondisi Badges */}
              <div className="flex gap-4">
                <div className="flex-1 bg-white border border-slate-200 rounded-lg p-3 text-center shadow-sm">
                  <span className="block text-xs text-slate-400 mb-1">Status</span>
                  <span className={`inline-block px-2 py-1 rounded text-xs font-bold uppercase tracking-wider ${
                    asset.status === 'borrowed' ? 'bg-orange-100 text-orange-600' : 'bg-green-100 text-green-600'
                  }`}>
                    {asset.status || "-"}
                  </span>
                </div>
                <div className="flex-1 bg-white border border-slate-200 rounded-lg p-3 text-center shadow-sm">
                  <span className="block text-xs text-slate-400 mb-1">Kondisi</span>
                  <span className={`inline-block px-2 py-1 rounded text-xs font-bold uppercase tracking-wider ${
                    asset.condition === 'baik' ? 'bg-green-100 text-green-600' : 
                    asset.condition === 'rusak' ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-600'
                  }`}>
                    {asset.condition || "-"}
                  </span>
                </div>
              </div>
            </div>

            {/* KOLOM KANAN: MEDIA (Foto, Kwitansi, QR) */}
            <div className="space-y-4">
              {/* Foto Aset */}
              <div 
                className="group relative rounded-xl overflow-hidden border border-slate-200 bg-slate-50 h-40 cursor-pointer shadow-sm hover:shadow-md transition-all"
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
                    <span className="text-2xl">📷</span>
                    <span className="text-xs mt-1">No Image</span>
                  </div>
                )}
                <div className="absolute bottom-0 left-0 right-0 bg-white/80 backdrop-blur-sm p-1 text-[10px] text-center font-medium text-slate-600 border-t border-slate-100">
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
                  onClick={() => {
                    // Generate QR data URL untuk preview (agak tricky, jadi kita preview simple text atau alert)
                    // Atau render ulang QR di modal preview. 
                    // Simpelnya: Kita tampilkan QR di tengah layar kalau diklik.
                    setPreviewImage("QR"); // Flag khusus
                  }}
                >
                  <QRCode value={buildQrPayload()} size={64} className="mb-1" />
                  <span className="text-[10px] text-[#009846] font-medium">Klik utk Zoom</span>
                </div>
              </div>
            </div>
          </div>

          {/* SECTION 2: TABEL RIWAYAT (Scrollable Container) */}
          <div className="mt-8">
            <h4 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2">
              <span className="w-1 h-4 bg-[#009846] rounded-full"></span>
              Riwayat Peminjaman & Pengembalian
            </h4>

            {/* WRAPPER TABEL: KUNCI UNTUK DATA BANYAK */}
            <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-sm">
              <div className="max-h-[300px] overflow-y-auto custom-scrollbar">
                <table className="w-full text-xs text-left">
                  {/* STICKY HEADER */}
                  <thead className="bg-slate-50 text-slate-600 font-semibold sticky top-0 z-10 shadow-sm">
                    <tr>
                      <th className="p-3 border-b border-slate-200 whitespace-nowrap">Peminjam</th>
                      <th className="p-3 border-b border-slate-200 whitespace-nowrap">Tanggal Pinjam</th>
                      <th className="p-3 border-b border-slate-200 whitespace-nowrap">Tanggal Kembali</th>
                      <th className="p-3 border-b border-slate-200 whitespace-nowrap">Catatan Pinjam</th>
                      <th className="p-3 border-b border-slate-200 whitespace-nowrap">Catatan Kembali</th>
                      <th className="p-3 border-b border-slate-200 whitespace-nowrap text-center">Kondisi</th>
                      <th className="p-3 border-b border-slate-200 whitespace-nowrap text-center">Bukti Foto</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {assetLoans.length === 0 ? (
                      <tr>
                        <td colSpan="7" className="p-8 text-center text-slate-400 italic">
                          Belum ada riwayat peminjaman.
                        </td>
                      </tr>
                    ) : (
                      assetLoans.map((loan) => (
                        <tr key={loan.id} className="hover:bg-slate-50 transition-colors">
                          <td className="p-3 font-medium text-slate-700">{loan.borrower}</td>
                          <td className="p-3 text-slate-500">
                            {loan.borrowed_at ? new Date(loan.borrowed_at).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' }) : "-"}
                          </td>
                          <td className="p-3 text-slate-500">
                            {loan.returned_at ? new Date(loan.returned_at).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' }) : 
                             <span className="text-orange-500 font-medium">Sedang dipinjam</span>
                            }
                          </td>
                          
                          {/* CATATAN PINJAM */}
                          <td className="p-3 text-slate-600 max-w-[150px] truncate" title={loan.notes}>
                            {loan.notes || "-"}
                          </td>

                          {/* CATATAN KEMBALI */}
                          <td className="p-3 text-slate-600 max-w-[150px] truncate" title={loan.notes_return}>
                            {loan.notes_return || "-"}
                          </td>

                          {/* KONDISI (Stacked) */}
                          <td className="p-3 text-center">
                            <div className="flex flex-col gap-1 items-center">
                                <span className="px-1.5 py-0.5 rounded text-[10px] bg-slate-100 border text-slate-600">
                                    Awal: {loan.condition_before || "?"}
                                </span>
                                {loan.condition_after && (
                                    <span className="px-1.5 py-0.5 rounded text-[10px] bg-white border border-slate-200 text-slate-600">
                                        Akhir: {loan.condition_after}
                                    </span>
                                )}
                            </div>
                          </td>

                          {/* FOTO BUKTI (Stacked) */}
                          <td className="p-3 text-center">
                            <div className="flex justify-center gap-2">
                                {loan.before_photo_url && (
                                    <button 
                                        onClick={() => setPreviewImage(fullUrl(loan.before_photo_url))}
                                        className="w-8 h-8 rounded border border-slate-200 overflow-hidden hover:scale-110 transition-transform"
                                        title="Foto Saat Pinjam"
                                    >
                                        <img src={fullUrl(loan.before_photo_url)} className="w-full h-full object-cover" />
                                    </button>
                                )}
                                {loan.after_photo_url && (
                                    <button 
                                        onClick={() => setPreviewImage(fullUrl(loan.after_photo_url))}
                                        className="w-8 h-8 rounded border border-[#009846] overflow-hidden hover:scale-110 transition-transform"
                                        title="Foto Saat Kembali"
                                    >
                                        <img src={fullUrl(loan.after_photo_url)} className="w-full h-full object-cover" />
                                    </button>
                                )}
                                {!loan.before_photo_url && !loan.after_photo_url && (
                                    <span className="text-[10px] text-slate-300">-</span>
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
            <p className="text-[10px] text-slate-400 mt-2 text-right">
              * Menampilkan maksimal 200 riwayat terakhir.
            </p>
          </div>

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