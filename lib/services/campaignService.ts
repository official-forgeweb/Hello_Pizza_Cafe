import prisma from '../prisma';
import { QueueService } from './queueService';
import { WhatsAppService } from './whatsappService';

export class CampaignService {
  /**
   * Start sending a campaign
   */
  static async executeCampaign(campaignId: string) {
    const campaign = await prisma.campaign.findUnique({
      where: { id: campaignId }
    });

    if (!campaign || campaign.status !== 'draft') {
      throw new Error('Campaign not found or not in draft state');
    }

    // 1. Mark as sending
    await prisma.campaign.update({
      where: { id: campaignId },
      data: { status: 'sending', sentAt: new Date() }
    });

    // 2. Resolve target customers
    let targetCustomers: any[] = [];
    
    if (campaign.targetType === 'all') {
      targetCustomers = await prisma.customer.findMany({
        where: { whatsappOptIn: true }
      });
    } else if (campaign.targetType === 'group' && campaign.targetGroup) {
      targetCustomers = await prisma.customer.findMany({
        where: { whatsappOptIn: true, group: campaign.targetGroup }
      });
    } else if (campaign.targetType === 'custom' && campaign.targetCustomers.length > 0) {
      targetCustomers = await prisma.customer.findMany({
        where: { 
          id: { in: campaign.targetCustomers },
          whatsappOptIn: true 
        }
      });
    }

    if (targetCustomers.length === 0) {
      await prisma.campaign.update({
        where: { id: campaignId },
        data: { status: 'failed', completedAt: new Date() }
      });
      return { success: false, error: 'No opted-in customers found for target' };
    }

    // 3. Update total recipients
    await prisma.campaign.update({
      where: { id: campaignId },
      data: { totalRecipients: targetCustomers.length }
    });

    // Fetch template details to get correct language code
    const template = await prisma.whatsAppTemplate.findUnique({
      where: { templateName: campaign.templateName }
    });
    const languageCode = template?.language || 'en_US';

    // Resolve header image (fallback to template example if null, but replace temporary Meta CDN links)
    let headerImgUrl = campaign.headerImage || undefined;
    if (!headerImgUrl && template) {
      const headerComp = (template.components as any[]).find(
        (c) => c.type === 'HEADER' && c.format === 'IMAGE'
      );
      if (headerComp && headerComp.example?.header_handle?.[0]) {
        const handle = headerComp.example.header_handle[0];
        if (handle.includes('fbcdn.net') || handle.includes('whatsapp.net')) {
          // Replace temporary expired Meta link with a stable Unsplash pizza banner image
          headerImgUrl = "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=800&q=80";
        } else {
          headerImgUrl = handle;
        }
      }
    }

    // 4. Queue or send messages
    const useQueue = !!process.env.REDIS_URL;

    if (useQueue) {
      for (const customer of targetCustomers) {
        const personalizedVars = campaign.bodyParameters.map(param => {
          if (param === '{name}') return customer.name;
          return param;
        });

        await QueueService.queueCampaignMessage({
          customerId: customer.id,
          phone: customer.phone,
          templateName: campaign.templateName,
          variables: personalizedVars,
          campaignId: campaign.id,
          language: languageCode,
          headerImageUrl: headerImgUrl,
          buttonUrl: campaign.buttonUrl || undefined
        });
      }
    } else {
      // Redis is not configured. Process sending directly in the background.
      console.log('Redis is not configured. Processing campaign sends directly.');
      
      // We run this asynchronously so we do not block the HTTP request returning a success status
      (async () => {
        let sentCount = 0;
        let failedCount = 0;

        for (const customer of targetCustomers) {
          try {
            const personalizedVars = campaign.bodyParameters.map(param => {
              if (param === '{name}') return customer.name;
              return param;
            });

            // Build components for sending
            const components: any[] = [];
            
            if (headerImgUrl) {
              components.push({
                type: 'header',
                parameters: [
                  {
                    type: 'image',
                    image: {
                      link: headerImgUrl
                    }
                  }
                ]
              });
            }

            if (personalizedVars.length > 0) {
              components.push({
                type: 'body',
                parameters: personalizedVars.map((v: string) => ({ type: 'text', text: v }))
              });
            }

            const result = await WhatsAppService.sendTemplateMessage(
              customer.phone,
              campaign.templateName,
              languageCode,
              components
            );

            if (result.success) {
              await prisma.messageLog.create({
                data: {
                  campaignId: campaign.id,
                  customerId: customer.id,
                  phone: customer.phone,
                  messageType: 'marketing',
                  templateUsed: campaign.templateName,
                  status: 'sent',
                  whatsappMessageId: result.data?.messages?.[0]?.id || ''
                }
              });
              sentCount++;
              await prisma.campaign.update({
                where: { id: campaign.id },
                data: { sent: { increment: 1 } }
              });
            } else {
              throw new Error(result.error);
            }
          } catch (error: any) {
            console.error(`Direct send failed for customer ${customer.id}:`, error);
            await prisma.messageLog.create({
              data: {
                campaignId: campaign.id,
                customerId: customer.id,
                phone: customer.phone,
                messageType: 'marketing',
                templateUsed: campaign.templateName,
                status: 'failed',
                errorMessage: error.message
              }
            });
            failedCount++;
            await prisma.campaign.update({
              where: { id: campaign.id },
              data: { failed: { increment: 1 } }
            });
          }

          // A small delay between API requests to respect rate limits
          await new Promise(resolve => setTimeout(resolve, 200));
        }

        // Mark campaign status dynamically
        let finalStatus = 'completed';
        if (sentCount === 0 && failedCount > 0) {
          finalStatus = 'failed';
        }

        await prisma.campaign.update({
          where: { id: campaign.id },
          data: { status: finalStatus, completedAt: new Date() }
        });
      })().catch(err => {
        console.error('Error running direct campaign sender:', err);
      });
    }

    return { success: true, recipientsCount: targetCustomers.length };
  }
}

