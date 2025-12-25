// src/utils/auth.js

// Ambil data user dari localStorage
export const getUser = () => {
  try {
    const auth = localStorage.getItem("auth");
    if (!auth) return null;
    return JSON.parse(auth).user;
  } catch (err) {
    console.error("Error parsing auth data:", err);
    return null;
  }
};

// Cek apakah user punya permission tertentu
export const hasPermission = (permissionSlug) => {
  const user = getUser();
  if (!user) return false;

  // 1. Super Admin Bypass (Jika role slug mengandung 'admin')
  // Ini penting! User seeder 'Super Admin' punya slug 'admin' atau 'super_admin'
  const roles = user.roles || [];
  const isAdmin = roles.some(r => 
    r.slug === 'admin' || 
    r.slug === 'super_admin' || 
    r.slug === 'super-admin'
  );
  
  if (isAdmin) return true;

  // 2. Cek permission spesifik di list permissions user
  const permissions = user.permissions || [];
  return permissions.some(p => p.slug === permissionSlug);
};