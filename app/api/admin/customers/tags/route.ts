import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const customers = await prisma.customer.findMany({
      select: {
        tags: true,
      },
    });

    const allTags = new Set<string>();
    customers.forEach((c) => {
      if (c.tags && Array.isArray(c.tags)) {
        c.tags.forEach((tag) => {
          if (tag) allTags.add(tag);
        });
      }
    });

    return NextResponse.json(Array.from(allTags).sort());
  } catch (error: any) {
    console.error("Error fetching unique tags:", error);
    return NextResponse.json(
      { error: "Failed to fetch tags: " + error.message },
      { status: 500 }
    );
  }
}
