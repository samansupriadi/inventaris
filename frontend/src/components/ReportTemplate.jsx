// src/components/ReportTemplate.jsx
import React from "react";

// Helper Format Rupiah
export const formatRupiah = (number) => {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(number);
};

export const ReportTemplate = React.forwardRef(({ type, data, year }, ref) => {
  const printDate = new Date().toLocaleDateString("id-ID", { day: 'numeric', month: 'long', year: 'numeric' });

  // Hitung Total Nilai
  const totalVal = data.reduce((acc, curr) => acc + Number(curr.value || 0), 0);
  const totalBookVal = data.reduce((acc, curr) => acc + Number(curr.book_value || 0), 0);

  return (
    <>
      {/* CSS KHUSUS PRINT - AGAR FOOTER TIDAK LOMPAT */}
      <style>{`
        @page {
          size: A4;
          margin: 0; /* PENTING: Hapus margin bawaan browser */
        }
        @media print {
          body {
            -webkit-print-color-adjust: exact;
          }
          .print-container {
            height: 297mm !important; /* Paksa tinggi pas A4 */
            width: 210mm !important;
            page-break-after: always;
          }
        }
      `}</style>

      {/* Container A4 */}
      <div 
        ref={ref} 
        className="print-container bg-white flex flex-col justify-between"
        style={{ 
          width: "210mm", 
          minHeight: "297mm", 
          padding: "15mm 20mm", // Margin dalam (Padding) kita atur di sini
          fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
          color: "#333",
          boxSizing: "border-box",
          position: "relative"
        }}
      >
        
        {/* ================= HEADER ================= */}
        <div style={{ 
            display: "flex", 
            justifyContent: "space-between", 
            alignItems: "flex-end", 
            borderBottom: "3px solid #009846", 
            paddingBottom: "15px",
            marginBottom: "25px" 
        }}>
          
          {/* KIRI: LOGO & BRAND TEXT */}
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <img src="/images/logo-small.png" alt="Logo" style={{ height: "55px", objectFit: "contain" }} />
              
              <div style={{ lineHeight: "1.1" }}>
                  <h1 style={{ margin: 0, fontSize: "24px", fontWeight: "800", color: "#444", letterSpacing: "-0.5px" }}>
                      SINERGI <span style={{ color: "#009846" }}>FOUNDATION</span>
                  </h1>
                  <p style={{ margin: 0, fontSize: "9px", color: "#666", textTransform: "uppercase", letterSpacing: "1px", fontWeight: "600" }}>
                      Lembaga Amil Zakat & Wakaf Produktif
                  </p>
              </div>
          </div>

          {/* KANAN: KONTAK */}
          <div style={{ textAlign: "right", fontSize: "9px", color: "#555", lineHeight: "1.4" }}>
            <p style={{ margin: 0, fontWeight: "bold", fontSize: "10px", color: "#009846" }}>www.sinergifoundation.org</p>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: "5px", marginTop: "2px" }}>
               <span style={{ fontWeight: "bold", color: "#888" }}>@sinergiID</span>
            </div>
          </div>
        </div>

        {/* ================= BODY CONTENT ================= */}
        <div style={{ flex: 1 }}>
          
          {/* JUDUL LAPORAN */}
          <div style={{ textAlign: "center", marginBottom: "30px" }}>
            <h2 style={{ fontSize: "16px", fontWeight: "bold", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "5px", color: "#000" }}>
              {type === 'all' ? 'LAPORAN INVENTARIS ASET' : type === 'broken' ? 'BERITA ACARA KERUSAKAN ASET' : 'LAPORAN PENYUSUTAN ASET'}
            </h2>
            
            {year && (
               <p style={{ fontSize: "11px", fontWeight: "bold", color: "#009846", marginBottom: "4px" }}>
                  TAHUN PEROLEHAN: {year}
               </p>
            )}

            <div style={{ width: "80px", height: "1px", background: "#000", margin: "0 auto 5px" }}></div>
            <p style={{ fontSize: "10px", color: "#666" }}>Tanggal Cetak: {printDate}</p>
          </div>

          {/* TABEL DATA */}
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "10px" }}>
            <thead>
              <tr style={{ background: "#f8f9fa", borderTop: "2px solid #333", borderBottom: "1px solid #333" }}>
                <th style={{ padding: "8px 5px", textAlign: "center", fontWeight: "bold" }}>NO</th>
                <th style={{ padding: "8px 5px", textAlign: "left", fontWeight: "bold" }}>ASET & KODE</th>
                <th style={{ padding: "8px 5px", textAlign: "left", fontWeight: "bold" }}>KATEGORI / LOKASI</th>
                <th style={{ padding: "8px 5px", textAlign: "center", fontWeight: "bold" }}>TGL BELI</th>
                <th style={{ padding: "8px 5px", textAlign: "right", fontWeight: "bold" }}>HARGA PEROLEHAN</th>
                <th style={{ padding: "8px 5px", textAlign: "right", fontWeight: "bold", color: "#009846" }}>NILAI SAAT INI</th>
                <th style={{ padding: "8px 5px", textAlign: "center", fontWeight: "bold" }}>KONDISI</th>
              </tr>
            </thead>
            <tbody>
              {data.length === 0 ? (
                  <tr><td colSpan={7} style={{ padding: "30px", textAlign: "center", borderBottom: "1px solid #eee", fontStyle: "italic", color: "#999" }}>-- Tidak ada data aset --</td></tr>
              ) : (
                  data.map((item, idx) => (
                  <tr key={idx} style={{ borderBottom: "1px solid #eee" }}>
                      <td style={{ padding: "8px 5px", textAlign: "center" }}>{idx + 1}</td>
                      <td style={{ padding: "8px 5px" }}>
                          <div style={{ fontWeight: "bold", color: "#222" }}>{item.name}</div>
                          <div style={{ fontSize: "9px", color: "#888", fontFamily: "monospace" }}>{item.code}</div>
                      </td>
                      <td style={{ padding: "8px 5px" }}>
                          <div>{item.category_name}</div>
                          <div style={{ fontSize: "9px", color: "#666", fontStyle: "italic" }}>{item.location}</div>
                      </td>
                      <td style={{ padding: "8px 5px", textAlign: "center" }}>
                          {item.purchase_date ? new Date(item.purchase_date).toLocaleDateString("id-ID") : "-"}
                      </td>
                      <td style={{ padding: "8px 5px", textAlign: "right", fontFamily: "monospace" }}>
                          {formatRupiah(item.value)}
                      </td>
                      <td style={{ padding: "8px 5px", textAlign: "right", fontFamily: "monospace", fontWeight: "bold" }}>
                          {formatRupiah(item.book_value)}
                      </td>
                      <td style={{ padding: "8px 5px", textAlign: "center" }}>
                           <span style={{ 
                               textTransform: "uppercase", fontSize: "9px", fontWeight: "bold",
                               color: item.condition === 'baik' ? '#166534' : '#991b1b'
                           }}>
                              {item.condition ? item.condition : "-"}
                           </span>
                      </td>
                  </tr>
                  ))
              )}
            </tbody>
            <tfoot>
               <tr style={{ background: "#f1f1f1", borderTop: "2px solid #333" }}>
                  <td colSpan={4} style={{ padding: "10px", textAlign: "right", fontWeight: "bold" }}>TOTAL ASET</td>
                  <td style={{ padding: "10px 5px", textAlign: "right", fontWeight: "bold", fontFamily: "monospace" }}>
                      {formatRupiah(totalVal)}
                  </td>
                  <td style={{ padding: "10px 5px", textAlign: "right", fontWeight: "bold", fontFamily: "monospace", color: "#009846" }}>
                      {formatRupiah(totalBookVal)}
                  </td>
                  <td></td>
               </tr>
            </tfoot>
          </table>

          {/* SIGNATURE */}
          <div style={{ marginTop: "60px", display: "flex", justifyContent: "flex-end" }}>
              <div style={{ textAlign: "center", width: "200px" }}>
                  <p style={{ fontSize: "10px", marginBottom: "70px" }}>Bandung, {printDate}</p>
                  <div style={{ borderTop: "1px solid #333", paddingTop: "5px" }}>
                      <p style={{ fontSize: "10px", fontWeight: "bold", margin: 0 }}>MANAJER OPERASIONAL</p>
                      <p style={{ fontSize: "9px", margin: 0, color: "#666" }}>Sinergi Foundation</p>
                  </div>
              </div>
          </div>
        </div>

        {/* ================= FOOTER (FIXED BOTTOM) ================= */}
        <div style={{ marginTop: "auto", paddingTop: "10px" }}>
          {/* Garis Tipis Pemisah Footer */}
          <div style={{ borderTop: "1px solid #ccc", marginBottom: "8px" }}></div>

          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "8px", color: "#666", lineHeight: "1.4" }}>
              
              {/* Alamat Kiri */}
              <div style={{ width: "45%" }}>
                  <strong style={{ color: "#333", display:"block" }}>KANTOR PUSAT</strong>
                  Jl. Sidomukti No. 99 H, Cibeunying Kaler, Bandung 40123<br/>
                  Telp: (022) 251 3991 / 251 3992<br/>
                  Email: info@sinergifoundation.org
              </div>

              {/* Alamat Kanan */}
              <div style={{ width: "45%", textAlign: "right" }}>
                  <strong style={{ color: "#333", display:"block" }}>KANTOR LAYANAN</strong>
                  Jl. HOS Tjokroaminoto (Pasirkaliki) No. 143, Bandung 40173<br/>
                  Telp: (022) 603 2281 / Fax: (022) 6120130
              </div>

          </div>
        </div>

      </div>
    </>
  );
});

ReportTemplate.displayName = "ReportTemplate";