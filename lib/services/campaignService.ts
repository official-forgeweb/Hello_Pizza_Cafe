import prisma from '../prisma';
import { QueueService } from './queueService';
import { WhatsAppService } from './whatsappService';

export class CampaignService {
  static async resolvePersonalizedVars(customer: any, campaign: any) {
    const { CustomerService } = await import("./customerService");
    const personalizedVars = [];
    for (const param of campaign.bodyParameters) {
      if (param === "{name}") {
        personalizedVars.push("Customer");
      } else if (param === "{points_expiring}") {
        const points = await CustomerService.getPointsExpiringInDays(customer.phone, 5);
        personalizedVars.push(String(points));
      } else if (param === "{expiry_date}") {
        const expiryDate = new Date();
        expiryDate.setDate(expiryDate.getDate() + 30);
        personalizedVars.push(expiryDate.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }));
      } else if (param === "{bonus_points}") {
        personalizedVars.push(String(CampaignService.getEffectiveBonusPoints(campaign)));
      } else {
        personalizedVars.push(param);
      }
    }
    return personalizedVars;
  }

  /**
   * Extracts the effective bonus points for a campaign.
   * Falls back to parsing the first body parameter if bonusPoints field is 0
   * (handles campaigns created before the frontend auto-sync fix).
   */
  static getEffectiveBonusPoints(campaign: any): number {
    if (campaign.bonusPoints && campaign.bonusPoints > 0) {
      return campaign.bonusPoints;
    }
    // Fallback: For loyalty_balance_update template, the first body param is the bonus points value
    if (campaign.templateName === 'loyalty_balance_update' && 
        Array.isArray(campaign.bodyParameters) && 
        campaign.bodyParameters.length > 0) {
      const parsed = parseInt(campaign.bodyParameters[0]);
      if (!isNaN(parsed) && parsed > 0) {
        return parsed;
      }
    }
    return 0;
  }

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
    } else if (campaign.targetType === 'tag' && campaign.targetGroup) {
      // Tag-based targeting — e.g. target all "pos-customer" contacts
      targetCustomers = await prisma.customer.findMany({
        where: {
          whatsappOptIn: true,
          tags: { has: campaign.targetGroup }
        }
      });
    } else if (campaign.targetType === 'custom' && campaign.targetCustomers.length > 0) {
      targetCustomers = await prisma.customer.findMany({
        where: { 
          phone: { in: campaign.targetCustomers },
          whatsappOptIn: true 
        }
      });
    } else if (campaign.targetType === 'expiring') {
      const now = new Date();
      const fiveDaysFromNow = new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000);
      const expiringTxs = await prisma.loyaltyTransaction.findMany({
        where: {
          type: "EARN",
          expiryDate: {
            gt: now,
            lte: fiveDaysFromNow
          }
        },
        select: { phoneNumber: true }
      });
      const expiringPhones = Array.from(new Set(expiringTxs.map(t => t.phoneNumber)));
      targetCustomers = await prisma.customer.findMany({
        where: {
          phone: { in: expiringPhones },
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

    // Resolve header image (fallback to template's stored headerImageUrl, then to template components)
    let headerImgUrl = campaign.headerImage || template?.headerImageUrl || undefined;
    if (!headerImgUrl && template) {
      const headerComp = (template.components as any[]).find(
        (c) => c.type === 'HEADER' && c.format === 'IMAGE'
      );
      if (headerComp && headerComp.example?.header_handle?.[0]) {
        const handle = headerComp.example.header_handle[0];
        if (!handle.includes('fbcdn.net') && !handle.includes('whatsapp.net')) {
          headerImgUrl = handle;
        }
      }
    }

    if (headerImgUrl && headerImgUrl.startsWith('/')) {
      headerImgUrl = `https://hello-pizza-cafe.vercel.app${headerImgUrl}`;
    }

    // 4. Queue or send messages
    const useQueue = !!process.env.REDIS_URL;

    if (useQueue) {
      for (const customer of targetCustomers) {
        const personalizedVars = await CampaignService.resolvePersonalizedVars(customer, campaign);

        await QueueService.queueCampaignMessage({
          customerId: customer.phone,
          phone: customer.phone,
          templateName: campaign.templateName,
          variables: personalizedVars,
          campaignId: campaign.id,
          language: languageCode,
          headerImageUrl: headerImgUrl,
          buttonUrl: campaign.buttonUrl || undefined
        });
      }
      return { success: true, recipientsCount: targetCustomers.length, needsClientDriving: false };
    } else {
      // Redis is not configured.
      console.log(`[CampaignService] Redis is not configured. Campaign ${campaignId} marked as sending, awaiting client-driven batches.`);
      return { success: true, recipientsCount: targetCustomers.length, needsClientDriving: true };
    }
  }

  /**
   * Process and send a small batch of campaign messages
   * Extremely safe for serverless/Vercel timeouts
   */
  static async sendCampaignBatch(campaignId: string, batchSize: number = 15) {
    const campaign = await prisma.campaign.findUnique({
      where: { id: campaignId }
    });

    if (!campaign || campaign.status !== 'sending') {
      return { success: false, error: 'Campaign not found or not in sending state' };
    }

    // 1. Resolve all target customers
    let targetCustomers: any[] = [];
    
    if (campaign.targetType === 'all') {
      targetCustomers = await prisma.customer.findMany({
        where: { whatsappOptIn: true }
      });
    } else if (campaign.targetType === 'group' && campaign.targetGroup) {
      targetCustomers = await prisma.customer.findMany({
        where: { whatsappOptIn: true, group: campaign.targetGroup }
      });
    } else if (campaign.targetType === 'tag' && campaign.targetGroup) {
      targetCustomers = await prisma.customer.findMany({
        where: {
          whatsappOptIn: true,
          tags: { has: campaign.targetGroup }
        }
      });
    } else if (campaign.targetType === 'custom' && campaign.targetCustomers.length > 0) {
      targetCustomers = await prisma.customer.findMany({
        where: { 
          phone: { in: campaign.targetCustomers },
          whatsappOptIn: true 
        }
      });
    }

    if (targetCustomers.length === 0) {
      await prisma.campaign.update({
        where: { id: campaignId },
        data: { status: 'completed', completedAt: new Date() }
      });
      return { success: true, completed: true, processed: 0 };
    }

    // 2. Fetch already-processed recipient logs for this campaign
    const processedLogs = await prisma.messageLog.findMany({
      where: { campaignId: campaign.id },
      select: { phone: true }
    });
    const processedPhones = new Set(processedLogs.map(log => log.phone));

    // 3. Find pending customers that haven't been processed yet
    const pendingCustomers = targetCustomers.filter(c => !processedPhones.has(c.phone));

    if (pendingCustomers.length === 0) {
      // All done! Update campaign status
      await prisma.campaign.update({
        where: { id: campaignId },
        data: { status: 'completed', completedAt: new Date() }
      });
      return { success: true, completed: true, processed: 0 };
    }

    // Take the next slice for this batch
    const batchCustomers = pendingCustomers.slice(0, batchSize);

    // Fetch template details to get correct language code
    const template = await prisma.whatsAppTemplate.findUnique({
      where: { templateName: campaign.templateName }
    });
    const languageCode = template?.language || 'en_US';

    // Resolve header image URL
    let headerImgUrl = campaign.headerImage || template?.headerImageUrl || undefined;
    if (!headerImgUrl && template) {
      const headerComp = (template.components as any[]).find(
        (c) => c.type === 'HEADER' && c.format === 'IMAGE'
      );
      if (headerComp && headerComp.example?.header_handle?.[0]) {
         const handle = headerComp.example.header_handle[0];
         if (!handle.includes('fbcdn.net') && !handle.includes('whatsapp.net')) {
           headerImgUrl = handle;
         }
      }
    }

    if (headerImgUrl && headerImgUrl.startsWith('/')) {
      headerImgUrl = `https://hello-pizza-cafe.vercel.app${headerImgUrl}`;
    }

    let sentCount = 0;
    let failedCount = 0;

    // Helper for limited concurrency parallel execution
    const runWithConcurrencyLimit = async (tasks: (() => Promise<void>)[], limit: number) => {
      const active: Promise<void>[] = [];
      for (const task of tasks) {
        const p = task().then(() => {
          active.splice(active.indexOf(p), 1);
        });
        active.push(p);
        if (active.length >= limit) {
          await Promise.race(active);
        }
      }
      await Promise.all(active);
    };

    const tasks = batchCustomers.map((customer) => async () => {
      try {
        const personalizedVars = await CampaignService.resolvePersonalizedVars(customer, campaign);

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

        // Add dynamic button parameters if template contains dynamic URL buttons
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
                  { type: 'text', text: customer.phone }
                ]
              });
            }
          }
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
              customerId: customer.phone,
              phone: customer.phone,
              messageType: 'marketing',
              templateUsed: campaign.templateName,
              status: 'sent',
              whatsappMessageId: result.data?.messages?.[0]?.id || ''
            }
          });
          sentCount++;

          const effectiveBonus = CampaignService.getEffectiveBonusPoints(campaign);
          if (effectiveBonus > 0) {
            const existingTx = await prisma.loyaltyTransaction.findFirst({
              where: {
                phoneNumber: customer.phone,
                campaignId: campaign.id
              }
            });
            if (!existingTx) {
              const expiryDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
              await prisma.loyaltyTransaction.create({
                data: {
                  phoneNumber: customer.phone,
                  type: "BONUS",
                  points: effectiveBonus,
                  expiryDate,
                  isPending: true,
                  campaignId: campaign.id
                }
              });
            }
          }
        } else {
          throw new Error(result.error);
        }
      } catch (error: any) {
        console.error(`[Campaign Batch] Send failed for phone ${customer.phone}:`, error.message);
        await prisma.messageLog.create({
          data: {
            campaignId: campaign.id,
            customerId: customer.phone,
            phone: customer.phone,
            messageType: 'marketing',
            templateUsed: campaign.templateName,
            status: 'failed',
            errorMessage: error.message || 'Unknown WhatsApp API error'
          }
        });
        failedCount++;
      }
    });

    // Run parallel sends with a concurrency limit of 8
    await runWithConcurrencyLimit(tasks, 8);

    // Update campaign counters in a single database roundtrip
    await prisma.campaign.update({
      where: { id: campaign.id },
      data: {
        sent: { increment: sentCount },
        failed: { increment: failedCount }
      }
    });

    const remainingCount = pendingCustomers.length - batchCustomers.length;
    const isCompleted = remainingCount <= 0;

    if (isCompleted) {
      await prisma.campaign.update({
        where: { id: campaign.id },
        data: { status: 'completed', completedAt: new Date() }
      });
    }

    return {
      success: true,
      completed: isCompleted,
      processed: batchCustomers.length,
      sent: sentCount,
      failed: failedCount,
      remaining: remainingCount
    };
  }
}

