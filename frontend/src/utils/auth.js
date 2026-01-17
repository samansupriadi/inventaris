// src/utils/auth.js

/**
 * Mengambil data Auth lengkap dari LocalStorage.
 * Catatan: Ini hanya data PROFIL USER (Nama, Email, Role, Permission) untuk keperluan UI.
 * Token autentikasi (JWT) tidak disimpan di sini, tapi di HttpOnly Cookie (dikelola browser).
 */
export const getAuthData = () => {
  try {
    const authString = localStorage.getItem("auth");
    if (!authString) return null;
    return JSON.parse(authString);
  } catch (error) {
    console.error("Error parsing auth data:", error);
    // Jika data korup, hapus sekalian biar bersih
    localStorage.removeItem("auth");
    return null;
  }
};

/**
 * Helper Cepat: Mengambil User Object yang sedang login
 */
export const getUser = () => {
  const auth = getAuthData();
  return auth?.user || null;
};

/**
 * Helper Utama: Cek apakah user memiliki IZIN (Permission) tertentu.
 * * @param {string | string[]} requiredPermission - Slug permission (contoh: 'view_dashboard' atau ['create_assets', 'edit_assets'])
 * @returns {boolean} True jika punya izin, False jika tidak.
 */
export const hasPermission = (requiredPermission) => {
  const user = getUser();

  // 1. Jika user tidak login (null), tolak akses
  if (!user) return false;

  // 2. Ambil Roles & Permissions dari user object
  // Pastikan backend mengirim struktur ini saat login
  const userRoles = user.roles || []; 
  const userPermissions = user.permissions || []; // Array string: ['view_assets', 'create_assets', ...]

  // 3. SUPER ADMIN BYPASS
  // Jika user punya role 'admin', dia boleh akses APAPUN tanpa cek permission.
  const isAdmin = userRoles.some(r => r.slug === 'admin');
  if (isAdmin) return true;

  // 4. Cek Permission Spesifik
  if (Array.isArray(requiredPermission)) {
    // Jika input array (misal: butuh salah satu dari ['edit_assets', 'delete_assets'])
    // Return true jika user punya SALAH SATU permission tersebut
    return requiredPermission.some((perm) => userPermissions.includes(perm));
  }

  // Jika input string tunggal (misal: 'view_dashboard')
  return userPermissions.includes(requiredPermission);
};

/**
 * Helper: Cek apakah user memiliki Role tertentu (Opsional)
 * Berguna jika ada logika khusus berbasis Role, bukan Permission.
 * @param {string} roleSlug - Slug role (contoh: 'ga', 'finance')
 */
export const hasRole = (roleSlug) => {
  const user = getUser();
  if (!user) return false;
  
  const userRoles = user.roles || [];
  return userRoles.some(r => r.slug === roleSlug);
};