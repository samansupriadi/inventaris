// backend/routes/maintenanceRoutes.js
import express from "express";
import { 
  getMaintenances, 
  getMaintenanceByAssetId, 
  createMaintenance, 
  updateMaintenance, 
  deleteMaintenance 
} from "../controllers/maintenanceController.js";
// 👇 Import authorize
import { verifyToken, authorize } from "../middleware/authMiddleware.js";
import { upload } from "../upload.js"; 

const router = express.Router();

// 1. Satpam Global (Wajib Login)
router.use(verifyToken);

// 2. GET (Lihat Data) -> Butuh 'view_maintenance'
router.get("/", authorize("view_maintenance"), getMaintenances); 
router.get("/asset/:assetId", authorize("view_maintenance"), getMaintenanceByAssetId); 

// 3. POST (Lapor Rusak) -> Butuh 'create_maintenance'
router.post("/", authorize("create_maintenance"), createMaintenance); 

// 4. PUT (Update/Selesaikan) -> Butuh 'update_maintenance'
// Urutan: Cek Token -> Cek Izin -> Handle File Upload -> Controller
router.put("/:id", authorize("update_maintenance"), upload.single("proof_photo"), updateMaintenance); 

// 5. DELETE -> Kita anggap butuh 'update_maintenance' (atau admin khusus)
// Karena di seeder tidak ada 'delete_maintenance', kita pakai 'update_maintenance' 
// sebagai level akses manager teknisi.
router.delete("/:id", authorize("update_maintenance"), deleteMaintenance);

export default router;