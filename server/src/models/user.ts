import { model, Schema } from "mongoose";
import { hash, compare, genSalt } from "bcrypt";

interface UserDocument extends Document {
  name: string;
  email: string;
  password: string;
  verified: boolean;
}

interface Methods {
  comparePassword(password: string): Promise<boolean>;
}

const userSchema = new Schema<UserDocument, {}, Methods>(
  {
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
    },
    password: {
      type: String,
      required: true,
    },
    verified: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

//#region PRE HOOKS (Hash Password Before Saving)
userSchema.pre("save", async function (next) {
  if (this.isModified("password")) {
    const salt = await genSalt(10);
    this.password = await hash(this.password, salt);
  }

  next();
});
//#endregion

//#region COMPARE PASSWORD
userSchema.methods.comparePassword = async function (password) {
  return await compare(password, this.password);
};
//#endregion;

const UserModel = model("User", userSchema);

export default UserModel;
