import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const batch = await request.json();

    if (!Array.isArray(batch)) {
      return NextResponse.json({ success: false, error: "Invalid payload format. Expected array." }, { status: 400 });
    }

    // Fetch all valid MenuItem IDs to validate referential integrity
    const allMenuItems = await prisma.menuItem.findMany({
      select: { id: true }
    });
    const validMenuItemIds = new Set(allMenuItems.map(m => m.id));

    const results = [];

    for (const item of batch) {
      const { localId, table, operation, record, timestamp } = item;

      if (table === "order") {
        try {
          let customerId: string | null = null;
          if (operation === "INSERT" || operation === "INSERT_OR_REPLACE" || operation === "create") {
            const orderId = record.id;
            const orderNumber = String(record.order_number);

            console.log(`[Sync Batch] Processing order INSERT: id=${orderId}, number=${orderNumber}, website_order_id=${record.website_order_id || 'none'}, wa_notify=${record.wa_notify}, phone=${record.customer_phone}`);

            // Handle linking and merging of website orders to avoid duplicates
            let waConfirmationSent = false;
            if (record.website_order_id) {
              let websiteOrderIdToUse = record.website_order_id;
              let existingWebOrder = await prisma.order.findUnique({
                where: { id: record.website_order_id }
              });

              // Fallback: If not found by ID, match by orderNumber to recover from ID mismatch/dev database resets
              if (!existingWebOrder && orderNumber) {
                existingWebOrder = await prisma.order.findUnique({
                  where: { orderNumber: orderNumber }
                });
                if (existingWebOrder) {
                  websiteOrderIdToUse = existingWebOrder.id;
                  console.log(`[Sync Batch] Website order not found by ID but matched by orderNumber ${orderNumber}. Using ID ${websiteOrderIdToUse}`);
                }
              }

              if (existingWebOrder) {
                waConfirmationSent = existingWebOrder.waConfirmationSent;
                console.log(`[Sync Batch] Found website order ${websiteOrderIdToUse}, waConfirmationSent=${waConfirmationSent}. Disconnecting message logs and deleting to replace with POS order.`);
                
                // Disconnect message logs to avoid foreign key violations on deletion
                await prisma.messageLog.updateMany({
                  where: { orderId: websiteOrderIdToUse },
                  data: { orderId: null }
                });

                // Delete the pending website order to replace it with the POS order
                await prisma.order.delete({
                  where: { id: websiteOrderIdToUse }
                });
              } else {
                console.log(`[Sync Batch] Website order ${record.website_order_id} not found in DB by ID or orderNumber.`);
              }
            }

            // Upsert customer from POS data (without incrementing stats yet)
            customerId = null;
            const cleanPhone = record.customer_phone?.trim() || "";
            const cleanName = record.customer_name?.trim() || "Walk-in Customer";
            const isWaNotify = record.wa_notify === true || record.wa_notify === "true" || record.wa_notify === 1 || record.wa_notify === "1";
            if (cleanPhone) {
              let customer = await prisma.customer.findFirst({
                where: { phone: cleanPhone }
              });

              if (!customer) {
                // New customer from POS — auto opt-in for WhatsApp
                customer = await prisma.customer.create({
                  data: {
                    name: cleanName,
                    phone: cleanPhone,
                    email: record.customer_email || null,
                    address: record.customer_address || null,
                    whatsappOptIn: true,   // POS customers always opt-in
                    group: "new",
                    tags: ["pos-customer"],
                    totalOrders: 0,
                    totalSpent: 0,
                  }
                });
              } else {
                // Existing customer — update info and tags, statistics will be updated dynamically later
                const existingTags: string[] = customer.tags || [];
                const updatedTags = existingTags.includes("pos-customer")
                  ? existingTags
                  : [...existingTags, "pos-customer"];

                customer = await prisma.customer.update({
                  where: { phone: customer.phone },
                  data: {
                    // Update name only if it was a default placeholder
                    ...(customer.name === "Walk-in Customer" && record.customer_name
                      ? { name: cleanName }
                      : {}),
                    whatsappOptIn: true,
                    tags: updatedTags,
                  }
                });
              }
              customerId = customer.phone;
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
            let exists = await prisma.order.findUnique({
              where: { id: orderId }
            });

            // Fallback: check by orderNumber to prevent unique constraint failures, handle collisions gracefully
            let finalOrderNumber = orderNumber;
            if (!exists && orderNumber) {
              const matchedOrder = await prisma.order.findUnique({
                where: { orderNumber: orderNumber }
              });
              if (matchedOrder) {
                if (matchedOrder.id === orderId) {
                  exists = matchedOrder;
                } else {
                  // Collision: different order has the same order number
                  let suffix = 1;
                  let uniqueNumber = `${orderNumber}-${suffix}`;
                  while (true) {
                    const checkCollision = await prisma.order.findUnique({
                      where: { orderNumber: uniqueNumber }
                    });
                    if (!checkCollision) {
                      break;
                    }
                    suffix++;
                    uniqueNumber = `${orderNumber}-${suffix}`;
                  }
                  console.log(`[Sync Batch] Collision detected for order number ${orderNumber}. Assigned unique order number: ${uniqueNumber}`);
                  finalOrderNumber = uniqueNumber;
                }
              }
            }

            const targetOrderId = exists ? exists.id : orderId;

            if (!exists) {
              // Create new synced order
              const createdOrder = await prisma.order.create({
                data: {
                  id: orderId,
                  orderNumber: finalOrderNumber,
                  customerId,
                  customerName: cleanName,
                  customerPhone: cleanPhone,
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
                  loyaltyPointsEarned: Number(record.loyalty_points_earned || 0),
                  loyaltyPointsRedeemed: Number(record.loyalty_points_redeemed || 0),
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

                      const itemId = item.menu_item_id;
                      const menuItemIdToUse = (itemId && validMenuItemIds.has(itemId)) ? itemId : null;

                      return {
                        menuItemId: menuItemIdToUse,
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

              // Send WhatsApp notification if conditions are met and order is completed/delivered.
              // If there's an upcoming UPDATE operation for the same order in the same batch,
              // defer the receipt until the UPDATE operation processes the final points.
              const hasCompletionUpdate = batch.some(b => 
                (b.table === "order" || b.table === "orders") && 
                b.operation === "UPDATE" && 
                (b.record_id === orderId || b.record?.id === orderId)
              );

              if (!waConfirmationSent && cleanPhone && cleanPhone !== "0000000000" && !hasCompletionUpdate && status === "DELIVERED") {
                console.log(`[Sync Batch] Triggering WhatsApp for NEW completed order ${createdOrder.id}, phone: ${cleanPhone}`);
                try {
                  const { OrderNotificationService } = await import("@/lib/services/orderNotificationService");
                  const waResult = await OrderNotificationService.sendPOSReceipt(createdOrder.id);
                  console.log(`[Sync Batch] WhatsApp result for ${createdOrder.id}:`, JSON.stringify(waResult));
                } catch (err) {
                  console.error("[Sync Batch] WhatsApp POS receipt failed:", err);
                }
              } else {
                console.log(`[Sync Batch] Skipping WhatsApp for new order ${createdOrder.id}: waConfirmationSent=${waConfirmationSent}, phone=${cleanPhone}, hasCompletionUpdate=${hasCompletionUpdate}, status=${status}`);
              }
            } else {
              // Order already exists — update status
              await prisma.order.update({
                where: { id: targetOrderId },
                data: {
                  status: status as any,
                  loyaltyPointsEarned: Number(record.loyalty_points_earned || 0),
                  loyaltyPointsRedeemed: Number(record.loyalty_points_redeemed || 0),
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
              customerId = exists.customerId;
              const updatedOrder = await prisma.order.update({
                where: { id: orderId },
                data: {
                  status: status as any,
                  loyaltyPointsEarned: Number(record.loyalty_points_earned || 0),
                  loyaltyPointsRedeemed: Number(record.loyalty_points_redeemed || 0),
                  updatedAt: new Date(),
                }
              });

              // Trigger WhatsApp updates for completed/delivered or cancelled orders synced from POS
              const { OrderNotificationService } = await import("@/lib/services/orderNotificationService");
              if (status === "DELIVERED") {
                const cleanPhone = exists.customerPhone ? exists.customerPhone.trim() : "";
                if (!updatedOrder.waConfirmationSent && cleanPhone && cleanPhone !== "0000000000") {
                  console.log(`[Sync Batch UPDATE] Triggering WhatsApp POS receipt for order ${updatedOrder.id}, phone: ${cleanPhone}`);
                  OrderNotificationService.sendPOSReceipt(updatedOrder.id).catch(err => {
                    console.error("[Sync Batch UPDATE] WhatsApp POS receipt failed:", err);
                  });
                } else {
                  console.log(`[Sync Batch UPDATE] Triggering WhatsApp delivery notification for order ${updatedOrder.id}`);
                  OrderNotificationService.sendOrderDelivered(updatedOrder.id).catch(err => {
                    console.error("[Sync Batch UPDATE] WhatsApp delivery notification failed:", err);
                  });
                }
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
              customerId = exists.customerId;
              await prisma.order.delete({
                where: { id: orderId }
              });
            }
            results.push({ localId, status: "success" });
          } else {
            results.push({ localId, status: "success" });
          }

          if (customerId) {
            const { CustomerService } = await import("@/lib/services/customerService");
            await CustomerService.recalculateCustomerStats(customerId);
          }
        } catch (err: any) {
          console.error(`[Sync Batch] Error processing item ${localId}:`, err);
          results.push({ localId, status: "failed", error: err.message });
        }
      } else if (table === "customer" || table === "customers") {
        try {
          const cleanPhone = record.phone?.trim() || "";
          if (!cleanPhone) {
            results.push({ localId, status: "success" });
            continue;
          }

          // Fetch the existing customer to check their current opt-in status
          const existingCustomer = await prisma.customer.findUnique({
            where: { phone: cleanPhone },
            select: { whatsappOptIn: true }
          });

          // If the customer already exists, preserve their current opt-in/opt-out status.
          // For brand-new customers, default to opted-in (true).
          const finalWhatsappOptIn = existingCustomer 
            ? existingCustomer.whatsappOptIn 
            : (record.whatsappOptIn !== undefined ? (record.whatsappOptIn === true || record.whatsappOptIn === 1) : true);

          const data = {
            name: record.name?.trim() || "Walk-in Customer",
            email: record.email || null,
            address: record.address || null,
            whatsappOptIn: finalWhatsappOptIn,
            updatedAt: new Date(record.updated_at || record.created_at || new Date()),
          };
          await prisma.customer.upsert({
            where: { phone: cleanPhone },
            create: {
              phone: cleanPhone,
              ...data,
              totalSpent: 0,
              totalOrders: 0,
            },
            update: data
          });
          results.push({ localId, status: "success" });
        } catch (err: any) {
          console.error(`[Sync Batch customer] Error processing:`, err);
          results.push({ localId, status: "failed", error: err.message });
        }
      } else if (table === "loyalty_setting" || table === "loyalty_settings") {
        try {
          await prisma.loyaltySetting.upsert({
            where: { id: record.id || "default" },
            create: {
              id: record.id || "default",
              pointsPerAmount: Number(record.pointsPerAmount || 5),
              amountThreshold: Number(record.amountThreshold || 100),
              expiryDays: Number(record.expiryDays || 30),
              updatedAt: new Date(record.updatedAt || new Date()),
            },
            update: {
              pointsPerAmount: Number(record.pointsPerAmount || 5),
              amountThreshold: Number(record.amountThreshold || 100),
              expiryDays: Number(record.expiryDays || 30),
              updatedAt: new Date(record.updatedAt || new Date()),
            }
          });
          results.push({ localId, status: "success" });
        } catch (err: any) {
          console.error(`[Sync Batch loyalty_setting] Error processing:`, err);
          results.push({ localId, status: "failed", error: err.message });
        }
      } else if (table === "loyalty_transaction" || table === "loyalty_transactions") {
        try {
          const phone = record.phoneNumber || record.phone_number;
          if (!phone) {
            results.push({ localId, status: "success" });
            continue;
          }
          const customerExists = await prisma.customer.findUnique({
            where: { phone }
          });
          if (!customerExists) {
            await prisma.customer.create({
              data: {
                phone,
                name: "Walk-in Customer",
                totalSpent: 0,
                totalOrders: 0,
              }
            });
          }

          await prisma.loyaltyTransaction.upsert({
            where: { id: record.id },
            create: {
              id: record.id,
              phoneNumber: phone,
              orderId: record.orderId || record.order_id || null,
              billId: record.billId || record.bill_id || null,
              type: record.type,
              points: Number(record.points),
              timestamp: new Date(record.timestamp || new Date()),
              expiryDate: record.expiryDate ? new Date(record.expiryDate) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
              isPending: record.isPending === true || record.isPending === 1 || record.isPending === "1",
              campaignId: record.campaignId || record.campaign_id || null,
            },
            update: {
              phoneNumber: phone,
              orderId: record.orderId || record.order_id || null,
              billId: record.billId || record.bill_id || null,
              type: record.type,
              points: Number(record.points),
              timestamp: new Date(record.timestamp || new Date()),
              expiryDate: record.expiryDate ? new Date(record.expiryDate) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
              isPending: record.isPending === true || record.isPending === 1 || record.isPending === "1",
              campaignId: record.campaignId || record.campaign_id || null,
            }
          });
          results.push({ localId, status: "success" });
        } catch (err: any) {
          console.error(`[Sync Batch loyalty_transaction] Error processing:`, err);
          results.push({ localId, status: "failed", error: err.message });
        }
      } else if (table === "whatsapp_log" || table === "whatsapp_logs") {
        try {
          const phone = record.phoneNumber || record.phone_number || record.phone;
          if (!phone) {
            results.push({ localId, status: "success" });
            continue;
          }
          const statusMap: Record<string, string> = {
            'SENT': 'sent',
            'DELIVERED': 'delivered',
            'READ': 'read',
            'FAILED': 'failed'
          };
          const mappedStatus = statusMap[record.status] || record.status?.toLowerCase() || 'queued';
          
          await prisma.messageLog.upsert({
            where: { id: record.id },
            create: {
              id: record.id,
              phone,
              customerId: phone,
              whatsappMessageId: record.messageId || null,
              messageType: "marketing",
              templateUsed: record.templateName || null,
              status: mappedStatus,
              campaignId: record.campaignId || null,
              createdAt: new Date(record.timestamp || new Date()),
              updatedAt: new Date(record.timestamp || new Date()),
            },
            update: {
              phone,
              customerId: phone,
              whatsappMessageId: record.messageId || null,
              status: mappedStatus,
              campaignId: record.campaignId || null,
              updatedAt: new Date(record.timestamp || new Date()),
            }
          });
          results.push({ localId, status: "success" });
        } catch (err: any) {
          console.error(`[Sync Batch whatsapp_log] Error processing:`, err);
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
