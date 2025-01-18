import nodemailer, { TransportOptions } from "nodemailer";
import { getEnvVariablesWithDefaults } from "./helper";

const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } =
  getEnvVariablesWithDefaults([
    { name: "SMTP_HOST" },
    { name: "SMTP_PORT" },
    { name: "SMTP_USER" },
    { name: "SMTP_PASS" },
  ]);

const transport = nodemailer.createTransport({
  host: SMTP_HOST,
  port: SMTP_PORT,
  auth: {
    user: SMTP_USER,
    pass: SMTP_PASS,
  },
} as TransportOptions);

const sendVerificationMail = async (email: string, link: string) => {
  await transport.sendMail({
    from: SMTP_USER,
    to: email,
    subject: "Please verify your account",
    html: `<h1>Please click <a href="${link}"><strong>here</strong></a> to verify your account</h1>`,
  });
};

const sendPasswordResetLinkMail = async (email: string, link: string) => {
  await transport.sendMail({
    from: SMTP_USER,
    to: email,
    subject: "Please reset your password",
    html: `<h1>Please click <a href="${link}"><strong>here</strong></a> to reset your password</h1>`,
  });
};

const sendPasswordUpdateMail = async (email: string) => {
  await transport.sendMail({
    from: SMTP_USER,
    to: email,
    subject: "Your password is updated",
    html: `<h1>Your password is updated, you can now use your new password.</h1>`,
  });
};

export const mail = {
  sendVerificationMail,
  sendPasswordResetLinkMail,
  sendPasswordUpdateMail,
};
