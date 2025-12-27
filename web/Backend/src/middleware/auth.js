import dotenv from "dotenv";

dotenv.config({ path: "./src/.env" });

const apiKeyMiddleware = (req, res, next) => {
  // Lấy apikey từ header (ưu tiên)
    const apiKey =
        req.headers["apikey"] ||
        req.headers["x-api-key"] ||
        req.query.apikey;

    if (!apiKey) {
        return res.status(401).json({
        message: "API key is required"
        });
    }

    const SECRET_KEY = process.env.SECRET_KEY;

    if (!SECRET_KEY) {
        return res.status(500).json({
        message: "Server misconfiguration: SECRET_KEY missing"
        });
    }

    if (apiKey !== SECRET_KEY) {
        return res.status(403).json({
        message: "Invalid API key"
        });
    }

    // hợp lệ → đi tiếp
    next();
};

export default apiKeyMiddleware;
