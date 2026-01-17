// backend/routes/maintenanceRoutes.js
import express from "express";
import { 
  getMaintenances, 
  getMaintenanceByAssetId, 
  createMaintenance, 
  updateMaintenance, 
  deleteMaintenance 
} from "../controllers/maintenanceController.js";
import { verifyToken } from "../middleware/authMiddleware.js";

// 👇 1. IMPORT UPLOAD (Wajib!)
import { upload } from "../upload.js"; 

const router = express.Router();

router.use(verifyToken);

router.get("/", getMaintenances); 
router.get("/asset/:assetId", getMaintenanceByAssetId); 
router.post("/", createMaintenance); 

// 👇 2. TAMBAHKAN 'upload.single("proof_photo")' DI SINI
// Ini wajib ada supaya Backend bisa baca data dari FormData Frontend
router.put("/:id", upload.single("proof_photo"), updateMaintenance); 

router.delete("/:id", deleteMaintenance);

export default router;