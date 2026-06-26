import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const phone = searchParams.get("phone");

    if (!phone) {
      return NextResponse.json({ error: "Phone number parameter is required" }, { status: 400 });
    }

    const cleanPhone = phone.trim();

    const txs = await prisma.loyaltyTransaction.findMany({
      where: { phoneNumber: cleanPhone },
      orderBy: { timestamp: "desc" },
      take: 15
    });

    // Serialize Decimal / Date values safely for JSON response
    const serializedTxs = txs.map(tx => ({
      ...tx,
      points: Number(tx.points)
    }));

    return NextResponse.json(serializedTxs);
  } catch (error: any) {
    console.error("Error fetching loyalty transactions:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
