import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const batch = await request.json();

    if (!Array.isArray(batch)) {
      return NextResponse.json({ success: false, error: "Invalid payload format. Expected array." }, { status: 400 });
    }

    const results = [];

    for (const item of batch) {
      const { localId, table, operation, record, timestamp } = item;

      if (table === "order") {
        try {
          if (operation === "INSERT" || operation === "INSERT_OR_REPLACE" || operation === "create") {
            const orderId = record.id;
            const orderNumber = String(record.order_number);

            // Handle linking and merging of website orders to avoid duplicates
            let waConfirmationSent = false;
            if (record.website_order_id) {
              const existingWebOrder = await prisma.order.findUnique({
                where: { id: record.website_order_id }
              });
              if (existingWebOrder) {
                waConfirmationSent = existingWebOrder.waConfirmationSent;
                // Delete the pending website order to replace it with the POS order
                await prisma.order.delete({
                  where: { id: record.website_order_id }
                });
              }
            }

            // Clean up customer upsert
            let customerId = null;
            if (record.customer_phone) {
              let customer = await prisma.customer.findFirst({
                where: { phone: record.customer_phone }
              });

              const totalAmount = Number(record.total_amount || 0);

              if (!customer) {
                customer = await prisma.customer.create({
                  data: {
                    name: record.customer_name || "Walk-in Customer",
                    phone: record.customer_phone,
                    totalOrders: 1,
                    totalSpent: totalAmount,
                    lastOrderDate: new Date(record.created_at || timestamp || new Date()),
                  }
                });
              } else {
                customer = await prisma.customer.update({
                  where: { id: customer.id },
                  data: {
                    totalOrders: { increment: 1 },
                    totalSpent: { increment: totalAmount },
                    lastOrderDate: new Date(record.created_at || timestamp || new Date()),
                  }
                });
              }
              customerId = customer.id;
            }

            // Map order types safely
            let orderType = "DINE_IN";
            if (record.order_type === "delivery") orderType = "DELIVERY";
            else if (record.order_type === "pickup") orderType = "PICKUP";

            // Map order status
            let status = "CONFIRMED";
            if (record.status === "completed" || record.status === "delivered") status = "DELIVERED";
            else if (record.status === "cancelled") status = "CANCELLED";

            // Check if order already exists in website db (deduplicate)
            const exists = await prisma.order.findUnique({
              where: { id: orderId }
            });

            if (!exists) {
              // Create new synced order
              const createdOrder = await prisma.order.create({
                data: {
                  id: orderId,
                  orderNumber,
                  customerId,
                  customerName: record.customer_name || "Walk-in Customer",
                  customerPhone: record.customer_phone || "",
                  customerEmail: record.customer_email || null,
                  orderType: orderType as any,
                  deliveryAddress: record.customer_address || null,
                  subtotal: Number(record.subtotal || 0),
                  taxAmount: Number(record.tax_amount || 0),
                  deliveryFee: Number(record.delivery_charge || 0),
                  discountAmount: Number(record.discount_amount || 0),
                  totalAmount: Number(record.total_amount || 0),
                  couponCode: record.coupon_code || null,
                  status: status as any,
                  orderNotes: record.notes || null,
                  placedAt: new Date(record.created_at || timestamp || new Date()),
                  isSynced: true,
                  syncedAt: new Date(),
                  waConfirmationSent,
                  items: {
                    create: (record.items || []).map((item: any) => {
                      let variantName = null;
                      let variantPrice = 0;
                      if (item.variant) {
                        try {
                          const v = typeof item.variant === "string" ? JSON.parse(item.variant) : item.variant;
                          variantName = v.name || null;
                          variantPrice = Number(v.price || 0);
                        } catch (e) {}
                      }

                      let addonsList = [];
                      if (item.addons) {
                        try {
                          addonsList = typeof item.addons === "string" ? JSON.parse(item.addons) : item.addons;
                        } catch (e) {}
                      }

                      const basePrice = Number(item.unit_price || 0);
                      const addonsPrice = addonsList.reduce((sum: number, add: any) => sum + Number(add.price || 0), 0);
                      const itemTotal = (basePrice + addonsPrice) * (item.quantity || 1);

                      return {
                        menuItemId: item.menu_item_id || null,
                        itemName: item.name || "Unknown Item",
                        variantName,
                        basePrice,
                        variantPrice,
                        addonsPrice,
                        quantity: item.quantity || 1,
                        itemTotal,
                        specialInstructions: item.special_instructions || null,
                        addOns: {
                          create: addonsList.map((addon: any) => ({
                            addonName: addon.name,
                            addonPrice: Number(addon.price || 0),
                            quantity: Number(addon.quantity || 1),
                          }))
                        }
                      };
                    })
                  }
                }
              });

              // Trigger WhatsApp order confirmation ONLY for recent orders (placed within last 2 hours).
              // This prevents old queued POS orders from sending notifications when they first sync.
              const orderAge = Date.now() - new Date(record.created_at || timestamp || new Date()).getTime();
              const isRecentOrder = orderAge < 2 * 60 * 60 * 1000; // 2 hours
              if (!waConfirmationSent && record.customer_phone && isRecentOrder) {
                const { OrderNotificationService } = await import("@/lib/services/orderNotificationService");
                OrderNotificationService.sendOrderConfirmation(createdOrder.id).catch(err => {
                  console.error("[Sync Batch] WhatsApp confirmation failed:", err);
                });
              }
            } else {
              // Update order status if it already exists
              await prisma.order.update({
                where: { id: orderId },
                data: {
                  status: status as any,
                  updatedAt: new Date(),
                }
              });
            }

            results.push({ localId, status: "success" });
          } else if (operation === "UPDATE") {
            const orderId = record.id || item.record_id;
            let status = "CONFIRMED";
            if (record.status === "completed" || record.status === "delivered") status = "DELIVERED";
            else if (record.status === "cancelled") status = "CANCELLED";

            const exists = await prisma.order.findUnique({
              where: { id: orderId }
            });

            if (exists) {
              const updatedOrder = await prisma.order.update({
                where: { id: orderId },
                data: {
                  status: status as any,
                  updatedAt: new Date(),
                }
              });

              // Trigger WhatsApp updates for completed/delivered or cancelled orders synced from POS
              const { OrderNotificationService } = await import("@/lib/services/orderNotificationService");
              if (status === "DELIVERED") {
                OrderNotificationService.sendOrderDelivered(updatedOrder.id).catch(err => {
                  console.error("[Sync Batch UPDATE] WhatsApp delivery notification failed:", err);
                });
              } else if (status === "CANCELLED") {
                const reason = record.cancellationReason || "Cancelled in POS software";
                OrderNotificationService.sendOrderCancelled(updatedOrder.id, reason).catch(err => {
                  console.error("[Sync Batch UPDATE] WhatsApp cancellation notification failed:", err);
                });
              }
            }
            results.push({ localId, status: "success" });
          } else if (operation === "DELETE") {
            const orderId = record.id || item.record_id;
            const exists = await prisma.order.findUnique({
              where: { id: orderId }
            });
            if (exists) {
              await prisma.order.delete({
                where: { id: orderId }
              });
            }
            results.push({ localId, status: "success" });
          } else {
            results.push({ localId, status: "success" });
          }
        } catch (err: any) {
          console.error(`[Sync Batch] Error processing item ${localId}:`, err);
          results.push({ localId, status: "failed", error: err.message });
        }
      } else {
        // Automatically success for unhandled tables
        results.push({ localId, status: "success" });
      }
    }

    return NextResponse.json({
      success: true,
      results
    });
  } catch (error: any) {
    console.error("Batch sync root error:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
