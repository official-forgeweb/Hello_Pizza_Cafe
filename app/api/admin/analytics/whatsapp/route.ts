import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [
      totalSentToday,
      totalDeliveredToday,
      totalFailedToday,
      campaignsActive,
      recentMessages
    ] = await Promise.all([
      prisma.messageLog.count({
        where: { createdAt: { gte: today }, status: { in: ['sent', 'delivered', 'read'] } }
      }),
      prisma.messageLog.count({
        where: { createdAt: { gte: today }, status: { in: ['delivered', 'read'] } }
      }),
      prisma.messageLog.count({
        where: { createdAt: { gte: today }, status: 'failed' }
      }),
      prisma.campaign.count({
        where: { status: 'sending' }
      }),
      prisma.messageLog.findMany({
        orderBy: { createdAt: 'desc' },
        take: 10,
        include: {
          customer: { select: { name: true, phone: true } },
          campaign: { select: { name: true } }
        }
      })
    ]);

    // Calculate overall delivery rate
    const totalMessages = await prisma.messageLog.count();
    const deliveredMessages = await prisma.messageLog.count({
      where: { status: { in: ['delivered', 'read'] } }
    });
    
    const deliveryRate = totalMessages > 0 
      ? Math.round((deliveredMessages / totalMessages) * 100) 
      : 0;

    return NextResponse.json({
      todayStats: {
        sent: totalSentToday,
        delivered: totalDeliveredToday,
        failed: totalFailedToday
      },
      campaignsActive,
      deliveryRate,
      recentMessages
    });
  } catch (error) {
    console.error("Error fetching analytics:", error);
    return NextResponse.json(
      { error: "Failed to fetch analytics" },
      { status: 500 }
    );
  }
}
