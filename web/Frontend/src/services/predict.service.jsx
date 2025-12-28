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