// src/components/StockOpnamePage.jsx
import { useState, useEffect, useRef } from "react";
import { Html5QrcodeScanner } from "html5-qrcode"; // Library Scanner
import { playBeep } from "../utils/sound"; // Helper Suara
import { 
    fetchLocations, 
    createOpnameSession, 
    fetchOpnameSessions, 
    fetchOpnameDetail, 
    scanOpnameItem, // Ganti fungsi updateOpnameItem jadi scanOpnameItem (sesuai backend baru)
    finalizeOpname 
} from "../api";
import Swal from "sweetalert2"; 
import { hasPermission } from "../utils/auth";

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
  const scannerRef = useRef(null); 

  // Form State
  const [newTitle, setNewTitle] = useState("");
  const [selectedLoc, setSelectedLoc] = useState("");

  useEffect(() => {
    loadData();
    loadLocations();
  }, []);

  // Effect Scanner
  useEffect(() => {
    if (isScanning && view === 'detail') {
        const scanner = new Html5QrcodeScanner(
            "reader", 
            { fps: 10, qrbox: { width: 250, height: 250 } },
            false
        );
        
        scanner.render(onScanSuccess, onScanFailure);
        scannerRef.current = scanner;

        return () => {
            scanner.clear().catch(error => console.error("Failed to clear scanner", error));
        };
    }
  }, [isScanning, view]); 

  // --- LOGIC SCANNER (CORE) ---
  const onScanSuccess = async (decodedText) => {
    // 1. Pause scanner
    if (scannerRef.current) scannerRef.current.pause(true); 
    playBeep("success");

    console.log(`Code Scanned: ${decodedText}`);

    // 2. Tampilkan Popup Konfirmasi Kondisi
    const { isConfirmed, isDenied, dismiss } = await Swal.fire({
        title: 'Aset Terdeteksi!',
        text: `Kode: ${decodedText}. Bagaimana kondisi fisiknya?`,
        icon: 'question',
        showCancelButton: true,
        showDenyButton: true,
        confirmButtonText: '✅ BAIK',
        denyButtonText: '🛠️ RUSAK',
        cancelButtonText: 'Batal',
        confirmButtonColor: '#16a34a', // Hijau
        denyButtonColor: '#dc2626',   // Merah
    });

    if (dismiss === Swal.DismissReason.cancel) {
        // Resume jika batal
        if (scannerRef.current) scannerRef.current.resume();
        return;
    }

    // Tentukan kondisi berdasarkan tombol yang diklik
    const condition = isConfirmed ? 'baik' : 'rusak';

    // 3. Kirim Data ke Backend
    try {
        const res = await scanOpnameItem(activeSession.id, {
            asset_code: decodedText,
            condition: condition,
            // status 'Matched'/'Moved' ditentukan backend otomatis
        });

        if (res.success) {
            Swal.fire({
                icon: 'success',
                title: 'Tersimpan!',
                text: `${res.message} (Kondisi: ${condition.toUpperCase()})`,
                timer: 1500,
                showConfirmButton: false
            });
            
            // Refresh Data Item (Penting agar item moved muncul / status berubah)
            fetchSessionDetail(activeSession.id);
        }
    } catch (err) {
        playBeep("error");
        Swal.fire({
            icon: 'error',
            title: 'Gagal',
            text: err.message || "Gagal menyimpan data scan.",
        });
    } finally {
        // Resume scanner
        if (scannerRef.current) scannerRef.current.resume();
    }
  };

  const onScanFailure = (error) => {
    // Biarkan kosong
  };

  const loadData = async () => {
    try {
        const data = await fetchOpnameSessions();
        setSessions(data);
    } catch (err) {
        console.error(err);
    }
  };

  const loadLocations = async () => {
    try {
        const data = await fetchLocations();
        setLocations(data);
    } catch (err) {
        console.error(err);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if(!newTitle || !selectedLoc) {
        return Swal.fire({ icon: 'warning', title: 'Data Kurang', text: 'Mohon lengkapi judul & lokasi.' });
    }

    setLoading(true);
    try {
        await createOpnameSession({ title: newTitle, location_id: selectedLoc });
        setNewTitle(""); setSelectedLoc("");
        loadData();
        Swal.fire({ icon: 'success', title: 'Berhasil', text: 'Sesi Opname baru telah dibuat!', timer: 1500, showConfirmButton: false });
    } catch(err) { 
        Swal.fire({ icon: 'error', title: 'Gagal', text: err.message });
    } finally { 
        setLoading(false); 
    }
  };

  // Helper untuk refresh data detail
  const fetchSessionDetail = async (sessionId) => {
      try {
        const res = await fetchOpnameDetail(sessionId);
        setActiveSession(res.session);
        setItems(res.items);
      } catch (err) {
          console.error(err);
      }
  };

  const openSession = async (session) => {
    setLoading(true);
    try {
        await fetchSessionDetail(session.id);
        setView("detail");
    } catch(err) { 
        Swal.fire({ icon: 'error', title: 'Gagal', text: err.message });
    } finally { 
        setLoading(false); 
    }
  };

  // Manual Verify (Tanpa Scan - Tombol Aksi Manual)
  const handleManualVerify = async (item, condition) => {
    try {
        // Kita panggil endpoint scan juga, tapi inject kodenya manual
        const res = await scanOpnameItem(activeSession.id, {
            asset_code: item.asset_code,
            condition: condition,
        });

        if (res.success) {
            // Update UI Optimistic (Cepat)
            const newStatus = res.status || 'Matched'; // Fallback
            setItems(prev => prev.map(i => i.id === item.id ? { ...i, status: newStatus, condition_actual: condition } : i));
            
            // Update header count (Simple logic)
            setActiveSession(prev => ({
                 ...prev, 
                 scanned_assets: prev.scanned_assets + (item.status === 'Missing' ? 1 : 0)
            }));
        }
    } catch(err) {
        Swal.fire({ icon: 'error', title: 'Gagal', text: err.message });
    }
  };

  const handleFinalize = async () => {
    const result = await Swal.fire({
        title: 'Finalisasi Opname?',
        html: `
            <p class="text-sm text-slate-500 mb-2">Sistem akan melakukan rekonsiliasi otomatis:</p>
            <ul class="text-xs text-left list-disc pl-6 mb-4">
                <li>Aset <b>Missing</b> akan diubah jadi <b>Hilang</b>.</li>
                <li>Aset <b>Moved</b> akan <b>Pindah Lokasi</b> ke sini.</li>
                <li>Kondisi fisik aset akan diupdate sesuai hasil scan.</li>
            </ul>
            <p class="text-sm font-bold text-red-600">Proses ini tidak dapat dibatalkan!</p>
        `,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33',
        confirmButtonText: 'Ya, Proses Sekarang!',
        cancelButtonText: 'Batal'
    });

    if (result.isConfirmed) {
        setLoading(true);
        try {
            const res = await finalizeOpname(activeSession.id);
            Swal.fire('Selesai!', res.message, 'success');
            setView("list");
            loadData();
        } catch(err) { 
            Swal.fire({ icon: 'error', title: 'Gagal', text: err.message });
        } finally {
            setLoading(false);
        }
    }
  };

  // --- RENDER DETAIL ---
  if (view === "detail" && activeSession) {
    const progress = activeSession.total_assets > 0 
        ? Math.round((activeSession.scanned_assets / activeSession.total_assets) * 100) 
        : 0;
    
    const canExecute = hasPermission('execute_opname'); 
    const canFinalize = hasPermission('finalize_opname');

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
                {activeSession.status !== 'Finalized' && canExecute && (
                    <button 
                        onClick={() => setIsScanning(true)} 
                        className="px-5 py-2.5 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 shadow-lg shadow-blue-900/20 flex items-center gap-2"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" /></svg>
                        Mulai Scan QR
                    </button>
                )}
                
                {activeSession.status !== 'Finalized' && canFinalize && (
                    <button onClick={handleFinalize} className="px-5 py-2 bg-green-600 text-white rounded-lg font-bold hover:bg-green-700 shadow-lg shadow-green-900/20">
                        Selesai & Finalisasi
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
                    
                    <div className="p-4 bg-gray-100">
                        <div id="reader" className="w-full"></div>
                    </div>
                    
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
             <table className="w-full text-sm text-left">
                <thead className="bg-slate-50 text-slate-600 font-bold uppercase text-xs border-b">
                    <tr>
                        <th className="p-4">Kode / Nama Aset</th>
                        <th className="p-4">Status Temuan</th>
                        <th className="p-4">Kondisi Fisik</th>
                        <th className="p-4 text-center">Aksi Manual</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                    {items.map(item => (
                        <tr key={item.id} className={`hover:bg-slate-50 transition ${item.status === 'Matched' ? 'bg-green-50/50' : item.status === 'Moved' ? 'bg-yellow-50/50' : ''}`}>
                            <td className="p-4">
                                <div className="font-bold text-slate-800">{item.asset_name}</div>
                                <div className="text-xs text-slate-500 font-mono">{item.asset_code}</div>
                                {item.status === 'Moved' && <span className="text-[10px] text-yellow-600 bg-yellow-100 px-1 rounded">Barang Pindahan</span>}
                            </td>
                            <td className="p-4">
                                <span className={`px-2 py-1 rounded text-xs border font-semibold ${
                                    item.status === 'Matched' ? 'bg-green-100 text-green-700 border-green-200' : 
                                    item.status === 'Moved' ? 'bg-yellow-100 text-yellow-700 border-yellow-200' :
                                    item.status === 'Missing' ? 'bg-red-50 text-red-600 border-red-200' : 'bg-slate-100 text-slate-500'
                                }`}>
                                    {item.status === 'Matched' ? '✅ Sesuai' : 
                                     item.status === 'Moved' ? '⚠️ Pindah Lokasi' : 
                                     '❌ Belum Scan'}
                                </span>
                            </td>
                            <td className="p-4">
                                {item.status !== 'Missing' ? (
                                    <span className={`uppercase text-xs font-bold ${item.condition_actual === 'rusak' ? 'text-red-600' : 'text-green-600'}`}>
                                        {item.condition_actual}
                                    </span>
                                ) : <span className="text-slate-300">-</span>}
                            </td>
                            <td className="p-4 text-center">
                                {activeSession.status !== 'Finalized' && canExecute && (
                                    <div className="flex justify-center gap-2">
                                        <button onClick={() => handleManualVerify(item, 'baik')} className="px-2 py-1 rounded border text-xs font-bold hover:bg-green-50 text-green-600 border-green-200" title="Set Baik">👍 Baik</button>
                                        <button onClick={() => handleManualVerify(item, 'rusak')} className="px-2 py-1 rounded border text-xs font-bold hover:bg-red-50 text-red-600 border-red-200" title="Set Rusak">👎 Rusak</button>
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
                <p className="text-sm text-slate-500 mt-1">Audit fisik aset berkala & rekonsiliasi otomatis.</p>
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
                            <div className="w-32 bg-slate-100 rounded-full h-2">
                                <div className="bg-green-500 h-2 rounded-full" style={{ width: `${s.total_assets > 0 ? (s.scanned_assets/s.total_assets)*100 : 0}%` }}></div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
            {hasPermission('create_opname') && (
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
            )}
        </div>
    </div>
  );
}

export default StockOpnamePage;