// src/components/DashboardPage.jsx
import React from 'react';

function DashboardPage({ assets = [], fundingSummary = [] }) {
  
  // Hitung Statistik
  const totalAssets = assets.length;
  const totalValue = assets.reduce((sum, a) => sum + (Number(a.value) || 0), 0);
  const availableCount = assets.filter(a => a.status === 'available').length;
  const borrowedCount = assets.filter(a => a.status === 'borrowed').length;
  const maintenanceCount = assets.filter(a => a.condition === 'maintenance').length;
  const brokenCount = assets.filter(a => a.condition === 'rusak').length;

  const formatCurrency = (num) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(num);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* HEADER */}
      <div>
        <h2 className="text-2xl font-bold text-slate-800">Dashboard Inventaris</h2>
        <p className="text-slate-500 text-sm mt-1">Ringkasan data aset dan statistik terkini.</p>
      </div>

      {/* KARTU UTAMA (STATISTIK) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Aset */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
          <div>
            <span className="text-xs font-bold text-[#009846] uppercase tracking-wider bg-green-50 px-2 py-1 rounded-md">Total Aset</span>
            <h3 className="text-3xl font-extrabold text-slate-800 mt-3">{totalAssets}</h3>
          </div>
          <p className="text-xs text-slate-400 mt-2">Unit barang terdaftar</p>
        </div>

        {/* Total Nilai */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
          <div>
            <span className="text-xs font-bold text-blue-600 uppercase tracking-wider bg-blue-50 px-2 py-1 rounded-md">Total Nilai</span>
            <h3 className="text-2xl font-extrabold text-slate-800 mt-3 truncate" title={formatCurrency(totalValue)}>
              {formatCurrency(totalValue)}
            </h3>
          </div>
          <p className="text-xs text-slate-400 mt-2">Estimasi valuasi aset</p>
        </div>

        {/* Tersedia */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
          <div>
            <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider bg-emerald-50 px-2 py-1 rounded-md">Tersedia</span>
            <h3 className="text-3xl font-extrabold text-slate-800 mt-3">{availableCount}</h3>
          </div>
          <p className="text-xs text-slate-400 mt-2">Siap digunakan/dipinjam</p>
        </div>

        {/* Sedang Dipinjam */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
          <div>
            <span className="text-xs font-bold text-orange-600 uppercase tracking-wider bg-orange-50 px-2 py-1 rounded-md">Sedang Dipinjam</span>
            <h3 className="text-3xl font-extrabold text-slate-800 mt-3">{borrowedCount}</h3>
          </div>
          <p className="text-xs text-slate-400 mt-2">Barang di luar gudang</p>
        </div>
      </div>

      {/* SECTION BAWAH: STATUS KONDISI & SUMBER DANA */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Card Kondisi Aset */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
          <h4 className="text-lg font-bold text-slate-800 mb-4">Kondisi Aset</h4>
          <div className="space-y-4">
            {/* Bar Maintenance */}
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-slate-600">Maintenance / Perbaikan</span>
                <span className="font-bold text-slate-800">{maintenanceCount}</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2.5">
                <div 
                  className="bg-yellow-400 h-2.5 rounded-full" 
                  style={{ width: `${(maintenanceCount / totalAssets) * 100}%` }}
                ></div>
              </div>
            </div>

            {/* Bar Rusak */}
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-slate-600">Rusak / Tidak Layak</span>
                <span className="font-bold text-slate-800">{brokenCount}</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2.5">
                <div 
                  className="bg-red-500 h-2.5 rounded-full" 
                  style={{ width: `${(brokenCount / totalAssets) * 100}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>

        {/* Card Sumber Dana (Opsional, jika ada data) */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
          <h4 className="text-lg font-bold text-slate-800 mb-4">Aset per Sumber Dana</h4>
          <div className="overflow-y-auto max-h-48 pr-2 custom-scrollbar space-y-3">
            {fundingSummary.map((fs) => (
              <div key={fs.id} className="flex items-center justify-between p-3 rounded-lg border border-slate-50 hover:bg-slate-50 transition-colors">
                <div>
                  <div className="text-sm font-medium text-slate-700">{fs.name}</div>
                  <div className="text-xs text-slate-400">{fs.count} unit</div>
                </div>
                <div className="text-sm font-bold text-slate-600">
                  {formatCurrency(fs.totalValue)}
                </div>
              </div>
            ))}
            {fundingSummary.length === 0 && (
                <p className="text-sm text-slate-400 text-center py-4">Belum ada data sumber dana.</p>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}

export default DashboardPage;