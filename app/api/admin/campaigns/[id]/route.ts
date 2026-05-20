import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const campaign = await prisma.campaign.findUnique({
      where: { id },
      include: {
        messageLogs: {
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
  } catch (error: any) {
    console.error("Error fetching campaign:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch campaign details" },
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
  } catch (error: any) {
    console.error("Error deleting campaign:", error);
    return NextResponse.json(
      { error: error.message || "Failed to delete campaign" },
      { status: 500 }
    );
  }
}
