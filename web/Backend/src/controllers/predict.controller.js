import { predictWithPythonService, createAnalysis,  getAnalysisHistoryService,
  getAnalysisDetailService } from "../services/predict.service.js";
import { scrapeCommentsFromUrl } from "../utils/scrape.util.js";


export const predictController = async (req, res) => {
  try {
    const { type, data } = req.body;

    let comments = [];

    if (type === "url") {
      comments = await scrapeCommentsFromUrl(data);
    } 
    else if (type === "file") {
      comments = data.comments;
    } 
    else {
      return res.status(400).json({
        success: false,
        message: "Invalid input type"
      });
    }

    comments = comments
      .map(c => c?.trim())
      .filter(c => c); // lấy text

    console.log(comments)

    // ===== CALL PYTHON =====
    const pythonResponse = await predictWithPythonService(comments);
    const results = pythonResponse.results;

    const total = results.length || 1;

    // ===== SUMMARY (PERCENTAGE) =====
    const count = {
      clean: 0,
      hate: 0,
      offensive: 0
    };

    results.forEach(r => {
      if (count[r.label] !== undefined) {
        count[r.label]++;
      }
    });

    const summary = {
      clean: Math.round((count.clean / total) * 100),
      hate: Math.round((count.hate / total) * 100),
      offensive: Math.round((count.offensive / total) * 100)
    };

    // ===== MOST HATE USER =====
    const hateByUser = {};

    results.forEach((r, idx) => {
      if (r.label === "hate" && comments[idx]?.author?.name) {
        const user = comments[idx].author.name;
        hateByUser[user] = (hateByUser[user] || 0) + 1;
      }
    });

    const mostHateUser =
      Object.entries(hateByUser).sort((a, b) => b[1] - a[1])[0]?.[0] ||
      "N/A";

    // ===== TOP WORDS =====
    const extractWords = (label) => {
      return results
        .filter(r => r.label === label)
        .flatMap(r =>
          r.text
            .toLowerCase()
            .split(/\W+/)
            .filter(w => w.length > 4)
        )
        .slice(0, 5);
    };

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

    const topWords = {
      hate: countWords("hate"),
      offensive: countWords("offensive")
    };

    // ===== RESPONSE MATCH FRONTEND =====
    return res.json({
      summary,
      mostHateUser,
      topWords,
      results
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
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