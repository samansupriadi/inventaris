import { useState } from "react";

function AssetForm({ onCreateAsset }) {
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [location, setLocation] = useState("");
  const [condition, setCondition] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!name || !code) {
      setError("Nama dan kode aset harus diisi");
      return;
    }

    const result = await onCreateAsset({
      name,
      code,
      location,
      condition,
    });

    if (!result.success) {
      setError(result.message || "Gagal menyimpan aset");
      return;
    }

    // reset form kalau sukses
    setName("");
    setCode("");
    setLocation("");
    setCondition("");
  };

  return (
    <div className="bg-white shadow rounded-xl p-4">
      <h2 className="text-xl font-semibold mb-3">Tambah Aset</h2>

      {error && <div className="text-red-600 text-sm mb-2">{error}</div>}

      <form
        onSubmit={handleSubmit}
        className="grid grid-cols-1 md:grid-cols-2 gap-3"
      >
        <input
          className="border rounded p-2"
          placeholder="Nama aset"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <input
          className="border rounded p-2"
          placeholder="Kode aset (unik)"
          value={code}
          onChange={(e) => setCode(e.target.value)}
        />
        <input
          className="border rounded p-2"
          placeholder="Lokasi"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
        />
        <input
          className="border rounded p-2"
          placeholder="Kondisi (baik/rusak)"
          value={condition}
          onChange={(e) => setCondition(e.target.value)}
        />

        <button
          type="submit"
          className="col-span-1 md:col-span-2 bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
        >
          Simpan
        </button>
      </form>
    </div>
  );
}

export default AssetForm;
