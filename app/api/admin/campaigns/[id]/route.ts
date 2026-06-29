import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const { searchParams } = new URL(request.url);
    const q = searchParams.get("q") || "";

    const campaign = await prisma.campaign.findUnique({
      where: { id },
      include: {
        messageLogs: {
          where: q.trim() ? {
            phone: {
              contains: q.trim(),
              mode: "insensitive"
            }
          } : undefined,
          select: {
            id: true,
            phone: true,
            status: true,
            errorMessage: true,
            createdAt: true,
            sentAt: true
          },
          orderBy: { createdAt: "desc" },
          take: 100 // Get up to 100 logs for review
        }
      }
    });

    if (!campaign) {
      return NextResponse.json(
        { error: "Campaign not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(campaign);
  } catch (error) {
    const err = error as Error;
    console.error("Error fetching campaign:", err);
    return NextResponse.json(
      { error: err.message || "Failed to fetch campaign details" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Delete associated message logs first
    await prisma.messageLog.deleteMany({
      where: { campaignId: id }
    });

    // Delete the campaign
    await prisma.campaign.delete({
      where: { id }
    });

    return NextResponse.json({ success: true, message: "Campaign deleted successfully" });
  } catch (error) {
    const err = error as Error;
    console.error("Error deleting campaign:", err);
    return NextResponse.json(
      { error: err.message || "Failed to delete campaign" },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const action = searchParams.get("action");

    const { CampaignService } = await import("@/lib/services/campaignService");

    if (action === "send-batch") {
      // Process next batch (15 recipients at a time)
      const result = await CampaignService.sendCampaignBatch(id, 15);
      if (!result.success) {
        return NextResponse.json(
          { error: result.error },
          { status: 400 }
        );
      }
      return NextResponse.json(result);
    } else if (action === "send") {
      // Execute campaign
      const result = await CampaignService.executeCampaign(id);
      if (!result.success) {
        return NextResponse.json(
          { error: result.error },
          { status: 400 }
        );
      }
      return NextResponse.json({ 
        success: true, 
        message: `Campaign started for ${result.recipientsCount} recipients.`,
        needsClientDriving: result.needsClientDriving,
        recipientsCount: result.recipientsCount
      });
    } else {
      return NextResponse.json(
        { error: "Invalid action parameter" },
        { status: 400 }
      );
    }
  } catch (error: any) {
    console.error("Error processing campaign action:", error);
    return NextResponse.json(
      { error: error.message || "Failed to process campaign action" },
      { status: 500 }
    );
  }
}

