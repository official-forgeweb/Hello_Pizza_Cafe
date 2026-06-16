import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { CustomerService } from "@/lib/services/customerService";
import { WhatsAppService } from "@/lib/services/whatsappService";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    // Basic verification token safety check
    const { searchParams } = new URL(request.url);
    const token = searchParams.get("token");
    const cronSecret = process.env.WHATSAPP_VERIFY_TOKEN || "hellopizza_webhook_secret_2024";

    if (token !== cronSecret) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    console.log("[Cron Loyalty Reminder] Starting check for expiring points (5 days)...");

    // Fetch all customers who have opted in
    const customers = await prisma.customer.findMany({
      where: { whatsappOptIn: true }
    });

    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + 5);
    const expiryDateStr = targetDate.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });

    let remindersSent = 0;
    const errors: any[] = [];

    for (const customer of customers) {
      // Calculate points expiring in exactly 5 days
      const pointsExpiring = await CustomerService.getPointsExpiringInDays(customer.phone, 5);

      if (pointsExpiring > 0) {
        console.log(`[Cron Loyalty Reminder] Customer ${customer.phone} (${customer.name}) has ${pointsExpiring} points expiring on ${expiryDateStr}`);

        // Try to fetch approved template details, fallback to 'wallet_update'
        const template = await prisma.whatsAppTemplate.findFirst({
          where: {
            templateName: { in: ["wallet_update", "loyalty_reminder"] },
            status: "APPROVED"
          }
        });
        const templateName = template?.templateName || "wallet_update";
        const language = template?.language || "en_US";

        // Template variables: Hi [Name], your wallet has been updated by [X] points. You have [Y] points expiring on [Date]... Visit [Cafe Name]...
        // 1: Name, 2: X (0 since reminder/no bonus), 3: Y (points expiring), 4: Date, 5: Cafe Name
        const components = [
          {
            type: "body",
            parameters: [
              { type: "text", text: customer.name },
              { type: "text", text: "0" },
              { type: "text", text: String(pointsExpiring) },
              { type: "text", text: expiryDateStr },
              { type: "text", text: "Hello Pizza Cafe" }
            ]
          }
        ];

        const result = await WhatsAppService.sendTemplateMessage(
          customer.phone,
          templateName,
          language,
          components
        );

        if (result.success) {
          // Log sending reminder
          await prisma.messageLog.create({
            data: {
              phone: customer.phone,
              customerId: customer.phone,
              messageType: "marketing",
              templateUsed: templateName,
              status: "sent",
              whatsappMessageId: result.data?.messages?.[0]?.id || "",
            }
          });
          remindersSent++;
        } else {
          console.error(`[Cron Loyalty Reminder] Failed to send reminder to ${customer.phone}:`, result.error);
          await prisma.messageLog.create({
            data: {
              phone: customer.phone,
              customerId: customer.phone,
              messageType: "marketing",
              templateUsed: templateName,
              status: "failed",
              errorMessage: result.error || "Unknown WhatsApp API error"
            }
          });
          errors.push({ phone: customer.phone, error: result.error });
        }
      }
    }

    return NextResponse.json({
      success: true,
      remindersSent,
      errorsCount: errors.length,
      errors
    });
  } catch (error: any) {
    console.error("[Cron Loyalty Reminder] Unexpected error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
