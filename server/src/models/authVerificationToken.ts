import { compare, genSalt, hash } from "bcrypt";
import { model, Schema } from "mongoose";

interface AuthVerificationTokenDocument extends Document {
  owner: Schema.Types.ObjectId;
  token: string;
  createdAt: Date;
}

interface Methods {
  compareToken(token: string): Promise<boolean>;
}

const AuthVerificationTokenSchema = new Schema<
  AuthVerificationTokenDocument,
  {},
  Methods
>({
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

//#region PRE HOOKS (Hash Token Before Saving)
AuthVerificationTokenSchema.pre("save", async function (next) {
  if (this.isModified("token")) {
    const salt = await genSalt(10);
    this.token = await hash(this.token, salt);
  }

  next();
});
//#endregion

//#region COMPARE TOKEN
AuthVerificationTokenSchema.methods.compareToken = async function (token) {
  return await compare(token, this.token);
};
//#endregion;

const AuthVerificationTokenModel = model(
  "AuthVerificationToken",
  AuthVerificationTokenSchema
);

export default AuthVerificationTokenModel;
