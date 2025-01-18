import nodemailer, { TransportOptions } from "nodemailer";

const transport = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
} as TransportOptions);

const sendVerificationMail = async (email: string, link: string) => {
  await transport.sendMail({
    from: process.env.SMTP_USER,
    to: email,
    subject: "Please verify your account",
    html: `<h1>Please click <a href="${link}"><strong>here</strong></a> to verify your account</h1>`,
  });
};

export const mail = {
  sendVerificationMail,
};
