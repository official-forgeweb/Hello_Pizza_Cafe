import { env } from 'process';

const getWhatsAppConfig = () => {
  return {
    accessToken: process.env.WHATSAPP_ACCESS_TOKEN,
    phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID,
    wabaId: process.env.WHATSAPP_BUSINESS_ACCOUNT_ID,
    apiVersion: process.env.WHATSAPP_API_VERSION || 'v18.0',
  };
};

export class WhatsAppService {
  /**
   * Send a WhatsApp template message
   */
  static async sendTemplateMessage(
    to: string,
    templateName: string,
    language: string = 'en_US',
    components: any[] = []
  ) {
    const config = getWhatsAppConfig();
    if (!config.accessToken || !config.phoneNumberId) {
      console.warn('WhatsApp API credentials are missing.');
      return { success: false, error: 'Credentials missing' };
    }

    const baseUrl = `https://graph.facebook.com/${config.apiVersion}/${config.phoneNumberId}`;

    try {
      const response = await fetch(`${baseUrl}/messages`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${config.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to: to,
          type: 'template',
          template: {
            name: templateName,
            language: {
              code: language,
            },
            components: components,
          },
        }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error?.message || 'Failed to send message');
      }

      return { success: true, data };
    } catch (error: any) {
      console.error('Error sending WhatsApp template:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Send a simple text message (only works within 24hr window)
   */
  static async sendTextMessage(to: string, text: string) {
    const config = getWhatsAppConfig();
    if (!config.accessToken || !config.phoneNumberId) {
      return { success: false, error: 'Credentials missing' };
    }

    const baseUrl = `https://graph.facebook.com/${config.apiVersion}/${config.phoneNumberId}`;

    try {
      const response = await fetch(`${baseUrl}/messages`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${config.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to: to,
          type: 'text',
          text: {
            body: text,
          },
        }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error?.message || 'Failed to send message');
      }

      return { success: true, data };
    } catch (error: any) {
      console.error('Error sending WhatsApp text:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Fetch approved templates from Meta API
   */
  static async getTemplates() {
    const config = getWhatsAppConfig();
    if (!config.accessToken || !config.wabaId) {
      return { success: false, error: 'Credentials missing' };
    }

    try {
      const response = await fetch(
        `https://graph.facebook.com/${config.apiVersion}/${config.wabaId}/message_templates`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${config.accessToken}`,
          },
        }
      );

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error?.message || 'Failed to fetch templates');
      }

      return { success: true, data: data.data };
    } catch (error: any) {
      console.error('Error fetching WhatsApp templates:', error);
      return { success: false, error: error.message };
    }
  }
}
