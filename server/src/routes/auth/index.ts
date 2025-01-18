import express from "express";
import {
  createNewUser,
  verifyEmail,
  signIn,
  signOut,
  getProfile,
  generateVerificationLink,
  grantAccessToken,
} from "controllers/auth";
import validator from "src/middlewares/validator";
import { newUserSchema, verifyTokenSchema } from "src/utils/validationSchema";
import { isAuth } from "src/middlewares/auth";

const router = express.Router();

router.post("/sign-up", validator(newUserSchema), createNewUser);
router.post("/sign-in", signIn);
router.post("/verify", validator(verifyTokenSchema), verifyEmail);
router.post("/refresh-token", grantAccessToken);
router.get("/verify-token", isAuth, generateVerificationLink);
router.post("/verify-pass-reset-token", (req, res) => {});
router.post("/sign-out", isAuth, signOut);
router.post("/forget-pass", (req, res) => {});
router.post("/reset-pass", (req, res) => {});
router.post("/update-avatar", (req, res) => {});
router.post("/update-profile", (req, res) => {});
router.get("/profile", isAuth, getProfile);
router.get("/profile/:id", (req, res) => {});

export default router;
