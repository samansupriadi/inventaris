// src/utils/depreciation.js
export const formatRupiah = (number) => {
  if (!number && number !== 0) return "-";
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0
  }).format(number);
};

export const calculateBookValue = (asset) => {
  if (!asset || !asset.value) return 0;

  const cost = parseFloat(asset.value);
  const lifeYears = parseInt(asset.useful_life) || 0;
  const residual = parseFloat(asset.residual_value) || 0;

  // Jika tanah (umur 0) atau tidak disusutkan
  if (lifeYears === 0) return cost;

  // Hitung selisih bulan
  const purchaseDate = new Date(asset.purchase_date);
  const now = new Date();
  
  let monthsUsed = (now.getFullYear() - purchaseDate.getFullYear()) * 12;
  monthsUsed -= purchaseDate.getMonth();
  monthsUsed += now.getMonth();

  if (monthsUsed < 0) monthsUsed = 0;

  // Rumus Garis Lurus
  const depreciationPerMonth = (cost - residual) / (lifeYears * 12);
  const totalDepreciation = depreciationPerMonth * monthsUsed;

  const currentBookValue = cost - totalDepreciation;

  // Tidak boleh lebih kecil dari residu
  return currentBookValue < residual ? residual : currentBookValue;
};