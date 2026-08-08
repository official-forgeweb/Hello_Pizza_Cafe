import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get("token");
    
    const validToken = process.env.WHATSAPP_VERIFY_TOKEN || "hellopizza_webhook_secret_2024";
    if (token !== validToken) {
      return NextResponse.json({ error: "Unauthorized token" }, { status: 401 });
    }

    console.log("[Loyalty Catchup API] Fetching loyalty catchup payload for POS app...");

    // Fetch all customers
    const customers = await prisma.customer.findMany({
      select: {
        phone: true,
        name: true,
        email: true,
        address: true,
        createdAt: true,
        updatedAt: true
      }
    });

    // Fetch loyalty settings
    const settings = await prisma.loyaltySetting.findMany();

    // Fetch loyalty transactions
    const transactions = await prisma.loyaltyTransaction.findMany({
      orderBy: { timestamp: "asc" }
    });

    console.log(`[Loyalty Catchup API] Returning ${customers.length} customers and ${transactions.length} transactions.`);

    return NextResponse.json({
      success: true,
      customers,
      settings,
      transactions
    });
  } catch (error: any) {
    console.error("[Loyalty Catchup API] Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
