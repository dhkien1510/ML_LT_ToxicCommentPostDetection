// routes/account.routes.js
import express from "express";
import {
    getAccountById,
    updateProfile,
    changePassword,
    registerAccount,
    loginAccount
} from "../services/account.service.js";

const router = express.Router();

/**
 * GET /api/account/me
 * Get current user profile
 */
router.get("/profile/:id", async (req, res) => {
    try {
        const userId = req.params.id;
        const user = await getAccountById(userId);
        res.json(user);
    } catch (err) {
        res.status(500).json({ message: err.message});
    }
    });

/**
 * PUT /api/account/me
 * Update profile (name, email, address)
 */
router.put("/profile/:id", async (req, res) => {
    try {
        const userId = req.params.id;
        const user = await updateProfile(userId, req.body);
        res.json({
        message: "Profile updated successfully",
        user
        });
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

/**
 * PUT /api/account/change-password
 * Change password
 */
router.put("/change-password/:id", async (req, res) => {
    try {
        const userId = req.params.id;
        const { oldPassword, newPassword } = req.body;

        if (!oldPassword || !newPassword) {
        return res.status(400).json({
            message: "Old password and new password are required"
        });
        }

        await changePassword(userId, oldPassword, newPassword);
        res.json({ message: "Password changed successfully" });
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

/* ===================== REGISTER ===================== */
router.post("/register", async (req, res) => {
    try {
        const { name, email, password, address } = req.body;

        if (!email || !password) {
        return res.status(400).json({ message: "Email and password required" });
        }

        const user = await registerAccount({
        name,
        email,
        password,
        address
        });

        res.json({
        message: "Register successful",
        user
        });
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

/* ===================== LOGIN ===================== */
router.post("/login", async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
        return res.status(400).json({ message: "Email and password required" });
        }

        const user = await loginAccount(email, password);

        res.json({
        message: "Login successful",
        user
        });
    } catch (err) {
        res.status(401).json({ message: err.message });
    }
});


export default router;
