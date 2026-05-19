import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const campaigns = await prisma.campaign.findMany({
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(campaigns);
  } catch (error) {
    console.error("Error fetching campaigns:", error);
    return NextResponse.json(
      { error: "Failed to fetch campaigns" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      name,
      type,
      templateName,
      headerImage,
      bodyParameters,
      targetType,
      targetGroup,
      targetCustomers,
      scheduledAt
    } = body;

    if (!name || !templateName || !targetType) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const campaign = await prisma.campaign.create({
      data: {
        name,
        type: type || 'marketing',
        templateName,
        headerImage,
        bodyParameters: bodyParameters || [],
        targetType,
        targetGroup,
        targetCustomers: targetCustomers || [],
        scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
      }
    });

    return NextResponse.json(campaign, { status: 201 });
  } catch (error) {
    console.error("Error creating campaign:", error);
    return NextResponse.json(
      { error: "Failed to create campaign" },
      { status: 500 }
    );
  }
}
