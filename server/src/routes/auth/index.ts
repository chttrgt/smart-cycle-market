import express from "express";
import { createNewUser } from "controllers/auth";

const router = express.Router();

router.post("/sign-up", createNewUser);
router.post("/sign-in", (req, res) => {});
router.post("/verify", (req, res) => {});
router.post("/refresh-token", (req, res) => {});
router.post("/verify-token", (req, res) => {});
router.post("/verify-pass-reset-token", (req, res) => {});
router.post("/sign-out", (req, res) => {});
router.post("/forget-pass", (req, res) => {});
router.post("/reset-pass", (req, res) => {});
router.post("/update-avatar", (req, res) => {});
router.post("/update-profile", (req, res) => {});
router.get("/profile", (req, res) => {});
router.get("/profile/:id", (req, res) => {});

export default router;
