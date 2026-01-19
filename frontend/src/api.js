export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:4000";
/**
 * HELPER: Fetch Wrapper untuk JSON Request
 * Otomatis menangani:
 * 1. Base URL
 * 2. Headers (Content-Type: application/json)
 * 3. Credentials (Cookie)
 * 4. Error Handling
 */
async function fetchWithAuth(endpoint, options = {}) {
  // Ambil headers bawaan jika ada
  const headers = { ...options.headers };

  // 👇 LOGIC BARU: Deteksi Tipe Data
  // Jika body ADALAH FormData (File), JANGAN set Content-Type (biar browser yang atur boundary)
  // Jika body BUKAN FormData (JSON biasa), set Content-Type: application/json
  if (!(options.body instanceof FormData) && !headers["Content-Type"]) {
    headers["Content-Type"] = "application/json";
  }

  const config = {
    ...options,
    headers: headers,
    // 👇 PENTING: Kunci agar Cookie dikirim ke backend
    credentials: "include", 
  };

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, config);

    // Handle Error HTTP (4xx, 5xx)
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Request failed with status ${response.status}`);
    }

    return response.json();
  } catch (error) {
    console.error(`API Error (${endpoint}):`, error);
    throw error;
  }
}

/**
 * HELPER: Fetch Wrapper khusus Upload File (FormData)
 * Bedanya: Tidak boleh set Content-Type secara manual (biar browser yang atur boundary)
 */
async function fetchUpload(endpoint, fileKey, file) {
  const formData = new FormData();
  formData.append(fileKey, file);

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    method: "POST",
    body: formData,
    credentials: "include", // Tetap butuh cookie
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || "Gagal upload file");
  }

  return response.json();
}


// ==================================================================
//  AUTHENTICATION
// ==================================================================

export async function login(email, password) {
  return fetchWithAuth("/api/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export async function logoutAPI() {
  return fetchWithAuth("/api/logout", { method: "POST" });
}


// ==================================================================
//  ASSETS MANAGEMENT
// ==================================================================

export async function fetchAssets(entityId = null) {
  let url = "/api/assets";
  if (entityId) url += `?entity_id=${entityId}`;
  return fetchWithAuth(url);
}

export async function createAsset(assetData) {
  return fetchWithAuth("/api/assets", {
    method: "POST",
    body: JSON.stringify(assetData),
  });
}

export async function updateAsset(id, assetData) {
  return fetchWithAuth(`/api/assets/${id}`, {
    method: "PUT",
    body: JSON.stringify(assetData),
  });
}

export async function softDeleteAsset(id) {
  return fetchWithAuth(`/api/assets/${id}`, { method: "DELETE" });
}

export async function restoreAsset(id) {
  return fetchWithAuth(`/api/assets/${id}/restore`, { method: "POST" });
}

// Upload Foto Aset
export async function uploadAssetPhoto(id, file) {
  return fetchUpload(`/api/assets/${id}/photo`, "photo", file);
}

// Upload Kwitansi Aset
export async function uploadAssetReceipt(id, file) {
  return fetchUpload(`/api/assets/${id}/receipt`, "receipt", file);
}

// ==================================================================
//  LOANS (PEMINJAMAN) - UPDATE SUPPORT FOTO
// ==================================================================

export async function fetchLoans() {
  return fetchWithAuth("/api/loans");
}


export async function borrowAsset(assetId, payload) {
  const formData = new FormData();
  
  formData.append("borrower_user_id", payload.borrower_user_id);
  if (payload.usage_location_id) formData.append("usage_location_id", payload.usage_location_id);
  if (payload.due_date) formData.append("due_date", payload.due_date);
  formData.append("notes", payload.notes || "");
  formData.append("detail_location", payload.detail_location || "");
  formData.append("condition_now", payload.condition_now || "baik");

  if (payload.photo) {
    formData.append("photo", payload.photo);
  }

  const response = await fetch(`${API_BASE_URL}/api/assets/${assetId}/borrow`, {
    method: "POST",
    credentials: "include", 
    body: formData,
  });

  if (!response.ok) {
     const err = await response.json();
     throw new Error(err.message || "Gagal memproses peminjaman");
  }
  return response.json();
}

export async function returnAsset(assetId, payload) {
  const formData = new FormData();

  formData.append("condition_after", payload.condition_after);
  if (payload.return_location_id) formData.append("return_location_id", payload.return_location_id);
  formData.append("return_detail_location", payload.return_detail_location || "");
  formData.append("notes_return", payload.notes_return || "");

  if (payload.photo) {
    console.log("📸 [API] Mengirim Foto:", payload.photo.name, payload.photo.size); // <--- CEK CONSOLE BROWSER
    formData.append("photo", payload.photo);
  } else {
    console.warn("⚠️ [API] Tidak ada foto yang dikirim di payload");
  }

  const response = await fetch(`${API_BASE_URL}/api/assets/${assetId}/return`, {
    method: "POST",
    credentials: "include", 
    body: formData,
  });

  if (!response.ok) {
     const err = await response.json();
     throw new Error(err.message || "Gagal memproses pengembalian");
  }
  return response.json();
}



export async function uploadLoanBeforePhoto(loanId, file) {
  return fetchUpload(`/api/loans/${loanId}/before-photo`, "before_photo", file);
}

export async function uploadLoanAfterPhoto(loanId, file) {
  return fetchUpload(`/api/loans/${loanId}/after-photo`, "after_photo", file);
}


// ==================================================================
//  MASTER DATA (CRUD Standard)
// ==================================================================

// --- Funding Sources ---
export async function fetchFundingSources(entityId = null) {
  let url = "/api/funding-sources";
  if (entityId) url += `?entity_id=${entityId}`;
  return fetchWithAuth(url);
}
export async function createFundingSource(data) {
  return fetchWithAuth("/api/funding-sources", { method: "POST", body: JSON.stringify(data) });
}
export async function updateFundingSource(id, data) {
  return fetchWithAuth(`/api/funding-sources/${id}`, { method: "PUT", body: JSON.stringify(data) });
}
export async function deleteFundingSource(id) {
  return fetchWithAuth(`/api/funding-sources/${id}`, { method: "DELETE" });
}

// --- Locations ---
export async function fetchLocations() { return fetchWithAuth("/api/locations"); }
export async function createLocation(data) {
  return fetchWithAuth("/api/locations", { method: "POST", body: JSON.stringify(data) });
}
export async function updateLocation(id, data) {
  return fetchWithAuth(`/api/locations/${id}`, { method: "PUT", body: JSON.stringify(data) });
}
export async function deleteLocation(id) {
  return fetchWithAuth(`/api/locations/${id}`, { method: "DELETE" });
}

// --- Categories ---
export async function fetchCategories() { return fetchWithAuth("/api/categories"); }
export async function createCategory(data) {
  return fetchWithAuth("/api/categories", { method: "POST", body: JSON.stringify(data) });
}
export async function updateCategory(id, data) {
  return fetchWithAuth(`/api/categories/${id}`, { method: "PUT", body: JSON.stringify(data) });
}
export async function deleteCategory(id) {
  return fetchWithAuth(`/api/categories/${id}`, { method: "DELETE" });
}

// --- Entities ---
export async function fetchEntities() { return fetchWithAuth("/api/entities"); }
export async function createEntity(data) {
  return fetchWithAuth("/api/entities", { method: "POST", body: JSON.stringify(data) });
}
export async function updateEntity(id, data) {
  return fetchWithAuth(`/api/entities/${id}`, { method: "PUT", body: JSON.stringify(data) });
}
export async function deleteEntity(id) {
  return fetchWithAuth(`/api/entities/${id}`, { method: "DELETE" });
}

// --- Budget Codes ---
export async function fetchBudgetCodes(fundingSourceId = null) {
  let url = "/api/budget-codes";
  if (fundingSourceId) url += `?funding_source_id=${fundingSourceId}`;
  return fetchWithAuth(url);
}
export async function createBudgetCode(data) {
  return fetchWithAuth("/api/budget-codes", { method: "POST", body: JSON.stringify(data) });
}
export async function updateBudgetCode(id, data) {
  return fetchWithAuth(`/api/budget-codes/${id}`, { method: "PUT", body: JSON.stringify(data) });
}
export async function deleteBudgetCode(id) {
  return fetchWithAuth(`/api/budget-codes/${id}`, { method: "DELETE" });
}


// ==================================================================
//  USER & ACCESS MANAGEMENT (RBAC)
// ==================================================================

// --- Users ---
export async function fetchUsers() { return fetchWithAuth("/api/users"); }
export async function createUser(data) {
  return fetchWithAuth("/api/users", { method: "POST", body: JSON.stringify(data) });
}
export async function updateUser(id, data) {
  return fetchWithAuth(`/api/users/${id}`, { method: "PUT", body: JSON.stringify(data) });
}
export async function deleteUser(id) {
  return fetchWithAuth(`/api/users/${id}`, { method: "DELETE" });
}
export async function restoreUser(id) {
  return fetchWithAuth(`/api/users/${id}/restore`, { method: "POST" });
}

// --- Roles ---
export async function fetchRoles() { return fetchWithAuth("/api/roles"); }
export async function createRole(data) {
  return fetchWithAuth("/api/roles", { method: "POST", body: JSON.stringify(data) });
}
export async function updateRole(id, data) {
  return fetchWithAuth(`/api/roles/${id}`, { method: "PUT", body: JSON.stringify(data) });
}
export async function deleteRole(id) {
  return fetchWithAuth(`/api/roles/${id}`, { method: "DELETE" });
}

// --- Permissions ---
export async function fetchPermissions() { return fetchWithAuth("/api/permissions"); }
export async function createPermission(data) {
  return fetchWithAuth("/api/permissions", { method: "POST", body: JSON.stringify(data) });
}
export async function updatePermission(id, data) {
  return fetchWithAuth(`/api/permissions/${id}`, { method: "PUT", body: JSON.stringify(data) });
}
export async function deletePermission(id) {
  return fetchWithAuth(`/api/permissions/${id}`, { method: "DELETE" });
}

// === IMPORT DATA ===
export async function importAssetsExcel(file) {
  const formData = new FormData();
  formData.append("file", file);

  // Endpoint yang tadi kita buat
  const res = await fetch(`${API_BASE_URL}/api/import/assets`, {
    method: "POST",
    body: formData,
    credentials: "include", // Supaya cookie auth terbawa
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || "Gagal import data");
  }

  return res.json();
}

export async function fetchImportHistory() {
  return fetchWithAuth("/api/import/history");
}

export async function rollbackImport(historyId) {
  return fetchWithAuth(`/api/import/history/${historyId}`, {
    method: "DELETE",
  });
}

// === STOCK OPNAME ===
export async function createOpnameSession(data) {
  return fetchWithAuth("/api/opname", { method: "POST", body: JSON.stringify(data) });
}

export async function fetchOpnameSessions() {
  return fetchWithAuth("/api/opname");
}

export async function fetchOpnameDetail(id) {
  return fetchWithAuth(`/api/opname/${id}`);
}

export async function updateOpnameItem(itemId, data) {
  return fetchWithAuth(`/api/opname/items/${itemId}`, { method: "PUT", body: JSON.stringify(data) });
}

export async function finalizeOpname(id) {
  return fetchWithAuth(`/api/opname/${id}/finalize`, { method: "POST" });
}


// --- MAINTENANCE API ---

export async function fetchMaintenances() {
  return fetchWithAuth("/api/maintenances");
}

export async function fetchMaintenanceByAsset(assetId) {
  return fetchWithAuth(`/api/maintenances/asset/${assetId}`);
}

export async function createMaintenance(payload) {
  return fetchWithAuth("/api/maintenances", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function updateMaintenance(id, payload) {
  const isFormData = payload instanceof FormData;

  return fetchWithAuth(`/api/maintenances/${id}`, {
    method: "PUT",
    // Kalau FormData kirim langsung, kalau JSON stringify dulu
    body: isFormData ? payload : JSON.stringify(payload),
  });
}


export const fetchCurrentUser = async () => {
  try {
    // Kita panggil endpoint /me yang baru dibuat
    // Pastikan 'credentials: include' agar cookie HttpOnly terkirim
    const response = await fetch(`${API_BASE_URL}/api/me`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      // PENTING: Opsi ini wajib ada agar browser mengirim Cookie Token
      credentials: "include", 
    });

    if (!response.ok) {
      // Jika 401/403, berarti session habis
      throw new Error("Session expired");
    }

    const data = await response.json();
    return data.user; // Kembalikan object user baru dari DB
  } catch (error) {
    console.warn("Session check failed:", error);
    throw error;
  }
};

export const scanOpnameItem = async (sessionId, payload) => {
  const res = await fetch(`${API_BASE_URL}/api/opname/sessions/${sessionId}/scan`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include", 
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
      const err = await res.json();
      throw new Error(err.message || "Scan gagal");
  }
  return res.json();
};

// === DASHBOARD API ===
export async function fetchDashboardSummary() {
  return fetchWithAuth("/api/dashboard/summary");
}