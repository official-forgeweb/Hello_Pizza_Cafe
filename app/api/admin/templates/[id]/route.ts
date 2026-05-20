import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { WhatsAppService } from "@/lib/services/whatsappService";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // 1. Find the template in local database to get its name
    const template = await prisma.whatsAppTemplate.findUnique({
      where: { id },
    });

    if (!template) {
      return NextResponse.json(
        { error: "Template not found in database" },
        { status: 404 }
      );
    }

    // 2. Try to delete the template from Meta
    const metaResult = await WhatsAppService.deleteTemplate(template.templateName);

    if (!metaResult.success) {
      console.warn(`Failed to delete template '${template.templateName}' from Meta: ${metaResult.error}. Proceeding to delete from database.`);
    }

    // 3. Delete the template from the database
    await prisma.whatsAppTemplate.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: `Template '${template.templateName}' deleted successfully from database.`,
    });
  } catch (error: any) {
    console.error("Error deleting template:", error);
    return NextResponse.json(
      { error: error.message || "Failed to delete template" },
      { status: 500 }
    );
  }
}
