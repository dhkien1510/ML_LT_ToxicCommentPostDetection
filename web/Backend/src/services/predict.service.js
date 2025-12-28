import axios from "axios";

const PYTHON_PREDICT_URL = "http://localhost:8000/predict";

export const predictWithPythonService = async (comments) => {
    try {
        const response = await axios.post(PYTHON_PREDICT_URL, {
            comments
        });

        return response.data;
    } catch (error) {
        console.error("Python ML service error:", error.message);
        throw new Error("PREDICT_SERVICE_FAILED");
    }
};

// services/analysis.service.js
import db from "../config/db.js";

const TABLE = "ML_ANALYSIS";

export async function createAnalysis({
    userId,
    url,
    summary,
    topWords,
    rawResults
}) {
    const [row] = await db(TABLE)
    .insert({
        user_id: userId,
        post_url: url,
        summary: JSON.stringify(summary),
        top_words: JSON.stringify(topWords),
        raw_results: JSON.stringify(rawResults)
    })
    .returning("*");

    return row;
}

export async function getAnalysisByUserId(userId) {
    return db(TABLE)
        .where({ user_id: userId })
        .orderBy("created_at", "desc");
}

/* ================= HISTORY ================= */
export async function getAnalysisHistoryService(userId) {
    return db(TABLE)
        .select(
        "id",
        "post_url",
        "created_at"
    )
    .where({ user_id: userId })
    .orderBy("created_at", "desc");
}

/* ================= DELETE ================= */
export async function deleteAnalysisService(analysisId, userId) {
    const deletedRows = await db(TABLE)
        .where({
        id: analysisId,
        user_id: userId
        })
        .del();

    return deletedRows > 0;
}

/* ================= DETAIL ================= */
export async function getAnalysisDetailService(analysisId) {
    return db(TABLE)
        .select(
        "id",
        "post_url",
        "summary",
        "top_words",
        "raw_results",
        "created_at"
    )
    .where({ id: analysisId })
    .first();
}
