// src/components/QrPrintSheet.jsx
import QRCode from "react-qr-code";

function QrPrintSheet({
  assets,
  fundingSources,
  locations,
  categories,
  onBack,
}) {
  if (!assets || assets.length === 0) return null;

  // Helper untuk mencari data pelengkap (biar saat QR discan, infonya tetap lengkap)
  const findFunding = (id) => fundingSources?.find((f) => f.id === id);
  const findLocation = (id) => locations?.find((l) => l.id === id);
  const findCategory = (id) => categories?.find((c) => c.id === id);

  const buildQrPayload = (asset) => {
    const funding = findFunding(asset.funding_source_id);
    const location = findLocation(asset.location_id);
    const category = findCategory(asset.category_id);

    // Payload JSON lengkap tersimpan DI DALAM QR
    return JSON.stringify({
      id: asset.id,
      name: asset.name,
      code: asset.code,
      loc: location ? location.name : "",
      cat: category ? category.name : "",
      fund: funding ? funding.name : "",
    });
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6 font-sans">
      
      {/* 1. STYLE KHUSUS PRINT (CSS Magic) */}
      <style>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 5mm; /* Margin kertas tipis (0.5cm) biar muat banyak */
          }
          
          body {
            background-color: white !important;
            -webkit-print-color-adjust: exact;
          }

          /* Sembunyikan semua elemen UI browser/app */
          body * { visibility: hidden; }

          /* Tampilkan HANYA area stiker */
          .print-area, .print-area * { visibility: visible; }

          .print-area {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }

          /* Hilangkan tombol UI */
          .no-print { display: none !important; }
        }
      `}</style>

      {/* 2. HEADER & TOMBOL (Hanya tampil di layar) */}
      <div className="no-print max-w-[210mm] mx-auto mb-6 bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex justify-between items-center">
        <div>
          <h1 className="text-lg font-bold text-slate-800">Cetak Label Stiker</h1>
          <p className="text-xs text-slate-500">
            Total: <span className="font-bold text-[#009846]">{assets.length} Aset</span>. Siapkan kertas label/stiker A4.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={onBack}
            className="px-4 py-2 text-xs font-medium border border-slate-300 rounded hover:bg-slate-50 transition"
          >
            Kembali
          </button>
          <button
            onClick={() => window.print()}
            className="px-4 py-2 text-xs font-medium bg-[#009846] text-white rounded hover:bg-[#007033] shadow-sm flex items-center gap-2"
          >
            🖨️ Print Sekarang
          </button>
        </div>
      </div>

      {/* 3. AREA KERTAS A4 (Grid Stiker) */}
      {/* Lebar 210mm = Lebar A4 */}
      <div className="print-area max-w-[210mm] mx-auto bg-white shadow-lg print:shadow-none min-h-[297mm] p-[2mm] print:p-0">
        
        {/* Container Flex agar stiker menyusun diri secara otomatis */}
        <div className="flex flex-wrap content-start gap-[2mm]">
          {assets.map((asset) => (
            <div
              key={asset.id}
              className="border border-slate-200 rounded-md flex flex-col items-center justify-center text-center relative bg-white"
              style={{
                // UKURAN STIKER: 40mm x 40mm (4cm) - Pas untuk label kecil
                width: "40mm",
                height: "40mm",
                pageBreakInside: "avoid", // Jangan terpotong halaman
                padding: "2mm"
              }}
            >
              {/* QR Code */}
              {/* Ukuran QR sekitar 2.4cm */}
              <div style={{ width: "24mm", height: "24mm" }}>
                <QRCode
                  value={buildQrPayload(asset)}
                  size={256}
                  style={{ height: "100%", width: "100%" }}
                  viewBox={`0 0 256 256`}
                />
              </div>

              {/* Info Text (Sangat Minimalis) */}
              <div className="mt-1.5 w-full overflow-hidden leading-none">
                {/* Kode Aset (Paling Penting) - Bold */}
                <div 
                  className="font-bold text-slate-900 truncate font-mono"
                  style={{ fontSize: "9px" }}
                >
                  {asset.code}
                </div>
                
                {/* Nama Aset (Opsional, kecil banget) */}
                <div 
                  className="text-slate-500 truncate mt-[2px]" 
                  style={{ fontSize: "7px" }}
                >
                  {asset.name}
                </div>
              </div>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}

export default QrPrintSheet;