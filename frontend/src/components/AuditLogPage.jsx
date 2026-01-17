import { useEffect, useState } from "react";
import { API_BASE_URL } from "../api";

function AuditLogPage() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/audit-logs`);
      const data = await res.json();
      if (Array.isArray(data)) {
        setLogs(data);
      } else {
        setLogs([]);
      }
    } catch (err) {
      console.error(err);
      setErrorMsg("Gagal memuat data.");
    } finally {
      setLoading(false);
    }
  };

  const getActionColor = (action) => {
    switch (action) {
      case "CREATE": return "bg-green-100 text-green-800 border-green-200";
      case "UPDATE": return "bg-blue-100 text-blue-800 border-blue-200";
      case "DELETE": return "bg-red-100 text-red-800 border-red-200";
      case "LOGIN":  return "bg-purple-100 text-purple-800 border-purple-200";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  // === 👇 FITUR BARU: FORMATTER JSON AGAR CANTIK 👇 ===
  const renderDetailContent = (details) => {
    if (!details) return <span className="text-slate-300 italic">-</span>;

    // Cek apakah ada key 'changes' (Pola umum dari update aset Anda)
    const dataToShow = details.changes || details; 

    // Jika data kosong object {}
    if (Object.keys(dataToShow).length === 0) return <span className="text-slate-300 italic">Tidak ada perubahan data</span>;

    return (
      <div className="flex flex-col gap-1">
        {Object.entries(dataToShow).map(([key, value]) => {
          // Skip jika value kosong/null biar tidak menuh-menuhin
          if (value === null || value === "") return null;

          return (
            <div key={key} className="flex text-[10px] border-b border-slate-50 last:border-0 pb-1 last:pb-0">
              <span className="font-bold text-slate-500 w-24 capitalize">
                {key.replace(/_/g, " ")}:
              </span>
              <span className="font-medium text-slate-700 flex-1 break-words">
                {typeof value === 'object' ? JSON.stringify(value) : String(value)}
              </span>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="space-y-6 font-sans animate-fade-in">
      <div className="flex justify-between items-center">
        <div>
            <h1 className="text-2xl font-bold text-slate-800">Jejak Aktivitas (Audit Log)</h1>
            <p className="text-xs text-slate-500 mt-1">
            Rekaman keamanan sistem. Data ini tidak dapat diubah atau dihapus.
            </p>
        </div>
        <button 
            onClick={fetchLogs} 
            className="px-3 py-1.5 text-xs font-bold text-slate-600 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
        >
            🔄 Refresh
        </button>
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
                  <th className="p-4 whitespace-nowrap">Waktu</th>
                  <th className="p-4 whitespace-nowrap">User / Aktor</th>
                  <th className="p-4 whitespace-nowrap">Aksi</th>
                  <th className="p-4 whitespace-nowrap">Target</th>
                  <th className="p-4 w-96">Detail Perubahan</th>
                  <th className="p-4 whitespace-nowrap">IP Address</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50 transition-colors align-top">
                    
                    <td className="p-4 whitespace-nowrap text-slate-500 font-mono">
                      {new Date(log.created_at).toLocaleString("id-ID", {
                        day: "numeric", month: "short", year: "numeric",
                        hour: "2-digit", minute: "2-digit"
                      })}
                    </td>

                    <td className="p-4">
                      <div className="font-bold text-slate-700">
                        {log.user_name || "System / Guest"}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {log.user_email || "-"}
                      </div>
                    </td>

                    <td className="p-4">
                      <span className={`inline-block px-2 py-1 rounded text-[10px] font-bold border ${getActionColor(log.action)}`}>
                        {log.action}
                      </span>
                    </td>

                    <td className="p-4">
                      <span className="font-mono text-slate-600 font-semibold">{log.entity_type}</span>
                      <span className="ml-1 text-slate-400">#{log.entity_id}</span>
                    </td>

                    {/* 👇 BAGIAN INI YANG DIUBAH AGAR RAPI 👇 */}
                    <td className="p-4">
                      <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 max-h-40 overflow-y-auto custom-scrollbar">
                        {renderDetailContent(log.details)}
                      </div>
                    </td>

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