import express from "express";
import {
  createNewUser,
  verifyEmail,
  signIn,
  signOut,
  getProfile,
  sendPublicProfile,
  generateVerificationLink,
  grantAccessToken,
  generateForgetPassLink,
  grantValid,
  updatePassword,
  updateProfile,
  updateAvatar,
} from "controllers/auth";
import validator from "src/middlewares/validator";
import {
  newUserSchema,
  resetPassSchema,
  verifyTokenSchema,
} from "src/utils/validationSchema";
import { isAuth, isValidPassResetToken } from "src/middlewares/auth";
import fileParser from "src/middlewares/fileParser";

const router = express.Router();

router.post("/sign-up", validator(newUserSchema), createNewUser);
router.post("/sign-in", signIn);
router.post("/verify", validator(verifyTokenSchema), verifyEmail);
router.post("/refresh-token", grantAccessToken);
router.get("/verify-token", isAuth, generateVerificationLink);
router.post(
  "/verify-pass-reset-token",
  validator(verifyTokenSchema),
  isValidPassResetToken,
  grantValid
);
router.post("/sign-out", isAuth, signOut);
router.post("/forget-pass", generateForgetPassLink);
router.post(
  "/reset-pass",
  validator(resetPassSchema),
  isValidPassResetToken,
  updatePassword
);
router.patch("/update-avatar", isAuth, fileParser, updateAvatar);
router.patch("/update-profile", isAuth, updateProfile);
router.get("/profile", isAuth, getProfile);
router.get("/profile/:id", isAuth, sendPublicProfile);

export default router;
