// src/pages/ScanIdentifikasiPage.jsx
import React, { useEffect, useState } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import Swal from 'sweetalert2';
import { fetchAssetByCode } from '../api';
import AssetDetailModal from '../components/AssetDetailModal'; // Pastikan path ini benar sesuai struktur Bapak

function ScanIdentifikasiPage() {
  const [scanResult, setScanResult] = useState(null);
  const [scannedAsset, setScannedAsset] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Inisialisasi Scanner
    const scanner = new Html5QrcodeScanner(
      "reader", 
      { 
        fps: 10, 
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1.0 
      },
      /* verbose= */ false
    );

    scanner.render(onScanSuccess, onScanFailure);

    // Cleanup saat pindah halaman
    return () => {
      scanner.clear().catch(error => console.error("Failed to clear html5-qrcode", error));
    };
  }, []);

  const onScanSuccess = async (decodedText, decodedResult) => {
    // Mencegah scan berulang kali dalam waktu singkat
    if (loading) return;

    // Kadang QR Code isinya URL lengkap (https://aset.../view/KODE-123)
    // Kita harus ambil KODE-nya saja.
    // Asumsi: QR Code Bapak isinya ADALAH "asset_code" murni.
    // Jika isinya URL, Bapak perlu logika split string di sini.
    const assetCode = decodedText.trim(); 

    setScanResult(assetCode);
    handleFetchAsset(assetCode);
  };

  const onScanFailure = (error) => {
    // Biarkan kosong agar tidak spam log console
  };

  const handleFetchAsset = async (code) => {
    setLoading(true);
    try {
      // Panggil API Backend yang baru kita buat
      // Gunakan encodeURIComponent untuk handle kode yang ada garis miring (/)
      const data = await fetchAssetByCode(code);
      
      if (data) {
        // Bunyi 'Beep' sukses (Opsional)
        const audio = new Audio('/sound_success.mp3'); // Kalau ada file sound
        audio.play().catch(e => {}); 

        setScannedAsset(data);
        setShowModal(true);
      }
    } catch (err) {
      console.error(err);
      Swal.fire({
        icon: 'error',
        title: 'Aset Tidak Ditemukan',
        text: `Sistem tidak mengenali kode QR: ${code}`,
        timer: 2000,
        showConfirmButton: false
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setScannedAsset(null);
    setScanResult(null);
    // Scanner otomatis jalan lagi siap untuk barang berikutnya
  };

  return (
    <div className="p-6 animate-fade-in max-w-xl mx-auto">
      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold text-slate-800">Scan Identifikasi Aset</h1>
        <p className="text-slate-500 text-sm">Arahkan kamera ke QR Code aset untuk melihat detail.</p>
      </div>

      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200">
        {/* AREA KAMERA */}
        <div id="reader" className="overflow-hidden rounded-xl"></div>
        
        <p className="text-center text-xs text-slate-400 mt-4">
          Pastikan ruangan cukup cahaya & QR Code bersih.
        </p>
      </div>

      {/* MODAL DETAIL (POPUP) */}
      {showModal && scannedAsset && (
        <AssetDetailModal 
          asset={scannedAsset} 
          onClose={handleCloseModal} 
        />
      )}
    </div>
  );
}

export default ScanIdentifikasiPage;