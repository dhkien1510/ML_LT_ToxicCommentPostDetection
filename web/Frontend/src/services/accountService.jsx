import api from "./api.js";

/* ================= REGISTER ================= */
export const registerAccount = (data) => {
    return api.post("/account/register", data);
};

/* ================= LOGIN ================= */
export const loginAccount = (data) => {
    return api.post("/account/login", data);
};

// GET profile
export const getProfile = (userId) => {
    return api.get(`/profile/${userId}`);
};

// UPDATE profile
export const updateProfile = (userId, data) => {
    return api.put(`/profile/${userId}`, data);
};

// CHANGE password
export const changePassword = (userId, data) => {
    return api.put(`/change-password/${userId}`, data);
};