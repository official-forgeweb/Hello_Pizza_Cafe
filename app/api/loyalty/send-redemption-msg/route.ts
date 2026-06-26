import { NextRequest, NextResponse } from "next/server";
import { WhatsAppService } from "@/lib/services/whatsappService";

export async function POST(request: NextRequest) {
  try {
    const { phone, pointsRedeemed, pointsBalance, expiryDate } = await request.json();
    if (!phone || pointsRedeemed === undefined || pointsBalance === undefined || !expiryDate) {
      return NextResponse.json(
        { error: "Phone, pointsRedeemed, pointsBalance, and expiryDate are required" },
        { status: 400 }
      );
    }

    const cleanPhone = phone.trim().replace(/\D/g, "");
    if (cleanPhone.length < 10) {
      return NextResponse.json({ error: "Invalid phone number" }, { status: 400 });
    }

    console.log(
      `[Loyalty Redemption] Sending redemption msg to ${cleanPhone}. Deducted: ${pointsRedeemed}, Balance: ${pointsBalance}, Expiry: ${expiryDate}`
    );

    // Send template message "loyalty_points_redeemed"
    const result = await WhatsAppService.sendTemplateMessage(
      cleanPhone,
      "loyalty_points_redeemed",
      "en_US",
      [
        {
          type: "body",
          parameters: [
            { type: "text", text: String(pointsRedeemed) },
            { type: "text", text: String(pointsBalance) },
            { type: "text", text: String(expiryDate) }
          ]
        }
      ]
    );

    if (result.success) {
      return NextResponse.json({ success: true, message: "Redemption message sent successfully via template" });
    } else {
      // Fallback: try sending as a simple text message (if inside 24h window)
      console.log(`[Loyalty Redemption] Template failed. Trying text fallback...`);
      const fallbackText = `Hello! You have successfully redeemed ${pointsRedeemed} loyalty points. Your remaining points balance is ${pointsBalance}, valid until ${expiryDate}. Thank you for ordering from Hello Pizza Cafe!`;
      
      const textResult = await WhatsAppService.sendTextMessage(cleanPhone, fallbackText);
      if (textResult.success) {
        return NextResponse.json({ success: true, message: "Redemption message sent via text fallback" });
      }
      return NextResponse.json({ success: false, error: result.error || textResult.error }, { status: 400 });
    }
  } catch (error: any) {
    console.error("Error sending redemption message:", error);
    return NextResponse.json({ error: error.message || "Server error" }, { status: 500 });
  }
}
