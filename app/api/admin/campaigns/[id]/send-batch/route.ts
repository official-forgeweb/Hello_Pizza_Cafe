import { NextRequest, NextResponse } from "next/server";
import { CampaignService } from "@/lib/services/campaignService";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // Process next batch (50 recipients at a time)
    const result = await CampaignService.sendCampaignBatch(id, 50);
    
    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("Error sending campaign batch:", error);
    return NextResponse.json(
      { error: error.message || "Failed to process campaign batch" },
      { status: 500 }
    );
  }
}
