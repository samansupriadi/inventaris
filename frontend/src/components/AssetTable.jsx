// src/components/AssetTable.jsx
import QRCode from "react-qr-code";
import { API_BASE_URL } from "../api";
import { useEffect, useState } from "react";

function AssetTable({
  assets,
  loading,
  onUploadPhoto,
  onBorrow,
  onReturn,
  onShowDetail,
  onPreviewPhoto,
  fundingSources,
  locations,
  categories,
  onPrintQr,
  onBulkPrintQr,
  onEdit,
  onDelete,
}) {
  const [openMenuId, setOpenMenuId] = useState(null);

  // STATE MODAL DELETE
  const [deleteModal, setDeleteModal] = useState({
    open: false,
    asset: null,
  });

  // STATE TOAST (NOTIFIKASI)
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  // Fungsi Helper tampilkan toast
  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    // Hilang otomatis setelah 3 detik
    setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 3000);
  };

  useEffect(() => {
    const onDocClick = () => setOpenMenuId(null);
    document.addEventListener("click", onDocClick);
    return () => document.removeEventListener("click", onDocClick);
  }, []);

  const getFundingName = (id) => {
    if (!id) return "-";
    const f = fundingSources?.find((x) => x.id === id);
    return f ? f.name : "-";
  };

  const getLocationName = (id) => {
    if (!id) return "-";
    const loc = locations?.find((x) => x.id === id);
    return loc ? loc.name : "-";
  };

  const getCategoryName = (id) => {
    if (!id) return "-";
    const cat = categories?.find((x) => x.id === id);
    return cat ? (cat.code ? `${cat.name} (${cat.code})` : cat.name) : "-";
  };

  const formatCurrency = (num) => {
    if (num === null || num === undefined) return "-";
    const n = Number(num);
    if (Number.isNaN(n)) return "-";
    return n.toLocaleString("id-ID");
  };

  const handlePrintSingle = (asset) => onPrintQr?.(asset);
  const handleBulkPrint = () => onBulkPrintQr?.();

  // 1. BUKA MODAL DELETE
  const handleDeleteClick = (asset) => {
    setDeleteModal({ open: true, asset });
  };

  // 2. EKSEKUSI HAPUS
  const handleConfirmDelete = async () => {
    if (!deleteModal.asset) return;

    try {
      await onDelete?.(deleteModal.asset);

      // SUKSES: Tutup modal & Tampilkan Toast Hijau
      setDeleteModal({ open: false, asset: null });
      showToast("Berhasil menghapus aset.", "success");

    } catch (err) {
      // GAGAL: Tutup modal & Tampilkan Toast Merah
      setDeleteModal({ open: false, asset: null });
      showToast(err?.message || "Gagal menghapus aset.", "error");
    }
  };

  return (
    <>
      <div className="bg-white shadow-sm border border-slate-100 rounded-xl overflow-hidden relative font-sans">

        {/* TOAST NOTIFICATION (Fixed Position) */}
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

        {/* Header + tombol bulk print */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-white">
          <div>
            <h2 className="text-lg font-bold text-slate-800 tracking-tight">Daftar Aset</h2>
            <p className="text-xs text-slate-500 mt-1">Kelola semua inventaris aset Anda di sini.</p>
          </div>
          {assets.length > 0 && (
            <button
              type="button"
              onClick={handleBulkPrint}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-medium rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-800 transition-colors shadow-sm"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6.72 13.829c-.24.03-.48.062-.72.096m.72-.096a42.415 42.415 0 0110.56 0m-10.56 0L6.34 18m10.94-4.171c.24.03.48.062.72.096m-.72-.096L17.66 18m0 0l.229 2.523a1.125 1.125 0 01-1.12 1.227H7.231c-.662 0-1.18-.568-1.12-1.227L6.34 18m11.318 0h1.091A2.25 2.25 0 0021 15.75V9.456c0-1.081-.768-2.015-1.837-2.175a48.055 48.055 0 00-1.913-.247M6.34 18H5.25A2.25 2.25 0 013 15.75V9.456c0-1.081.768-2.015 1.837-2.175a48.041 48.041 0 011.913-.247m10.5 0a48.536 48.536 0 00-10.5 0m10.5 0V3.375c0-.621-.504-1.125-1.125-1.125h-8.25c-.621 0-1.125.504-1.125 1.125v3.659M18 10.5h.008v.008H18V10.5zm-3 0h.008v.008H15V10.5z" />
              </svg>
              Print Semua QR
            </button>
          )}
        </div>

        {loading ? (
          <div className="p-12 text-center">
            <div className="inline-block animate-spin rounded-full h-10 w-10 border-4 border-[#009846] border-t-transparent"></div>
            <p className="mt-3 text-slate-500 text-sm font-medium">Sedang memuat data...</p>
          </div>
        ) : assets.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-sm">
            <div className="mb-2 text-4xl">📦</div>
            <p>Belum ada data aset yang ditemukan.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs md:text-sm text-left border-collapse">
              {/* HEADER TABEL */}
              <thead className="bg-[#009846]/5 border-b border-[#009846]/10 text-[#007033] uppercase text-[11px] tracking-wider font-semibold">
                <tr>
                  <th className="p-4 whitespace-nowrap rounded-tl-lg">Nama & Kode</th>
                  <th className="p-4 whitespace-nowrap">Kategori</th>
                  <th className="p-4 whitespace-nowrap">Lokasi</th>
                  <th className="p-4 whitespace-nowrap">Kondisi</th>
                  <th className="p-4 whitespace-nowrap">Status</th>
                  <th className="p-4 whitespace-nowrap">Nilai Aset</th>
                  <th className="p-4 whitespace-nowrap text-center">Foto</th>
                  <th className="p-4 whitespace-nowrap text-right rounded-tr-lg w-32">Aksi</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100 bg-white">
                {assets.map((a) => (
                  <tr key={a.id} className="hover:bg-slate-50/80 transition-colors group">
                    {/* NAMA & KODE */}
                    <td className="p-4 align-top">
                      <div className="font-bold text-slate-800 text-sm mb-0.5">{a.name}</div>
                      <div className="font-mono text-[10px] text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded inline-block border border-slate-200">
                        {a.code}
                      </div>
                      <div className="mt-1 text-[10px] text-slate-400">
                        Sumber: {getFundingName(a.funding_source_id)}
                      </div>
                    </td>

                    {/* KATEGORI */}
                    <td className="p-4 align-top text-slate-600 font-medium">
                      {getCategoryName(a.category_id)}
                    </td>

                    {/* LOKASI & DETAIL */}
                    <td className="p-4 align-top">
                      <div className="text-slate-700 font-medium">{getLocationName(a.location_id)}</div>
                      <div className="text-[11px] text-slate-500 mt-0.5 max-w-[140px] truncate" title={a.location}>
                        {a.location || "-"}
                      </div>
                    </td>

                    {/* KONDISI */}
                    <td className="p-4 align-top">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-medium border ${
                        a.condition === 'baik' ? 'bg-green-50 text-green-700 border-green-100' :
                        a.condition === 'rusak' ? 'bg-red-50 text-red-700 border-red-100' :
                        'bg-gray-50 text-gray-600 border-gray-200'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
                           a.condition === 'baik' ? 'bg-green-500' :
                           a.condition === 'rusak' ? 'bg-red-500' :
                           'bg-gray-400'
                        }`}></span>
                        {a.condition ? a.condition.charAt(0).toUpperCase() + a.condition.slice(1) : "-"}
                      </span>
                    </td>

                    {/* STATUS */}
                    <td className="p-4 align-top">
                      {a.status === 'borrowed' ? (
                        <span className="inline-flex items-center px-2 py-0.5 text-[10px] font-medium text-orange-700 bg-orange-50 border border-orange-100 rounded-md">
                          Dipinjam
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 text-[10px] font-medium text-slate-600 bg-slate-50 border border-slate-100 rounded-md">
                          Tersedia
                        </span>
                      )}
                    </td>

                    {/* NILAI */}
                    <td className="p-4 align-top font-medium text-slate-700">
                      Rp {formatCurrency(a.value)}
                    </td>

                    {/* FOTO */}
                    <td className="p-4 align-top text-center">
                      <div className="relative group/photo w-10 h-10 mx-auto">
                        {a.photo_url ? (
                          <button
                            type="button"
                            onClick={() => onPreviewPhoto?.(`${API_BASE_URL}${a.photo_url}`)}
                            className="w-10 h-10 rounded-lg border border-slate-200 overflow-hidden hover:opacity-90 transition-opacity bg-slate-50 shadow-sm"
                          >
                            <img
                              src={`${API_BASE_URL}${a.photo_url}`}
                              alt={a.name}
                              className="w-full h-full object-cover"
                            />
                          </button>
                        ) : (
                          <div className="w-10 h-10 flex items-center justify-center border border-slate-200 rounded-lg text-[8px] text-gray-400 bg-slate-50">
                            No IMG
                          </div>
                        )}
                        
                        {/* Tombol Upload Mini (Muncul saat hover row) */}
                        <label className="absolute -bottom-2 -right-2 cursor-pointer bg-white rounded-full p-1 shadow-md border border-slate-100 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-orange-50" title="Upload Foto">
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="#F68D2E" className="w-3 h-3">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                          </svg>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => onUploadPhoto?.(a.id, e)}
                            className="hidden"
                          />
                        </label>
                      </div>
                    </td>

                    {/* AKSI */}
                    <td className="p-4 align-top text-right">
                      <div className="flex items-center justify-end gap-2">
                        {/* Primary Action Button */}
                        {a.status === "available" ? (
                          <button
                            onClick={() => onBorrow?.(a)}
                            className="px-3 py-1.5 text-[10px] font-semibold rounded-lg bg-[#009846] text-white hover:bg-[#007b3a] shadow-sm transition-all hover:shadow focus:ring-2 focus:ring-green-500/20"
                          >
                            Pinjam
                          </button>
                        ) : (
                          <button
                            onClick={() => onReturn?.(a)}
                            className="px-3 py-1.5 text-[10px] font-semibold rounded-lg bg-[#F68D2E] text-white hover:bg-[#e07b22] shadow-sm transition-all hover:shadow focus:ring-2 focus:ring-orange-500/20"
                          >
                            Kembalikan
                          </button>
                        )}

                        {/* Secondary Button: Detail */}
                        <button
                          onClick={() => onShowDetail?.(a)}
                          className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors border border-transparent hover:border-blue-100"
                          title="Detail Aset"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                        </button>

                        {/* More Menu */}
                        <div className="relative" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => setOpenMenuId(openMenuId === a.id ? null : a.id)}
                            className={`p-1.5 rounded-lg transition-colors border border-transparent ${openMenuId === a.id ? 'bg-slate-100 text-slate-800' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'}`}
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.75a.75.75 0 110-1.5.75.75 0 010 1.5zM12 12.75a.75.75 0 110-1.5.75.75 0 010 1.5zM12 18.75a.75.75 0 110-1.5.75.75 0 010 1.5z" />
                            </svg>
                          </button>

                          {/* Dropdown Menu */}
                          {openMenuId === a.id && (
                            <div className="absolute right-0 mt-2 w-40 bg-white rounded-xl shadow-xl border border-slate-100 z-50 overflow-hidden animate-fade-in-up origin-top-right ring-1 ring-black/5">
                              <div className="py-1">
                                <button
                                  onClick={() => { setOpenMenuId(null); handlePrintSingle(a); }}
                                  className="w-full text-left px-4 py-2.5 text-xs text-slate-600 hover:bg-slate-50 hover:text-[#009846] flex items-center gap-2"
                                >
                                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-3.5 h-3.5">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 013.75 9.375v-4.5zM3.75 14.625c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5a1.125 1.125 0 01-1.125-1.125v-4.5zM13.5 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 0113.5 9.375v-4.5z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 6.75h.75v.75h-.75v-.75zM6.75 16.5h.75v.75h-.75v-.75zM16.5 6.75h.75v.75h-.75v-.75zM13.5 13.5h.75v.75h-.75v-.75zM13.5 19.5h.75v.75h-.75v-.75zM19.5 13.5h.75v.75h-.75v-.75zM16.5 16.5h.75v.75h-.75v-.75z" />
                                  </svg>
                                  Print QR Code
                                </button>
                                <button
                                  onClick={() => { setOpenMenuId(null); onEdit?.(a); }}
                                  className="w-full text-left px-4 py-2.5 text-xs text-slate-600 hover:bg-slate-50 hover:text-blue-600 flex items-center gap-2"
                                >
                                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-3.5 h-3.5">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125" />
                                  </svg>
                                  Edit Data
                                </button>
                                <div className="h-px bg-slate-100 my-1"></div>
                                <button
                                  onClick={() => { setOpenMenuId(null); handleDeleteClick(a); }}
                                  className="w-full text-left px-4 py-2.5 text-xs text-red-600 hover:bg-red-50 flex items-center gap-2"
                                >
                                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-3.5 h-3.5">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                                  </svg>
                                  Hapus Aset
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 🔹 MODAL KONFIRMASI HAPUS (CUSTOM) 🔹 */}
      {deleteModal.open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in"
          onClick={() => setDeleteModal({ open: false, asset: null })}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden transform transition-all scale-100 border border-slate-100"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header Merah */}
            <div className="bg-red-50 p-6 flex flex-col items-center text-center gap-3 border-b border-red-50">
              <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center text-red-600 shadow-sm">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-7 h-7">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-800">Hapus Aset Ini?</h3>
                <p className="text-xs text-slate-500 mt-1 max-w-[200px] mx-auto">Tindakan ini akan memindahkan data ke sampah dan tidak bisa dibatalkan instan.</p>
              </div>
            </div>

            {/* Body */}
            <div className="p-5 text-sm text-slate-600 bg-white">
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 flex items-center gap-3">
                <div className="w-10 h-10 bg-white rounded border border-slate-100 flex items-center justify-center text-xl">
                  📦
                </div>
                <div className="overflow-hidden">
                  <div className="font-bold text-slate-800 truncate">{deleteModal.asset?.name}</div>
                  <div className="font-mono text-xs text-slate-500 truncate">{deleteModal.asset?.code}</div>
                </div>
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="flex gap-3 p-5 pt-0">
              <button
                type="button"
                onClick={() => setDeleteModal({ open: false, asset: null })}
                className="flex-1 px-4 py-2.5 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-red-600 border border-red-600 rounded-xl hover:bg-red-700 shadow-md shadow-red-200 transition-all flex items-center justify-center gap-2"
              >
                Ya, Hapus
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default AssetTable;