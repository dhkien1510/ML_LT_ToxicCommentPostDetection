import express from "express";
import {saveAnalysisController, predictController, getAnalysisHistoryController,
  getAnalysisDetailController } from "../controllers/predict.controller.js";

const router = express.Router();

router.post("/", predictController);
router.post("/analysis/:id", saveAnalysisController);
/* ================= HISTORY ================= */
// GET /analysis/user/:userId
router.get("/analysis/user/:userId", getAnalysisHistoryController);

/* ================= DETAIL ================= */
// GET /analysis/:analysisId
router.get("/analysis/:analysisId", getAnalysisDetailController);

export default router;
