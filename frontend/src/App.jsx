// src/App.jsx
import { useEffect, useState } from "react";
import {
  login,
  fetchAssets,
  fetchLoans,
  createAsset,
  uploadAssetPhoto,
  borrowAsset,
  returnAsset,
  fetchFundingSources,
  createFundingSource,
  updateFundingSource,
  deleteFundingSource,
  fetchLocations,
  createLocation,
  updateLocation,
  deleteLocation,
  uploadAssetReceipt,
  fetchCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  fetchUsers,
  createUser,
  updateUser,
  deleteUser,
  fetchRoles,
  fetchEntities,
  createEntity,
  updateEntity,
  deleteEntity,
  fetchPermissions,
  createRole,
  updateRole,
  deleteRole,
  createPermission,
  updatePermission,
  deletePermission,
  uploadLoanBeforePhoto,
  uploadLoanAfterPhoto,
  updateAsset,
  softDeleteAsset,
  API_BASE_URL,
  logoutAPI,
} from "./api";

// COMPONENTS
import LoginPage from "./components/LoginPage";
import Sidebar from "./components/Sidebar";
import Header from "./components/Header"; // Pastikan sudah buat Header.jsx
import AssetDetailModal from "./components/AssetDetailModal";
import AddAssetModal from "./components/AddAssetModal";
import FundingSourcePage from "./components/FundingSourcePage";
import LocationPage from "./components/LocationPage";
import CategoryPage from "./components/CategoryPage";
import UserPage from "./components/UserPage";
import EntityPage from "./components/EntityPage";
import PermissionPage from "./components/PermissionPage";
import RolePage from "./components/RolePage";
import QrPrintSheet from "./components/QrPrintSheet.jsx";
import DashboardPage from "./components/DashboardPage.jsx";
import AssetsPage from "./components/AssetsPage.jsx";
import BorrowAssetModal from "./components/BorrowAssetModal";
import ReturnAssetModal from "./components/ReturnAssetModal";
import ImportPage from "./components/ImportPage";
import StockOpnamePage from "./components/StockOpnamePage"; 

function App() {
  // STATE DATA UTAMA
  const [assets, setAssets] = useState([]);
  const [loans, setLoans] = useState([]);
  const [fundingSources, setFundingSources] = useState([]);
  const [locations, setLocations] = useState([]);
  const [categories, setCategories] = useState([]);
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [permissions, setPermissions] = useState([]);
  const [entities, setEntities] = useState([]);

  // STATE UI
  const [loading, setLoading] = useState(true);
  const [activeMenu, setActiveMenu] = useState("dashboard"); // Default ke Dashboard
  const [previewUrl, setPreviewUrl] = useState(null);
  const [selectedAsset, setSelectedAsset] = useState(null);
  
  // MODAL STATES
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editAssetTarget, setEditAssetTarget] = useState(null);
  const [borrowModalOpen, setBorrowModalOpen] = useState(false);
  const [borrowAssetTarget, setBorrowAssetTarget] = useState(null);
  const [borrowLoading, setBorrowLoading] = useState(false);
  const [returnModalOpen, setReturnModalOpen] = useState(false);
  const [returnAssetTarget, setReturnAssetTarget] = useState(null);
  const [returnLoading, setReturnLoading] = useState(false);
  
  // PRINT & SIDEBAR STATES
  const [qrPrintAssets, setQrPrintAssets] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false); // Untuk Mobile

  // FILTER STATES
  const [selectedFundingFilter, setSelectedFundingFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [filterCondition, setFilterCondition] = useState("");
  const [filterLocation, setFilterLocation] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterYear, setFilterYear] = useState("");

  // PAGINATION
  const [assetPage, setAssetPage] = useState(1);
  const ASSET_PAGE_SIZE = 10;

  // ---------- AUTHENTICATION ----------
  const [auth, setAuth] = useState(() => {
    const saved = localStorage.getItem("auth");
    if (!saved) return { user: null, isLoggedIn: false };
    try {
      return JSON.parse(saved);
    } catch {
      return { user: null, isLoggedIn: false };
    }
  });

  const isLoggedIn = !!auth.user && auth.isLoggedIn;

  const handleLogin = async (email, password) => {
    try {
      const data = await login(email, password);
      
      const newAuth = {
        user: data.user,
        isLoggedIn: true,
      };
      
      setAuth(newAuth);
      localStorage.setItem("auth", JSON.stringify(newAuth));
      setAssetPage(1);
      
    } catch (err) {
      console.error(err);
      alert(err.message || "Gagal login");
      throw err;
    }
  };

  const handleLogout = async () => {
    try {
      await logoutAPI();
    } catch (error) {
      console.error("Logout server error (ignored)", error);
    } finally {
      setAuth({ user: null, isLoggedIn: false });
      localStorage.removeItem("auth");
      
      // Clear all data
      setAssets([]);
      setLoans([]);
      setFundingSources([]);
      setLocations([]);
      setCategories([]);
      setUsers([]);
      setRoles([]);
      setPermissions([]);
      setEntities([]);
      setAssetPage(1);
    }
  };

  // ---------- DATA LOADERS ----------
  const loadLocations = async () => {
    try {
      const data = await fetchLocations();
      setLocations(data);
    } catch (err) { console.error(err); }
  };

  const loadPermissions = async () => {
    try {
      const data = await fetchPermissions();
      setPermissions(data);
    } catch (err) { console.error(err); }
  };

  const loadAssets = async () => {
    setLoading(true);
    try {
      const entityId = auth.user?.entity?.id || null;
      const data = await fetchAssets(entityId);
      setAssets(data);
    } finally {
      setLoading(false);
    }
  };

  const loadEntities = async () => {
    try {
      const data = await fetchEntities();
      setEntities(data);
    } catch (err) { console.error(err); }
  };

  const loadLoans = async () => {
    try {
        const data = await fetchLoans();
        setLoans(data);
    } catch (err) { console.error(err); }
  };

  const loadFundingSources = async () => {
    try {
      const entityId = auth.user?.entity?.id || null;
      const data = await fetchFundingSources(entityId);
      setFundingSources(data);
    } catch (err) { console.error(err); }
  };

  const loadCategories = async () => {
    try {
      const data = await fetchCategories();
      setCategories(data);
    } catch (err) { console.error(err); }
  };

  const loadUsers = async () => {
    try {
      const data = await fetchUsers();
      setUsers(data);
    } catch (err) { console.error(err); }
  };

  const loadRoles = async () => {
    try {
      const data = await fetchRoles();
      setRoles(data);
    } catch (err) { console.error(err); }
  };

  // Load data saat login berhasil

  const refreshAllData = async () => {
    // Set loading true sebentar (opsional, biar user tau ada proses refresh)
    // setLoading(true); 
    
    await Promise.all([
      loadAssets(),
      loadLoans(),
      loadFundingSources(),
      loadLocations(),
      loadCategories(),
      loadUsers(),
      loadRoles(),
      loadEntities(),
      loadPermissions()
    ]);
    
    // setLoading(false);
  };

  useEffect(() => {
    if (!isLoggedIn) return;
    refreshAllData();
  }, [isLoggedIn]);


  // ---------- CRUD HANDLERS (ROLES, PERMISSION, LOCATION, ETC) ----------

  // ROLE
  const handleCreateRole = async (payload) => {
    const created = await createRole(payload);
    await loadRoles();
    return created;
  };
  const handleUpdateRole = async (id, payload) => {
    const updated = await updateRole(id, payload);
    await loadRoles();
    return updated;
  };
  const handleDeleteRole = async (id) => {
    await deleteRole(id);
    await loadRoles();
  };

  // PERMISSION
  const handleCreatePermission = async (payload) => {
    const created = await createPermission(payload);
    setPermissions((prev) => [...prev, created]);
  };
  const handleUpdatePermission = async (id, payload) => {
    const updated = await updatePermission(id, payload);
    setPermissions((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
  };
  const handleDeletePermission = async (id) => {
    await deletePermission(id);
    setPermissions((prev) => prev.filter((p) => p.id !== id));
  };

  // LOCATION
  const handleCreateLocation = async (payload) => {
    const created = await createLocation(payload);
    setLocations((prev) => [...prev, created]);
  };
  const handleUpdateLocation = async (id, payload) => {
    const updated = await updateLocation(id, payload);
    setLocations((prev) => prev.map((l) => (l.id === updated.id ? updated : l)));
  };
  const handleDeleteLocation = async (id) => {
    await deleteLocation(id);
    setLocations((prev) => prev.filter((l) => l.id !== id));
  };

  // CATEGORY
  const handleCreateCategory = async (payload) => {
    const created = await createCategory(payload);
    setCategories((prev) => [...prev, created]);
  };
  const handleUpdateCategory = async (id, payload) => {
    const updated = await updateCategory(id, payload);
    setCategories((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
  };
  const handleDeleteCategory = async (id) => {
    await deleteCategory(id);
    setCategories((prev) => prev.filter((c) => c.id !== id));
  };

  // USER
  const handleCreateUser = async (payload) => {
    const created = await createUser(payload);
    await loadUsers();
    return created;
  };
  const handleUpdateUser = async (id, payload) => {
    const updated = await updateUser(id, payload);
    await loadUsers();
    return updated;
  };
  const handleDeleteUser = async (id) => {
    await deleteUser(id);
    await loadUsers();
  };

  // ENTITY
  const handleCreateEntity = async (payload) => {
    const created = await createEntity(payload);
    setEntities((prev) => [...prev, created]);
  };
  const handleUpdateEntity = async (id, payload) => {
    const updated = await updateEntity(id, payload);
    setEntities((prev) => prev.map((e) => (e.id === updated.id ? updated : e)));
  };
  const handleDeleteEntity = async (id) => {
    await deleteEntity(id);
    setEntities((prev) => prev.filter((e) => e.id !== id));
  };

  // FUNDING SOURCE
  const handleCreateFundingSource = async (payload) => {
    const created = await createFundingSource(payload);
    setFundingSources((prev) => [...prev, created]);
  };
  const handleUpdateFundingSource = async (id, payload) => {
    const updated = await updateFundingSource(id, payload);
    setFundingSources((prev) => prev.map((f) => (f.id === updated.id ? updated : f)));
  };
  const handleDeleteFundingSource = async (id) => {
    await deleteFundingSource(id);
    setFundingSources((prev) => prev.filter((f) => f.id !== id));
  };


  // ---------- ASSET ACTIONS (CREATE, EDIT, DELETE) ----------
  
  const handleCreateAsset = async (payload, photoFile, receiptFile) => {
    try {
      let newAsset = await createAsset(payload);
      if (photoFile) newAsset = await uploadAssetPhoto(newAsset.id, photoFile);
      if (receiptFile) newAsset = await uploadAssetReceipt(newAsset.id, receiptFile);
      
      setAssets((prev) => [newAsset, ...prev]);
      return { success: true };
    } catch (err) {
      console.error(err);
      return { success: false, message: err.message };
    }
  };

  const handleOpenEdit = (asset) => {
    setEditAssetTarget(asset);
    setEditModalOpen(true);
  };

  const handleSubmitEdit = async (id, payload, photoFile, receiptFile) => {
    try {
      let updated = await updateAsset(id, payload);
      if (photoFile) updated = await uploadAssetPhoto(updated.id, photoFile);
      if (receiptFile) updated = await uploadAssetReceipt(updated.id, receiptFile);

      setAssets((prev) => prev.map((a) => (a.id === updated.id ? updated : a)));
      setEditModalOpen(false);
      setEditAssetTarget(null);
      return { success: true };
    } catch (err) {
      return { success: false, message: err.message };
    }
  };

  const handleDeleteAsset = async (asset) => {
    try {
      await softDeleteAsset(asset.id);
      setAssets((prev) => prev.filter((a) => a.id !== asset.id));
    } catch (err) {
      alert(err.message);
    }
  };


  // ---------- BORROW & RETURN ----------
  
  const handleBorrow = (asset) => {
    setBorrowAssetTarget(asset);
    setBorrowModalOpen(true);
  };

  const handleSubmitBorrow = async (payload) => {
    try {
      setBorrowLoading(true);
      const res = await borrowAsset(borrowAssetTarget.id, {
        borrower_user_id: payload.borrower_user_id,
        usage_location_id: payload.usage_location_id,
        due_date: payload.due_date || null,
        detail_location: payload.detail_location,
        notes: payload.notes,
        condition_now: payload.condition_now
      });

      if (payload.photo && res?.loan?.id) {
        await uploadLoanBeforePhoto(res.loan.id, payload.photo);
      }

      // Optimistic Update
      if (res?.asset?.id) {
        setAssets((prev) => prev.map((a) => (a.id === res.asset.id ? res.asset : a)));
      } else {
        await loadAssets(); 
      }
      await loadLoans();

      setBorrowModalOpen(false);
      setBorrowAssetTarget(null);
    } catch (err) {
      alert(err.message);
    } finally {
      setBorrowLoading(false);
    }
  };

  const handleReturn = (asset) => {
    setReturnAssetTarget(asset);
    setReturnModalOpen(true);
  };

  const handleSubmitReturn = async (payload) => {
    try {
      setReturnLoading(true);
      const res = await returnAsset(returnAssetTarget.id, {
        condition_after: payload.condition_after,
        update_asset_location: payload.update_asset_location,
        return_location_id: payload.return_location_id,
        return_detail_location: payload.return_detail_location,
        notes_return: payload.notes_return
      });

      if (payload.photo && res?.loan?.id) {
        await uploadLoanAfterPhoto(res.loan.id, payload.photo);
      }

      if (res?.asset?.id) {
        setAssets((prev) => prev.map((a) => (a.id === res.asset.id ? res.asset : a)));
      } else {
        await loadAssets();
      }
      await loadLoans();

      setReturnModalOpen(false);
      setReturnAssetTarget(null);
    } catch (err) {
      alert(err.message);
    } finally {
      setReturnLoading(false);
    }
  };


  // ---------- FILTER & PAGINATION LOGIC ----------
  
  // Handler Filter Changes
  const handleCategoryChange = (val) => { setFilterCategory(val); setAssetPage(1); };
  const handleStatusChange = (val) => { setFilterStatus(val); setAssetPage(1); };
  const handleYearChange = (val) => { setFilterYear(val); setAssetPage(1); };
  const handleSearchChange = (val) => { setSearch(val); setAssetPage(1); };
  const handleConditionChange = (val) => { setFilterCondition(val); setAssetPage(1); };
  const handleLocationChange = (val) => { setFilterLocation(val); setAssetPage(1); };
  const handleFundingFilterChange = (val) => { setSelectedFundingFilter(val); setAssetPage(1); };
  const handleResetFilters = () => {
    setSearch("");
    setFilterCondition("");
    setFilterLocation("");
    setSelectedFundingFilter("all");
    setFilterCategory("");
    setFilterStatus("");
    setFilterYear("");
    setAssetPage(1);
  };

  // Filter Computation
  const filteredAssets = assets.filter((a) => {
    const searchLower = search.toLowerCase();
    const matchesFunding = selectedFundingFilter === "all" || String(a.funding_source_id) === String(selectedFundingFilter);
    const matchesSearch = searchLower === "" || (a.name || "").toLowerCase().includes(searchLower) || (a.code || "").toLowerCase().includes(searchLower);
    const matchesCondition = filterCondition === "" || (a.condition || "").toLowerCase() === filterCondition.toLowerCase();
    const matchesLocation = filterLocation === "" || String(a.location_id) === String(filterLocation);
    const matchesCategory = filterCategory === "" || String(a.category_id) === String(filterCategory);
    const matchesStatus = filterStatus === "" || (a.status || "").toLowerCase() === filterStatus.toLowerCase();
    const matchesYear = filterYear === "" || (a.created_at && new Date(a.created_at).getFullYear().toString() === filterYear);

    return matchesFunding && matchesSearch && matchesCondition && matchesLocation && matchesCategory && matchesStatus && matchesYear;
  });

  const totalAssetPages = filteredAssets.length === 0 ? 1 : Math.ceil(filteredAssets.length / ASSET_PAGE_SIZE);
  
  useEffect(() => {
    if (assetPage > totalAssetPages) setAssetPage(totalAssetPages);
  }, [assetPage, totalAssetPages]);

  // Asset Years for Filter
  const assetYears = Array.from(new Set(assets.map((a) => a.created_at ? new Date(a.created_at).getFullYear().toString() : null).filter(Boolean))).sort((a, b) => b.localeCompare(a));

  // Funding Summary for Dashboard
  const fundingSummary = fundingSources.map((fs) => {
    const asetFs = assets.filter((a) => a.funding_source_id === fs.id);
    const totalValue = asetFs.reduce((sum, a) => {
      const v = Number(a.value);
      return Number.isNaN(v) ? sum : sum + v;
    }, 0);
    return { id: fs.id, name: fs.name, count: asetFs.length, totalValue };
  });


  // ---------- EXPORT CSV & PRINT QR ----------
  
  const handlePrintQr = (asset) => setQrPrintAssets([asset]);
  const handleBulkPrintQr = () => setQrPrintAssets(filteredAssets);

  const handleExportCsv = () => {
    const rows = filteredAssets;
    if (!rows.length) {
      alert("Tidak ada data aset untuk diexport.");
      return;
    }

    const getFundingName = (id) => fundingSources.find((x) => x.id === id)?.name || "-";
    const formatDate = (dateString) => dateString ? new Date(dateString).toLocaleDateString("id-ID") : "";
    const getFullUrl = (path) => (!path ? "" : path.startsWith("http") ? path : `${API_BASE_URL}${path}`);

    const header = ["Nama Aset", "Kode Aset", "Kategori", "Lokasi", "Detail Lokasi", "Kondisi", "Status", "Sumber Dana", "Nilai (Rp)", "Tanggal Pembelian", "Link Foto", "Link Kwitansi"];
    const csvRows = [header];

    rows.forEach((a) => {
      const locName = locations.find(l => l.id === a.location_id)?.name || "-";
      const catName = categories.find(c => c.id === a.category_id)?.name || "-";
      csvRows.push([
        a.name || "", a.code || "", catName, locName, a.location || "", 
        a.condition || "", a.status || "", getFundingName(a.funding_source_id), 
        a.value ? String(a.value) : "0", formatDate(a.purchase_date || a.created_at),
        getFullUrl(a.photo_url), getFullUrl(a.receipt_url)
      ]);
    });

    const csvString = csvRows.map(row => row.map(cell => `"${String(cell ?? "").replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob(["\uFEFF" + csvString], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `Data_Aset_SF_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };


  // ---------- RENDER ----------
  
  if (!isLoggedIn) {
    return <LoginPage onLoginSuccess={handleLogin} />;
  }

  // Helper untuk title header dinamis
  const getPageTitle = () => {
      switch(activeMenu) {
          case 'dashboard': return "Executive Dashboard";
          case 'assets': return "Manajemen Aset";
          case 'funding': return "Sumber Dana";
          case 'entities': return "Entitas & Unit";
          case 'locations': return "Lokasi Aset";
          case 'categories': return "Kategori Aset";
          case 'roles': return "Roles & Hak Akses";
          case 'users': return "Manajemen Pengguna";
          case 'permissions': return "System Permissions";
          default: return "Sinergi Foundation Inventaris";
      }
  };

  // ---------- UPLOAD FOTO (LANGSUNG DARI TABEL) ----------
  const handleUploadPhoto = async (assetId, event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const updated = await uploadAssetPhoto(assetId, file);
      
      // Update state assets agar foto langsung muncul tanpa refresh
      setAssets((prev) =>
        prev.map((a) => (a.id === updated.id ? updated : a))
      );
    } catch (err) {
      console.error(err);
      alert(err.message || "Gagal upload foto");
    } finally {
      // Reset input file agar bisa upload file yang sama jika perlu
      event.target.value = "";
    }
  };

  return (
    <div className="flex h-screen bg-slate-50 font-sans overflow-hidden">
      
      {/* SIDEBAR (Desktop: Visible, Mobile: Toggle) */}
      <div className={`
        fixed inset-y-0 left-0 z-30 transform transition-transform duration-300 md:relative md:translate-x-0
        ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
      `}>
         <Sidebar 
           activeMenu={activeMenu} 
           onChange={(id) => { 
             setActiveMenu(id); 
             setSidebarOpen(false); 
           }} 
         />
      </div>

      {/* OVERLAY MOBILE */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-20 md:hidden backdrop-blur-sm"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 flex flex-col h-full overflow-hidden relative">
        
        {/* HEADER MEWAH */}
        <Header 
          title={getPageTitle()}
          onLogout={handleLogout}
          onToggleSidebar={() => setSidebarOpen(true)}
        />

        {/* SCROLLABLE CONTENT */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8 custom-scrollbar">
          <div className="max-w-7xl mx-auto space-y-6 pb-10">
            
            {/* VIEW QR PRINT MODE */}
            {qrPrintAssets ? (
              <QrPrintSheet
                assets={qrPrintAssets}
                fundingSources={fundingSources}
                locations={locations}
                categories={categories}
                onBack={() => setQrPrintAssets(null)}
              />
            ) : (
              // VIEW REGULAR PAGES
              <>
                {activeMenu === "dashboard" && (
                  <DashboardPage
                    assets={assets}
                    fundingSummary={fundingSummary}
                  />
                )}

                {activeMenu === "assets" && (
                  <AssetsPage
                    assets={filteredAssets}
                    loading={loading}
                    fundingSources={fundingSources}
                    locations={locations}
                    categories={categories}
                    search={search}
                    filterCondition={filterCondition}
                    filterLocation={filterLocation}
                    selectedFundingFilter={selectedFundingFilter}
                    filterCategory={filterCategory}
                    filterStatus={filterStatus}
                    filterYear={filterYear}
                    years={assetYears}
                    onSearchChange={handleSearchChange}
                    onConditionChange={handleConditionChange}
                    onLocationChange={handleLocationChange}
                    onFundingFilterChange={handleFundingFilterChange}
                    onCategoryChange={handleCategoryChange}
                    onStatusChange={handleStatusChange}
                    onYearChange={handleYearChange}
                    onResetFilters={handleResetFilters}
                    onUploadPhoto={handleUploadPhoto} // Note: This might need adjustment if using modal only
                    onBorrow={handleBorrow}
                    onReturn={handleReturn}
                    onShowDetail={setSelectedAsset}
                    onPreviewPhoto={setPreviewUrl}
                    onExportCsv={handleExportCsv}
                    onPrintQr={handlePrintQr}
                    onBulkPrintQr={handleBulkPrintQr}
                    page={assetPage}
                    pageSize={ASSET_PAGE_SIZE}
                    totalItems={filteredAssets.length}
                    totalPages={totalAssetPages}
                    onPageChange={setAssetPage}
                    onOpenAddModal={() => setAddModalOpen(true)}
                    onEditAsset={handleOpenEdit}
                    onDeleteAsset={handleDeleteAsset}
                  />
                )}

                {activeMenu === "funding" && (
                  <FundingSourcePage
                    fundingSources={fundingSources}
                    entities={entities}
                    onCreate={handleCreateFundingSource}
                    onUpdate={handleUpdateFundingSource}
                    onDelete={handleDeleteFundingSource}
                  />
                )}

                {activeMenu === "locations" && (
                  <LocationPage
                    locations={locations}
                    onCreate={handleCreateLocation}
                    onUpdate={handleUpdateLocation}
                    onDelete={handleDeleteLocation}
                  />
                )}

                {activeMenu === "categories" && (
                  <CategoryPage
                    categories={categories}
                    onCreate={handleCreateCategory}
                    onUpdate={handleUpdateCategory}
                    onDelete={handleDeleteCategory}
                  />
                )}

                {activeMenu === "roles" && (
                  <RolePage
                    roles={roles}
                    permissions={permissions}
                    onCreate={handleCreateRole}
                    onUpdate={handleUpdateRole}
                    onDelete={handleDeleteRole}
                  />
                )}

                {activeMenu === "permissions" && (
                  <PermissionPage
                    permissions={permissions}
                    onCreate={handleCreatePermission}
                    onUpdate={handleUpdatePermission}
                    onDelete={handleDeletePermission}
                  />
                )}

                {activeMenu === "users" && (
                  <UserPage
                    users={users}
                    roles={roles}
                    entities={entities}
                    onCreate={handleCreateUser}
                    onUpdate={handleUpdateUser}
                    onDelete={handleDeleteUser}
                  />
                )}

                {activeMenu === "entities" && (
                  <EntityPage
                    entities={entities}
                    onCreate={handleCreateEntity}
                    onUpdate={handleUpdateEntity}
                    onDelete={handleDeleteEntity}
                  />
                )}

                {activeMenu === "import" && (
                  <ImportPage onImportSuccess={refreshAllData} />
                )}
                
                {activeMenu === "opname" && (
                  <StockOpnamePage />
                )}
              </>
            )}
          </div>
        </main>
      </div>

      {/* --- MODALS GLOBAL --- */}

      {/* Modal Preview Foto */}
      {previewUrl && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[60]" onClick={() => setPreviewUrl(null)}>
          <div className="bg-white p-2 rounded-lg max-w-4xl max-h-[90vh] relative" onClick={(e) => e.stopPropagation()}>
            <img src={previewUrl} alt="Preview" className="max-h-[85vh] object-contain rounded" />
            <button 
                onClick={() => setPreviewUrl(null)}
                className="absolute -top-4 -right-4 bg-red-600 text-white rounded-full w-8 h-8 flex items-center justify-center shadow-lg hover:bg-red-700"
            >
                ✕
            </button>
          </div>
        </div>
      )}

      {/* Modal Detail Aset */}
      <AssetDetailModal
        asset={selectedAsset}
        loans={loans}
        fundingSources={fundingSources}
        locations={locations}
        categories={categories}
        onClose={() => setSelectedAsset(null)}
      />

      {/* Modal Tambah Aset */}
      <AddAssetModal
        open={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        onCreateAsset={handleCreateAsset}
        fundingSources={fundingSources}
        locations={locations}
        categories={categories}
        mode="create"
      />

      {/* Modal Edit Aset */}
      <AddAssetModal
        open={editModalOpen}
        onClose={() => { setEditModalOpen(false); setEditAssetTarget(null); }}
        onSaveAsset={handleSubmitEdit}
        fundingSources={fundingSources}
        locations={locations}
        categories={categories}
        mode="edit"
        asset={editAssetTarget}
      />

      {/* Modal Pinjam */}
      <BorrowAssetModal
        open={borrowModalOpen}
        asset={borrowAssetTarget}
        users={users}
        locations={locations}
        loading={borrowLoading}
        onClose={() => { setBorrowModalOpen(false); setBorrowAssetTarget(null); }}
        onSubmit={handleSubmitBorrow}
      />

      {/* Modal Kembali */}
      <ReturnAssetModal
        open={returnModalOpen}
        asset={returnAssetTarget}
        locations={locations}
        loading={returnLoading}
        onClose={() => { setReturnModalOpen(false); setReturnAssetTarget(null); }}
        onSubmit={handleSubmitReturn}
      />

    </div>
  );
}

export default App;