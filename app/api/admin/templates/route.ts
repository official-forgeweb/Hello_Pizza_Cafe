import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { WhatsAppService } from "@/lib/services/whatsappService";

export async function GET(request: NextRequest) {
  try {
    const templates = await prisma.whatsAppTemplate.findMany({
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(templates);
  } catch (error) {
    console.error("Error fetching templates:", error);
    return NextResponse.json(
      { error: "Failed to fetch templates" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { templateName, category, language, components } = body;

    if (!templateName || !category || !language || !components) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Call Meta API to create the template
    const metaResult = await WhatsAppService.createTemplate({
      name: templateName,
      category,
      language,
      components,
    });

    if (!metaResult.success) {
      return NextResponse.json(
        { error: metaResult.error || "Failed to create template on Meta" },
        { status: 400 }
      );
    }

    // Extract variables from body component if any
    const bodyComponent = components.find((c: any) => c.type === 'BODY');
    const text = bodyComponent?.text || '';
    const matches = text.match(/\{\{(\d+)\}\}/g);
    const variablesCount = matches ? new Set(matches).size : 0;
    const variables = Array.from({ length: variablesCount }, (_, i) => `Variable ${i + 1}`);

    // Create in local DB
    const metaTemplateId = metaResult.data?.id || null;
    const template = await prisma.whatsAppTemplate.upsert({
      where: { templateName },
      update: {
        category,
        language,
        status: "PENDING", // Newly created starts as pending
        components,
        variables,
        metaTemplateId,
      },
      create: {
        templateName,
        category,
        language,
        status: "PENDING",
        components,
        variables,
        metaTemplateId,
      },
    });

    return NextResponse.json(template, { status: 201 });
  } catch (error: any) {
    console.error("Error creating template:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create template" },
      { status: 500 }
    );
  }
}
