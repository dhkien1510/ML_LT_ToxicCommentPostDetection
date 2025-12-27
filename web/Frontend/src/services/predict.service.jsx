import api from "./api.js";

export const predict = (data) => {
    return api.post("/predict", data);
};

export const saveAnalysis = (userId, payload) => {
    return api.post(`/predict/analysis/${userId}`, payload);
};

export const getAnalysisHistory = (userId) =>
    api.get(`/predict/analysis/user/${userId}`);

export const getAnalysisDetail = (analysisId) =>
    api.get(`/predict/analysis/${analysisId}`);