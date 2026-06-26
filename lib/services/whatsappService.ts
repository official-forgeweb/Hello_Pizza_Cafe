import { env } from 'process';

const getWhatsAppConfig = () => {
  return {
    accessToken: process.env.WHATSAPP_ACCESS_TOKEN,
    phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID,
    wabaId: process.env.WHATSAPP_BUSINESS_ACCOUNT_ID,
    apiVersion: process.env.WHATSAPP_API_VERSION || 'v21.0',
  };
};

function sanitizePhone(phone: string): string {
  if (!phone) return "";
  let cleaned = phone.trim().replace(/\D/g, "");
  if (cleaned.startsWith("0")) {
    cleaned = cleaned.substring(1);
  }
  if (cleaned.length === 10) {
    cleaned = "91" + cleaned;
  }
  return cleaned;
}

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

    const cleanTo = sanitizePhone(to);

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
          to: cleanTo,
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

    const cleanTo = sanitizePhone(to);

    try {
      const response = await fetch(`${baseUrl}/messages`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${config.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to: cleanTo,
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

  /**
   * Upload an image to Meta Resumable Upload API to get a header_handle for templates
   */
  static async uploadImageToMeta(imageUrl: string) {
    const config = getWhatsAppConfig();
    const appId = process.env.WHATSAPP_APP_ID;
    
    if (!config.accessToken || !appId) {
      return { success: false, error: 'Credentials or App ID missing' };
    }

    try {
      const imgRes = await fetch(imageUrl);
      if (!imgRes.ok) throw new Error('Failed to fetch image from URL');
      const arrayBuf = await imgRes.arrayBuffer();
      const imgBuffer = Buffer.from(arrayBuf);
      const fileLength = imgBuffer.length;

      // 1. Create upload session
      const url1 = `https://graph.facebook.com/${config.apiVersion}/${appId}/uploads?file_length=${fileLength}&file_type=image/jpeg`;
      const res1 = await fetch(url1, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${config.accessToken}` }
      });
      const data1 = await res1.json();
      
      if (!data1.id) {
        throw new Error(data1.error?.message || 'Failed to create upload session');
      }
      const sessionId = data1.id;

      // 2. Upload data
      const url2 = `https://graph.facebook.com/${config.apiVersion}/${sessionId}`;
      const res2 = await fetch(url2, {
        method: 'POST',
        headers: {
          'Authorization': `OAuth ${config.accessToken}`,
          'file_offset': '0'
        },
        body: imgBuffer
      });
      const data2 = await res2.json();
      
      if (!data2.h) {
        throw new Error(data2.error?.message || 'Failed to upload image data');
      }

      return { success: true, handle: data2.h };
    } catch (error: any) {
      console.error('Error uploading image to Meta:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Create a template on Meta
   */
  static async createTemplate(templateData: {
    name: string;
    category: string;
    language: string;
    components: any[];
  }) {
    const config = getWhatsAppConfig();
    if (!config.accessToken || !config.wabaId) {
      return { success: false, error: 'Credentials missing' };
    }

    try {
      console.log('Sending createTemplate payload to Meta:', JSON.stringify(templateData, null, 2));
      const response = await fetch(
        `https://graph.facebook.com/${config.apiVersion}/${config.wabaId}/message_templates`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${config.accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(templateData),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        console.error('Meta API createTemplate error response:', JSON.stringify(data, null, 2));
        return {
          success: false,
          error: data.error?.message || 'Failed to create template in Meta',
          rawError: data.error
        };
      }

      return { success: true, data };
    } catch (error: any) {
      console.error('Error creating WhatsApp template:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Delete a template from Meta by name
   */
  static async deleteTemplate(templateName: string) {
    const config = getWhatsAppConfig();
    if (!config.accessToken || !config.wabaId) {
      return { success: false, error: 'Credentials missing' };
    }

    try {
      const response = await fetch(
        `https://graph.facebook.com/${config.apiVersion}/${config.wabaId}/message_templates?name=${encodeURIComponent(templateName)}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${config.accessToken}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || 'Failed to delete template from Meta');
      }

      return { success: true, data };
    } catch (error: any) {
      console.error('Error deleting WhatsApp template:', error);
      return { success: false, error: error.message };
    }
  }
}
