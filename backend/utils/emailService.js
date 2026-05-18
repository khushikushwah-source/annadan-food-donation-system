const nodemailer = require('nodemailer');

// Transporter banao
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL,
    pass: process.env.EMAIL_PASSWORD,
  },
});

// OTP generate karo — 6 digit
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// OTP email bhejo
const sendOTPEmail = async (toEmail, otp, purpose) => {
  const subjects = {
    register: 'Annadan — Email Verify karo',
    reset: 'Annadan — Password Reset OTP',
  };

  const messages = {
    register: `
      <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto;">
        <h2 style="color: #7B2FFF;">🌾 Annadan</h2>
        <h3>Email Verification</h3>
        <p>Namaste! Aapka Annadan par swagat hai.</p>
        <p>Apni email verify karne ke liye ye OTP use karo:</p>
        <div style="background: #f0e6ff; padding: 20px; border-radius: 10px; text-align: center; margin: 20px 0;">
          <h1 style="color: #7B2FFF; letter-spacing: 8px; font-size: 36px;">${otp}</h1>
        </div>
        <p style="color: #666;">Ye OTP sirf <strong>10 minute</strong> ke liye valid hai.</p>
        <p style="color: #666;">Agar aapne register nahi kiya to is email ko ignore karo.</p>
        <hr/>
        <p style="color: #999; font-size: 12px;">Annadan — Khana Bachao, Zindagi Bachao</p>
      </div>
    `,
    reset: `
      <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto;">
        <h2 style="color: #7B2FFF;">🌾 Annadan</h2>
        <h3>Password Reset</h3>
        <p>Namaste! Aapne password reset request ki hai.</p>
        <p>Naya password set karne ke liye ye OTP use karo:</p>
        <div style="background: #f0e6ff; padding: 20px; border-radius: 10px; text-align: center; margin: 20px 0;">
          <h1 style="color: #7B2FFF; letter-spacing: 8px; font-size: 36px;">${otp}</h1>
        </div>
        <p style="color: #666;">Ye OTP sirf <strong>10 minute</strong> ke liye valid hai.</p>
        <p style="color: #666;">Agar aapne request nahi ki to is email ko ignore karo.</p>
        <hr/>
        <p style="color: #999; font-size: 12px;">Annadan — Khana Bachao, Zindagi Bachao</p>
      </div>
    `,
  };

  const mailOptions = {
    from: `"Annadan 🌾" <${process.env.EMAIL}>`,
    to: toEmail,
    subject: subjects[purpose],
    html: messages[purpose],
  };

  await transporter.sendMail(mailOptions);
};

module.exports = { generateOTP, sendOTPEmail };