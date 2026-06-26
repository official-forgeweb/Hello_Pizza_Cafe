import { NextRequest, NextResponse } from "next/server";
import { WhatsAppService } from "@/lib/services/whatsappService";
import prisma from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const { phone, otp } = await request.json();
    if (!phone || !otp) {
      return NextResponse.json({ error: "Phone and OTP are required" }, { status: 400 });
    }

    const cleanPhone = phone.trim().replace(/\D/g, "");
    if (cleanPhone.length < 10) {
      return NextResponse.json({ error: "Invalid phone number" }, { status: 400 });
    }

    console.log(`[Loyalty OTP] Sending OTP ${otp} to ${cleanPhone}`);

    // Send template message "loyalty_verification_otp" (AUTHENTICATION)
    const result = await WhatsAppService.sendTemplateMessage(
      cleanPhone,
      "loyalty_verification_otp",
      "en_US",
      [
        {
          type: "body",
          parameters: [
            { type: "text", text: otp }
          ]
        },
        {
          type: "button",
          sub_type: "url",
          index: "0",
          parameters: [
            { type: "text", text: otp }
          ]
        }
      ]
    );

    if (result.success) {
      return NextResponse.json({ success: true, message: "OTP sent successfully" });
    } else {
      // Fallback: try sending as a simple text message (if inside 24h window)
      console.log(`[Loyalty OTP] Template failed. Trying text fallback...`);
      const textResult = await WhatsAppService.sendTextMessage(
        cleanPhone,
        `Your Hello Pizza Cafe loyalty points redemption OTP is ${otp}. Do not share this code.`
      );
      if (textResult.success) {
        return NextResponse.json({ success: true, message: "OTP sent as text message fallback" });
      }
      return NextResponse.json({ success: false, error: result.error || textResult.error }, { status: 400 });
    }
  } catch (error: any) {
    console.error("Error sending loyalty OTP:", error);
    return NextResponse.json({ error: error.message || "Server error" }, { status: 500 });
  }
}
