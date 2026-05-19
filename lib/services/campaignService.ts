import prisma from '../prisma';
import { QueueService } from './queueService';

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

    // 4. Queue messages
    for (const customer of targetCustomers) {
      // In a real scenario we might personalize variables here per customer
      // e.g. mapping `{{1}}` to `customer.name` if the campaign defines it that way.
      // For now, we'll just pass the static parameters provided in the campaign.
      
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
        headerImageUrl: campaign.headerImage || undefined,
        buttonUrl: campaign.buttonUrl || undefined
      });
    }

    return { success: true, recipientsCount: targetCustomers.length };
  }
}
