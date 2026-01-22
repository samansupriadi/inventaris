// src/pages/ReportPage.jsx
import { useState, useEffect, useRef } from "react";
import { useReactToPrint } from "react-to-print";
import { API_BASE_URL, fetchFundingSources, fetchLocations, fetchBudgetCodes } from "../api";
import { ReportTemplate } from "../components/ReportTemplate";

function ReportPage() {
  const [reportData, setReportData] = useState({ summary: {}, data: [] });
  const [categories, setCategories] = useState([]);
  const [fundingSources, setFundingSources] = useState([]); 
  const [locations, setLocations] = useState([]);
  const [budgetCodes, setBudgetCodes] = useState([]); // State untuk KMA
  const [loading, setLoading] = useState(false);

  // Filter State
  // Kita hapus reportType karena Bapak bilang "Semua Aset" saja cukup
  // Tapi kita simpan filter 'status' atau 'condition' di dropdown jika perlu
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedLocation, setSelectedLocation] = useState("");
  const [selectedYear, setSelectedYear] = useState("");
  const [selectedFunding, setSelectedFunding] = useState(""); 
  const [selectedKma, setSelectedKma] = useState(""); 
  const [selectedCondition, setSelectedCondition] = useState(""); // Ganti radio button dengan dropdown kondisi

  const componentRef = useRef(null);

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 30 }, (_, i) => currentYear - i);

  // 1. Load Master Data
  useEffect(() => {
    // Categories
    fetch(`${API_BASE_URL}/api/categories`, { credentials: "include" }) 
      .then(res => res.json())
      .then(data => setCategories(Array.isArray(data) ? data : []))
      .catch(err => console.error(err));

    // Funding & Locations
    fetchFundingSources().then(setFundingSources).catch(console.error);
    fetchLocations().then(setLocations).catch(console.error);
  }, []);
  
  // 2. Load KMA Dinamis
  useEffect(() => {
    if (!selectedFunding) {
      setBudgetCodes([]);
      return;
    }
    // Panggil API Budget Codes (yang sudah ada parameternya)
    fetchBudgetCodes(selectedFunding)
      .then(data => setBudgetCodes(Array.isArray(data) ? data : []))
      .catch(console.error);
  }, [selectedFunding]);

  // 3. Fetch Data Laporan
  useEffect(() => {
    fetchReportData();
  }, [selectedCategory, selectedYear, selectedFunding, selectedKma, selectedLocation, selectedCondition]);

  const fetchReportData = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      
      if (selectedCategory) params.append("category_id", selectedCategory);
      if (selectedLocation) params.append("location_id", selectedLocation);
      if (selectedCondition) params.append("condition", selectedCondition); // Filter kondisi (rusak/baik/hilang)
      
      if (selectedYear) {
         params.append("start_date", `${selectedYear}-01-01`);
         params.append("end_date", `${selectedYear}-12-31`);
      }

      if (selectedFunding) params.append("funding_source_id", selectedFunding);
      if (selectedKma) params.append("budget_code_id", selectedKma);
      
      const res = await fetch(`${API_BASE_URL}/api/reports/summary?${params.toString()}`, {
          credentials: "include" 
      });
      
      if (!res.ok) throw new Error("Gagal load laporan");
      
      const result = await res.json();

      // --- LOGIKA WRITE-OFF DI SINI ---
      // Sebelum masuk ke state, kita manipulasi datanya dulu.
      // Jika kondisi rusak/hilang, paksa book_value jadi 0.
      const processedData = (result.data || []).map(item => {
          const cond = (item.condition || "").toLowerCase();
          const stat = (item.status || "").toLowerCase();
          
          let finalBookValue = Number(item.book_value || 0);

          // Logika Nol-kan Nilai
          if (cond === 'rusak' || cond === 'hilang' || stat === 'hilang') {
              finalBookValue = 0;
          }

          return {
              ...item,
              book_value: finalBookValue
          };
      });

      setReportData({ ...result, data: processedData });

    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = useReactToPrint({
    contentRef: componentRef,
    documentTitle: `Laporan_Aset_Sinergi_${selectedYear || 'AllTime'}`,
  });

  return (
    <div className="p-6 space-y-6 font-sans animate-fade-in">
      
      {/* HEADER PAGE */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">🖨️ Pusat Laporan</h1>
          <p className="text-xs text-slate-500 mt-1">Cetak laporan resmi inventaris aset yayasan.</p>
        </div>
        <button 
          onClick={handlePrint}
          className="px-6 py-2.5 bg-slate-800 text-white rounded-lg shadow-lg hover:bg-slate-700 transition-all flex items-center gap-2 font-bold"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M6.72 13.829c-.24.03-.48.062-.72.096m.72-.096a42.415 42.415 0 0110.56 0m-10.56 0L6.34 18m10.94-4.171c.24.03.48.062.72.096m-.72-.096L17.66 18m0 0l.229 2.523a1.125 1.125 0 01-1.12 1.227H7.231c-.662 0-1.18-.568-1.12-1.227L6.34 18m11.318 0h1.091A2.25 2.25 0 0021 15.75V9.456c0-1.081-.768-2.015-1.837-2.175a48.055 48.055 0 00-1.913-.247M6.34 18H5.25A2.25 2.25 0 013 15.75V9.456c0-1.081.768-2.015 1.837-2.175a48.041 48.041 0 011.913-.247m10.5 0a48.536 48.536 0 00-10.5 0m10.5 0V3.375c0-.621-.504-1.125-1.125-1.125h-8.25c-.621 0-1.125.504-1.125 1.125v3.659M18 10.5h.008v.008H18V10.5zm-3 0h.008v.008H15V10.5z" /></svg>
          Cetak PDF / Print
        </button>
      </div>

      {/* === CONTROLS PANEL === */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm grid grid-cols-1 md:grid-cols-4 gap-6">
        
        {/* KOLOM 1: Filter Kategori & Kondisi */}
        <div className="space-y-3 col-span-1">
            <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Kondisi Aset</label>
                <select 
                    className="w-full border border-slate-300 rounded px-2 py-1.5 text-xs focus:ring-1 focus:ring-[#009846] outline-none"
                    value={selectedCondition}
                    onChange={(e) => setSelectedCondition(e.target.value)}
                >
                    <option value="">-- Semua Kondisi --</option>
                    <option value="baik">Baik</option>
                    <option value="rusak">Rusak</option>
                    <option value="hilang">Hilang</option>
                </select>
            </div>
            <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Kategori</label>
                <select 
                    className="w-full border border-slate-300 rounded px-2 py-1.5 text-xs focus:ring-1 focus:ring-[#009846] outline-none"
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                >
                    <option value="">-- Semua Kategori --</option>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
            </div>
        </div>

        {/* KOLOM 2: Filter Lokasi & Tahun */}
        <div className="space-y-3 col-span-1">
            <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Lokasi Aset</label>
                <select 
                    className="w-full border border-slate-300 rounded px-2 py-1.5 text-xs focus:ring-1 focus:ring-[#009846] outline-none"
                    value={selectedLocation}
                    onChange={(e) => setSelectedLocation(e.target.value)}
                >
                    <option value="">-- Semua Lokasi --</option>
                    {locations.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                </select>
            </div>
            <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Tahun Beli</label>
                <select 
                    className="w-full border border-slate-300 rounded px-2 py-1.5 text-xs focus:ring-1 focus:ring-[#009846] outline-none"
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(e.target.value)}
                >
                    <option value="">-- Semua Tahun --</option>
                    {years.map(y => <option key={y} value={y}>{y}</option>)}
                </select>
            </div>
        </div>

        {/* KOLOM 3: Filter Dana & KMA */}
        <div className="space-y-3 col-span-1">
            <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Sumber Dana</label>
                <select 
                    className="w-full border border-slate-300 rounded px-2 py-1.5 text-xs focus:ring-1 focus:ring-[#009846] outline-none"
                    value={selectedFunding}
                    onChange={(e) => {
                        setSelectedFunding(e.target.value);
                        setSelectedKma(""); // Reset KMA
                    }}
                >
                    <option value="">-- Semua Dana --</option>
                    {fundingSources.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                </select>
            </div>
            <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Mata Anggaran (KMA)</label>
                <select 
                    className="w-full border border-slate-300 rounded px-2 py-1.5 text-xs focus:ring-1 focus:ring-[#009846] outline-none disabled:bg-slate-100 disabled:text-slate-400"
                    value={selectedKma}
                    onChange={(e) => setSelectedKma(e.target.value)}
                    disabled={!selectedFunding}
                >
                    <option value="">-- Semua KMA --</option>
                    {budgetCodes.map(k => (
                        <option key={k.id} value={k.id}>{k.code} - {k.name}</option>
                    ))}
                </select>
            </div>
        </div>

        {/* KOLOM 4: Info Ringkas */}
        <div className="bg-slate-50 rounded-lg p-4 border border-slate-200 flex flex-col justify-center items-center text-center col-span-1">
          {loading ? (
             <span className="text-xs animate-pulse font-bold text-slate-400">Loading...</span>
          ) : (
             <>
                <span className="text-3xl mb-1">📊</span>
                <div className="text-2xl font-bold text-slate-800">{reportData.summary?.total_items || 0} <span className="text-sm font-normal text-slate-500">Unit</span></div>
                <div className="text-[10px] text-slate-400 mt-1">Siap dicetak</div>
             </>
          )}
        </div>

      </div>

      {/* === PREVIEW AREA === */}
      <div className="bg-slate-200 p-8 rounded-xl overflow-auto shadow-inner border border-slate-300 flex justify-center min-h-[500px]">
        {loading ? (
            <div className="flex flex-col items-center justify-center text-slate-500 gap-2">
                <div className="w-8 h-8 border-4 border-slate-300 border-t-[#009846] rounded-full animate-spin"></div>
                <span className="text-sm font-bold">Sedang memuat preview...</span>
            </div>
        ) : (
            <div className="shadow-2xl scale-[0.6] md:scale-90 origin-top transition-transform duration-300">
               {/* TYPE SELALU 'all' (Laporan Inventaris Aset), 
                  tapi datanya sudah kita filter di atas 
               */}
               <ReportTemplate 
                  ref={componentRef} 
                  type="all" 
                  data={reportData.data || []} 
                  year={selectedYear}
               />
            </div>
        )}
      </div>

    </div>
  );
}

export default ReportPage;