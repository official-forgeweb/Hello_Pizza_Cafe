import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import prisma from "@/lib/prisma";

const VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN;
const APP_SECRET = process.env.WHATSAPP_APP_SECRET;

// ─── Bot Message Processing (async, non-blocking) ──────────

/**
 * Process an incoming WhatsApp message through the chatbot and send back a response.
 * This runs asynchronously so the webhook can return 200 immediately (WhatsApp requires < 15s).
 */
async function processIncomingMessage(senderPhone: string, messageText: string) {
  try {
    console.log(`[WhatsApp Bot] Incoming from ${senderPhone}: "${messageText}"`);

    // Dynamic import to avoid circular dependency issues
    const { handleIncomingMessage } = await import("@/lib/services/chatbotService");
    const { WhatsAppService } = await import("@/lib/services/whatsappService");

    // Get the bot's response
    const responseText = await handleIncomingMessage(senderPhone, messageText);

    if (!responseText) {
      console.log("[WhatsApp Bot] Empty response — skipping send");
      return;
    }

    // WhatsApp has a 4096 character limit per message — split if needed
    const chunks = splitMessage(responseText, 4000);

    for (const chunk of chunks) {
      const result = await WhatsAppService.sendTextMessage(senderPhone, chunk);
      if (!result.success) {
        console.error(`[WhatsApp Bot] Failed to send reply to ${senderPhone}:`, result.error);
      }
    }

    console.log(`[WhatsApp Bot] Sent ${chunks.length} message(s) to ${senderPhone}`);
  } catch (error) {
    console.error("[WhatsApp Bot] Error processing message:", error);

    // Try to send an error message to the user
    try {
      const { WhatsAppService } = await import("@/lib/services/whatsappService");
      await WhatsAppService.sendTextMessage(
        senderPhone,
        "😔 Sorry, something went wrong. Please try again or type *HELP* for options."
      );
    } catch {
      // Can't even send error message — just log
      console.error("[WhatsApp Bot] Failed to send error fallback message");
    }
  }
}

/**
 * Split a long message into chunks that fit within WhatsApp's character limit.
 * Tries to break at newlines for clean formatting.
 */
function splitMessage(text: string, maxLength: number): string[] {
  if (text.length <= maxLength) return [text];

  const chunks: string[] = [];
  let remaining = text;

  while (remaining.length > 0) {
    if (remaining.length <= maxLength) {
      chunks.push(remaining);
      break;
    }

    // Find a good break point (newline near the limit)
    let breakIdx = remaining.lastIndexOf('\n', maxLength);
    if (breakIdx < maxLength * 0.5) {
      // No good newline break — try space
      breakIdx = remaining.lastIndexOf(' ', maxLength);
    }
    if (breakIdx < maxLength * 0.3) {
      // No good break point — hard cut
      breakIdx = maxLength;
    }

    chunks.push(remaining.substring(0, breakIdx));
    remaining = remaining.substring(breakIdx).trimStart();
  }

  return chunks;
}

// ─── Webhook Handlers ──────────────────────────────────────

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
              const { id: messageId, status: messageStatus, timestamp } = status;
              
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

              if (messageLog && messageLog.campaignId && (messageStatus === "sent" || messageStatus === "delivered")) {
                const campaign = await prisma.campaign.findUnique({
                  where: { id: messageLog.campaignId }
                });
                if (campaign) {
                  const getEffectiveBonusPoints = (c: any) => {
                    if (c.bonusPoints && c.bonusPoints > 0) return c.bonusPoints;
                    if (c.templateName === 'loyalty_balance_update' && Array.isArray(c.bodyParameters) && c.bodyParameters.length > 0) {
                      const parsed = parseInt(c.bodyParameters[0]);
                      if (!isNaN(parsed) && parsed > 0) return parsed;
                    }
                    return 0;
                  };
                  const effectiveBonus = getEffectiveBonusPoints(campaign);
                  if (effectiveBonus > 0) {
                    const existingTx = await prisma.loyaltyTransaction.findFirst({
                      where: {
                        phoneNumber: messageLog.phone,
                        campaignId: campaign.id
                      }
                    });
                    if (!existingTx) {
                      const expiryDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
                      await prisma.loyaltyTransaction.create({
                        data: {
                          phoneNumber: messageLog.phone,
                          type: "BONUS",
                          points: effectiveBonus,
                          expiryDate,
                          isPending: true,
                          campaignId: campaign.id
                        }
                      });
                    }
                  }
                }
              }

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
            // ─── CHATBOT: Handle incoming customer messages ─────
            for (const message of change.value.messages) {
              const senderPhone = message.from; // e.g. "919876543210"

              // Extract text content from different message types
              let messageText = "";

              if (message.type === "text" && message.text?.body) {
                // Regular text message
                messageText = message.text.body;
              } else if (message.type === "interactive") {
                // Button reply or list reply
                if (message.interactive?.type === "button_reply") {
                  messageText = message.interactive.button_reply.title || message.interactive.button_reply.id;
                } else if (message.interactive?.type === "list_reply") {
                  messageText = message.interactive.list_reply.title || message.interactive.list_reply.id;
                }
              } else if (message.type === "button" && message.button?.text) {
                // Template button click
                messageText = message.button.text;
              } else {
                // Unsupported message type (image, audio, video, etc.)
                messageText = "";
              }

              if (messageText) {
                // Process asynchronously — don't block the webhook response
                // WhatsApp requires webhook to respond within 15 seconds
                processIncomingMessage(senderPhone, messageText).catch((err) => {
                  console.error("[WhatsApp Bot] Async processing error:", err);
                });
              } else if (message.type !== "text") {
                // Send a polite message for unsupported content types
                processIncomingMessage(
                  senderPhone,
                  "__UNSUPPORTED_MEDIA__"
                ).catch(() => {});
                // Override: send a direct text reply instead
                import("@/lib/services/whatsappService").then(({ WhatsAppService }) => {
                  WhatsAppService.sendTextMessage(
                    senderPhone,
                    "🤔 I can only process text messages right now.\n\nPlease type your message or type *HELP* to see what I can do! 😊"
                  ).catch(() => {});
                }).catch(() => {});
              }

              console.log(`[WhatsApp Bot] Received ${message.type} message from ${senderPhone}`);
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
