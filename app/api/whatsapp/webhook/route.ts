import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import prisma from "@/lib/prisma";

const VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN;
const APP_SECRET = process.env.WHATSAPP_APP_SECRET;

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  if (mode && token) {
    if (mode === "subscribe" && token === VERIFY_TOKEN) {
      console.log("WEBHOOK_VERIFIED");
      return new NextResponse(challenge, { status: 200 });
    } else {
      return new NextResponse("Forbidden", { status: 403 });
    }
  }

  return new NextResponse("Bad Request", { status: 400 });
}

export async function POST(request: NextRequest) {
  try {
    let body;

    // 1. Verify Signature if APP_SECRET is provided
    if (APP_SECRET) {
      const signature = request.headers.get("x-hub-signature-256");
      if (!signature) {
        return new NextResponse("Missing signature", { status: 401 });
      }

      const bodyText = await request.text();
      const expectedSignature = `sha256=${crypto
        .createHmac("sha256", APP_SECRET)
        .update(bodyText)
        .digest("hex")}`;

      if (signature !== expectedSignature) {
        return new NextResponse("Invalid signature", { status: 401 });
      }
      
      body = JSON.parse(bodyText);
    } else {
      body = await request.json();
    }

    // 2. Process Webhook Payload
    if (body.object === "whatsapp_business_account") {
      for (const entry of body.entry || []) {
        for (const change of entry.changes || []) {
          if (change.value && change.value.statuses) {
            // Handle message status updates (sent, delivered, read, failed)
            for (const status of change.value.statuses) {
              const { id: messageId, status: messageStatus, timestamp, pricing } = status;
              
              const updateData: any = {
                status: messageStatus,
              };

              const date = new Date(parseInt(timestamp) * 1000);
              if (messageStatus === "sent") updateData.sentAt = date;
              if (messageStatus === "delivered") updateData.deliveredAt = date;
              if (messageStatus === "read") updateData.readAt = date;
              
              if (status.errors && status.errors.length > 0) {
                updateData.errorMessage = status.errors[0].title || status.errors[0].message;
              }

              const messageLog = await prisma.messageLog.update({
                where: { whatsappMessageId: messageId },
                data: updateData,
              }).catch(() => null);

              // If it's part of a campaign, update campaign stats
              if (messageLog && messageLog.campaignId) {
                if (messageStatus === "delivered") {
                  await prisma.campaign.update({
                    where: { id: messageLog.campaignId },
                    data: { delivered: { increment: 1 } }
                  });
                } else if (messageStatus === "read") {
                  await prisma.campaign.update({
                    where: { id: messageLog.campaignId },
                    data: { read: { increment: 1 } }
                  });
                } else if (messageStatus === "failed") {
                  await prisma.campaign.update({
                    where: { id: messageLog.campaignId },
                    data: { failed: { increment: 1 } }
                  });
                }
              }
            }
          }

          if (change.value && change.value.messages) {
            // Handle incoming messages (customer replying)
            for (const message of change.value.messages) {
              // Can implement auto-reply here
              console.log("Received incoming message:", message);
            }
          }
        }
      }
      return new NextResponse("EVENT_RECEIVED", { status: 200 });
    } else {
      return new NextResponse("Not Found", { status: 404 });
    }
  } catch (error) {
    console.error("Webhook processing error:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
