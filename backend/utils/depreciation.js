// backend/utils/depreciation.js

export const calculateBookValue = (asset) => {
  if (!asset.useful_life || asset.useful_life <= 0) return Number(asset.value);

  const purchaseDate = new Date(asset.purchase_date);
  const currentDate = new Date();
  
  // Hitung selisih bulan
  const monthsUsed = (currentDate.getFullYear() - purchaseDate.getFullYear()) * 12 + (currentDate.getMonth() - purchaseDate.getMonth());

  // Masa manfaat dalam bulan
  const totalMonths = asset.useful_life * 12;

  // Jika belum dipakai (masa depan), nilai tetap harga beli
  if (monthsUsed <= 0) return Number(asset.value);

  // Jika sudah habis umur ekonomisnya
  if (monthsUsed >= totalMonths) return Number(asset.residual_value || 0);

  // Rumus Garis Lurus: (Harga Beli - Residu) / Total Bulan
  const depreciationPerMonth = (asset.value - (asset.residual_value || 0)) / totalMonths;
  const totalDepreciation = depreciationPerMonth * monthsUsed;

  const currentBookValue = asset.value - totalDepreciation;

  // Safety check jangan sampai minus
  return Math.max(currentBookValue, Number(asset.residual_value || 0));
};