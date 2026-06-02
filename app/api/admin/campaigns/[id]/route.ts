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
