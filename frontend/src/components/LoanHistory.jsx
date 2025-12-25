function LoanHistory({ loans }) {
  return (
    <div className="bg-white shadow rounded-xl border border-slate-100 p-4">
      <h2 className="text-xl font-semibold mb-3">
        Riwayat Peminjaman (semua aset)
      </h2>

      {loans.length === 0 ? (
        <p className="text-gray-400 text-sm">
          Belum ada riwayat peminjaman.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-xs md:text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left p-2">Aset</th>
                <th className="text-left p-2">Kode</th>
                <th className="text-left p-2">Peminjam</th>
                <th className="text-left p-2">Dipinjam</th>
                <th className="text-left p-2">Jatuh Tempo</th>
                <th className="text-left p-2">Dikembalikan</th>
                <th className="text-left p-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {loans.map((loan) => (
                <tr key={loan.id} className="border-b">
                  <td className="p-2">{loan.asset_name}</td>
                  <td className="p-2">{loan.asset_code}</td>
                  <td className="p-2">{loan.borrower}</td>
                  <td className="p-2">
                    {loan.borrowed_at
                      ? new Date(loan.borrowed_at).toLocaleString()
                      : "-"}
                  </td>
                  <td className="p-2">
                    {loan.due_date
                      ? new Date(loan.due_date).toLocaleDateString()
                      : "-"}
                  </td>
                  <td className="p-2">
                    {loan.returned_at
                      ? new Date(loan.returned_at).toLocaleString()
                      : "-"}
                  </td>
                  <td className="p-2">
                    <span
                      className={
                        loan.status === "borrowed"
                          ? "text-xs px-2 py-1 rounded bg-orange-100 text-orange-700"
                          : "text-xs px-2 py-1 rounded bg-emerald-100 text-emerald-700"
                      }
                    >
                      {loan.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default LoanHistory;
