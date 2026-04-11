import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { generateOTP, hashOTP, sendOTPEmail } from "@/lib/otp";

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    // Only allow admin email
    const adminEmail = process.env.ADMIN_EMAIL || "admin@hellopizza.com";
    if (email.toLowerCase() !== adminEmail.toLowerCase()) {
      return NextResponse.json({ error: "Unauthorized email" }, { status: 403 });
    }

    // Rate limit: max 5 OTPs per hour
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const recentOtps = await prisma.otpToken.count({
      where: {
        email: email.toLowerCase(),
        createdAt: { gte: oneHourAgo },
      },
    });

    if (recentOtps >= 5) {
      return NextResponse.json(
        { error: "Too many OTP requests. Try again later." },
        { status: 429 }
      );
    }

    // Invalidate previous unused OTPs
    await prisma.otpToken.updateMany({
      where: { email: email.toLowerCase(), used: false },
      data: { used: true },
    });

    // Generate and store new OTP
    const otp = generateOTP();
    const otpHash = await hashOTP(otp);

    await prisma.otpToken.create({
      data: {
        email: email.toLowerCase(),
        otpHash,
        expiresAt: new Date(Date.now() + 5 * 60 * 1000), // 5 minutes
      },
    });

    // Send OTP email
    try {
      await sendOTPEmail(email, otp);
    } catch (emailError) {
      console.error("Failed to send OTP email:", emailError);
      // In development, log the OTP to console
      if (process.env.NODE_ENV === "development") {
        console.log(`\n🔑 DEV OTP for ${email}: ${otp}\n`);
      }
    }

    return NextResponse.json({
      message: "OTP sent successfully",
      // In development, return OTP for easy testing
      ...(process.env.NODE_ENV === "development" && { devOtp: otp }),
    });
  } catch (error) {
    console.error("Send OTP error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
