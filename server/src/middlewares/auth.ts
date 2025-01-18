import { RequestHandler } from "express";
import { sendErrorRes } from "src/utils/helper";
import jwt, { JsonWebTokenError, TokenExpiredError } from "jsonwebtoken";
import UserModel from "src/models/user";

interface UserProfile {
  id: string;
  name: string;
  email: string;
  verified: boolean;
}

declare global {
  namespace Express {
    interface Request {
      user?: UserProfile;
    }
  }
}

export const isAuth: RequestHandler = async (req, res, next) => {
  try {
    const authToken = req.headers.authorization;
    if (!authToken) {
      sendErrorRes(res, "Unauthorized Request!", 403);
      return;
    }

    // Check if the token is valid or not
    const token = authToken.split("Bearer ")[1];
    if (!process.env.JWT_SECRET_KEY) {
      sendErrorRes(
        res,
        "JWT_SECRET_KEY is not defined in the environment variables!",
        400
      );
      return;
    }
    const payload = jwt.verify(token, process.env.JWT_SECRET_KEY) as {
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
