import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { verifyAdminToken } from "@/lib/jwt";

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
    let setting = await prisma.globalSetting.findUnique({
      where: { id: 1 },
    });

    if (!setting) {
      setting = await prisma.globalSetting.create({
        data: {
          id: 1,
          cafeName: "Hello Pizza Cafe",
          taxPercent: 5.0,
          currency: "INR",
          loyaltyPointsPerAmount: 5,
          loyaltyAmountThreshold: 100,
          loyaltyMinHours: 24,
          loyaltyMaxDays: 30,
        },
      });
    }

    return NextResponse.json(setting);
  } catch (error: any) {
    console.error("Error in GET global-settings:", error);
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
      cafeName,
      taxPercent,
      currency,
      loyaltyPointsPerAmount,
      loyaltyAmountThreshold,
      loyaltyMinHours,
      loyaltyMaxDays,
    } = body;

    const updated = await prisma.globalSetting.upsert({
      where: { id: 1 },
      create: {
        id: 1,
        cafeName: cafeName || "Hello Pizza Cafe",
        taxPercent: Number(taxPercent ?? 5.0),
        currency: currency || "INR",
        loyaltyPointsPerAmount: Number(loyaltyPointsPerAmount ?? 5),
        loyaltyAmountThreshold: Number(loyaltyAmountThreshold ?? 100),
        loyaltyMinHours: Number(loyaltyMinHours ?? 24),
        loyaltyMaxDays: Number(loyaltyMaxDays ?? 30),
        updatedAt: new Date(),
      },
      update: {
        cafeName: cafeName || "Hello Pizza Cafe",
        taxPercent: Number(taxPercent ?? 5.0),
        currency: currency || "INR",
        loyaltyPointsPerAmount: Number(loyaltyPointsPerAmount ?? 5),
        loyaltyAmountThreshold: Number(loyaltyAmountThreshold ?? 100),
        loyaltyMinHours: Number(loyaltyMinHours ?? 24),
        loyaltyMaxDays: Number(loyaltyMaxDays ?? 30),
        updatedAt: new Date(),
      },
    });

    // Sync to LoyaltySetting table as well
    await prisma.loyaltySetting.upsert({
      where: { id: "default" },
      create: {
        id: "default",
        pointsPerAmount: Number(loyaltyPointsPerAmount ?? 5),
        amountThreshold: Number(loyaltyAmountThreshold ?? 100),
        expiryDays: Number(loyaltyMaxDays ?? 30),
      },
      update: {
        pointsPerAmount: Number(loyaltyPointsPerAmount ?? 5),
        amountThreshold: Number(loyaltyAmountThreshold ?? 100),
        expiryDays: Number(loyaltyMaxDays ?? 30),
      },
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error("Error in PUT global-settings:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
