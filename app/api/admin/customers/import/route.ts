import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { ExcelParserService } from "@/lib/services/excelParser";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    
    // Parse the file
    const result = ExcelParserService.parseContactsFile(buffer);
    
    if (result.validContacts.length === 0) {
      return NextResponse.json(
        { error: "No valid contacts found in the file", errors: result.errors },
        { status: 400 }
      );
    }

    // Upsert customers
    let imported = 0;
    let updated = 0;
    
    for (const contact of result.validContacts) {
      const existing = await prisma.customer.findUnique({
        where: { phone: contact.phone }
      });
      
      if (existing) {
        // Update tags if needed, preserving existing ones
        const newTags = Array.from(new Set([...existing.tags, ...(contact.tags || [])]));
        
        await prisma.customer.update({
          where: { id: existing.id },
          data: {
            name: contact.name, // optionally update name
            email: contact.email || existing.email,
            tags: newTags,
            whatsappOptIn: true // Assume implicit opt-in for marketing imports
          }
        });
        updated++;
      } else {
        await prisma.customer.create({
          data: {
            name: contact.name,
            phone: contact.phone,
            email: contact.email,
            tags: contact.tags || [],
            whatsappOptIn: true,
            group: 'regular'
          }
        });
        imported++;
      }
    }

    return NextResponse.json({
      success: true,
      message: `Import complete. Added ${imported} new contacts and updated ${updated} existing ones.`,
      stats: {
        totalRows: result.totalRows,
        imported,
        updated,
        errors: result.errors
      }
    });

  } catch (error: any) {
    console.error("Import error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to process import" },
      { status: 500 }
    );
  }
}
