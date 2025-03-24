import { RequestHandler } from "express";
import { getEnvVariablesWithDefaults, sendErrorRes } from "src/utils/helper";
import jwt, { JsonWebTokenError, TokenExpiredError } from "jsonwebtoken";
import UserModel from "src/models/user";
import PasswordResetTokenModel from "src/models/passwordResetToken";

interface UserProfile {
  id: string;
  name: string;
  email: string;
  verified: boolean;
  avatar?: string;
}

declare global {
  namespace Express {
    interface Request {
      user: UserProfile;
    }
  }
}

const { JWT_SECRET_KEY } = getEnvVariablesWithDefaults([
  { name: "JWT_SECRET_KEY" },
]);

export const isAuth: RequestHandler = async (req, res, next) => {
  try {
    const authToken = req.headers.authorization;
    if (!authToken) {
      sendErrorRes(res, "Unauthorized Request!", 403);
      return;
    }

    // Check if the token is valid or not
    const token = authToken.split("Bearer ")[1];

    const payload = jwt.verify(token, JWT_SECRET_KEY) as {
      id: string;
    };

    const user = await UserModel.findById(payload.id);
    if (!user) {
      sendErrorRes(res, "Unauthorized Request!", 403);
      return;
    }

    req.user = {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      verified: user.verified,
      avatar: user.avatar?.url,
    };

    next();
  } catch (error) {
    if (error instanceof TokenExpiredError) {
      sendErrorRes(res, "Token Expired", 401);
      return;
    }

    if (error instanceof JsonWebTokenError) {
      sendErrorRes(res, "Unauthorized access!", 401);
      return;
    }

    next(error);
  }
};

export const isValidPassResetToken: RequestHandler = async (req, res, next) => {
  const { id, token } = req.body;

  const resetPassToken = await PasswordResetTokenModel.findOne({ owner: id });

  if (!resetPassToken) {
    sendErrorRes(res, "Invalid Token!", 400);
    return;
  }

  const matched = resetPassToken.compareToken(token);
  if (!matched) {
    sendErrorRes(res, "Invalid Token!", 400);
    return;
  }

  next();
};
