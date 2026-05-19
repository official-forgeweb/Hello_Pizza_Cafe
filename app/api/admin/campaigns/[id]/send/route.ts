import { NextRequest, NextResponse } from "next/server";
import { CampaignService } from "@/lib/services/campaignService";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
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
      message: `Campaign started for ${result.recipientsCount} recipients.`
    });
  } catch (error: any) {
    console.error("Error executing campaign:", error);
    return NextResponse.json(
      { error: error.message || "Failed to execute campaign" },
      { status: 500 }
    );
  }
}
