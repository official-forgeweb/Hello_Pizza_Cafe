/**
 * Chatbot Order Service
 * 
 * Creates orders from WhatsApp bot conversations using the same pipeline
 * as website orders. Orders appear in ZapBill POS via /api/orders/pending.
 */

import prisma from '@/lib/prisma';
import { ConversationState } from './chatbotState';
import { CustomerService } from './customerService';
import { formatPrice } from './menuHelper';

// ─── Types ─────────────────────────────────────────────────

interface OrderResult {
  success: boolean;
  orderNumber?: string;
  orderId?: string;
  totalAmount?: number;
  pointsEarned?: number;
  estimatedTime?: number;
  error?: string;
}

// ─── Public Functions ──────────────────────────────────────

/**
 * Calculate order totals from conversation state
 */
export function calculateOrderTotals(state: ConversationState) {
  const subtotal = state.cart.reduce((sum, item) => {
    const unitPrice = item.variantPrice && item.variantPrice > 0
      ? item.variantPrice
      : item.basePrice;
    return sum + (unitPrice + item.addonsPrice) * item.quantity;
  }, 0);

  const taxRate = 0.05;
  const taxAmount = Math.round(subtotal * taxRate * 100) / 100;

  // Simplified delivery fee for WhatsApp orders
  let deliveryFee = 0;
  if (state.orderType === 'DELIVERY') {
    deliveryFee = subtotal >= 500 ? 0 : 40; // Free delivery above ₹500
  }

  const loyaltyDiscount = state.useLoyalty ? state.loyaltyDiscount : 0;

  const totalAmount = Math.max(0, subtotal + taxAmount + deliveryFee - loyaltyDiscount);

  return {
    subtotal,
    taxAmount,
    deliveryFee,
    loyaltyDiscount,
    totalAmount,
  };
}

/**
 * Format cart for WhatsApp display
 */
export function formatCartMessage(state: ConversationState): string {
  if (state.cart.length === 0) {
    return '🛒 *Your cart is empty!*\n\nType *MENU* to browse our menu and add items. 😊';
  }

  let msg = '🛒 *YOUR CART*\n━━━━━━━━━━━━━━━━━━━━━━\n';

  state.cart.forEach((item, idx) => {
    const unitPrice = item.variantPrice && item.variantPrice > 0
      ? item.variantPrice
      : item.basePrice;
    const lineTotal = (unitPrice + item.addonsPrice) * item.quantity;

    msg += `${idx + 1}. *${item.itemName}* x${item.quantity} → ${formatPrice(lineTotal)}\n`;

    if (item.variantName) {
      msg += `   └ ${item.variantName}\n`;
    }
    if (item.addOns.length > 0) {
      item.addOns.forEach((addon) => {
        msg += `   └ +${addon.addonName} (${formatPrice(addon.addonPrice)})\n`;
      });
    }
  });

  const totals = calculateOrderTotals(state);

  msg += '━━━━━━━━━━━━━━━━━━━━━━\n';
  msg += `🧾 *Subtotal:* ${formatPrice(totals.subtotal)}\n`;

  if (state.orderType === 'DELIVERY') {
    if (totals.deliveryFee > 0) {
      msg += `🚚 *Delivery Charge:* ${formatPrice(totals.deliveryFee)}\n`;
    } else {
      msg += '🚚 *Delivery:* FREE ✨\n';
    }
  }

  msg += `🏷️ *GST (5%):* ${formatPrice(totals.taxAmount)}\n`;

  if (totals.loyaltyDiscount > 0) {
    msg += `⭐ *Loyalty Discount:* -${formatPrice(totals.loyaltyDiscount)}\n`;
  }

  msg += '━━━━━━━━━━━━━━━━━━━━━━\n';
  msg += `💰 *TOTAL: ${formatPrice(totals.totalAmount)}*\n`;
  msg += '━━━━━━━━━━━━━━━━━━━━━━\n\n';

  msg += 'What would you like to do?\n';
  msg += '🔹 *1. ✅ Proceed to Checkout*\n';
  msg += '🔹 *2. ➕ Add More Items*\n';
  msg += '🔹 *3. ❌ Remove an Item*\n';
  msg += '🔹 *4. 🗑️ Clear Cart*';

  return msg;
}

/**
 * Format final order summary for confirmation
 */
export function formatOrderSummary(state: ConversationState): string {
  const totals = calculateOrderTotals(state);

  let msg = '📋 *ORDER SUMMARY — Please Confirm*\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n';

  msg += `👤 *Name:* ${state.customerInfo.name}\n`;
  msg += `📱 *Phone:* ${state.customerInfo.phone}\n`;

  if (state.orderType === 'DELIVERY' && state.customerInfo.address) {
    msg += `📍 *Address:* ${state.customerInfo.address}\n`;
    if (state.customerInfo.deliveryInstructions) {
      msg += `📝 *Instructions:* ${state.customerInfo.deliveryInstructions}\n`;
    }
  }

  const orderTypeLabels = {
    DELIVERY: '🏠 Home Delivery',
    PICKUP: '🏃 Pickup / Takeaway',
    DINE_IN: '🍽️ Dine In',
  };
  msg += `🚚 *Order Type:* ${orderTypeLabels[state.orderType || 'DELIVERY']}\n`;

  if (state.orderType === 'DINE_IN') {
    if (state.guestCount > 0) msg += `👥 *Guests:* ${state.guestCount}\n`;
    if (state.arrivalTime) msg += `🕐 *Arrival:* ${state.arrivalTime}\n`;
    if (state.occasion) msg += `🎉 *Occasion:* ${state.occasion}\n`;
  }

  if (state.orderType === 'PICKUP' && state.pickupTime) {
    msg += `🕐 *Pickup Time:* ${state.pickupTime}\n`;
  }

  const paymentLabels: Record<string, string> = {
    UPI: '📱 UPI / GPay / PhonePe',
    CARD: '💳 Credit / Debit Card',
    COD: '💵 Cash on Delivery',
    LINK: '🔗 Pay via Link',
  };
  msg += `💳 *Payment:* ${paymentLabels[state.paymentMethod || 'COD']}\n`;

  msg += '\n🛒 *YOUR ORDER:*\n';
  state.cart.forEach((item) => {
    const unitPrice = item.variantPrice && item.variantPrice > 0
      ? item.variantPrice
      : item.basePrice;
    const lineTotal = (unitPrice + item.addonsPrice) * item.quantity;
    msg += `• ${item.itemName} x${item.quantity} → ${formatPrice(lineTotal)}\n`;
    if (item.variantName) msg += `  └ ${item.variantName}\n`;
  });

  msg += '\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n';
  msg += `🧾 Subtotal: ${formatPrice(totals.subtotal)}\n`;

  if (state.orderType === 'DELIVERY') {
    msg += `🚚 Delivery: ${totals.deliveryFee > 0 ? formatPrice(totals.deliveryFee) : 'FREE'}\n`;
  }

  msg += `🏷️ GST (5%): ${formatPrice(totals.taxAmount)}\n`;

  if (totals.loyaltyDiscount > 0) {
    msg += `⭐ Loyalty Discount: -${formatPrice(totals.loyaltyDiscount)}\n`;
  }

  msg += '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n';
  msg += `💰 *FINAL TOTAL: ${formatPrice(totals.totalAmount)}*\n`;
  msg += '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n';

  const eta = state.orderType === 'DELIVERY' ? '35-45' : '20-25';
  msg += `⏱️ *Estimated Time:* ${eta} mins\n\n`;

  msg += '🔹 *1. ✅ CONFIRM ORDER*\n';
  msg += '🔹 *2. ✏️ Make Changes*\n';
  msg += '🔹 *3. ❌ Cancel*';

  return msg;
}

/**
 * Create the order in the database
 */
export async function createOrderFromBot(state: ConversationState): Promise<OrderResult> {
  try {
    const totals = calculateOrderTotals(state);

    // Validate cart
    if (state.cart.length === 0) {
      return { success: false, error: 'Cart is empty' };
    }

    const finalPhone = state.customerInfo.phone.replace(/\D/g, '');
    const finalName = state.customerInfo.name || 'WhatsApp Customer';

    // Verify menu items exist
    const validMenuItems = new Set<string>();
    const menuItemIds = state.cart.map((i) => i.menuItemId).filter(Boolean);
    if (menuItemIds.length > 0) {
      const existingItems = await prisma.menuItem.findMany({
        where: { id: { in: menuItemIds } },
        select: { id: true },
      });
      existingItems.forEach((i) => validMenuItems.add(i.id));
    }

    // Build order items
    const orderItems = state.cart.map((item) => {
      const unitPrice = item.variantPrice && item.variantPrice > 0
        ? item.variantPrice
        : item.basePrice;
      const itemTotal = (unitPrice + item.addonsPrice) * item.quantity;

      return {
        menuItemId: item.menuItemId && validMenuItems.has(item.menuItemId)
          ? item.menuItemId
          : null,
        itemName: item.itemName,
        itemType: item.itemType,
        variantName: item.variantName || null,
        basePrice: item.basePrice,
        variantPrice: item.variantPrice || 0,
        addonsPrice: item.addonsPrice || 0,
        quantity: item.quantity,
        itemTotal,
        addOns: {
          create: item.addOns.map((addon) => ({
            addonName: addon.addonName,
            addonPrice: addon.addonPrice,
            quantity: addon.quantity || 1,
          })),
        },
      };
    });

    // Generate order number (YYMMDD format)
    const now = new Date();
    const yy = String(now.getFullYear()).slice(-2);
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    const prefix = `${yy}${mm}${dd}`;
    const minOrderNumber = `${prefix}500`;

    let orderNumber = '';
    let attempts = 0;
    while (attempts < 10) {
      const ordersToday = await prisma.order.count({
        where: {
          orderNumber: { gt: minOrderNumber, startsWith: prefix },
        },
      });
      const seq = String(500 + ordersToday + 1 + attempts).padStart(3, '0');
      orderNumber = `${prefix}${seq}`;

      const existing = await prisma.order.findUnique({
        where: { orderNumber },
      });
      if (!existing) break;
      attempts++;
    }

    // Loyalty points calculation
    const loyaltySettings = await prisma.loyaltySetting.findUnique({
      where: { id: 'default' },
    }) || { pointsPerAmount: 5, amountThreshold: 100 };

    const pointsEarned = Math.floor(
      totals.totalAmount / Number(loyaltySettings.amountThreshold)
    ) * Number(loyaltySettings.pointsPerAmount);

    const pointsToRedeem = state.useLoyalty ? state.loyaltyPoints : 0;

    // Upsert customer
    let customer = await prisma.customer.findFirst({
      where: { phone: finalPhone },
    });

    if (!customer) {
      customer = await prisma.customer.create({
        data: {
          name: finalName,
          phone: finalPhone,
          whatsappOptIn: true,
          totalOrders: 0,
          totalSpent: 0,
        },
      });
    } else {
      customer = await prisma.customer.update({
        where: { phone: customer.phone },
        data: { whatsappOptIn: true },
      });
    }

    // Determine order type
    const orderType = state.orderType || 'DELIVERY';

    // Create order
    const order = await prisma.order.create({
      data: {
        orderNumber,
        customerId: customer.phone,
        customerName: finalName,
        customerPhone: finalPhone,
        orderType,
        deliveryAddress: state.customerInfo.address || null,
        deliveryInstructions: state.customerInfo.deliveryInstructions || null,
        subtotal: totals.subtotal,
        taxAmount: totals.taxAmount,
        deliveryFee: totals.deliveryFee,
        discountAmount: totals.loyaltyDiscount,
        totalAmount: totals.totalAmount,
        orderNotes: state.orderType === 'DINE_IN' && state.occasion
          ? `Guests: ${state.guestCount}, Occasion: ${state.occasion}`
          : null,
        estimatedPrepTime: 20,
        estimatedDeliveryTime: orderType === 'PICKUP' ? 20 : orderType === 'DINE_IN' ? 0 : 40,
        loyaltyPointsEarned: pointsEarned,
        loyaltyPointsRedeemed: pointsToRedeem,
        items: {
          create: orderItems,
        },
      },
      include: {
        items: { include: { addOns: true } },
      },
    });

    // Create loyalty transactions
    if (finalPhone) {
      const timestamp = new Date();

      if (pointsToRedeem > 0) {
        await prisma.loyaltyTransaction.create({
          data: {
            phoneNumber: finalPhone,
            orderId: order.id,
            type: 'REDEEM',
            points: -pointsToRedeem,
            timestamp,
            expiryDate: timestamp,
            isPending: false,
          },
        });
      }

      if (pointsEarned > 0) {
        const expiryDate = new Date(timestamp.getTime() + 30 * 24 * 60 * 60 * 1000);
        await prisma.loyaltyTransaction.create({
          data: {
            phoneNumber: finalPhone,
            orderId: order.id,
            type: 'EARN',
            points: pointsEarned,
            timestamp,
            expiryDate,
            isPending: true,
          },
        });
      }
    }

    // Recalculate customer stats
    await CustomerService.recalculateCustomerStats(customer.phone);

    // Increment menu item order counts
    for (const item of state.cart) {
      if (item.menuItemId) {
        try {
          const exists = await prisma.menuItem.findUnique({
            where: { id: item.menuItemId },
          });
          if (exists) {
            await prisma.menuItem.update({
              where: { id: item.menuItemId },
              data: { totalOrders: { increment: item.quantity } },
            });
          }
        } catch {
          // Ignore — menu item may not exist
        }
      }
    }

    // Send admin email notification asynchronously
    import('@/lib/email').then(({ sendAdminOrderNotification }) => {
      sendAdminOrderNotification(order).catch((err: Error) => {
        console.error('Admin order notification failed:', err);
      });
    }).catch(() => {});

    const eta = orderType === 'DELIVERY' ? 40 : 20;

    return {
      success: true,
      orderNumber,
      orderId: order.id,
      totalAmount: totals.totalAmount,
      pointsEarned,
      estimatedTime: eta,
    };
  } catch (error: unknown) {
    console.error('[ChatbotOrder] Error creating order:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create order',
    };
  }
}
