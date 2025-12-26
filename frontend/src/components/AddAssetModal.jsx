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
  const initialData = asset; 

  // State Form
  const [name, setName] = useState("");
  const [locationDetail, setLocationDetail] = useState("");
  const [condition, setCondition] = useState("baik");
  const [fundingSourceId, setFundingSourceId] = useState("");
  const [locationId, setLocationId] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [budgetCodeId, setBudgetCodeId] = useState("");
  const [purchaseDate, setPurchaseDate] = useState("");
  const [notes, setNotes] = useState("");

  // State Financials
  const [value, setValue] = useState("");
  const [usefulLife, setUsefulLife] = useState("");
  const [residualValue, setResidualValue] = useState("");

  // Files & Previews
  const [photoFile, setPhotoFile] = useState(null);
  const [receiptFile, setReceiptFile] = useState(null);
  const [previewPhoto, setPreviewPhoto] = useState(null);

  // UI States
  const [budgetOptions, setBudgetOptions] = useState([]);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Helper: URL Gambar Existing
  const existingPhotoUrl = useMemo(() => {
    if (!isEdit || !initialData?.photo_url) return null;
    return initialData.photo_url.startsWith("http") ? initialData.photo_url : `${API_BASE_URL}${initialData.photo_url}`;
  }, [isEdit, initialData]);

  const existingReceiptUrl = useMemo(() => {
    if (!isEdit || !initialData?.receipt_url) return null;
    return initialData.receipt_url.startsWith("http") ? initialData.receipt_url : `${API_BASE_URL}${initialData.receipt_url}`;
  }, [isEdit, initialData]);

  // LOGIC AUTO-FILL Kategori
  const handleCategoryChange = (e) => {
    const selectedId = e.target.value;
    setCategoryId(selectedId);
    
    // Cari data kategori lengkap
    const selectedCat = categories.find(c => String(c.id) === String(selectedId));
    
    if (selectedCat) {
       // Cek apakah kategori ini disusutkan?
       if (selectedCat.is_depreciable === false) {
          // Jika TIDAK disusutkan (Tanah), paksa 0
          setUsefulLife("0");
       } else if (selectedCat.useful_life) {
          // Jika disusutkan, ambil defaultnya
          setUsefulLife(selectedCat.useful_life);
       }
    }
  }

  // EFFECT: Reset Form
  useEffect(() => {
    if (!open) return;
    setError("");
    setIsSubmitting(false);
    setBudgetOptions([]);
    setPreviewPhoto(null);

    if (isEdit && initialData) {
      setName(initialData.name || "");
      setLocationDetail(initialData.location || "");
      setCondition(initialData.condition || "baik");
      setFundingSourceId(initialData.funding_source_id ? String(initialData.funding_source_id) : "");
      setLocationId(initialData.location_id ? String(initialData.location_id) : "");
      setCategoryId(initialData.category_id ? String(initialData.category_id) : "");
      setBudgetCodeId(initialData.budget_code_id ? String(initialData.budget_code_id) : "");
      
      setValue(initialData.value != null ? String(initialData.value) : "");
      setUsefulLife(initialData.useful_life != null ? String(initialData.useful_life) : ""); 
      setResidualValue(initialData.residual_value != null ? String(initialData.residual_value) : "");

      if (initialData.purchase_date) {
        const d = new Date(initialData.purchase_date);
        if (!isNaN(d.getTime())) setPurchaseDate(d.toISOString().split('T')[0]);
      } else {
        setPurchaseDate("");
      }
      
      setNotes(initialData.notes || "");
      setPhotoFile(null);
      setReceiptFile(null);
    } else {
      // Reset All
      setName(""); setLocationDetail(""); setCondition("baik"); setFundingSourceId(""); 
      setLocationId(""); setCategoryId(""); setBudgetCodeId(""); setValue(""); 
      setUsefulLife(""); setResidualValue(""); setPurchaseDate(""); setNotes("");
      setPhotoFile(null); setReceiptFile(null);
    }
  }, [open, isEdit, initialData]);

  // EFFECT: Load Budget Codes
  useEffect(() => {
    const loadKma = async () => {
      if (!fundingSourceId) {
        setBudgetOptions([]); return;
      }
      try {
        const data = await fetchBudgetCodes(fundingSourceId);
        setBudgetOptions(data);
        if (budgetCodeId && !data.some((b) => String(b.id) === String(budgetCodeId))) {
          setBudgetCodeId("");
        }
      } catch (err) { console.error(err); }
    };
    if (open) loadKma();
  }, [fundingSourceId]); // eslint-disable-line

  const handlePhotoChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setPhotoFile(file);
      setPreviewPhoto(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);

    // Client-Side Validation
    if (!name.trim()) { setError("Nama aset wajib diisi"); setIsSubmitting(false); return; }
    if (!fundingSourceId) { setError("Sumber dana wajib dipilih"); setIsSubmitting(false); return; }
    if (!categoryId) { setError("Kategori aset wajib dipilih"); setIsSubmitting(false); return; }
    if (!isEdit && !purchaseDate) { setError("Tanggal pembelian wajib diisi"); setIsSubmitting(false); return; }
    if (!isEdit && !photoFile) { setError("Foto aset wajib diupload"); setIsSubmitting(false); return; }
    // Receipt boleh opsional tergantung kebijakan, tapi di sini kita buat wajib jika add new
    if (!isEdit && !receiptFile) { setError("Kwitansi wajib diupload"); setIsSubmitting(false); return; }

    const payload = {
      name, location: locationDetail, condition, 
      funding_source_id: fundingSourceId, location_id: locationId || null, 
      category_id: categoryId, budget_code_id: budgetCodeId || null, 
      notes, purchase_date: purchaseDate || null,
      value: value ? Number(value) : 0,
      useful_life: usefulLife ? Number(usefulLife) : 0,
      residual_value: residualValue ? Number(residualValue) : 0,
    };

    let result;
    try {
      if (isEdit) {
          if (onSaveAsset) result = await onSaveAsset(initialData.id, payload, photoFile, receiptFile);
      } else {
          result = await onCreateAsset(payload, photoFile, receiptFile);
      }

      if (!result?.success) throw new Error(result?.message || "Gagal menyimpan aset");
      onClose?.();
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in" onClick={onClose}>
      <div 
        className="bg-white rounded-2xl w-full max-w-3xl flex flex-col max-h-[90vh] shadow-2xl border border-slate-200" 
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* === HEADER === */}
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 rounded-t-2xl">
          <div>
            <h2 className="text-lg font-bold text-slate-800">{isEdit ? "Edit Aset" : "Tambah Aset Baru"}</h2>
            <p className="text-xs text-slate-500 mt-0.5">Lengkapi form di bawah untuk inventarisasi.</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full bg-white border border-slate-200 text-slate-400 hover:text-red-500 hover:border-red-200 transition-colors">✕</button>
        </div>

        {/* === BODY SCROLLABLE === */}
        <div className="overflow-y-auto p-6 custom-scrollbar">
          {error && (
            <div className="mb-5 bg-red-50 border border-red-100 text-red-600 px-4 py-3 rounded-lg text-sm flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* SECTION 1: IDENTITAS (GRID 2 KOLOM) */}
            <div>
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                <span className="bg-slate-100 p-1 rounded">📝</span> Identitas Aset
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">Nama Aset <span className="text-red-500">*</span></label>
                  <input className="input-field w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-[#009846] focus:border-[#009846] outline-none" value={name} onChange={(e) => setName(e.target.value)} placeholder="Contoh: Laptop Asus VivoBook Pro 14" autoFocus />
                </div>
                
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">Sumber Dana <span className="text-red-500">*</span></label>
                  <select className="input-field w-full bg-white border border-slate-300 rounded-lg px-3 py-2.5 text-sm" value={fundingSourceId} onChange={(e) => setFundingSourceId(e.target.value)}>
                    <option value="">-- Pilih Sumber Dana --</option>
                    {fundingSources.map((fs) => <option key={fs.id} value={fs.id}>{fs.name} ({fs.code})</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">Kategori <span className="text-red-500">*</span></label>
                  <select className="input-field w-full bg-white border border-slate-300 rounded-lg px-3 py-2.5 text-sm" value={categoryId} onChange={handleCategoryChange}>
                    <option value="">-- Pilih Kategori --</option>
                    {categories.map((cat) => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">Kode Mata Anggaran (Opsional)</label>
                  <select className="input-field w-full bg-white border border-slate-300 rounded-lg px-3 py-2.5 text-sm disabled:bg-slate-50 disabled:text-slate-400" value={budgetCodeId} onChange={(e) => setBudgetCodeId(e.target.value)} disabled={!fundingSourceId}>
                    <option value="">{fundingSourceId ? "-- Pilih KMA --" : "Pilih sumber dana terlebih dahulu"}</option>
                    {budgetOptions.map((kma) => <option key={kma.id} value={kma.id}>{kma.code} - {kma.name}</option>)}
                  </select>
                </div>
              </div>
            </div>

            {/* SECTION 2: FINANCIAL (HIGHLIGHTED BOX) */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1 h-full bg-[#009846]"></div>
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                💰 Informasi Nilai & Penyusutan
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                   <label className="block text-xs font-semibold text-slate-600 mb-1.5">Harga Perolehan (Rp)</label>
                   <input type="number" min="0" className="input-field w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm" value={value} onChange={(e) => setValue(e.target.value)} placeholder="0" />
                </div>

                <div className="relative">
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">Umur Ekonomis</label>
                  <input 
                    type="number" 
                    min="0" 
                    className="input-field w-full border-yellow-400 bg-yellow-50 focus:ring-yellow-500 disabled:bg-slate-100 disabled:border-slate-300 disabled:text-slate-400" 
                    value={usefulLife} 
                    onChange={(e) => setUsefulLife(e.target.value)} 
                    placeholder="Auto"
                    // === FITUR KUNCI: DISABLE JIKA TANAH ===
                    disabled={categories.find(c => String(c.id) === String(categoryId))?.is_depreciable === false}
                  />
                  <span className="absolute right-3 top-8 text-[10px] text-slate-400 font-bold">TAHUN</span>
                </div>

                <div>
                   <label className="block text-xs font-semibold text-slate-600 mb-1.5">Nilai Sisa (Residu)</label>
                   <input type="number" min="0" className="input-field w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm" value={residualValue} onChange={(e) => setResidualValue(e.target.value)} placeholder="0" />
                </div>
              </div>
            </div>

            {/* SECTION 3: LOKASI & FISIK */}
            <div>
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                <span className="bg-slate-100 p-1 rounded">📍</span> Lokasi & Kondisi
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <div>
                   <label className="block text-xs font-semibold text-slate-700 mb-1.5">Lokasi Utama</label>
                   <select className="input-field w-full bg-white border border-slate-300 rounded-lg px-3 py-2.5 text-sm" value={locationId} onChange={(e) => setLocationId(e.target.value)}>
                     <option value="">-- Pilih Lokasi --</option>
                     {locations.map((loc) => <option key={loc.id} value={loc.id}>{loc.name}</option>)}
                   </select>
                 </div>
                 <div>
                   <label className="block text-xs font-semibold text-slate-700 mb-1.5">Tanggal Pembelian</label>
                   <input type="date" className="input-field w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm" value={purchaseDate} onChange={(e) => setPurchaseDate(e.target.value)} />
                 </div>
                 <div>
                   <label className="block text-xs font-semibold text-slate-700 mb-1.5">Detail Lokasi</label>
                   <input className="input-field w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm" value={locationDetail} onChange={(e) => setLocationDetail(e.target.value)} placeholder="Contoh: Rak B2, Meja Staff IT" />
                 </div>
                 <div>
                   <label className="block text-xs font-semibold text-slate-700 mb-1.5">Kondisi Saat Ini</label>
                   <select className="input-field w-full bg-white border border-slate-300 rounded-lg px-3 py-2.5 text-sm" value={condition} onChange={(e) => setCondition(e.target.value)}>
                     <option value="baik">Baik</option>
                     <option value="cukup">Cukup</option>
                     <option value="rusak">Rusak</option>
                     <option value="maintenance">Maintenance</option>
                     <option value="hilang">Hilang</option>
                   </select>
                 </div>
                 <div className="md:col-span-2">
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">Catatan / Spesifikasi</label>
                    <textarea className="input-field w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm resize-none" rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Contoh: Serial Number: 123ABC, Warna: Hitam..." />
                 </div>
              </div>
            </div>

            {/* SECTION 4: MEDIA UPLOAD (DASHED BOXES) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              {/* Foto Aset */}
              <div>
                 <p className="mb-2 text-xs font-semibold text-slate-700 flex justify-between">
                    <span>Foto Aset { !isEdit && <span className="text-red-500">*</span> }</span>
                    {previewPhoto && <span className="text-[10px] text-[#009846]">Preview Ready</span>}
                 </p>
                 <label className={`flex flex-col items-center justify-center border-2 border-dashed rounded-xl h-32 cursor-pointer transition-all ${photoFile ? 'border-[#009846] bg-green-50' : 'border-slate-300 hover:border-[#009846] hover:bg-slate-50'}`}>
                   {previewPhoto ? (
                      <img src={previewPhoto} alt="Preview" className="h-28 object-contain rounded p-1" />
                   ) : existingPhotoUrl ? (
                      <div className="text-center">
                         <img src={existingPhotoUrl} alt="Old" className="h-20 object-contain mx-auto mb-1 opacity-50" />
                         <span className="text-[10px] text-slate-500 bg-white px-2 py-1 rounded shadow-sm border">Klik untuk ganti</span>
                      </div>
                   ) : (
                      <>
                        <span className="text-2xl mb-1">📷</span>
                        <span className="text-xs text-slate-500 font-medium">Klik untuk upload foto</span>
                        <span className="text-[10px] text-slate-400 mt-1">JPG, PNG (Max 5MB)</span>
                      </>
                   )}
                   <input type="file" accept="image/*" onChange={handlePhotoChange} className="hidden" />
                 </label>
              </div>

              {/* Kwitansi */}
              <div>
                 <p className="mb-2 text-xs font-semibold text-slate-700">Kwitansi { !isEdit && <span className="text-red-500">*</span> }</p>
                 <label className={`flex flex-col items-center justify-center border-2 border-dashed rounded-xl h-32 cursor-pointer transition-all ${receiptFile ? 'border-orange-400 bg-orange-50' : 'border-slate-300 hover:border-orange-400 hover:bg-slate-50'}`}>
                   {receiptFile ? (
                      <div className="text-center">
                        <span className="text-2xl">📄</span>
                        <p className="text-xs font-bold text-orange-600 mt-1 max-w-[150px] truncate">{receiptFile.name}</p>
                      </div>
                   ) : existingReceiptUrl ? (
                      <div className="text-center">
                         <span className="text-2xl opacity-50">🧾</span>
                         <span className="block text-[10px] text-slate-500 mt-1">Kwitansi Tersimpan</span>
                         <span className="text-[10px] text-orange-600 underline">Klik untuk ganti</span>
                      </div>
                   ) : (
                      <>
                        <span className="text-2xl mb-1">📄</span>
                        <span className="text-xs text-slate-500 font-medium">Upload Kwitansi</span>
                        <span className="text-[10px] text-slate-400 mt-1">PDF atau Gambar</span>
                      </>
                   )}
                   <input type="file" accept="image/*,application/pdf" onChange={(e) => e.target.files?.[0] && setReceiptFile(e.target.files[0])} className="hidden" />
                 </label>
              </div>
            </div>

          </form>
        </div>

        {/* === FOOTER === */}
        <div className="p-4 border-t border-slate-100 bg-slate-50 rounded-b-2xl flex justify-end gap-3">
          <button 
            type="button" 
            onClick={onClose} 
            className="px-5 py-2.5 rounded-lg border border-slate-300 text-slate-600 font-medium text-sm hover:bg-slate-100 transition-colors"
            disabled={isSubmitting}
          >
            Batal
          </button>
          <button 
            onClick={handleSubmit} 
            disabled={isSubmitting}
            className="px-6 py-2.5 rounded-lg bg-[#009846] text-white font-bold text-sm hover:bg-[#007b3a] shadow-lg shadow-green-100 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <>
                <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                Menyimpan...
              </>
            ) : (
              isEdit ? "Simpan Perubahan" : "Simpan Aset"
            )}
          </button>
        </div>

      </div>
    </div>
  );
}

export default AddAssetModal;