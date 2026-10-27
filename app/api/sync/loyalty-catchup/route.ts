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
    // Allow optional filters (?days=X, ?since=ISO, ?all=true)
    // Default to last 3 days (covers all transactions from today + 2 previous days)
    // This keeps the response payload ~2.3 MB, well within Vercel's 4.5 MB limit and avoiding timeouts
    const allParam = searchParams.get("all");
    const sinceParam = searchParams.get("since");
    const daysParam = searchParams.get("days");

    let txWhere: any = {};
    if (allParam === "true") {
      txWhere = {};
    } else if (sinceParam) {
      txWhere = { timestamp: { gte: new Date(sinceParam) } };
    } else {
      const days = daysParam ? parseInt(daysParam, 10) : 3;
      const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
      txWhere = { timestamp: { gte: cutoffDate } };
    }

    const transactions = await prisma.loyaltyTransaction.findMany({
      where: txWhere,
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
