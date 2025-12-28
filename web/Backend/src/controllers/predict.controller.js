import { predictWithPythonService, createAnalysis,  getAnalysisHistoryService,
  getAnalysisDetailService, deleteAnalysisService } from "../services/predict.service.js";
import { scrapeCommentsFromUrl } from "../utils/scrape.util.js";

import fs from "fs";

export const predictController = async (req, res) => {
  
  try {
    const { type, url } = req.body;
    let comments = [];
    
    // ================= URL =================
    if (type === "url") {
      if (!url) {
        return res.status(400).json({ message: "URL missing" });
      }

      comments = await scrapeCommentsFromUrl(url);
    }

    // ================= FILE =================
    else if (type === "file") {
      const file = req.file;

      if (!file) {
        return res.status(400).json({ message: "File missing" });
      }

      const text = file.buffer.toString("utf-8");

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
        comments = json.comments || json.data || [];
      }
    }

    else {
      return res.status(400).json({ message: "Invalid input type" });
    }

    // ================= CLEAN =================
    comments = comments
      .map(c => typeof c === "string" ? c.trim() : null)
      .filter(Boolean);

    if (comments.length === 0) {
      return res.status(400).json({ message: "No comments found" });
    }

    // ================= PYTHON =================
    const pythonResponse = await predictWithPythonService(comments);
    const results = pythonResponse.results;

    // ================= SUMMARY =================
    const total = results.length || 1;
    const count = { clean: 0, hate: 0, offensive: 0 };

    results.forEach(r => count[r.label]++);

    const cleanPct = Math.round((count.clean / total) * 100);
    const hatePct = Math.round((count.hate / total) * 100);
    const offensivePct = 100 - cleanPct - hatePct;

    const summary = {
      clean: cleanPct,
      hate: hatePct,
      offensive: offensivePct
    };

    // ================= TOP WORDS =================
    const countWords = (label, topN = 10) => {
      const freq = {};

      results
        .filter(r => r.label === label)
        .forEach(r => {
          r.text
            .toLowerCase()
            .split(/\W+/)
            .filter(w => w.length > 3)
            .forEach(w => {
              freq[w] = (freq[w] || 0) + 1;
            });
        });

      return Object.entries(freq)
        .sort((a, b) => b[1] - a[1])   // 🔥 sort theo frequency
        .slice(0, topN)               // 🔥 lấy top N
        .reduce((obj, [word, count]) => {
          obj[word] = count;
          return obj;
        }, {});
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
    console.error(error);
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

/* ================= DELETE ================= */
export const deleteAnalysisController = async (req, res) => {
  try {
    const analysisId = Number(req.params.analysisId);
    const { userId } = req.body; 
    // hoặc lấy từ auth middleware: req.user.id

    if (!analysisId || !userId) {
      return res.status(400).json({
        success: false,
        message: "Invalid analysisId or userId"
      });
    }

    const deleted = await deleteAnalysisService(analysisId, userId);

    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: "Analysis not found or not owned by user"
      });
    }

    return res.json({
      success: true,
      message: "Analysis deleted successfully"
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