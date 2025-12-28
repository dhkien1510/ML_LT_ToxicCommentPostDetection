import api from "./api.js";

export const predict = (formData) => {
    return api.post("/predict", formData, {
        headers: {
            "Content-Type": "multipart/form-data"
        }
    });
};

export const saveAnalysis = (userId, payload) => {
    return api.post(`/predict/analysis/${userId}`, payload);
};

export const getAnalysisHistory = (userId) =>
    api.get(`/predict/analysis/user/${userId}`);

export const getAnalysisDetail = (analysisId) =>
    api.get(`/predict/analysis/${analysisId}`);

/* ================= DELETE ================= */
export const deleteAnalysis = (analysisId, userId) => {
    return api.delete(
        `predict/analysis/${analysisId}`,
        {
            data: { userId } // gửi body cho DELETE
        }
    );
};