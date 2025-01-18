import { compare, genSalt, hash } from "bcrypt";
import { model, Schema } from "mongoose";

interface PassResetTokenDocument extends Document {
  owner: Schema.Types.ObjectId;
  token: string;
  createdAt: Date;
}

interface Methods {
  compareToken(token: string): Promise<boolean>;
}

const PasswordResetTokenSchema = new Schema<
  PassResetTokenDocument,
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
    expires: 3600, // 1 hour
    default: Date.now,
  },
});

//#region PRE HOOKS (Hash Token Before Saving)
PasswordResetTokenSchema.pre("save", async function (next) {
  if (this.isModified("token")) {
    const salt = await genSalt(10);
    this.token = await hash(this.token, salt);
  }

  next();
});
//#endregion

//#region COMPARE TOKEN
PasswordResetTokenSchema.methods.compareToken = async function (token) {
  return await compare(token, this.token);
};
//#endregion;

const PasswordResetTokenModel = model(
  "PasswordResetToken",
  PasswordResetTokenSchema
);

export default PasswordResetTokenModel;
