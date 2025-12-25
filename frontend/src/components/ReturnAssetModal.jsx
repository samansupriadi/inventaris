// src/components/ReturnAssetModal.jsx
import { useEffect, useRef, useState } from "react";

function ReturnAssetModal({ 
  open, 
  asset, 
  locations = [], 
  loading, 
  onClose, 
  onSubmit 
}) {
  const [conditionAfter, setConditionAfter] = useState("baik");
  const [returnLocationId, setReturnLocationId] = useState("");
  const [returnDetailLocation, setReturnDetailLocation] = useState("");
  const [notesReturn, setNotesReturn] = useState("");
  const [updateAssetLocation, setUpdateAssetLocation] = useState(true);
  const [photo, setPhoto] = useState(null);
  const [error, setError] = useState("");

  const modalRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (open) {
      setConditionAfter("baik");
      // Default kosongkan lokasi agar user memilih
      setReturnLocationId(""); 
      setReturnDetailLocation("");
      setNotesReturn("");
      setUpdateAssetLocation(true);
      setPhoto(null);
      setError("");
    }
  }, [open, asset]);

  // Handle klik luar modal
  const handleBackdropMouseDown = (e) => {
    if (modalRef.current && !modalRef.current.contains(e.target)) onClose?.();
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files?.[0];
    if (file) setPhoto(file);
  };

  const handleSubmit = () => {
    setError("");

    if (updateAssetLocation && !returnLocationId) {
        setError("Harap pilih Lokasi Penyimpanan Baru.");
        return;
    }

    onSubmit?.({
      condition_after: conditionAfter,
      return_location_id: returnLocationId,
      return_detail_location: returnDetailLocation,
      notes_return: notesReturn,
      update_asset_location: updateAssetLocation,
      photo,
    });
  };

  if (!open || !asset) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in"
      onMouseDown={handleBackdropMouseDown}
    >
      <div
        ref={modalRef}
        className="bg-white w-full max-w-lg rounded-xl shadow-2xl flex flex-col max-h-[90vh]"
      >
        {/* HEADER */}
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-start bg-slate-50/50 rounded-t-xl">
          <div>
            <h2 className="text-lg font-bold text-slate-800">Pengembalian Aset</h2>
            <div className="text-sm text-[#009846] font-medium mt-0.5">
              {asset.name} <span className="text-slate-400 font-normal">({asset.code})</span>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-red-500 transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* BODY */}
        <div className="p-6 overflow-y-auto space-y-5">
            {error && (
                <div className="bg-red-50 border border-red-100 text-red-600 text-xs p-3 rounded-lg flex items-center gap-2">
                    <span className="font-bold">!</span> {error}
                </div>
            )}

            {/* KONDISI SETELAH KEMBALI */}
            <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Kondisi Saat Dikembalikan
                </label>
                <select
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#009846] focus:border-[#009846] outline-none bg-white transition-all"
                    value={conditionAfter}
                    onChange={(e) => setConditionAfter(e.target.value)}
                >
                    <option value="baik">Baik</option>
                    <option value="cukup">Cukup</option>
                    <option value="rusak">Rusak</option>
                    <option value="maintenance">Maintenance</option>
                    <option value="hilang">Hilang</option>
                </select>
            </div>

            <div className="h-px bg-slate-100 my-2"></div>

            {/* CHECKBOX UPDATE LOKASI */}
            <div className="bg-blue-50/50 p-3 rounded-lg border border-blue-100">
                <label className="flex items-center gap-3 cursor-pointer">
                    <input
                        type="checkbox"
                        className="w-4 h-4 text-[#009846] border-slate-300 rounded focus:ring-[#009846]"
                        checked={updateAssetLocation}
                        onChange={(e) => setUpdateAssetLocation(e.target.checked)}
                    />
                    <div>
                        <span className="block text-sm font-semibold text-slate-700">Update Lokasi Aset</span>
                        <span className="block text-xs text-slate-500">Pindahkan aset ke lokasi baru setelah dikembalikan.</span>
                    </div>
                </label>

                {/* FORM LOKASI (Animasi muncul) */}
                {updateAssetLocation && (
                    <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3 animate-fade-in-up">
                        <div>
                            <label className="block text-xs font-medium text-slate-700 mb-1">
                                Lokasi Penyimpanan <span className="text-red-500">*</span>
                            </label>
                            <select
                                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#009846] focus:border-[#009846] outline-none bg-white"
                                value={returnLocationId}
                                onChange={(e) => setReturnLocationId(e.target.value)}
                            >
                                <option value="">-- Pilih Lokasi --</option>
                                {locations.map((loc) => (
                                    <option key={loc.id} value={loc.id}>
                                        {loc.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-slate-700 mb-1">
                                Detail Lokasi (Rak/Meja)
                            </label>
                            <input
                                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#009846] focus:border-[#009846] outline-none"
                                placeholder="Contoh: Lemari A3"
                                value={returnDetailLocation}
                                onChange={(e) => setReturnDetailLocation(e.target.value)}
                            />
                        </div>
                    </div>
                )}
            </div>

            {/* CATATAN */}
            <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Catatan Pengembalian</label>
                <textarea
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#009846] focus:border-[#009846] outline-none transition-all"
                    rows={2}
                    placeholder="Tulis catatan kondisi barang atau keterangan lain..."
                    value={notesReturn}
                    onChange={(e) => setNotesReturn(e.target.value)}
                />
            </div>

            {/* UPLOAD FOTO */}
            <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Foto Bukti Pengembalian (Opsional)
                </label>
                <label className="flex flex-col items-center justify-center border-2 border-dashed border-slate-300 rounded-lg h-24 cursor-pointer hover:border-[#009846] hover:bg-green-50 transition-colors group bg-slate-50">
                    {photo ? (
                        <div className="flex flex-col items-center w-full px-2">
                            <span className="text-xs font-semibold text-[#009846] truncate w-full text-center">
                                {photo.name}
                            </span>
                            <span className="text-[10px] text-slate-400">
                                {(photo.size / 1024).toFixed(0)} KB
                            </span>
                            <button 
                                onClick={(e) => { e.preventDefault(); setPhoto(null); }}
                                className="mt-1 text-[10px] text-red-500 hover:underline"
                            >
                                Hapus Foto
                            </button>
                        </div>
                    ) : (
                        <>
                            <div className="text-lg text-slate-300 group-hover:text-[#009846] mb-1">📷</div>
                            <span className="text-[10px] text-slate-500">Klik untuk upload foto</span>
                        </>
                    )}
                    <input type="file" accept="image/*" onChange={handlePhotoChange} className="hidden" />
                </label>
            </div>
        </div>

        {/* FOOTER */}
        <div className="px-6 py-4 border-t border-slate-100 flex justify-end gap-3 bg-slate-50 rounded-b-xl">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-300 rounded-lg hover:bg-slate-100 transition-all"
            disabled={loading}
          >
            Batal
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="px-4 py-2 text-sm font-medium text-white bg-[#009846] rounded-lg hover:bg-[#007033] shadow-md transition-all flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {loading ? "Memproses..." : "Simpan Pengembalian"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ReturnAssetModal;