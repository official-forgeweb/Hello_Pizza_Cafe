import { NextRequest, NextResponse } from "next/server";
import { CustomerService } from "@/lib/services/customerService";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const phone = searchParams.get("phone");

    if (!phone) {
      return NextResponse.json({ error: "Phone number parameter is required" }, { status: 400 });
    }

    const cleanPhone = phone.trim();
    const wallet = await CustomerService.getCustomerLoyaltyWallet(cleanPhone);

    return NextResponse.json({
      success: true,
      phone: cleanPhone,
      ...wallet
    });
  } catch (error: any) {
    console.error("Error fetching loyalty balance:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
