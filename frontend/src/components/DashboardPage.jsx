// src/components/DashboardPage.jsx
import React, { useEffect, useState } from 'react';
import { fetchDashboardSummary } from "../api";
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';
import { Line } from 'react-chartjs-2';

// Register ChartJS
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

function DashboardPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Fetch Data dari Endpoint Cerdas tadi
  useEffect(() => {
    const loadDashboard = async () => {
      try {
        // Asumsi fetchWithAuth sudah ada di api.js
        // URL-nya mengarah ke /api/dashboard/summary
        const res = await fetchDashboardSummary();
        setData(res);
      } catch (error) {
        console.error("Gagal load dashboard:", error);
      } finally {
        setLoading(false);
      }
    };
    loadDashboard();
  }, []);

  const formatCurrency = (num) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(num);
  };

  if (loading) return <div className="p-8 text-center text-slate-500">Sedang menganalisa data...</div>;
  if (!data) return <div className="p-8 text-center text-red-500">Gagal memuat data.</div>;

  const { stats, funding, wisdom, knowledge } = data;

  // Konfigurasi Chart Tren Opname
  const chartData = {
    labels: knowledge.opname_history.map(k => new Date(k.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })),
    datasets: [
      {
        label: 'Akurasi Audit (%)',
        data: knowledge.opname_history.map(k => k.accuracy),
        borderColor: 'rgb(37, 99, 235)',
        backgroundColor: 'rgba(37, 99, 235, 0.5)',
        tension: 0.3,
      },
    ],
  };

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      
      {/* HEADER */}
      <div>
        <h2 className="text-2xl font-bold text-slate-800">Executive Dashboard</h2>
        <p className="text-slate-500 text-sm mt-1">Analisa performa aset & rekomendasi tindakan.</p>
      </div>

      {/* --- SECTION 1: WISDOM (REKOMENDASI AKSI) --- */}
      {/* Ini fitur "Killer" buat Atasan */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        
        {/* Widget 1: Audit Alert */}
        <div className={`p-4 rounded-xl border-l-4 shadow-sm flex items-start gap-4 ${wisdom.audit_alerts.length > 0 ? 'bg-red-50 border-red-500' : 'bg-green-50 border-green-500'}`}>
          <div className="text-2xl">{wisdom.audit_alerts.length > 0 ? '🚨' : '✅'}</div>
          <div>
            <h4 className={`font-bold ${wisdom.audit_alerts.length > 0 ? 'text-red-700' : 'text-green-700'}`}>
              {wisdom.audit_alerts.length > 0 ? 'Tindakan Diperlukan: Audit Lokasi' : 'Kepatuhan Audit Aman'}
            </h4>
            <p className="text-sm text-slate-600 mt-1">
              {wisdom.audit_alerts.length > 0 
                ? `Lokasi berikut belum diaudit >6 bulan: ${wisdom.audit_alerts.map(l => l.name).join(', ')}.`
                : 'Semua lokasi telah diaudit secara berkala.'}
            </p>
          </div>
        </div>

        {/* Widget 2: Rekomendasi Peremajaan */}
        <div className={`p-4 rounded-xl border-l-4 shadow-sm flex items-start gap-4 ${wisdom.replacement_needed > 0 ? 'bg-yellow-50 border-yellow-500' : 'bg-blue-50 border-blue-500'}`}>
          <div className="text-2xl">💡</div>
          <div>
            <h4 className="font-bold text-slate-800">Analisa Peremajaan Aset</h4>
            <p className="text-sm text-slate-600 mt-1">
              Sistem mendeteksi <strong>{wisdom.replacement_needed} aset tua (&gt; 5 tahun) & rusak</strong> yang sebaiknya dihapus buku
            </p>
          </div>
        </div>
      </div>

      {/* --- SECTION 2: UNDERSTANDING (FINANCIAL & STATS) --- */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Aset */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <span className="text-xs font-bold text-[#009846] bg-green-50 px-2 py-1 rounded-md">TOTAL ASET</span>
          <h3 className="text-3xl font-extrabold text-slate-800 mt-3">{stats.total_assets}</h3>
          <p className="text-xs text-slate-400 mt-1">Unit terdaftar</p>
        </div>

        {/* Total Nilai */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded-md">VALUASI</span>
          <h3 className="text-2xl font-extrabold text-slate-800 mt-3 truncate">{formatCurrency(stats.total_value)}</h3>
          <p className="text-xs text-slate-400 mt-1">Total nilai buku</p>
        </div>

        {/* Aset Hilang (Critical) */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <span className="text-xs font-bold text-red-600 bg-red-50 px-2 py-1 rounded-md">ASET HILANG</span>
          <h3 className="text-3xl font-extrabold text-red-600 mt-3">{stats.hilang}</h3>
          <p className="text-xs text-slate-400 mt-1">Perlu investigasi</p>
        </div>

        {/* Aset Rusak */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <span className="text-xs font-bold text-orange-600 bg-orange-50 px-2 py-1 rounded-md">RUSAK / MAINTENANCE</span>
          <h3 className="text-3xl font-extrabold text-slate-800 mt-3">{Number(stats.rusak)}</h3>
          <p className="text-xs text-slate-400 mt-1">Tidak produktif</p>
        </div>
      </div>

      {/* --- SECTION 3: KNOWLEDGE (TREN & DATA) --- */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Chart Tren Opname */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm lg:col-span-2">
          <h4 className="text-lg font-bold text-slate-800 mb-4">Tren Kualitas Data (Akurasi Opname)</h4>
          <div className="h-64">
            {knowledge.opname_history.length > 0 ? (
               <Line options={{ responsive: true, maintainAspectRatio: false }} data={chartData} />
            ) : (
               <div className="h-full flex items-center justify-center text-slate-400 text-sm">Belum ada data history opname.</div>
            )}
          </div>
        </div>

        {/* Sumber Dana (Scrollable) */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
          <h4 className="text-lg font-bold text-slate-800 mb-4">Breakdown Sumber Dana</h4>
          <div className="overflow-y-auto max-h-64 pr-2 custom-scrollbar space-y-3">
            {funding.map((fs, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 rounded-lg border border-slate-50 hover:bg-slate-50">
                <div>
                  <div className="text-sm font-medium text-slate-700">{fs.name}</div>
                  <div className="text-xs text-slate-400">{fs.count} unit</div>
                </div>
                <div className="text-sm font-bold text-slate-600">{formatCurrency(fs.total_value)}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

    </div>
  );
}

export default DashboardPage;