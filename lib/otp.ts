import crypto from "crypto";
import bcrypt from "bcryptjs";
import nodemailer from "nodemailer";

/**
 * Generate a 6-digit OTP
 */
export function generateOTP(): string {
  return crypto.randomInt(100000, 999999).toString();
}

/**
 * Hash an OTP for secure storage
 */
export async function hashOTP(otp: string): Promise<string> {
  return bcrypt.hash(otp, 10);
}

/**
 * Verify an OTP against its hash
 */
export async function verifyOTP(otp: string, hash: string): Promise<boolean> {
  return bcrypt.compare(otp, hash);
}

/**
 * Send OTP via email using Nodemailer
 */
export async function sendOTPEmail(email: string, otp: string): Promise<void> {
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || "smtp.gmail.com",
    port: parseInt(process.env.SMTP_PORT || "587"),
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  await transporter.sendMail({
    from: `"Hello Pizza Admin" <${process.env.SMTP_USER}>`,
    to: email,
    subject: "Your Admin Login OTP — Hello Pizza",
    html: `
      <div style="font-family: 'Inter', sans-serif; max-width: 480px; margin: 0 auto; padding: 40px 24px; background: #fafaf9;">
        <div style="text-align: center; margin-bottom: 32px;">
          <h1 style="font-size: 24px; font-weight: 800; color: #1c1917; margin: 0;">
            Hello<span style="color: #e31837;">Pizza</span>
          </h1>
          <p style="font-size: 13px; color: #78716c; margin-top: 4px;">Admin Dashboard</p>
        </div>
        <div style="background: white; border-radius: 16px; padding: 32px; box-shadow: 0 4px 20px -2px rgba(0,0,0,0.05);">
          <h2 style="font-size: 18px; font-weight: 700; color: #1c1917; margin: 0 0 8px;">Your Verification Code</h2>
          <p style="font-size: 13px; color: #78716c; margin: 0 0 24px;">Enter this code to log in to the admin dashboard.</p>
          <div style="background: #f5f5f4; border-radius: 12px; padding: 20px; text-align: center; letter-spacing: 12px; font-size: 36px; font-weight: 800; color: #e31837;">
            ${otp}
          </div>
          <p style="font-size: 12px; color: #a8a29e; margin-top: 24px; text-align: center;">
            This code expires in <strong>5 minutes</strong>. Do not share it with anyone.
          </p>
        </div>
        <p style="font-size: 11px; color: #a8a29e; text-align: center; margin-top: 24px;">
          If you didn't request this code, you can safely ignore this email.
        </p>
      </div>
    `,
  });
}
