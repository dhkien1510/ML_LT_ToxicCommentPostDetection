// src/api/api.js
import axios from "axios";

const api = axios.create({
    baseURL: "http://localhost:3000",
    headers: {
        "Content-Type": "application/json",
        apikey: "KzB8mYEp53aDA7dp7idsCF0Q3tkSeX3Iaebh56sx",
    },
});

export default api;
