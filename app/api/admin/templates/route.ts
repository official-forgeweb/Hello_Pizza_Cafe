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

    let processedComponents = components;

    if (category === "AUTHENTICATION") {
      processedComponents = [];

      // 1. Process Body component
      const origBody = components.find((c: any) => c.type === 'BODY');
      const addSecurity = origBody ? (origBody.text.includes("security") || origBody.text.includes("do not share")) : true;
      processedComponents.push({
        type: "BODY",
        add_security_recommendation: addSecurity
      });

      // 2. Process Footer component
      const origFooter = components.find((c: any) => c.type === 'FOOTER');
      let codeExpirationMinutes = 5; // default fallback
      if (origFooter && origFooter.text) {
        const match = origFooter.text.match(/(\d+)/);
        if (match) {
          codeExpirationMinutes = parseInt(match[1], 10);
        }
      }
      processedComponents.push({
        type: "FOOTER",
        code_expiration_minutes: codeExpirationMinutes
      });

      // 3. Process Buttons component
      const origButtons = components.find((c: any) => c.type === 'BUTTONS');
      const buttonText = (origButtons && origButtons.buttons?.[0]?.text) || "Copy Code";
      processedComponents.push({
        type: "BUTTONS",
        buttons: [
          {
            type: "OTP",
            otp_type: "COPY_CODE",
            text: buttonText
          }
        ]
      });
    } else {
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
            const isLoyalty = templateName.toLowerCase().includes("loyalty");
            const examplesList = uniqueIndices.map(idx => {
              const lowerTemplateName = templateName.toLowerCase();
              if (lowerTemplateName.includes("otp") || lowerTemplateName.includes("verify")) {
                if (idx === 1) return "123456"; // 6-digit numeric OTP example
              } else if (lowerTemplateName.includes("redeem") || lowerTemplateName.includes("deduct")) {
                if (idx === 1) return "150";        // Points redeemed
                if (idx === 2) return "350";        // Remaining balance
                if (idx === 3) return "2026-07-22"; // Expiry date
              } else if (lowerTemplateName.includes("points_credit")) {
                if (idx === 1) return "500";          // Points amount
                if (idx === 2) return "2026-07-16";   // Expiry date
                if (idx === 3) return "Special Loyalty Bonus"; // Credit message/reason
              } else if (isLoyalty) {
                if (idx === 1) return "Rahul Sharma"; // Customer name
                if (idx === 2) return "500";          // Points amount
                if (idx === 3) return "2026-07-16";   // Expiry date
                if (idx === 4) return "Special Loyalty Bonus"; // Credit message/reason
              } else {
                if (idx === 1) return "Rahul Sharma"; // Default customer name
                if (idx === 2) return "OD-98214";     // Default order number
                if (idx === 3) return "Amit Kumar (Rider)"; // Default rider name
                if (idx === 4) return "+91 98765 43210";    // Default phone number
                if (idx === 5) return "123 Cafe Street, Faridabad"; // Default address
              }
              return `Sample ${idx}`;
            });

            bodyComponent.example = {
              body_text: [examplesList]
            };
          }
        }
      }
    }

    // Automatically inject examples for dynamic URL buttons
    const buttonsComponent = processedComponents.find((c: any) => c.type === 'BUTTONS');
    if (buttonsComponent && Array.isArray(buttonsComponent.buttons)) {
      buttonsComponent.buttons.forEach((btn: any) => {
        if (btn.type === 'URL' && btn.url && btn.url.includes('{{1}}') && !btn.example) {
          btn.example = [btn.url.replace('{{1}}', '919873123360')];
        }
      });
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
      components: processedComponents,
    });

    // Subcode 2388024 indicates the template already exists in this language on Meta
    const isAlreadyExists = metaResult.rawError?.error_subcode === 2388024 ||
                            metaResult.rawError?.message?.includes("Already Exists") ||
                            metaResult.error?.includes("Already Exists") ||
                            (metaResult.rawError?.error_user_title && metaResult.rawError.error_user_title.includes("Already Exists"));

    if (!metaResult.success && !isAlreadyExists) {
      return NextResponse.json(
        { error: metaResult.error || "Failed to create template on Meta" },
        { status: 400 }
      );
    }

    // Extract variables from body component for local DB storage
    let variables: string[] = [];
    if (category === "AUTHENTICATION") {
      variables = ["OTP Code"];
    } else {
      const origBodyComponent = components.find((c: any) => c.type === 'BODY');
      const text = origBodyComponent?.text || '';
      const varMatches = text.match(/\{\{(\d+)\}\}/g);
      const variablesCount = varMatches ? new Set(varMatches).size : 0;
      variables = Array.from({ length: variablesCount }, (_, i) => `Variable ${i + 1}`);
    }

    // Create or update in local DB
    const existingTemplate = await prisma.whatsAppTemplate.findUnique({
      where: { templateName },
    });
    const metaTemplateId = metaResult.data?.id || existingTemplate?.metaTemplateId || null;
    const template = await prisma.whatsAppTemplate.upsert({
      where: { templateName },
      update: {
        category,
        language,
        status: isAlreadyExists ? (existingTemplate?.status || "APPROVED") : "PENDING",
        components: processedComponents,
        variables,
        metaTemplateId,
        headerImageUrl: originalHeaderImageUrl,
      },
      create: {
        templateName,
        category,
        language,
        status: isAlreadyExists ? "APPROVED" : "PENDING",
        components: processedComponents,
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
