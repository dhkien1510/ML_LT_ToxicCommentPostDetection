import { predictWithPythonService, createAnalysis,  getAnalysisHistoryService,
  getAnalysisDetailService } from "../services/predict.service.js";
import { scrapeCommentsFromUrl } from "../utils/scrape.util.js";

import fs from "fs";

export const predictController = async (req, res) => {
  try {
    const { type, url } = req.body;
    let comments = [];

    // ===== URL =====
    if (type === "url") {
      comments = await scrapeCommentsFromUrl(url);
    }

    // ===== FILE =====
    else if (type === "file") {
      const file = req.file;
      
      if (!file) {
        return res.status(400).json({ message: "File missing" });
      }
      
      const text = req.file.buffer.toString("utf-8");
      
      // .txt
      if (file.originalname.endsWith(".txt")) {
        comments = text
          .split("\n")
          .map(c => c.trim())
          .filter(Boolean);
      }

      // .json
      else if (file.originalname.endsWith(".json")) {
        const json = JSON.parse(text);
        comments = json.comments || json.data || json || [];
      }
    }

    else {
      return res.status(400).json({ message: "Invalid input type" });
    }

    // ===== CLEAN =====
    comments = comments.map(c => c?.trim()).filter(Boolean);

    // ===== CALL PYTHON =====
    const pythonResponse = await predictWithPythonService(comments);
    const results = pythonResponse.results;

    // ===== SUMMARY =====
    const total = results.length || 1;
    const count = { clean: 0, hate: 0, offensive: 0 };

    results.forEach(r => count[r.label]++);

    const summary = {
      clean: Math.round((count.clean / total) * 100),
      hate: Math.round((count.hate / total) * 100),
      offensive: Math.round((count.offensive / total) * 100)
    };

    // ===== TOP WORDS =====
    const countWords = (label) => {
      const freq = {};
      results
        .filter(r => r.label === label)
        .forEach(r => {
          r.text
            .toLowerCase()
            .split(/\W+/)
            .filter(w => w.length > 4)
            .forEach(w => {
              freq[w] = (freq[w] || 0) + 1;
            });
        });
      return freq;
    };

    return res.json({
      summary,
      topWords: {
        hate: countWords("hate"),
        offensive: countWords("offensive")
      },
      results
    });

  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const saveAnalysisController = async (req, res) => {
  try {
    const userId = Number(req.params.id);
    const { url, result } = req.body;

    if (!userId || !url || !result) {
      return res.status(400).json({
        success: false,
        message: "Missing userId, url or result"
      });
    }

    const analysis = await createAnalysis({
      userId,
      url,
      summary: result.summary,
      topWords: result.topWords,
      rawResults: result.results
    });

    return res.status(201).json({
      success: true,
      data: analysis
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/* ================= HISTORY ================= */
export const getAnalysisHistoryController = async (req, res) => {
  try {
    const userId = Number(req.params.userId);

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "Invalid userId"
      });
    }

    const history = await getAnalysisHistoryService(userId);

    return res.json({
      success: true,
      data: history
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/* ================= DETAIL ================= */
export const getAnalysisDetailController = async (req, res) => {
  try {
    const analysisId = Number(req.params.analysisId);

    if (!analysisId) {
      return res.status(400).json({
        success: false,
        message: "Invalid analysisId"
      });
    }

    const analysis = await getAnalysisDetailService(analysisId);

    if (!analysis) {
      return res.status(404).json({
        success: false,
        message: "Analysis not found"
      });
    }

    return res.json({
      success: true,
      data: analysis
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};