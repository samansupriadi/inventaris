// src/components/BorrowAssetModal.jsx
import { useEffect, useMemo, useRef, useState } from "react";

function useDebouncedValue(value, delay = 250) {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);

  return debounced;
}

function BorrowAssetModal({
  open,
  asset,
  users = [],
  locations = [],
  loading,
  onClose,
  onSubmit,
}) {
  const [selectedUser, setSelectedUser] = useState(null);
  
  // Search User
  const [userQuery, setUserQuery] = useState("");
  const debouncedQuery = useDebouncedValue(userQuery, 250);
  const [showUserList, setShowUserList] = useState(false);

  // Form Fields
  const [locationId, setLocationId] = useState("");
  const [detailLocation, setDetailLocation] = useState(""); // ✅ NEW: Detail Lokasi
  const [notes, setNotes] = useState("");                   // ✅ NEW: Catatan
  const [dueDate, setDueDate] = useState("");
  const [conditionNow, setConditionNow] = useState("baik");
  const [photo, setPhoto] = useState(null);
  const [error, setError] = useState("");

  const modalRef = useRef(null);
  const userBoxRef = useRef(null);

  // Reset form
  useEffect(() => {
    if (!open) return;
    setSelectedUser(null);
    setUserQuery("");
    setShowUserList(false);
    setLocationId("");
    setDetailLocation(""); // Reset
    setNotes("");          // Reset
    
    // Default Tanggal: 20 Desember Tahun Ini
    const currentYear = new Date().getFullYear();
    setDueDate(`${currentYear}-12-20`); 

    setConditionNow("baik");
    setPhoto(null);
    setError("");
  }, [open]);

  // Close handlers
  const handleBackdropMouseDown = (e) => {
    if (modalRef.current && !modalRef.current.contains(e.target)) onClose?.();
  };

  useEffect(() => {
    if (!open) return;
    const onDocMouseDown = (e) => {
      if (userBoxRef.current && !userBoxRef.current.contains(e.target)) setShowUserList(false);
    };
    document.addEventListener("mousedown", onDocMouseDown);
    return () => document.removeEventListener("mousedown", onDocMouseDown);
  }, [open]);

  // Filter User
  const filteredUsers = useMemo(() => {
    const q = (debouncedQuery || "").trim().toLowerCase();
    if (!q) return users.slice(0, 30);
    return users.filter((u) => {
      return (u.name || "").toLowerCase().includes(q) || (u.email || "").toLowerCase().includes(q);
    }).slice(0, 30);
  }, [users, debouncedQuery]);

  const handlePickUser = (u) => {
    setSelectedUser(u);
    setUserQuery(`${u.name} (${u.email})`);
    setShowUserList(false);
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files?.[0];
    if (file) setPhoto(file);
  };

  const handleSubmit = () => {
    setError("");
    if (!selectedUser) return setError("Peminjam wajib dipilih");
    if (!locationId) return setError("Lokasi penggunaan wajib dipilih");

    onSubmit?.({
      borrower_user_id: selectedUser.id,
      usage_location_id: locationId,
      detail_location: detailLocation, // Kirim ke App.jsx
      notes: notes,                    // Kirim ke App.jsx
      due_date: dueDate || null,
      condition_now: conditionNow,
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
        <div className="px-5 py-4 border-b border-slate-100 flex justify-between items-start bg-slate-50/50">
          <div>
            <h2 className="text-lg font-bold text-slate-800">Pinjam Aset</h2>
            <div className="text-sm text-[#009846] font-medium mt-0.5">
              {asset.name} <span className="text-slate-400 font-normal">({asset.code})</span>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-red-500 transition-colors">✕</button>
        </div>

        {/* BODY */}
        <div className="p-5 overflow-y-auto space-y-4">
          
          {error && (
            <div className="bg-red-50 border border-red-100 text-red-600 text-xs p-3 rounded-lg flex items-center gap-2">
              <span className="font-bold">!</span> {error}
            </div>
          )}

          {/* USER SEARCH */}
          <div ref={userBoxRef} className="relative">
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Peminjam (User) <span className="text-red-500">*</span>
            </label>
            <input
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#009846] focus:border-[#009846] outline-none transition-all"
              placeholder="Cari nama atau email..."
              value={userQuery}
              onChange={(e) => {
                setSelectedUser(null);
                setUserQuery(e.target.value);
                setShowUserList(true);
              }}
              onFocus={() => setShowUserList(true)}
            />
            {userQuery && (
              <button
                onClick={() => { setSelectedUser(null); setUserQuery(""); setShowUserList(true); }}
                className="absolute right-3 top-8 text-slate-400 hover:text-slate-600"
              >✕</button>
            )}
            {showUserList && (!selectedUser || userQuery) && (
              <div className="absolute left-0 right-0 z-20 mt-1 border border-slate-200 rounded-lg bg-white shadow-lg max-h-48 overflow-y-auto">
                {filteredUsers.length > 0 ? (
                  filteredUsers.map((u) => (
                    <button
                      key={u.id}
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => handlePickUser(u)}
                      className="w-full text-left px-3 py-2 hover:bg-slate-50 text-sm border-b border-slate-50 last:border-0"
                    >
                      <div className="font-medium text-slate-800">{u.name}</div>
                      <div className="text-xs text-slate-500">{u.email}</div>
                    </button>
                  ))
                ) : (
                  <div className="px-3 py-2 text-xs text-slate-400 italic">User tidak ditemukan.</div>
                )}
              </div>
            )}
          </div>

          {/* GRID: LOKASI & DETAIL LOKASI */}
          <div className="grid grid-cols-2 gap-3">
            <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                Lokasi Penggunaan <span className="text-red-500">*</span>
                </label>
                <select
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#009846] focus:border-[#009846] outline-none transition-all bg-white"
                value={locationId}
                onChange={(e) => setLocationId(e.target.value)}
                >
                <option value="">Pilih Lokasi...</option>
                {locations.map((l) => (
                    <option key={l.id} value={l.id}>{l.name}</option>
                ))}
                </select>
            </div>
            <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Detail Lokasi</label>
                <input
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#009846] focus:border-[#009846] outline-none"
                placeholder="Ex: Meja Staff IT"
                value={detailLocation}
                onChange={(e) => setDetailLocation(e.target.value)}
                />
            </div>
          </div>

          {/* GRID: JATUH TEMPO & KONDISI */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Jatuh Tempo</label>
              <input
                type="date"
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#009846] focus:border-[#009846] outline-none"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
              <p className="text-[10px] text-slate-400 mt-1">Default: 20 Des</p>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Kondisi Awal</label>
              <select
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#009846] focus:border-[#009846] outline-none bg-white"
                value={conditionNow}
                onChange={(e) => setConditionNow(e.target.value)}
              >
                <option value="">Semua kondisi</option>
                <option value="baik">Baik</option>
                <option value="cukup">Cukup</option>
                <option value="rusak">Rusak</option>
                <option value="maintenance">Maintenance</option>
                <option value="hilang">Hilang</option>
              </select>
            </div>
          </div>

          {/* CATATAN */}
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Catatan Peminjaman</label>
            <textarea
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#009846] focus:border-[#009846] outline-none"
                rows={2}
                placeholder="Tujuan peminjaman atau catatan khusus..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          {/* UPLOAD FOTO */}
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Foto Bukti Serah Terima (Opsional)
            </label>
            
            <label className="flex flex-col items-center justify-center border-2 border-dashed border-slate-300 rounded-lg h-24 cursor-pointer hover:border-[#009846] hover:bg-green-50 transition-colors group">
              {photo ? (
                <div className="flex flex-col items-center w-full px-2">
                  <span className="text-xs font-semibold text-[#009846] truncate w-full text-center">
                    {photo.name}
                  </span>
                  <span className="text-[10px] text-slate-400">
                    {(photo.size / 1024).toFixed(0)} KB
                  </span>
                  <button onClick={(e) => { e.preventDefault(); setPhoto(null); }} className="mt-1 text-[10px] text-red-500 hover:underline">Hapus</button>
                </div>
              ) : (
                <>
                  <div className="text-lg text-slate-300 group-hover:text-[#009846]">📷</div>
                  <span className="text-[10px] text-slate-500 mt-1">Klik untuk upload foto</span>
                </>
              )}
              <input type="file" accept="image/*" onChange={handlePhotoChange} className="hidden" />
            </label>
          </div>

        </div>

        {/* FOOTER */}
        <div className="px-5 py-4 border-t border-slate-100 flex justify-end gap-3 bg-slate-50">
          <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-300 rounded-lg hover:bg-slate-100 transition-all" disabled={loading}>Batal</button>
          <button onClick={handleSubmit} disabled={loading} className="px-4 py-2 text-sm font-medium text-white bg-[#009846] rounded-lg hover:bg-[#007033] shadow-md transition-all flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed">
            {loading ? "Memproses..." : "Konfirmasi Pinjam"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default BorrowAssetModal;