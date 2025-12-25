import { useState, useEffect, useRef } from "react";
import { Html5QrcodeScanner } from "html5-qrcode"; // Library Scanner
import { playBeep } from "../utils/sound"; // Helper Suara
import { fetchLocations, createOpnameSession, fetchOpnameSessions, fetchOpnameDetail, updateOpnameItem, finalizeOpname } from "../api";

function StockOpnamePage() {
  const [view, setView] = useState("list");
  const [sessions, setSessions] = useState([]);
  const [locations, setLocations] = useState([]);
  
  // State Detail
  const [activeSession, setActiveSession] = useState(null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);

  // State Scanner
  const [isScanning, setIsScanning] = useState(false);
  const scannerRef = useRef(null); // Ref untuk instance scanner

  // Form State
  const [newTitle, setNewTitle] = useState("");
  const [selectedLoc, setSelectedLoc] = useState("");

  useEffect(() => {
    loadData();
    loadLocations();
  }, []);

  // Effect khusus untuk Scanner
  useEffect(() => {
    if (isScanning && view === 'detail') {
        // Inisialisasi Scanner saat mode scanning aktif
        const scanner = new Html5QrcodeScanner(
            "reader", 
            { fps: 10, qrbox: { width: 250, height: 250 } },
            /* verbose= */ false
        );
        
        scanner.render(onScanSuccess, onScanFailure);
        scannerRef.current = scanner;

        // Cleanup saat tutup modal scan
        return () => {
            scanner.clear().catch(error => console.error("Failed to clear scanner", error));
        };
    }
  }, [isScanning, view]); // Re-run jika isScanning berubah

  // --- LOGIC SCANNER ---
  const onScanSuccess = (decodedText) => {
    // 1. Pause scanner sebentar biar ga scan berkali-kali dalam 1 detik
    if (scannerRef.current) {
        scannerRef.current.pause(true); 
    }

    console.log(`Code Scanned: ${decodedText}`);

    // 2. Cari aset di list items (menggunakan Kode Aset)
    const targetItem = items.find(i => i.asset_code === decodedText);

    if (targetItem) {
        // SKENARIO A: ASET DITEMUKAN (MATCH) ✅
        playBeep("success"); // Bunyi "Ting!"
        
        // Auto verify di sistem
        handleVerify(targetItem, 'Matched');
        
        alert(`✅ DITEMUKAN!\n\nNama: ${targetItem.asset_name}\nKode: ${decodedText}`);
    } else {
        // SKENARIO B: ASET SALAH LOKASI / TIDAK ADA DI LIST ❌
        playBeep("error"); // Bunyi "Tet-tot!"
        alert(`❌ PERINGATAN!\n\nAset dengan kode "${decodedText}" TIDAK ADA dalam daftar audit lokasi ini.\n\nKemungkinan aset salah lokasi.`);
    }

    // 3. Resume scanner setelah alert ditutup user
    if (scannerRef.current) {
        scannerRef.current.resume();
    }
  };

  const onScanFailure = (error) => {
    // Biarkan kosong agar console tidak penuh warning saat kamera mencari QR
  };

  const loadData = async () => {
    const data = await fetchOpnameSessions();
    setSessions(data);
  };

  const loadLocations = async () => {
    const data = await fetchLocations();
    setLocations(data);
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if(!newTitle || !selectedLoc) return alert("Lengkapi data!");
    setLoading(true);
    try {
        await createOpnameSession({ title: newTitle, location_id: selectedLoc });
        setNewTitle(""); setSelectedLoc("");
        loadData();
        alert("Sesi Opname Berhasil Dibuat!");
    } catch(err) { alert(err.message); } finally { setLoading(false); }
  };

  const openSession = async (session) => {
    setLoading(true);
    try {
        const res = await fetchOpnameDetail(session.id);
        setActiveSession(res.session);
        setItems(res.items);
        setView("detail");
    } catch(err) { alert(err.message); } finally { setLoading(false); }
  };

  const handleVerify = async (item, status) => {
    const oldItems = [...items];
    const newItems = items.map(i => i.id === item.id ? { ...i, status: status } : i);
    setItems(newItems); // Update UI dulu (Optimistic)

    try {
        await updateOpnameItem(item.id, { 
            status: status, 
            condition: item.condition_actual || 'baik', 
            notes: "" 
        });
        // Update header progress real-time (tanpa fetch ulang agar cepat)
        setActiveSession(prev => ({
             ...prev, 
             scanned_assets: newItems.filter(i => i.status === 'Matched').length
        }));
    } catch(err) {
        setItems(oldItems);
        alert("Gagal update");
    }
  };

  const handleFinalize = async () => {
    if(!confirm("Yakin finalisasi audit ini?")) return;
    try {
        await finalizeOpname(activeSession.id);
        alert("Audit Selesai!");
        setView("list");
        loadData();
    } catch(err) { alert(err.message); }
  };

  // --- RENDER DETAIL ---
  if (view === "detail" && activeSession) {
    const progress = Math.round((activeSession.scanned_assets / activeSession.total_assets) * 100) || 0;
    
    return (
      <div className="space-y-6 animate-fade-in relative">
        
        {/* HEADER & TOMBOL KEMBALI */}
        <div className="flex flex-col md:flex-row md:items-center justify-between bg-white p-6 rounded-xl border border-slate-200 shadow-sm gap-4">
            <div>
                <button onClick={() => { setView("list"); setIsScanning(false); }} className="text-sm text-slate-500 hover:text-blue-600 mb-2 flex items-center gap-1">
                    ← Kembali ke List
                </button>
                <h1 className="text-2xl font-bold text-slate-800">{activeSession.title}</h1>
                <p className="text-sm text-slate-500">Lokasi: <span className="font-semibold">{activeSession.location_name}</span> | Status: {activeSession.status}</p>
            </div>
            
            <div className="flex gap-2">
                {/* TOMBOL SCANNER (Hanya muncul jika belum final) */}
                {activeSession.status !== 'Finalized' && (
                    <button 
                        onClick={() => setIsScanning(true)} 
                        className="px-5 py-2.5 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 shadow-lg shadow-blue-900/20 flex items-center gap-2"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" /></svg>
                        Mode Scan QR
                    </button>
                )}
                
                {activeSession.status !== 'Finalized' && (
                    <button onClick={handleFinalize} className="px-5 py-2 bg-green-600 text-white rounded-lg font-bold hover:bg-green-700 shadow-lg shadow-green-900/20">
                        Selesai
                    </button>
                )}
            </div>
        </div>


        {/* AREA SCANNER KAMERA */}
        {isScanning && (
            <div className="fixed inset-0 z-50 bg-black/90 flex flex-col items-center justify-center p-4">
                <div className="bg-white rounded-2xl overflow-hidden w-full max-w-md relative">
                    <div className="p-4 bg-slate-900 text-white flex justify-between items-center">
                        <h3 className="font-bold">Pemindai QR Code</h3>
                        <button onClick={() => setIsScanning(false)} className="text-slate-400 hover:text-white">Tutup ✕</button>
                    </div>
                    
                    {/* --- PERBAIKAN DI SINI --- */}
                    {/* Hapus 'bg-black', ganti bg-gray-100 agar tombol izin terlihat */}
                    <div className="p-4 bg-gray-100">
                        <div id="reader" className="w-full"></div>
                    </div>
                    {/* ------------------------- */}
                    
                    <div className="p-4 text-center text-sm text-slate-500">
                        Arahkan kamera ke QR Code Aset.
                    </div>
                </div>
            </div>
        )}

        {/* PROGRESS BAR */}
        <div className="bg-white p-4 rounded-xl border border-slate-200">
            <div className="flex justify-between text-sm mb-2 font-semibold text-slate-700">
                <span>Progress Audit</span>
                <span>{progress}% ({activeSession.scanned_assets} / {activeSession.total_assets} Aset)</span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-4 overflow-hidden">
                <div className="bg-blue-600 h-4 rounded-full transition-all duration-500" style={{ width: `${progress}%` }}></div>
            </div>
        </div>

        {/* TABEL ITEM */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
             {/* ... Tabel sama seperti sebelumnya ... */}
             <table className="w-full text-sm text-left">
                <thead className="bg-slate-50 text-slate-600 font-bold uppercase text-xs border-b">
                    <tr>
                        <th className="p-4">Kode / Nama Aset</th>
                        <th className="p-4">Status</th>
                        <th className="p-4 text-center">Manual Aksi</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                    {items.map(item => (
                        <tr key={item.id} className={`hover:bg-slate-50 transition ${item.status === 'Matched' ? 'bg-green-50/50' : ''}`}>
                            <td className="p-4">
                                <div className="font-bold text-slate-800">{item.asset_name}</div>
                                <div className="text-xs text-slate-500 font-mono">{item.asset_code}</div>
                            </td>
                            <td className="p-4">
                                <span className={`px-2 py-1 rounded text-xs border font-semibold ${
                                    item.status === 'Matched' ? 'bg-green-100 text-green-700 border-green-200' : 
                                    item.status === 'Missing' ? 'bg-red-50 text-red-600 border-red-200' : 'bg-slate-100 text-slate-500'
                                }`}>
                                    {item.status === 'Matched' ? '✅ Ditemukan' : '❌ Belum/Hilang'}
                                </span>
                            </td>
                            <td className="p-4 text-center">
                                {activeSession.status !== 'Finalized' && (
                                    <div className="flex justify-center gap-2">
                                        <button onClick={() => handleVerify(item, 'Matched')} className={`px-3 py-1.5 rounded border text-xs font-bold ${item.status === 'Matched' ? 'bg-green-600 text-white' : 'hover:bg-green-50 text-green-600 border-green-200'}`}>ADA</button>
                                        <button onClick={() => handleVerify(item, 'Missing')} className={`px-3 py-1.5 rounded border text-xs font-bold ${item.status === 'Missing' ? 'bg-red-600 text-white' : 'hover:bg-red-50 text-red-600 border-red-200'}`}>HILANG</button>
                                    </div>
                                )}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
      </div>
    );
  }

  // --- RENDER LIST ---
  return (
    <div className="space-y-8 animate-fade-in">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-4">
            <div>
                <h1 className="text-2xl font-bold text-slate-800">Stock Opname</h1>
                <p className="text-sm text-slate-500 mt-1">Audit fisik aset berkala.</p>
            </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-4">
                {sessions.map(s => (
                    <div key={s.id} onClick={() => openSession(s)} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition cursor-pointer group">
                        <div className="flex justify-between items-start">
                            <div>
                                <h3 className="font-bold text-slate-800 text-lg group-hover:text-blue-600">{s.title}</h3>
                                <p className="text-sm text-slate-500 mt-1">📍 {s.location_name} • 👤 {s.auditor_name}</p>
                            </div>
                            <span className={`px-3 py-1 rounded-full text-xs font-bold ${s.status === 'Finalized' ? 'bg-slate-100 text-slate-600' : 'bg-blue-100 text-blue-700 animate-pulse'}`}>{s.status}</span>
                        </div>
                        <div className="mt-4 pt-4 border-t border-slate-100 flex justify-between items-center">
                            <div className="text-xs text-slate-500">Progress: <span className="font-bold text-slate-700">{s.scanned_assets} / {s.total_assets}</span> Aset</div>
                            <div className="w-32 bg-slate-100 rounded-full h-2"><div className="bg-green-500 h-2 rounded-full" style={{ width: `${(s.scanned_assets/s.total_assets)*100}%` }}></div></div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm sticky top-6 h-fit">
                <h3 className="font-bold text-slate-800 mb-4">Mulai Audit Baru</h3>
                <form onSubmit={handleCreate} className="space-y-4">
                    <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1">Judul Kegiatan</label>
                        <input className="w-full border p-2 rounded text-sm" placeholder="Contoh: Audit Q4 Gudang A" value={newTitle} onChange={e => setNewTitle(e.target.value)} />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1">Target Lokasi</label>
                        <select className="w-full border p-2 rounded text-sm" value={selectedLoc} onChange={e => setSelectedLoc(e.target.value)}>
                            <option value="">-- Pilih Lokasi --</option>
                            {locations.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                        </select>
                    </div>
                    <button type="submit" disabled={loading} className="w-full bg-blue-600 text-white py-2.5 rounded-lg font-bold hover:bg-blue-700 shadow-lg shadow-blue-900/20">{loading ? "Memproses..." : "Buat Sesi & Mulai"}</button>
                </form>
            </div>
        </div>
    </div>
  );
}

export default StockOpnamePage;