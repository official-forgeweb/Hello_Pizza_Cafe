import { WhatsAppService } from './whatsappService';
import prisma from '../prisma';

export class OrderNotificationService {
  /**
   * Send order confirmation
   */
  static async sendOrderConfirmation(orderId: string) {
    try {
      const order = await prisma.order.findUnique({
        where: { id: orderId },
        include: { customer: true }
      });

      if (!order || !order.customerPhone) return { success: false, error: 'No order or phone found' };
      if (order.customerPhone === '0000000000') return { success: true, note: 'Skipped for dummy phone' };
      if (order.waConfirmationSent) return { success: true, note: 'Already sent' };

      const billAmount = Number(order.totalAmount).toFixed(2);

      const result = await WhatsAppService.sendTemplateMessage(
        order.customerPhone,
        'pos_order_receipt',
        'en_US',
        [
          {
            type: 'body',
            parameters: [
              { type: 'text', text: billAmount }
            ]
          }
        ]
      );

      if (result.success) {
        await prisma.order.update({
          where: { id: order.id },
          data: { waConfirmationSent: true }
        });

        await prisma.messageLog.create({
          data: {
            customerId: order.customerId,
            orderId: order.id,
            phone: order.customerPhone,
            messageType: 'pos_order_receipt',
            templateUsed: 'pos_order_receipt',
            status: 'sent',
            whatsappMessageId: result.data?.messages?.[0]?.id || ''
          }
        });
      }

      return result;
    } catch (error: any) {
      console.error('Error sending order confirmation:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Send POS order receipt notification
   */
  static async sendPOSReceipt(orderId: string) {
    try {
      console.log(`[POS Receipt] Starting for orderId: ${orderId}`);
      const order = await prisma.order.findUnique({
        where: { id: orderId },
        include: { customer: true }
      });

      if (!order || !order.customerPhone) {
        console.log(`[POS Receipt] Skipped: no order or phone. order=${!!order}, phone=${order?.customerPhone}`);
        return { success: false, error: 'No order or phone found' };
      }
      if (order.customerPhone === '0000000000') {
        console.log(`[POS Receipt] Skipped: dummy phone for order ${order.orderNumber}`);
        return { success: true, note: 'Skipped for dummy phone' };
      }
      if (order.waConfirmationSent) {
        console.log(`[POS Receipt] Skipped: already sent for order ${order.orderNumber}`);
        return { success: true, note: 'Already sent' };
      }

      // Total amount formatted to two decimal places
      const billAmount = Number(order.totalAmount).toFixed(2);
      console.log(`[POS Receipt] Sending to ${order.customerPhone}, amount: ${billAmount}, order: ${order.orderNumber}`);

      const result = await WhatsAppService.sendTemplateMessage(
        order.customerPhone,
        'pos_order_receipt',
        'en_US',
        [
          {
            type: 'body',
            parameters: [
              { type: 'text', text: billAmount }
            ]
          }
        ]
      );

      console.log(`[POS Receipt] WhatsApp API result:`, JSON.stringify(result));

      if (result.success) {
        await prisma.order.update({
          where: { id: order.id },
          data: { waConfirmationSent: true }
        });

        await prisma.messageLog.create({
          data: {
            customerId: order.customerId,
            orderId: order.id,
            phone: order.customerPhone,
            messageType: 'pos_order_receipt',
            templateUsed: 'pos_order_receipt',
            status: 'sent',
            whatsappMessageId: result.data?.messages?.[0]?.id || ''
          }
        });
      }

      return result;
    } catch (error: any) {
      console.error('[POS Receipt] Error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Send order preparing update
   */
  static async sendOrderPreparing(orderId: string) {
    return { success: true, note: 'Preparing notification disabled' };
  }

  /**
   * Send order out for delivery update
   */
  static async sendOrderOutForDelivery(orderId: string, deliveryBoy: { name: string, phone: string }) {
    return { success: true, note: 'Out for delivery notification disabled' };
  }

  /**
   * Send order delivered update
   */
  static async sendOrderDelivered(orderId: string) {
    return { success: true, note: 'Delivered notification disabled' };
  }

  /**
   * Send order cancelled update
   */
  static async sendOrderCancelled(orderId: string, reason: string) {
    try {
      const order = await prisma.order.findUnique({
        where: { id: orderId },
        include: { customer: true }
      });

      if (!order || !order.customerPhone) return { success: false, error: 'No order or phone found' };
      if (order.customerPhone === '0000000000') return { success: true, note: 'Skipped for dummy phone' };

      const result = await WhatsAppService.sendTemplateMessage(
        order.customerPhone,
        'order_cancelled3',
        'en_US',
        [
          {
            type: 'body',
            parameters: [
              { type: 'text', text: order.customerName },
              { type: 'text', text: order.orderNumber },
              { type: 'text', text: reason }
            ]
          }
        ]
      );

      if (result.success) {
        await prisma.messageLog.create({
          data: {
            customerId: order.customerId,
            orderId: order.id,
            phone: order.customerPhone,
            messageType: 'order_cancelled3',
            templateUsed: 'order_cancelled3',
            status: 'sent',
            whatsappMessageId: result.data?.messages?.[0]?.id || ''
          }
        });
      }

      return result;
    } catch (error: any) {
      console.error('Error sending order cancelled notification:', error);
      return { success: false, error: error.message };
    }
  }
}
