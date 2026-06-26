/**
 * Chatbot History Service
 * 
 * Handles order history lookup, order tracking, and reorder functionality
 * for WhatsApp bot conversations.
 */

import prisma from '@/lib/prisma';
import { CartItem } from './chatbotState';
import { formatPrice } from './menuHelper';

// ─── Status Display Mapping ────────────────────────────────

const STATUS_DISPLAY: Record<string, { label: string; emoji: string }> = {
  PENDING: { label: 'Pending', emoji: '⏳' },
  CONFIRMED: { label: 'Confirmed', emoji: '✅' },
  PREPARING: { label: 'Being Prepared', emoji: '👨‍🍳' },
  READY: { label: 'Ready', emoji: '📦' },
  OUT_FOR_DELIVERY: { label: 'Out for Delivery', emoji: '🛵' },
  DELIVERED: { label: 'Delivered', emoji: '✅' },
  CANCELLED: { label: 'Cancelled', emoji: '❌' },
};

// ─── Public Functions ──────────────────────────────────────

/**
 * Get order history for a customer by phone number
 */
export async function getOrderHistory(phone: string): Promise<string> {
  const cleanPhone = sanitizePhone(phone);

  const orders = await prisma.order.findMany({
    where: {
      customerPhone: cleanPhone,
    },
    orderBy: { placedAt: 'desc' },
    take: 5,
    include: {
      items: {
        select: {
          itemName: true,
          quantity: true,
        },
      },
    },
  });

  if (orders.length === 0) {
    return `📦 *No previous orders found*\n\nWe couldn't find any orders for this number.\n\n*1️⃣ 🍴 Place a New Order*\n*2️⃣ 🏠 Back to Main Menu*`;
  }

  let msg = '📦 *ORDER HISTORY*\n━━━━━━━━━━━━━━━━━━━━━━\n';

  orders.forEach((order) => {
    const status = STATUS_DISPLAY[order.status] || { label: order.status, emoji: '📋' };
    const date = order.placedAt.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });

    const itemsList = order.items
      .slice(0, 3)
      .map((item) => `${item.itemName}${item.quantity > 1 ? ` x${item.quantity}` : ''}`)
      .join(', ');

    const moreItems = order.items.length > 3 ? ` +${order.items.length - 3} more` : '';

    msg += `\n🆔 ${order.orderNumber} | ${date}\n`;
    msg += `   ${itemsList}${moreItems}\n`;
    msg += `   💰 ${formatPrice(Number(order.totalAmount))} | ${status.emoji} ${status.label}\n`;
  });

  msg += '\n━━━━━━━━━━━━━━━━━━━━━━\n\n';
  msg += '*1️⃣ 🔄 Reorder Last Order*\n';
  msg += '*2️⃣ 🍴 Place New Order*\n';
  msg += '*3️⃣ 🏠 Back to Main Menu*';

  return msg;
}

/**
 * Get the status of a specific order
 */
export async function getOrderStatus(orderNumber: string): Promise<string> {
  const order = await prisma.order.findUnique({
    where: { orderNumber },
    select: {
      orderNumber: true,
      status: true,
      orderType: true,
      totalAmount: true,
      placedAt: true,
      estimatedDeliveryTime: true,
      estimatedPrepTime: true,
      customerName: true,
      items: {
        select: {
          itemName: true,
          quantity: true,
          itemTotal: true,
        },
      },
    },
  });

  if (!order) {
    return `🔍 *Order not found*\n\nCouldn't find order #${orderNumber}.\nPlease check the order number and try again.\n\nType *HELP* to see all options.`;
  }

  const status = STATUS_DISPLAY[order.status] || { label: order.status, emoji: '📋' };
  const placedTime = order.placedAt.toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });

  let msg = `📋 *ORDER STATUS*\n━━━━━━━━━━━━━━━━━━━━━━\n`;
  msg += `🆔 *Order:* #${order.orderNumber}\n`;
  msg += `👤 *Name:* ${order.customerName}\n`;
  msg += `🚚 *Type:* ${order.orderType}\n`;
  msg += `📅 *Placed:* ${placedTime}\n`;
  msg += `${status.emoji} *Status:* ${status.label}\n\n`;

  msg += '🛒 *Items:*\n';
  order.items.forEach((item) => {
    msg += `  • ${item.itemName} x${item.quantity} → ${formatPrice(Number(item.itemTotal))}\n`;
  });

  msg += `\n💰 *Total:* ${formatPrice(Number(order.totalAmount))}\n`;

  if (order.status === 'PENDING' || order.status === 'CONFIRMED') {
    const eta = order.orderType === 'DELIVERY'
      ? (order.estimatedDeliveryTime || 40)
      : (order.estimatedPrepTime || 20);
    msg += `⏱️ *Estimated Time:* ${eta} mins\n`;
  }

  msg += '\n━━━━━━━━━━━━━━━━━━━━━━\n';

  // Show progress bar
  msg += '\n📊 *Order Progress:*\n';
  const stages = ['PENDING', 'CONFIRMED', 'PREPARING', 'READY'];
  if (order.orderType === 'DELIVERY') {
    stages.push('OUT_FOR_DELIVERY');
  }
  stages.push('DELIVERED');

  const currentIdx = stages.indexOf(order.status);
  stages.forEach((stage, idx) => {
    const sd = STATUS_DISPLAY[stage] || { label: stage, emoji: '⬜' };
    if (idx < currentIdx) {
      msg += `  ✅ ${sd.label}\n`;
    } else if (idx === currentIdx) {
      msg += `  ▶️ *${sd.label}* ← You are here\n`;
    } else {
      msg += `  ⬜ ${sd.label}\n`;
    }
  });

  msg += '\nType *HELP* for more options.';
  return msg;
}

/**
 * Get cart items from the last order for reordering
 */
export async function getReorderItems(phone: string): Promise<CartItem[] | null> {
  const cleanPhone = sanitizePhone(phone);

  const lastOrder = await prisma.order.findFirst({
    where: {
      customerPhone: cleanPhone,
      status: { not: 'CANCELLED' },
    },
    orderBy: { placedAt: 'desc' },
    include: {
      items: {
        include: { addOns: true },
      },
    },
  });

  if (!lastOrder || lastOrder.items.length === 0) return null;

  return lastOrder.items.map((item) => ({
    menuItemId: item.menuItemId || '',
    itemName: item.itemName,
    itemType: (item.itemType as 'VEG' | 'NON_VEG') || 'VEG',
    basePrice: Number(item.basePrice),
    variantName: item.variantName || undefined,
    variantPrice: Number(item.variantPrice) || undefined,
    addonsPrice: Number(item.addonsPrice) || 0,
    quantity: item.quantity,
    addOns: item.addOns.map((addon) => ({
      addonName: addon.addonName,
      addonPrice: Number(addon.addonPrice),
      quantity: addon.quantity,
    })),
  }));
}

// ─── Helpers ───────────────────────────────────────────────

function sanitizePhone(phone: string): string {
  if (!phone) return '';
  let cleaned = phone.trim().replace(/\D/g, '');
  // Remove country code prefix for DB lookup
  if (cleaned.startsWith('91') && cleaned.length > 10) {
    cleaned = cleaned.substring(cleaned.length - 10);
  }
  return cleaned;
}
