// index.js
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import { uploadsDir } from "./upload.js";

// --- IMPORT LIMITER ---
import { globalLimiter } from "./middleware/limiter.js";

// routers
import healthRouter from "./routes/healthRoutes.js";
import assetRouter from "./routes/assetRoutes.js";
import loanRouter from "./routes/loanRoutes.js";
import fundingSourceRouter from "./routes/fundingSourceRoutes.js";
import locationRouter from "./routes/locationRoutes.js";
import categoryRouter from "./routes/categoryRoutes.js";
import roleRouter from "./routes/roleRoutes.js";
import userRouter from "./routes/userRoutes.js";
import budgetCodeRouter from "./routes/budgetCodeRoutes.js";
import authRouter from "./routes/authRoutes.js";
import entityRouter from "./routes/entityRoutes.js";
import permissionRouter from "./routes/permissionRoutes.js";
import importRoutes from "./routes/importRoutes.js";
import opnameRoutes from "./routes/opnameRoutes.js";
import auditRoutes from "./routes/auditRoutes.js";
import reportRouter from "./routes/reportRoutes.js";
import maintenanceRoutes from "./routes/maintenanceRoutes.js"; 

dotenv.config();

const app = express();
const port = process.env.PORT || 4000;
app.use(express.json({ limit: "10mb" })); 
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// 1. SECURITY HEADERS
app.use(helmet());

// 2. CORS CONFIG (UPDATED: MULTI ORIGIN)
// Daftar URL Frontend yang boleh akses Backend ini
const allowedOrigins = [
  "http://localhost:5173",      // Frontend Localhost Utama
  "http://127.0.0.1:5173",      // IP Loopback (kadang browser pakai ini)
  // "http://192.168.1.XX:5173", // Tambahkan IP LAN jika mau tes di HP satu WiFi
  // "https://aset.sinergifoundation.org" // Tambahkan Domain Production nanti
];

app.use(cors({
  origin: function (origin, callback) {
    // allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    // Cek apakah origin ada di daftar putih kita?
    if (allowedOrigins.indexOf(origin) === -1) {
      const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));

// 3. PARSE COOKIES & JSON
app.use(cookieParser());
app.use(express.json());

// 4. GLOBAL RATE LIMITER
app.use(globalLimiter);

// static uploads (Cross-Origin Resource Policy diperbolehkan)
app.use("/uploads", express.static(uploadsDir, {
  setHeaders: (res) => {
    res.set("Cross-Origin-Resource-Policy", "cross-origin");
  }
}));

// routes
app.use("/api/health", healthRouter);
app.use("/api/assets", assetRouter);
app.use("/api/loans", loanRouter);
app.use("/api/funding-sources", fundingSourceRouter);
app.use("/api/locations", locationRouter);
app.use("/api/categories", categoryRouter);
app.use("/api/roles", roleRouter);
app.use("/api/users", userRouter);
app.use("/api/budget-codes", budgetCodeRouter);
app.use("/api", authRouter);       
app.use("/api/entities", entityRouter);
app.use("/api/permissions", permissionRouter);
app.use("/api/import", importRoutes);
app.use("/api/opname", opnameRoutes);
app.use("/api/audit-logs", auditRoutes);
app.use("/api/reports", reportRouter);
app.use("/api/maintenances", maintenanceRoutes);

// listen
app.listen(port, () => {
  console.log(`API server running on port ${port}`);
});