import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { verifyAdminToken } from "@/lib/jwt";
import { encryptPassword, decryptPassword } from "@/lib/crypto";

function isAuthenticated(request: NextRequest) {
  const token = request.cookies.get("admin_token")?.value;
  if (!token) return false;
  return verifyAdminToken(token) !== null;
}

export async function GET(request: NextRequest) {
  if (!isAuthenticated(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    let emailConfig = await prisma.cloudEmailConfig.findUnique({
      where: { id: 1 },
    });

    if (!emailConfig) {
      emailConfig = await prisma.cloudEmailConfig.create({
        data: {
          id: 1,
          smtpHost: "smtp.gmail.com",
          smtpPort: 587,
          smtpUser: "",
          smtpPass: "",
          salesReportRecipients: [],
          hourlyReportEnabled: true,
        },
      });
    }

    // Decrypt password for display
    const decryptedPass = emailConfig.smtpPass ? decryptPassword(emailConfig.smtpPass) : "";

    return NextResponse.json({
      ...emailConfig,
      smtpPass: decryptedPass,
    });
  } catch (error: any) {
    console.error("Error in GET email-config:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  if (!isAuthenticated(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const {
      smtpHost,
      smtpPort,
      smtpUser,
      smtpPass,
      salesReportRecipients,
      hourlyReportEnabled,
    } = body;

    const encryptedPass = smtpPass ? encryptPassword(smtpPass) : "";

    const updated = await prisma.cloudEmailConfig.upsert({
      where: { id: 1 },
      create: {
        id: 1,
        smtpHost: smtpHost || "smtp.gmail.com",
        smtpPort: Number(smtpPort ?? 587),
        smtpUser: smtpUser || "",
        smtpPass: encryptedPass,
        salesReportRecipients: salesReportRecipients || [],
        hourlyReportEnabled: hourlyReportEnabled ?? true,
        updatedAt: new Date(),
      },
      update: {
        smtpHost: smtpHost || "smtp.gmail.com",
        smtpPort: Number(smtpPort ?? 587),
        smtpUser: smtpUser || "",
        smtpPass: encryptedPass,
        salesReportRecipients: salesReportRecipients || [],
        hourlyReportEnabled: hourlyReportEnabled ?? true,
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({
      ...updated,
      smtpPass: smtpPass || "",
    });
  } catch (error: any) {
    console.error("Error in PUT email-config:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
