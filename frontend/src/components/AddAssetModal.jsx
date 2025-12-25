// src/components/AddAssetModal.jsx
import { useEffect, useMemo, useState } from "react";
import { API_BASE_URL, fetchBudgetCodes } from "../api";

function AddAssetModal({
  open,
  onClose,
  mode = "add",
  asset, 
  onCreateAsset,
  onSaveAsset,
  fundingSources,
  locations,
  categories,
}) {
  const isEdit = mode === "edit";
  
  // Pastikan kita punya variabel initialData yang merujuk ke asset
  const initialData = asset; 

  // State Form
  const [name, setName] = useState("");
  const [locationDetail, setLocationDetail] = useState("");
  const [condition, setCondition] = useState("baik");
  const [fundingSourceId, setFundingSourceId] = useState("");
  const [locationId, setLocationId] = useState("");
  const [value, setValue] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [budgetCodeId, setBudgetCodeId] = useState("");
  const [purchaseDate, setPurchaseDate] = useState("");
  const [notes, setNotes] = useState("");

  const [photoFile, setPhotoFile] = useState(null);
  const [receiptFile, setReceiptFile] = useState(null);

  // Helper untuk URL gambar/kwitansi existing
  const existingPhotoUrl = useMemo(() => {
    if (!isEdit || !initialData?.photo_url) return "";
    return initialData.photo_url.startsWith("http")
      ? initialData.photo_url
      : `${API_BASE_URL}${initialData.photo_url}`;
  }, [isEdit, initialData]);

  const existingReceiptUrl = useMemo(() => {
    if (!isEdit || !initialData?.receipt_url) return "";
    return initialData.receipt_url.startsWith("http")
      ? initialData.receipt_url
      : `${API_BASE_URL}${initialData.receipt_url}`;
  }, [isEdit, initialData]);

  const [budgetOptions, setBudgetOptions] = useState([]);
  const [error, setError] = useState("");

  // EFFECT 1: Reset Form atau Isi Data saat Modal Dibuka
  useEffect(() => {
    // Kalau modal tertutup, jangan lakukan apa-apa
    if (!open) return;

    setError("");
    setBudgetOptions([]);

    // LOGIKA PENTING:
    // Jika mode EDIT dan data 'asset' (initialData) ADA, maka isi form.
    if (isEdit && initialData) {
      console.log("Mengisi data form edit:", initialData); // Debugging di console

      setName(initialData.name || "");
      setLocationDetail(initialData.location || "");
      setCondition(initialData.condition || "baik");
      setFundingSourceId(initialData.funding_source_id ? String(initialData.funding_source_id) : "");
      setLocationId(initialData.location_id ? String(initialData.location_id) : "");
      setValue(initialData.value != null ? String(initialData.value) : "");
      setCategoryId(initialData.category_id ? String(initialData.category_id) : "");
      setBudgetCodeId(initialData.budget_code_id ? String(initialData.budget_code_id) : "");
      
      // Format tanggal agar masuk ke input type="date" (YYYY-MM-DD)
      let formattedDate = "";
      if (initialData.purchase_date) {
        const d = new Date(initialData.purchase_date);
        if (!isNaN(d.getTime())) {
            formattedDate = d.toISOString().split('T')[0];
        }
      }
      setPurchaseDate(formattedDate);
      
      setNotes(initialData.notes || "");
      setPhotoFile(null);
      setReceiptFile(null);
    } else {
      // Jika mode ADD atau data kosong, reset form jadi bersih
      console.log("Reset form (Mode Tambah)");
      setName("");
      setLocationDetail("");
      setCondition("baik");
      setFundingSourceId("");
      setLocationId("");
      setValue("");
      setCategoryId("");
      setBudgetCodeId("");
      setPurchaseDate("");
      setNotes("");
      setPhotoFile(null);
      setReceiptFile(null);
    }
  }, [open, isEdit, initialData]);

  // EFFECT 2: Load Kode Mata Anggaran saat Sumber Dana berubah
  useEffect(() => {
    const loadKma = async () => {
      if (!fundingSourceId) {
        setBudgetOptions([]);
        setBudgetCodeId("");
        return;
      }
      try {
        const data = await fetchBudgetCodes(fundingSourceId);
        setBudgetOptions(data);

        // Cek apakah budgetCodeId yg terpilih masih valid di list baru
        if (budgetCodeId && !data.some((b) => String(b.id) === String(budgetCodeId))) {
          setBudgetCodeId("");
        }
      } catch (err) {
        console.error(err);
      }
    };

    if (open) { // Hanya load kalau modal terbuka
        loadKma();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fundingSourceId]);

  if (!open) return null;

  const title = isEdit ? "Edit Aset" : "Tambah Aset Baru";

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!name) return setError("Nama aset wajib diisi");
    if (!fundingSourceId) return setError("Sumber dana wajib dipilih");
    if (!categoryId) return setError("Kategori aset wajib dipilih");

    if (!isEdit) {
      if (!purchaseDate) return setError("Tanggal pembelian wajib diisi");
      if (!photoFile) return setError("Foto aset wajib diupload");
      if (!receiptFile) return setError("Kwitansi pembelian wajib diupload");
    }

    const payload = {
      name,
      location: locationDetail,
      condition,
      funding_source_id: fundingSourceId,
      value: value ? Number(value) : null,
      location_id: locationId || null,
      category_id: categoryId,
      budget_code_id: budgetCodeId || null,
      notes,
      purchase_date: purchaseDate || null,
    };

    // Panggil fungsi create atau save tergantung mode
    let result;
    if (isEdit) {
        // Pastikan onSaveAsset dikirim dari parent
        if (onSaveAsset) {
            result = await onSaveAsset(initialData.id, payload, photoFile, receiptFile);
        } else {
            setError("Fungsi simpan (onSaveAsset) tidak ditemukan!");
            return;
        }
    } else {
        result = await onCreateAsset(payload, photoFile, receiptFile);
    }

    if (!result?.success) {
      setError(result?.message || "Gagal menyimpan aset");
      return;
    }

    onClose?.();
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoFile(file);
    e.target.value = "";
  };

  const handleReceiptChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setReceiptFile(file);
    e.target.value = "";
  };

  return (
    <div
      className="fixed inset-0 bg-black/60 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl w-full max-w-lg p-5 max-h-[90vh] overflow-y-auto shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-4 border-b pb-3">
          <div>
            <h2 className="text-lg font-bold text-slate-800">{title}</h2>
            {isEdit && (
              <p className="text-[11px] text-slate-500 mt-0.5">
                Mengedit data: <span className="font-semibold text-slate-700">{initialData?.name}</span> ({initialData?.code})
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-red-500 transition-colors"
          >
            ✕
          </button>
        </div>

        {error && <div className="text-xs text-red-600 mb-3 bg-red-50 p-2 rounded border border-red-100">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-4 text-sm">
          {/* NAMA */}
          <div>
            <label className="block mb-1 text-xs font-medium text-slate-700">Nama aset</label>
            <input
              className="border border-slate-300 rounded w-full px-3 py-2 focus:ring-1 focus:ring-[#009846] focus:border-[#009846] outline-none"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Contoh: Laptop Asus VivoBook"
            />
          </div>

          {/* GRID 1: Sumber Dana & Kategori */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block mb-1 text-xs font-medium text-slate-700">Sumber dana</label>
              <select
                className="border border-slate-300 rounded w-full px-3 py-2 text-sm focus:ring-1 focus:ring-[#009846] focus:border-[#009846] outline-none"
                value={fundingSourceId}
                onChange={(e) => setFundingSourceId(e.target.value)}
              >
                <option value="">Pilih...</option>
                {fundingSources.map((fs) => (
                  <option key={fs.id} value={fs.id}>
                    {fs.name} ({fs.code})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block mb-1 text-xs font-medium text-slate-700">Kategori aset</label>
              <select
                className="border border-slate-300 rounded w-full px-3 py-2 text-sm focus:ring-1 focus:ring-[#009846] focus:border-[#009846] outline-none"
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
              >
                <option value="">Pilih...</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* KMA */}
          <div>
            <label className="block mb-1 text-xs font-medium text-slate-700">
              Kode Mata Anggaran (opsional)
            </label>
            <select
              className="border border-slate-300 rounded w-full px-3 py-2 text-sm focus:ring-1 focus:ring-[#009846] focus:border-[#009846] outline-none disabled:bg-slate-100"
              value={budgetCodeId}
              onChange={(e) => setBudgetCodeId(e.target.value)}
              disabled={!fundingSourceId}
            >
              <option value="">
                {fundingSourceId ? "Pilih KMA..." : "Pilih sumber dana dulu"}
              </option>
              {budgetOptions.map((kma) => (
                <option key={kma.id} value={kma.id}>
                  {kma.code} - {kma.name}
                </option>
              ))}
            </select>
          </div>

          {/* GRID 2: Lokasi */}
          <div className="grid grid-cols-2 gap-3">
            <div>
                <label className="block mb-1 text-xs font-medium text-slate-700">Lokasi utama</label>
                <select
                className="border border-slate-300 rounded w-full px-3 py-2 text-sm focus:ring-1 focus:ring-[#009846] focus:border-[#009846] outline-none"
                value={locationId}
                onChange={(e) => setLocationId(e.target.value)}
                >
                <option value="">Pilih lokasi...</option>
                {locations.map((loc) => (
                    <option key={loc.id} value={loc.id}>
                    {loc.name}
                    </option>
                ))}
                </select>
            </div>
            <div>
                <label className="block mb-1 text-xs font-medium text-slate-700">Detail lokasi</label>
                <input
                className="border border-slate-300 rounded w-full px-3 py-2 focus:ring-1 focus:ring-[#009846] focus:border-[#009846] outline-none"
                value={locationDetail}
                placeholder="Ex: Rak B2"
                onChange={(e) => setLocationDetail(e.target.value)}
                />
            </div>
          </div>

          {/* GRID 3: Kondisi & Tanggal */}
          <div className="grid grid-cols-2 gap-3">
             <div>
                <label className="block mb-1 text-xs font-medium text-slate-700">Kondisi aset</label>
                <select
                className="border border-slate-300 rounded w-full px-3 py-2 text-sm focus:ring-1 focus:ring-[#009846] focus:border-[#009846] outline-none"
                value={condition}
                onChange={(e) => setCondition(e.target.value)}
                >
                <option value="baik">Baik</option>
                <option value="cukup">Cukup</option>
                <option value="rusak">Rusak</option>
                <option value="maintenance">Maintenance</option>
                <option value="hilang">Hilang</option>
                </select>
            </div>
             <div>
                <label className="block mb-1 text-xs font-medium text-slate-700">
                Tgl pembelian {isEdit ? "(opsional)" : ""}
                </label>
                <input
                type="date"
                className="border border-slate-300 rounded w-full px-3 py-2 focus:ring-1 focus:ring-[#009846] focus:border-[#009846] outline-none"
                value={purchaseDate}
                onChange={(e) => setPurchaseDate(e.target.value)}
                />
            </div>
          </div>

          {/* NILAI */}
          <div>
            <label className="block mb-1 text-xs font-medium text-slate-700">Nilai aset (Rp)</label>
            <input
              type="number"
              min="0"
              className="border border-slate-300 rounded w-full px-3 py-2 text-sm focus:ring-1 focus:ring-[#009846] focus:border-[#009846] outline-none"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder="0"
            />
          </div>

          {/* CATATAN */}
          <div>
            <label className="block mb-1 text-xs font-medium text-slate-700">Catatan / Spesifikasi</label>
            <textarea
              className="border border-slate-300 rounded w-full px-3 py-2 text-sm focus:ring-1 focus:ring-[#009846] focus:border-[#009846] outline-none"
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Spesifikasi barang..."
            />
          </div>

          {/* UPLOAD AREA */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {/* Foto */}
            <div>
              <p className="block mb-1 text-xs font-medium text-slate-700">
                Foto aset {!isEdit && <span className="text-red-500">*</span>}
              </p>
              <label className="flex flex-col items-center justify-center border-2 border-dashed border-slate-300 rounded-lg h-24 cursor-pointer hover:border-[#009846] hover:bg-green-50 transition-colors">
                {photoFile ? (
                    <span className="text-xs font-semibold text-[#009846]">{photoFile.name}</span>
                ) : existingPhotoUrl ? (
                    <div className="text-center">
                        <span className="text-xs text-slate-500">Ganti foto?</span>
                        <br/>
                        <a href={existingPhotoUrl} target="_blank" className="text-[10px] text-[#009846] underline" onClick={e=>e.stopPropagation()}>Lihat yg lama</a>
                    </div>
                ) : (
                    <>
                        <span className="text-2xl text-slate-300">📷</span>
                        <span className="text-[10px] text-slate-500 mt-1">Pilih Foto</span>
                    </>
                )}
                <input type="file" accept="image/*" onChange={handlePhotoChange} className="hidden" />
              </label>
            </div>

            {/* Kwitansi */}
            <div>
              <p className="block mb-1 text-xs font-medium text-slate-700">
                Kwitansi {!isEdit && <span className="text-red-500">*</span>}
              </p>
              <label className="flex flex-col items-center justify-center border-2 border-dashed border-slate-300 rounded-lg h-24 cursor-pointer hover:border-[#F68D2E] hover:bg-orange-50 transition-colors">
                 {receiptFile ? (
                    <span className="text-xs font-semibold text-[#F68D2E]">{receiptFile.name}</span>
                ) : existingReceiptUrl ? (
                    <div className="text-center">
                        <span className="text-xs text-slate-500">Ganti kwitansi?</span>
                        <br/>
                        <a href={existingReceiptUrl} target="_blank" className="text-[10px] text-[#F68D2E] underline" onClick={e=>e.stopPropagation()}>Lihat yg lama</a>
                    </div>
                ) : (
                    <>
                        <span className="text-2xl text-slate-300">📄</span>
                        <span className="text-[10px] text-slate-500 mt-1">Upload Kwitansi</span>
                    </>
                )}
                <input type="file" accept="image/*,application/pdf" onChange={handleReceiptChange} className="hidden" />
              </label>
            </div>
          </div>

          {/* TOMBOL AKSI */}
          <div className="flex justify-end gap-3 pt-4 border-t mt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium border border-slate-300 rounded text-slate-700 hover:bg-slate-50"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-medium rounded bg-[#009846] text-white hover:bg-[#007033] shadow-md transition-all"
            >
              {isEdit ? "Simpan Perubahan" : "Simpan Aset"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AddAssetModal;