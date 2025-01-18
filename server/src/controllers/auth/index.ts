import { RequestHandler } from "express";
import UserModel from "src/models/user";
import AuthVerificationTokenModel from "src/models/authVerificationToken";
import crypto from "crypto";
import { sendErrorRes } from "src/utils/helper";
import jwt from "jsonwebtoken";
import { mail } from "src/utils/mail";

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
  const link = `http://localhost:8000/verify.html?id=${newUser._id}&token=${token}`;

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

  if (!process.env.JWT_SECRET_KEY) {
    sendErrorRes(
      res,
      "JWT_SECRET_KEY is not defined in the environment variables!",
      400
    );
    return;
  }

  const accessToken = jwt.sign({ id: user._id }, process.env.JWT_SECRET_KEY, {
    expiresIn: "15m",
  });
  const refreshToken = jwt.sign({ id: user._id }, process.env.JWT_SECRET_KEY, {
    expiresIn: "7d",
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

  const link = `http://localhost:8000/verify.html?id=${id}&token=${token}`;

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

  if (!process.env.JWT_SECRET_KEY) {
    sendErrorRes(
      res,
      "JWT_SECRET_KEY is not defined in the environment variables!",
      400
    );
    return;
  }
  const payload = jwt.verify(refreshToken, process.env.JWT_SECRET_KEY) as {
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

  const newAccessToken = jwt.sign(
    { id: user._id },
    process.env.JWT_SECRET_KEY,
    {
      expiresIn: "15m",
    }
  );

  const newRefreshToken = jwt.sign(
    { id: user._id },
    process.env.JWT_SECRET_KEY,
    { expiresIn: "7d" }
  );

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

export {
  createNewUser,
  verifyEmail,
  signIn,
  getProfile,
  generateVerificationLink,
  grantAccessToken,
};
