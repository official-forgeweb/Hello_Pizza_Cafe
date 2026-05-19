import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { WhatsAppService } from "@/lib/services/whatsappService";

export async function GET(request: NextRequest) {
  try {
    const result = await WhatsAppService.getTemplates();
    
    if (!result.success || !result.data) {
      return NextResponse.json(
        { error: result.error || "Failed to fetch templates from Meta" },
        { status: 500 }
      );
    }

    let syncedCount = 0;

    for (const metaTemplate of result.data) {
      const { name, category, language, status, components, id: metaTemplateId } = metaTemplate;
      
      // Extract variables from body if any
      const bodyComponent = components.find((c: any) => c.type === 'BODY');
      const text = bodyComponent?.text || '';
      
      // Find matches like {{1}}, {{2}}
      const matches = text.match(/\{\{(\d+)\}\}/g);
      const variablesCount = matches ? new Set(matches).size : 0;
      
      const variables = Array.from({ length: variablesCount }, (_, i) => `Variable ${i + 1}`);

      await prisma.whatsAppTemplate.upsert({
        where: { templateName: name },
        update: {
          category,
          language,
          status,
          components,
          variables,
          metaTemplateId,
          approvedAt: status === 'APPROVED' ? new Date() : null,
        },
        create: {
          templateName: name,
          category,
          language,
          status,
          components,
          variables,
          metaTemplateId,
          approvedAt: status === 'APPROVED' ? new Date() : null,
        }
      });
      syncedCount++;
    }

    return NextResponse.json({
      success: true,
      message: `Successfully synced ${syncedCount} templates.`,
    });
  } catch (error: any) {
    console.error("Error syncing templates:", error);
    return NextResponse.json(
      { error: error.message || "Failed to sync templates" },
      { status: 500 }
    );
  }
}
