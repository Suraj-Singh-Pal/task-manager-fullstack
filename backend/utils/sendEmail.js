const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const sendEmail = async (to, subject, text) => {
  try {
    const info = await transporter.sendMail({
      from: `"Task Manager" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      text,
    });

    console.log(`✅ Email sent to ${to}: ${info.messageId}`);
  } catch (error) {
    console.log("❌ Email send error:", error.message);
  }
};

module.exports = sendEmail;