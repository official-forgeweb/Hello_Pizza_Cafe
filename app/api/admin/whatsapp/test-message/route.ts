import { NextRequest, NextResponse } from "next/server";
import { WhatsAppService } from "@/lib/services/whatsappService";
import prisma from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const { phone } = await request.json();
    if (!phone) {
      return NextResponse.json({ error: "Phone number is required" }, { status: 400 });
    }

    // Clean phone number
    const cleanPhone = phone.trim().replace(/\D/g, "");
    if (cleanPhone.length < 10) {
      return NextResponse.json({ error: "Invalid phone number length" }, { status: 400 });
    }

    console.log(`[WhatsApp Test] Triggering hello_world template for: ${cleanPhone}`);

    // Call WhatsApp Service with standard hello_world template
    const result = await WhatsAppService.sendTemplateMessage(
      cleanPhone,
      "hello_world",
      "en_US",
      []
    );

    // Always log the test message attempt in MessageLog for troubleshooting!
    try {
      await prisma.messageLog.create({
        data: {
          phone: cleanPhone,
          messageType: "test_message",
          templateUsed: "hello_world",
          status: result.success ? "sent" : "failed",
          errorMessage: result.success ? null : (result.error || "Meta rejected request"),
          whatsappMessageId: result.data?.messages?.[0]?.id || null,
        },
      });
    } catch (dbError) {
      console.error("Could not write test message log to DB:", dbError);
    }

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: "Test message sent successfully!",
        data: result.data,
      });
    } else {
      return NextResponse.json(
        {
          success: false,
          error: result.error || "Failed to send test message via Meta",
        },
        { status: 400 }
      );
    }
  } catch (error: any) {
    console.error("Error sending test message:", error);
    return NextResponse.json(
      { error: error.message || "An unexpected error occurred." },
      { status: 500 }
    );
  }
}
