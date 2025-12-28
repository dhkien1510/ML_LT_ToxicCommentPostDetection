import express from "express";
import {saveAnalysisController, predictController, getAnalysisHistoryController,
  getAnalysisDetailController } from "../controllers/predict.controller.js";
import multer from "multer";

const upload = multer({
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB
  }
});

const router = express.Router();

router.post("/", upload.single("file"), predictController);
router.post("/analysis/:id", saveAnalysisController);
/* ================= HISTORY ================= */
// GET /analysis/user/:userId
router.get("/analysis/user/:userId", getAnalysisHistoryController);

/* ================= DETAIL ================= */
// GET /analysis/:analysisId
router.get("/analysis/:analysisId", getAnalysisDetailController);

export default router;
