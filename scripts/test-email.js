require('dotenv').config();
const nodemailer = require('nodemailer');

async function main() {
  console.log('==================================================');
  console.log('       🍕 HELLO PIZZA - EMAIL DIAGNOSTIC 🍕       ');
  console.log('==================================================\n');

  const host = process.env.SMTP_HOST || "smtp.gmail.com";
  const port = parseInt(process.env.SMTP_PORT || "587");
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const adminEmail = process.env.ADMIN_EMAIL;

  console.log('--- Configuration ---');
  console.log(`SMTP Host:   ${host}`);
  console.log(`SMTP Port:   ${port}`);
  console.log(`SMTP User:   ${user || 'MISSING!'}`);
  console.log(`SMTP Pass:   ${pass ? '***' + pass.slice(-4) : 'MISSING!'}`);
  console.log(`Admin Email: ${adminEmail || 'MISSING!'}`);
  console.log('---------------------\n');

  if (!user || !pass) {
    console.error('❌ Error: SMTP credentials (SMTP_USER or SMTP_PASS) are missing in .env!');
    process.exit(1);
  }

  if (!adminEmail) {
    console.error('❌ Error: ADMIN_EMAIL is missing in .env!');
    process.exit(1);
  }

  console.log('🔄 Step 1: Initializing nodemailer transporter...');
  const transporter = nodemailer.createTransport({
    host,
    port,
    secure: false, // 587 is STARTTLS, which starts unencrypted then upgrades
    auth: {
      user,
      pass,
    },
  });

  console.log('🔄 Step 2: Verifying connection configuration...');
  try {
    await transporter.verify();
    console.log('✅ Success: SMTP connection verified successfully!');
  } catch (error) {
    console.error('❌ Error verifying SMTP connection:', error.message);
    console.error('Full Error:', error);
    console.log('\n💡 Troubleshooting Tips:');
    console.log('1. If using Gmail, make sure you generated an "App Password" (16 letters, no spaces) under Google Account -> Security -> 2-Step Verification.');
    console.log('2. Make sure the credentials in your .env file match exactly.');
    console.log('3. Ensure your firewall or network allows outgoing traffic on port ' + port + '.');
    process.exit(1);
  }

  console.log('\n🔄 Step 3: Sending a test email to Admin (' + adminEmail + ')...');
  try {
    const info = await transporter.sendMail({
      from: `"Hello Pizza System" <${user}>`,
      to: adminEmail,
      subject: '🍕 Hello Pizza - SMTP Diagnostic Test Email',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
          <h2 style="color: #e21837; margin-top: 0;">Hello Pizza SMTP Diagnostic</h2>
          <p>This is a test email sent from the Hello Pizza application diagnostic tool to verify that your email service and SMTP settings are working correctly.</p>
          
          <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
            <tr style="background-color: #f8fafc;">
              <th style="padding: 10px; border: 1px solid #cbd5e1; text-align: left;">Setting</th>
              <th style="padding: 10px; border: 1px solid #cbd5e1; text-align: left;">Value</th>
            </tr>
            <tr>
              <td style="padding: 10px; border: 1px solid #cbd5e1; font-weight: bold;">SMTP Host</td>
              <td style="padding: 10px; border: 1px solid #cbd5e1;">${host}</td>
            </tr>
            <tr>
              <td style="padding: 10px; border: 1px solid #cbd5e1; font-weight: bold;">SMTP Port</td>
              <td style="padding: 10px; border: 1px solid #cbd5e1;">${port}</td>
            </tr>
            <tr>
              <td style="padding: 10px; border: 1px solid #cbd5e1; font-weight: bold;">Sender User</td>
              <td style="padding: 10px; border: 1px solid #cbd5e1;">${user}</td>
            </tr>
            <tr>
              <td style="padding: 10px; border: 1px solid #cbd5e1; font-weight: bold;">Recipient Admin</td>
              <td style="padding: 10px; border: 1px solid #cbd5e1; color: #0284c7;">${adminEmail}</td>
            </tr>
          </table>

          <p style="font-size: 14px; color: #475569; background-color: #f0fdf4; border-left: 4px solid #22c55e; padding: 12px; border-radius: 4px;">
            <strong>Status:</strong> If you are reading this email, the SMTP configuration is 100% correct, and the system is able to reach your admin inbox successfully!
          </p>

          <p style="font-size: 12px; color: #94a3b8; margin-top: 30px;">Sent at: ${new Date().toString()}</p>
        </div>
      `,
    });

    console.log('✅ Success: Test email sent successfully!');
    console.log('Message ID:', info.messageId);
    console.log(`\n🎉 All tests passed! Please check the inbox of: ${adminEmail}`);
  } catch (error) {
    console.error('❌ Error sending test email:', error.message);
    console.error('Full Error:', error);
  }
}

main();
