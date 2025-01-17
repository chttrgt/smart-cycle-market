import { model, Schema } from "mongoose";

const AuthVerificationTokenSchema = new Schema({
  owner: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  token: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    expires: 86400, // 1 day (60 * 60 * 24)
    default: Date.now,
  },
});

const AuthVerificationTokenModel = model(
  "AuthVerificationToken",
  AuthVerificationTokenSchema
);

export default AuthVerificationTokenModel;
