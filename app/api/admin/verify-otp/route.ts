import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { verifyOTP } from "@/lib/otp";
import { signAdminToken } from "@/lib/jwt";

export async function POST(request: NextRequest) {
  try {
    const { email, otp } = await request.json();

    if (!email || !otp) {
      return NextResponse.json({ error: "Email and OTP are required" }, { status: 400 });
    }

    const adminEmail = process.env.ADMIN_EMAIL || "admin@hellopizza.com";
    if (email.toLowerCase() !== adminEmail.toLowerCase()) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Find the latest unused OTP for this email
    const otpRecord = await prisma.otpToken.findFirst({
      where: {
        email: email.toLowerCase(),
        used: false,
        expiresAt: { gte: new Date() },
      },
      orderBy: { createdAt: "desc" },
    });

    console.log(`[DEBUG] Verify OTP for ${email}:`, { 
      found: !!otpRecord, 
      attempts: otpRecord?.attempts,
      expiresAt: otpRecord?.expiresAt 
    });

    if (!otpRecord) {
      return NextResponse.json(
        { error: "OTP expired or not found. Request a new one." },
        { status: 400 }
      );
    }

    // Check max attempts
    if (otpRecord.attempts >= 3) {
      await prisma.otpToken.update({
        where: { id: otpRecord.id },
        data: { used: true },
      });
      return NextResponse.json(
        { error: "Too many attempts. Request a new OTP." },
        { status: 400 }
      );
    }

    // Verify OTP
    const isValid = await verifyOTP(otp, otpRecord.otpHash);

    if (!isValid) {
      // Increment attempt count
      await prisma.otpToken.update({
        where: { id: otpRecord.id },
        data: { attempts: otpRecord.attempts + 1 },
      });
      return NextResponse.json(
        { error: `Invalid OTP. ${2 - otpRecord.attempts} attempts remaining.` },
        { status: 400 }
      );
    }

    // Mark OTP as used
    await prisma.otpToken.update({
      where: { id: otpRecord.id },
      data: { used: true },
    });

    // Find or create admin user
    let admin = await prisma.adminUser.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!admin) {
      admin = await prisma.adminUser.create({
        data: {
          email: email.toLowerCase(),
          name: "Admin",
          role: "ADMIN",
        },
      });
    }

    // Update last login
    await prisma.adminUser.update({
      where: { id: admin.id },
      data: { lastLogin: new Date() },
    });

    // Issue JWT
    const token = signAdminToken({
      id: admin.id,
      email: admin.email,
      name: admin.name,
      role: admin.role,
    });

    // Set cookie
    const response = NextResponse.json({
      message: "Login successful",
      admin: { id: admin.id, email: admin.email, name: admin.name },
    });

    response.cookies.set("admin_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("Verify OTP error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
