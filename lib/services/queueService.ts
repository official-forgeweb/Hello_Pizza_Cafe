import { Queue, Worker, Job } from 'bullmq';
import Redis from 'ioredis';
import { WhatsAppService } from './whatsappService';
import prisma from '../prisma';

let connection: Redis | null = null;
let campaignQueue: Queue | null = null;
let worker: Worker | null = null;

if (process.env.REDIS_URL) {
  // Use a fallback to local redis if no URL is provided
  connection = new Redis(process.env.REDIS_URL, {
    maxRetriesPerRequest: null,
  });

  campaignQueue = new Queue('whatsapp-campaign', { connection });

  // Setup Worker to process jobs
  // 80 messages per second rate limit is standard for some Meta tiers, we'll configure it carefully
  worker = new Worker('whatsapp-campaign', async (job: Job) => {
    const { customerId, phone, templateName, variables, campaignId, headerImageUrl, buttonUrl } = job.data;
    
    try {
      // Build components
      const components = [];
      
      if (headerImageUrl) {
        components.push({
          type: 'header',
          parameters: [
            {
              type: 'image',
              image: {
                link: headerImageUrl
              }
            }
          ]
        });
      }

      if (variables && variables.length > 0) {
        components.push({
          type: 'body',
          parameters: variables.map((v: string) => ({ type: 'text', text: v }))
        });
      }

      // Send the message via WhatsApp
      const result = await WhatsAppService.sendTemplateMessage(phone, templateName, 'en_US', components);

      if (result.success) {
        // Log the successful send
        await prisma.messageLog.create({
          data: {
            campaignId,
            customerId,
            phone,
            messageType: 'marketing',
            templateUsed: templateName,
            status: 'sent',
            whatsappMessageId: result.data?.messages?.[0]?.id || ''
          }
        });
        
        return { success: true, messageId: result.data?.messages?.[0]?.id };
      } else {
        throw new Error(result.error);
      }
    } catch (error: any) {
      // Log the failure
      await prisma.messageLog.create({
        data: {
          campaignId,
          customerId,
          phone,
          messageType: 'marketing',
          templateUsed: templateName,
          status: 'failed',
          errorMessage: error.message
        }
      });
      
      throw error;
    }
  }, {
    connection,
    limiter: {
      max: 50, // 50 messages
      duration: 1000 // per second
    }
  });

  worker.on('completed', async (job) => {
    if (job.data.campaignId) {
      await prisma.campaign.update({
        where: { id: job.data.campaignId },
        data: { sent: { increment: 1 } }
      });
    }
  });

  worker.on('failed', async (job, err) => {
    console.error(`Job ${job?.id} failed:`, err);
    if (job?.data.campaignId) {
      await prisma.campaign.update({
        where: { id: job.data.campaignId },
        data: { failed: { increment: 1 } }
      });
    }
  });
}

export { campaignQueue };

export class QueueService {
  /**
   * Queue a message for a campaign
   */
  static async queueCampaignMessage(data: {
    customerId: string,
    phone: string,
    templateName: string,
    variables: string[],
    campaignId: string,
    headerImageUrl?: string,
    buttonUrl?: string
  }) {
    if (!campaignQueue) {
      console.warn('QueueService: Redis is not configured. Cannot queue campaign message.');
      return;
    }
    
    await campaignQueue.add(`campaign-${data.campaignId}-msg-${data.customerId}`, data, {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 1000,
      },
      removeOnComplete: true,
      removeOnFail: 1000,
    });
  }
}

