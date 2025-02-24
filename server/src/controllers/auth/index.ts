import { RequestHandler } from "express";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import UserModel from "src/models/user";
import AuthVerificationTokenModel from "src/models/authVerificationToken";
import PasswordResetTokenModel from "src/models/passwordResetToken";
import { getEnvVariablesWithDefaults, sendErrorRes } from "src/utils/helper";
import { mail } from "src/utils/mail";
import { isValidObjectId } from "mongoose";
import cloudUploader from "src/cloud";

const { JWT_SECRET_KEY, VERIFICATION_LINK, PASSWORD_RESET_LINK } =
  getEnvVariablesWithDefaults([
    { name: "JWT_SECRET_KEY" },
    { name: "VERIFICATION_LINK" },
    { name: "PASSWORD_RESET_LINK" },
  ]);

//#region SIGN UP USER
const createNewUser: RequestHandler = async (req, res) => {
  // read incoming data like: name,email,password etc.
  const { name, email, password } = req.body;

  // Validate if the data is ok or not & send error if not
  if (!name) {
    sendErrorRes(res, "Name is required!", 422);
    return;
  }
  if (!email) {
    sendErrorRes(res, "Email is required!", 422);
    return;
  }
  if (!password) {
    sendErrorRes(res, "Password is required!", 422);
    return;
  }

  /*
     Check if we already have account with same user.
     Send error if yes otherwise create new account and save user inside DB.
   */
  const existingUser = await UserModel.findOne({ email });
  if (existingUser) {
    sendErrorRes(res, "User already exists!", 401);
    return;
  }

  // Create new user
  const newUser = await UserModel.create({ name, email, password });

  // Generate and Store verification token.
  const token = crypto.randomBytes(36).toString("hex");
  await AuthVerificationTokenModel.create({ owner: newUser._id, token });

  //send verification link with token to register email
  const link = `${VERIFICATION_LINK}?id=${newUser._id}&token=${token}`;

  await mail.sendVerificationMail(newUser.email, link);

  res.status(201).json({
    message: "User created successfully! Please check your inbox!",
    link: link,
  });
};
//#endregion

//#region VERIFY EMAIL
const verifyEmail: RequestHandler = async (req, res) => {
  const { id, token } = req.body;

  const authToken = await AuthVerificationTokenModel.findOne({ owner: id });
  if (!authToken) {
    sendErrorRes(res, "Unauthorized request!", 403);
    return;
  }

  const isMatched = await authToken.compareToken(token);
  if (!isMatched) {
    sendErrorRes(res, "Unauthorized request! Invalid token!", 403);
    return;
  }

  await UserModel.findByIdAndUpdate(id, { verified: true });

  await AuthVerificationTokenModel.findByIdAndDelete(authToken._id);

  res.status(200).json({
    message: "Thanks for joining us, your email is verified successfully!",
  });
};
//#endregion

//#region SIGN IN
const signIn: RequestHandler = async (req, res) => {
  const { email, password } = req.body;

  const user = await UserModel.findOne({ email });

  if (!user) {
    sendErrorRes(res, "User not found!", 404);
    return;
  }

  const isMatched = await user.comparePassword(password);
  if (!isMatched) {
    sendErrorRes(res, "Invalid credentials!", 401);
    return;
  }
  // Generate JWT token (Access Token & Refresh Token)

  const accessToken = jwt.sign({ id: user._id }, JWT_SECRET_KEY, {
    expiresIn: "15m",
  });
  const refreshToken = jwt.sign({ id: user._id }, JWT_SECRET_KEY, {
    expiresIn: "1d",
  });

  if (!user.tokens) user.tokens = [refreshToken];
  else user.tokens.push(refreshToken);

  await user.save();

  res.status(200).json({
    message: "Logged in successfully!",
    id: user._id,
    name: user.name,
    email: user.email,
    verified: user.verified,
    tokens: {
      access: accessToken,
      refresh: refreshToken,
    },
  });
};
//#endregion

//#region GET PROFILE
const getProfile: RequestHandler = async (req, res) => {
  res.status(200).json({ ...req.user });
};
//#endregion

//#region RE-GENERATE VERIFICATION LINK
const generateVerificationLink: RequestHandler = async (req, res) => {
  const { id, email } = req.user;

  const token = crypto.randomBytes(36).toString("hex");

  const link = `${VERIFICATION_LINK}?id=${id}&token=${token}`;

  await AuthVerificationTokenModel.findOneAndDelete({ owner: id });

  await AuthVerificationTokenModel.create({ owner: id, token });

  await mail.sendVerificationMail(email, link);

  res.status(200).json({
    message: "Please check your inbox!",
  });
};
//#endregion

//#region RERESH TOKEN (GRANT NEW ACCESS TOKEN)
const grantAccessToken: RequestHandler = async (req, res) => {
  const { refreshToken } = req.body;
  if (!refreshToken) {
    sendErrorRes(res, "Unauthorized request!", 403);
    return;
  }

  const payload = jwt.verify(refreshToken, JWT_SECRET_KEY) as {
    id: string;
  };

  if (!payload.id) {
    sendErrorRes(res, "Unauthorized request!", 401);
    return;
  }

  const user = await UserModel.findOne({
    _id: payload.id,
    tokens: refreshToken,
  });

  if (!user) {
    // user is compromised, remove all the previous tokens
    await UserModel.findByIdAndUpdate(payload.id, { tokens: [] });
    sendErrorRes(res, "Unauthorized request!", 403);
    return;
  }

  const newAccessToken = jwt.sign({ id: user._id }, JWT_SECRET_KEY, {
    expiresIn: "15m",
  });

  const newRefreshToken = jwt.sign({ id: user._id }, JWT_SECRET_KEY, {
    expiresIn: "1d",
  });

  const filteredTokens = user.tokens.filter((token) => token !== refreshToken);
  user.tokens = [...filteredTokens, newRefreshToken];
  await user.save();

  res.status(200).json({
    message: "New access token generated successfully!",
    tokens: {
      access: newAccessToken,
      refresh: newRefreshToken,
    },
  });
};
//#endregion

//#region SIGN OUT

const signOut: RequestHandler = async (req, res) => {
  const { refreshToken } = req.body;
  const user = await UserModel.findOne({
    _id: req.user.id,
    tokens: refreshToken,
  });

  if (!user) {
    sendErrorRes(res, "Unauthorized request, user not found!", 403);
    return;
  }

  const filteredTokens = user.tokens.filter((token) => token !== refreshToken);
  user.tokens = filteredTokens;
  await user.save();
};

//#endregion

//#region FORGET PASSWORD
const generateForgetPassLink: RequestHandler = async (req, res) => {
  const { email } = req.body;

  const user = await UserModel.findOne({ email });

  if (!user) {
    sendErrorRes(res, "User not found!", 404);
    return;
  }

  // Remove token if already exists
  await PasswordResetTokenModel.findOneAndDelete({ owner: user._id });

  // Create new token
  const token = crypto.randomBytes(36).toString("hex");
  await PasswordResetTokenModel.create({ owner: user._id, token });

  // Send the link to user's email
  const passResetLink = `${PASSWORD_RESET_LINK}?id=${user._id}&token=${token}`;
  await mail.sendPasswordResetLinkMail(user.email, passResetLink);

  // Send response
  res.status(200).json({
    message: "Please check your inbox!",
  });
};
//#endregion

//#region VALIDATE PASSWORD RESET TOKEN

const grantValid: RequestHandler = async (req, res) => {
  res.json({ valid: true });
};

//#endregion

//#region RESET PASSWORD
const updatePassword: RequestHandler = async (req, res) => {
  const { id, password } = req.body;
  const user = await UserModel.findById(id);
  if (!user) {
    sendErrorRes(res, "Unauthorized access!", 403);
    return;
  }

  const matched = await user.comparePassword(password);
  if (matched) {
    sendErrorRes(res, "The new password can't be same as old password!", 422);
    return;
  }

  user.password = password;
  await user.save();

  await PasswordResetTokenModel.findOneAndDelete({ owner: user._id });
  await mail.sendPasswordUpdateMail(user.email);

  res.status(200).json({
    message: "Password updated successfully!",
  });
};
//#endregion

//#region UPDATE PROFILE
const updateProfile: RequestHandler = async (req, res) => {
  const { name } = req.body;
  if (typeof name !== "string" || name.trim().length < 3) {
    sendErrorRes(res, "Invalid name!", 422);
    return;
  }

  await UserModel.findByIdAndUpdate(req.user.id, { name });

  res.json({
    message: "Profile updated successfully!",
    profile: {
      ...req.user,
      name,
    },
  });
};
//#endregion

//#region UPDATE AVATAR
const updateAvatar: RequestHandler = async (req, res) => {
  const { avatar } = req.files;
  if (Array.isArray(avatar)) {
    return sendErrorRes(res, "Only one file is allowed!", 422);
  }

  if (!avatar.mimetype?.startsWith("image")) {
    return sendErrorRes(res, "Invalid file type!", 422);
  }

  const user = await UserModel.findById(req.user.id);
  if (!user) {
    return sendErrorRes(res, "User not found!", 404);
  }

  if (user.avatar?.id) {
    await cloudUploader.destroy(user.avatar.id);
  }

  const { secure_url: url, public_id: id } = await cloudUploader.upload(
    avatar.filepath,
    {
      width: 300,
      height: 300,
      crop: "thumb",
      gravity: "face",
    }
  );
  user.avatar = { url, id };
  await user.save();

  res.json({
    profile: {
      ...req.user,
      avatar: user.avatar.url,
    },
  });
};
//#endregion

//#region PBULIC PROFILE
const sendPublicProfile: RequestHandler = async (req, res) => {
  const profileId = req.params.id;
  if (!isValidObjectId(profileId)) {
    return sendErrorRes(res, "Invalid profile id!", 422);
  }
  const user = await UserModel.findById(profileId);
  if (!user) {
    return sendErrorRes(res, "User not found!", 404);
  }

  res.json({
    profile: {
      id: user._id,
      name: user.name,
      email: user.email,
      avatar: user.avatar?.url || null,
    },
  });
};
//#endregion

export {
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
};
