import nodemailer from "nodemailer";

function getTransporter() {
  const host = process.env.SMTP_HOST || "smtp.gmail.com";
  const port = parseInt(process.env.SMTP_PORT || "587");
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!user || !pass) {
    console.warn("[EMAIL] SMTP credentials missing in .env!");
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: false,
    auth: {
      user,
      pass,
    },
  });
}

const STATUS_LABELS: Record<string, string> = {
  PENDING: "Pending",
  CONFIRMED: "Confirmed",
  PREPARING: "Preparing In Kitchen",
  READY: "Ready",
  OUT_FOR_DELIVERY: "Out for Delivery",
  DELIVERED: "Delivered",
  CANCELLED: "Cancelled",
};

export async function sendOrderConfirmationEmail(order: any) {
  if (!order.customerEmail) {
    console.log("[EMAIL] No customer email provided for order", order.orderNumber);
    return;
  }

  try {
    const transporter = getTransporter();
    
    const itemsHtml = order.items.map((item: any) => `
      <tr>
        <td style="padding: 12px 0; border-bottom: 1px solid #f5f5f4;">
          <p style="margin: 0; font-weight: 600; color: #1c1917;">${item.quantity}x ${item.itemName}</p>
          ${item.variantName ? `<p style="margin: 4px 0 0; font-size: 12px; color: #78716c;">Size: ${item.variantName}</p>` : ''}
        </td>
        <td style="padding: 12px 0; border-bottom: 1px solid #f5f5f4; text-align: right; font-weight: 600; color: #1c1917;">
          ₹${Number(item.itemTotal)}
        </td>
      </tr>
    `).join("");

    const html = `
      <div style="font-family: 'Inter', sans-serif; max-width: 480px; margin: 0 auto; padding: 40px 24px; background: #fafaf9;">
        <div style="text-align: center; margin-bottom: 32px;">
          <h1 style="font-size: 24px; font-weight: 800; color: #1c1917; margin: 0;">
            Hello<span style="color: #e31837;">Pizza</span>
          </h1>
        </div>
        <div style="background: white; border-radius: 16px; padding: 32px; box-shadow: 0 4px 20px -2px rgba(0,0,0,0.05);">
          <div style="text-align: center; margin-bottom: 24px;">
            <h2 style="font-size: 20px; font-weight: 700; color: #1c1917; margin: 0 0 8px;">Order Confirmed! 🍕</h2>
            <p style="font-size: 14px; color: #78716c; margin: 0;">Thank you for your order, ${order.customerName.split(' ')[0]}!</p>
          </div>
          
          <div style="background: #f5f5f4; border-radius: 12px; padding: 16px; margin-bottom: 24px; text-align: center;">
            <p style="font-size: 12px; color: #78716c; margin: 0 0 4px; text-transform: uppercase; font-weight: 700; letter-spacing: 1px;">Order Number</p>
            <p style="font-size: 18px; font-weight: 800; color: #1c1917; margin: 0;">${order.orderNumber}</p>
          </div>

          <h3 style="font-size: 14px; font-weight: 700; color: #1c1917; margin: 0 0 12px; text-transform: uppercase; letter-spacing: 1px;">Order Summary</h3>
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px; font-size: 14px;">
            ${itemsHtml}
            <tr>
              <td style="padding: 12px 0 4px; color: #78716c;">Subtotal</td>
              <td style="padding: 12px 0 4px; text-align: right; color: #78716c;">₹${Number(order.subtotal)}</td>
            </tr>
            <tr>
              <td style="padding: 4px 0; color: #78716c;">Tax (5%)</td>
              <td style="padding: 4px 0; text-align: right; color: #78716c;">₹${Number(order.taxAmount)}</td>
            </tr>
            <tr>
              <td style="padding: 4px 0; color: #78716c;">Delivery</td>
              <td style="padding: 4px 0; text-align: right; color: #78716c;">₹${Number(order.deliveryFee)}</td>
            </tr>
            <tr>
              <td style="padding: 12px 0 0; font-weight: 800; font-size: 16px; color: #1c1917; border-top: 1px solid #e7e5e4;">Total Payable</td>
              <td style="padding: 12px 0 0; font-weight: 800; font-size: 16px; color: #e31837; text-align: right; border-top: 1px solid #e7e5e4;">₹${Number(order.totalAmount)}</td>
            </tr>
          </table>
          
          <p style="font-size: 13px; color: #78716c; text-align: center; margin: 0;">
            We'll send you another update when your order changes status!
          </p>
        </div>
      </div>
    `;

    await transporter.sendMail({
      from: `"Hello Pizza" <${process.env.SMTP_USER}>`,
      to: order.customerEmail,
      subject: `Order Confirmed - ${order.orderNumber} 🍕`,
      html,
    });
    console.log("[EMAIL] Order confirmation sent to", order.customerEmail);
  } catch (error) {
    console.error("[EMAIL] Failed to send order confirmation:", error);
  }
}

export async function sendOrderStatusEmail(order: any) {
  if (!order.customerEmail) return;

  try {
    const transporter = getTransporter();
    const statusLabel = STATUS_LABELS[order.status] || order.status;

    const html = `
      <div style="font-family: 'Inter', sans-serif; max-width: 480px; margin: 0 auto; padding: 40px 24px; background: #fafaf9;">
        <div style="text-align: center; margin-bottom: 32px;">
          <h1 style="font-size: 24px; font-weight: 800; color: #1c1917; margin: 0;">
            Hello<span style="color: #e31837;">Pizza</span>
          </h1>
        </div>
        <div style="background: white; border-radius: 16px; padding: 32px; box-shadow: 0 4px 20px -2px rgba(0,0,0,0.05);">
          <div style="text-align: center;">
            <div style="display: inline-block; padding: 8px 16px; background: #fef2f2; color: #e31837; font-size: 12px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; border-radius: 20px; margin-bottom: 16px;">
              Status Update
            </div>
            <h2 style="font-size: 20px; font-weight: 700; color: #1c1917; margin: 0 0 16px;">Your order is <span style="color: #e31837;">${statusLabel}</span></h2>
            <p style="font-size: 14px; color: #78716c; margin: 0 0 24px;">Hi ${order.customerName.split(' ')[0]}, your order <strong>${order.orderNumber}</strong> has been updated to <strong>${statusLabel}</strong>.</p>
            
            <div style="background: #f5f5f4; border-radius: 12px; padding: 16px; text-align: left;">
              <p style="font-size: 12px; color: #78716c; margin: 0 0 4px; text-transform: uppercase; font-weight: 700; letter-spacing: 1px;">Delivery Address</p>
              <p style="font-size: 14px; font-weight: 600; color: #1c1917; margin: 0;">${order.deliveryAddress || 'Self Pickup'}</p>
            </div>
          </div>
        </div>
      </div>
    `;

    await transporter.sendMail({
      from: `"Hello Pizza Updates" <${process.env.SMTP_USER}>`,
      to: order.customerEmail,
      subject: `Order Update: ${statusLabel} - ${order.orderNumber}`,
      html,
    });
    console.log("[EMAIL] Status update sent to", order.customerEmail);
  } catch (error) {
    console.error("[EMAIL] Failed to send status update:", error);
  }
}

export async function sendAdminOrderNotification(order: any) {
  const adminEmail = process.env.ADMIN_EMAIL;
  if (!adminEmail) return;

  try {
    const transporter = getTransporter();
    
    await transporter.sendMail({
      from: `"Hello Pizza System" <${process.env.SMTP_USER}>`,
      to: adminEmail,
      subject: `NEW ORDER: ${order.orderNumber} - ₹${order.totalAmount}`,
      html: `
        <h2>New Order Received!</h2>
        <p><strong>Order Number:</strong> ${order.orderNumber}</p>
        <p><strong>Customer:</strong> ${order.customerName} (${order.customerPhone})</p>
        <p><strong>Total:</strong> ₹${order.totalAmount}</p>
        <p><strong>Type:</strong> ${order.orderType}</p>
        <a href="${process.env.NEXTAUTH_URL}/admin/orders">View in Dashboard</a>
      `,
    });
    console.log("[EMAIL] Admin notification sent to", adminEmail);
  } catch (error) {
    console.error("[EMAIL] Failed to send admin notification:", error);
  }
}
