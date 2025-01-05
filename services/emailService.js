const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USERNAME,
    pass: process.env.EMAIL_PASSWORD,
  },
});

async function sendVerificationEmail(to, token) {
  const verificationLink = `http://localhost:${process.env.PORT}/register/verify?token=${token}`;

  const mailOptions = {
    from: process.env.EMAIL_USERNAME,
    to: to,
    subject: "Verify Your Email Address",
    html: `<p>Thank you for registering. Please verify your email by clicking the link below:</p>
           <a href="${verificationLink}">Verify Email</a>`,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log("Verification email sent");
  } catch (error) {
    console.error("Error sending verification email:", error);
  }
}

async function sendResetPasswordEmail(to, token) {
  const resetLink = `http://localhost:${process.env.PORT}/login/reset-password?token=${token}`;

  const mailOptions = {
    from: process.env.EMAIL_USERNAME,
    to,
    subject: "Password Reset Request",
    html: `<p>Please click the following link to reset your password:</p>
           <a href="${resetLink}">Reset Password</a>`,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log("Password reset email sent");
  } catch (error) {
    console.error("Error sending reset password email:", error);
  }
}

module.exports = { sendVerificationEmail, sendResetPasswordEmail };
