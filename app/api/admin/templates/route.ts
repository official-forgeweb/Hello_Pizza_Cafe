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

    // Automatically inject variables example payload for BODY component
    const bodyComponent = components.find((c: any) => c.type === 'BODY');
    if (bodyComponent && bodyComponent.text) {
      const matches = bodyComponent.text.match(/\{\{(\d+)\}\}/g);
      if (matches) {
        // Collect unique variable indices in ascending order
        const uniqueIndices = Array.from(
          new Set<number>(matches.map((m: string) => parseInt(m.replace(/[^0-9]/g, ''), 10)))
        ).sort((a, b) => a - b);

        if (uniqueIndices.length > 0) {
          const examplesList = uniqueIndices.map(idx => {
            if (idx === 1) return "Rahul Sharma"; // Default customer name
            if (idx === 2) return "OD-98214";     // Default order number
            if (idx === 3) return "Amit Kumar (Rider)"; // Default rider name
            if (idx === 4) return "+91 98765 43210";    // Default phone number
            if (idx === 5) return "123 Cafe Street, Faridabad"; // Default address
            return `Sample ${idx}`;
          });

          bodyComponent.example = {
            body_text: [examplesList]
          };
        }
      }
    }

    // Process IMAGE header components: upload to Meta to get a valid handle
    let originalHeaderImageUrl = null;
    const headerComponent = components.find((c: any) => c.type === 'HEADER');
    if (headerComponent && headerComponent.format === 'IMAGE' && headerComponent.example?.header_handle?.[0]) {
      const imageUrl = headerComponent.example.header_handle[0];
      if (imageUrl.startsWith('http')) {
        originalHeaderImageUrl = imageUrl;
        const uploadResult = await WhatsAppService.uploadImageToMeta(imageUrl);
        if (!uploadResult.success) {
          return NextResponse.json(
            { error: "Failed to upload header image to Meta: " + uploadResult.error },
            { status: 400 }
          );
        }
        headerComponent.example.header_handle = [uploadResult.handle];
      }
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

    // Extract variables from body component for local DB storage
    const text = bodyComponent?.text || '';
    const varMatches = text.match(/\{\{(\d+)\}\}/g);
    const variablesCount = varMatches ? new Set(varMatches).size : 0;
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
        headerImageUrl: originalHeaderImageUrl,
      },
      create: {
        templateName,
        category,
        language,
        status: "PENDING",
        components,
        variables,
        metaTemplateId,
        headerImageUrl: originalHeaderImageUrl,
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
