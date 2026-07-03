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
    const { customerId, phone, templateName, variables, campaignId, headerImageUrl, buttonUrl, language } = job.data;
    
    try {
      if (campaignId) {
        const campaign = await prisma.campaign.findUnique({
          where: { id: campaignId },
          select: { status: true }
        });
        if (campaign && campaign.status === 'paused') {
          console.log(`[Queue Worker] Skipping message for phone ${phone} as campaign ${campaignId} is paused.`);
          return { success: false, skipped: true, error: 'Campaign is paused' };
        }
      }

      // Build components
      const components = [];
      
      if (headerImageUrl) {
        let resolvedHeaderUrl = headerImageUrl;
        if (resolvedHeaderUrl.startsWith('/')) {
          resolvedHeaderUrl = `https://hello-pizza-cafe.vercel.app${resolvedHeaderUrl}`;
        }
        components.push({
          type: 'header',
          parameters: [
            {
              type: 'image',
              image: {
                link: resolvedHeaderUrl
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

      // Add dynamic button parameters if template contains dynamic URL buttons
      const template = await prisma.whatsAppTemplate.findUnique({
        where: { templateName }
      });
      if (template && Array.isArray(template.components)) {
        const buttonsComp = (template.components as any[]).find((c: any) => c.type === 'BUTTONS');
        if (buttonsComp && Array.isArray(buttonsComp.buttons)) {
          const urlButtonIndex = buttonsComp.buttons.findIndex((b: any) => b.type === 'URL' && b.url && b.url.includes('{{1}}'));
          if (urlButtonIndex !== -1) {
            components.push({
              type: 'button',
              sub_type: 'url',
              index: String(urlButtonIndex),
              parameters: [
                { type: 'text', text: phone }
              ]
            });
          }
        }
      }

      // Send the message via WhatsApp
      const result = await WhatsAppService.sendTemplateMessage(phone, templateName, language || 'en_US', components);

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
        
        if (campaignId) {
          const campaign = await prisma.campaign.findUnique({
            where: { id: campaignId }
          });
          if (campaign) {
            const getEffectiveBonusPoints = (c: any) => {
              if (c.bonusPoints && c.bonusPoints > 0) return c.bonusPoints;
              if (c.templateName === 'loyalty_balance_update' && Array.isArray(c.bodyParameters) && c.bodyParameters.length > 0) {
                const parsed = parseInt(c.bodyParameters[0]);
                if (!isNaN(parsed) && parsed > 0) return parsed;
              }
              return 0;
            };
            const effectiveBonus = getEffectiveBonusPoints(campaign);
            if (effectiveBonus > 0) {
              const existingTx = await prisma.loyaltyTransaction.findFirst({
                where: {
                  phoneNumber: phone,
                  campaignId: campaign.id
                }
              });
              if (!existingTx) {
                const expiryDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
                await prisma.loyaltyTransaction.create({
                  data: {
                    phoneNumber: phone,
                    type: "BONUS",
                    points: effectiveBonus,
                    expiryDate,
                    isPending: true,
                    campaignId: campaign.id
                  }
                });
              }
            }
          }
        }
        
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
    language: string,
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

