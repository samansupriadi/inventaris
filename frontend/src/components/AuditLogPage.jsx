// src/pages/AuditLogPage.jsx
import { useEffect, useState } from "react";
import { API_BASE_URL } from "../api"; // Sesuaikan path api config

function AuditLogPage() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/audit-logs`);
      const data = await res.json();
      setLogs(data);
    } catch (err) {
      console.error("Gagal load logs", err);
    } finally {
      setLoading(false);
    }
  };

  // Helper warna badge aksi
  const getActionColor = (action) => {
    switch (action) {
      case "CREATE": return "bg-green-100 text-green-800 border-green-200";
      case "UPDATE": return "bg-blue-100 text-blue-800 border-blue-200";
      case "DELETE": return "bg-red-100 text-red-800 border-red-200";
      case "LOGIN":  return "bg-purple-100 text-purple-800 border-purple-200";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="space-y-6 font-sans animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Jejak Aktivitas (Audit Log)</h1>
        <p className="text-xs text-slate-500 mt-1">
          Rekaman keamanan sistem. Data ini tidak dapat diubah atau dihapus.
        </p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-500 text-sm">Memuat rekaman...</div>
        ) : logs.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-sm">Belum ada aktivitas terekam.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 text-slate-600 font-bold uppercase border-b border-slate-200">
                <tr>
                  <th className="p-4">Waktu</th>
                  <th className="p-4">User / Aktor</th>
                  <th className="p-4">Aksi</th>
                  <th className="p-4">Target</th>
                  <th className="p-4">Detail Perubahan</th>
                  <th className="p-4">IP Address</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                    
                    {/* WAKTU */}
                    <td className="p-4 whitespace-nowrap text-slate-500">
                      {new Date(log.created_at).toLocaleString("id-ID", {
                        day: "numeric", month: "short", year: "numeric",
                        hour: "2-digit", minute: "2-digit", second: "2-digit"
                      })}
                    </td>

                    {/* USER */}
                    <td className="p-4">
                      <div className="font-bold text-slate-700">
                        {log.user_name || "System / Guest"}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {log.user_email || "-"}
                      </div>
                    </td>

                    {/* AKSI */}
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded text-[10px] font-bold border ${getActionColor(log.action)}`}>
                        {log.action}
                      </span>
                    </td>

                    {/* TARGET */}
                    <td className="p-4">
                      <span className="font-mono text-slate-600 font-semibold">{log.entity_type}</span>
                      <span className="ml-1 text-slate-400">#{log.entity_id}</span>
                    </td>

                    {/* DETAIL (JSON) */}
                    <td className="p-4">
                      <div className="max-w-xs max-h-20 overflow-y-auto custom-scrollbar bg-slate-50 p-2 rounded border border-slate-100 font-mono text-[10px] text-slate-600">
                        {JSON.stringify(log.details, null, 2)}
                      </div>
                    </td>

                    {/* IP */}
                    <td className="p-4 text-slate-400 font-mono text-[10px]">
                      {log.ip_address || "-"}
                    </td>

                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default AuditLogPage;