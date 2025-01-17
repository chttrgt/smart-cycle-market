import { RequestHandler } from "express";
import UserModel from "src/models/user";
import AuthVerificationTokenModel from "src/models/authVerificationToken";
import crypto from "crypto";
import nodemailer from "nodemailer";

//#region SIGN UP USER
const createNewUser: RequestHandler = async (req, res) => {
  // read incoming data like: name,email,password etc.
  const { name, email, password } = req.body;

  // Validate if the data is ok or not & send error if not
  if (!name) {
    res.status(422).json({ message: "Name is required!" });
    return;
  }
  if (!email) {
    res.status(422).json({ message: "Email is required!" });
    return;
  }
  if (!password) {
    res.status(422).json({ message: "Password is required!" });
    return;
  }

  /*
    Check if we already have account with same user.
    Send error if yes otherwise create new account and save user inside DB.
  */
  const existingUser = await UserModel.findOne({ email });
  if (existingUser) {
    res.status(401).json({ message: "User already exists!" });
    return;
  }

  // Create new user
  const newUser = await UserModel.create({ name, email, password });

  // Generate and Store verification token.
  const token = crypto.randomBytes(36).toString("hex");
  await AuthVerificationTokenModel.create({ owner: newUser._id, token });

  //send verification link with token to register email
  const link = `http://localhost:8000/api/auth/verify?id=${newUser._id}&token=${token}`;

  const transport = nodemailer.createTransport({
    host: "smtp.example.com",
    port: 333,
    auth: {
      user: "ct.example@mail.com",
      pass: "xxxxxxxxxxxxxx",
    },
  });

  await transport.sendMail({
    from: "ct.example@mail.com",
    to: newUser.email,
    subject: "Please verify your account",
    html: `<h1>Please click <a href="${link}"><strong>here</strong></a> to verify your account</h1>`,
  });

  res.status(201).json({
    message: "User created successfully! Please check your inbox!",
    link: link,
  });
};
//#endregion

export { createNewUser };
