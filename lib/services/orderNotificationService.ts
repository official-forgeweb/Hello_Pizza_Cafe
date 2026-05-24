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
      const order = await prisma.order.findUnique({
        where: { id: orderId },
        include: { customer: true }
      });

      if (!order || !order.customerPhone) return { success: false, error: 'No order or phone found' };
      if (order.customerPhone === '0000000000') return { success: true, note: 'Skipped for dummy phone' };
      if (order.waConfirmationSent) return { success: true, note: 'Already sent' };

      // Total amount formatted to two decimal places
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
      console.error('Error sending POS order receipt:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Send order preparing update
   */
  static async sendOrderPreparing(orderId: string) {
    try {
      const order = await prisma.order.findUnique({
        where: { id: orderId },
        include: { customer: true }
      });

      if (!order || !order.customerPhone) return { success: false, error: 'No order or phone found' };
      if (order.customerPhone === '0000000000') return { success: true, note: 'Skipped for dummy phone' };
      if (order.waPreparingSent) return { success: true, note: 'Already sent' };

      const result = await WhatsAppService.sendTemplateMessage(
        order.customerPhone,
        'order_preparing3',
        'en_US',
        [
          {
            type: 'body',
            parameters: [
              { type: 'text', text: order.customerName },
              { type: 'text', text: order.orderNumber }
            ]
          }
        ]
      );

      if (result.success) {
        await prisma.order.update({
          where: { id: order.id },
          data: { waPreparingSent: true }
        });

        await prisma.messageLog.create({
          data: {
            customerId: order.customerId,
            orderId: order.id,
            phone: order.customerPhone,
            messageType: 'order_preparing3',
            templateUsed: 'order_preparing3',
            status: 'sent',
            whatsappMessageId: result.data?.messages?.[0]?.id || ''
          }
        });
      }

      return result;
    } catch (error: any) {
      console.error('Error sending order preparing notification:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Send order out for delivery update
   */
  static async sendOrderOutForDelivery(orderId: string, deliveryBoy: { name: string, phone: string }) {
    try {
      const order = await prisma.order.findUnique({
        where: { id: orderId },
        include: { customer: true }
      });

      if (!order || !order.customerPhone) return { success: false, error: 'No order or phone found' };
      if (order.customerPhone === '0000000000') return { success: true, note: 'Skipped for dummy phone' };
      if (order.waOutForDeliverySent) return { success: true, note: 'Already sent' };

      const result = await WhatsAppService.sendTemplateMessage(
        order.customerPhone,
        'order_out_for_delivery',
        'en_US',
        [
          {
            type: 'body',
            parameters: [
              { type: 'text', text: order.customerName },
              { type: 'text', text: order.orderNumber },
              { type: 'text', text: deliveryBoy.name },
              { type: 'text', text: deliveryBoy.phone }
            ]
          }
        ]
      );

      if (result.success) {
        await prisma.order.update({
          where: { id: order.id },
          data: { waOutForDeliverySent: true }
        });

        await prisma.messageLog.create({
          data: {
            customerId: order.customerId,
            orderId: order.id,
            phone: order.customerPhone,
            messageType: 'order_out_for_delivery',
            templateUsed: 'order_out_for_delivery',
            status: 'sent',
            whatsappMessageId: result.data?.messages?.[0]?.id || ''
          }
        });
      }

      return result;
    } catch (error: any) {
      console.error('Error sending order out for delivery notification:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Send order delivered update
   */
  static async sendOrderDelivered(orderId: string) {
    try {
      const order = await prisma.order.findUnique({
        where: { id: orderId },
        include: { customer: true }
      });

      if (!order || !order.customerPhone) return { success: false, error: 'No order or phone found' };
      if (order.customerPhone === '0000000000') return { success: true, note: 'Skipped for dummy phone' };
      if (order.waDeliveredSent) return { success: true, note: 'Already sent' };

      const result = await WhatsAppService.sendTemplateMessage(
        order.customerPhone,
        'order_delivered',
        'en_US',
        [
          {
            type: 'body',
            parameters: [
              { type: 'text', text: order.customerName },
              { type: 'text', text: order.orderNumber }
            ]
          }
        ]
      );

      if (result.success) {
        await prisma.order.update({
          where: { id: order.id },
          data: { waDeliveredSent: true }
        });

        await prisma.messageLog.create({
          data: {
            customerId: order.customerId,
            orderId: order.id,
            phone: order.customerPhone,
            messageType: 'order_delivered',
            templateUsed: 'order_delivered',
            status: 'sent',
            whatsappMessageId: result.data?.messages?.[0]?.id || ''
          }
        });
      }

      return result;
    } catch (error: any) {
      console.error('Error sending order delivered notification:', error);
      return { success: false, error: error.message };
    }
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
