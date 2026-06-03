/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const customers = await prisma.customer.findMany({
      select: {
        tags: true,
      },
    });

    const batchCounts: Record<string, number> = {};
    customers.forEach((c) => {
      if (c.tags && Array.isArray(c.tags)) {
        c.tags.forEach((tag) => {
          if (tag) {
            batchCounts[tag] = (batchCounts[tag] || 0) + 1;
          }
        });
      }
    });

    const batches = Object.entries(batchCounts)
      .map(([name, count]) => ({
        name,
        count,
      }))
      .sort((a, b) => a.name.localeCompare(b.name));

    return NextResponse.json(batches);
  } catch (error: any) {
    console.error("Error fetching batches:", error);
    return NextResponse.json(
      { error: "Failed to fetch batches: " + error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tag = searchParams.get("tag");

    if (!tag) {
      return NextResponse.json(
        { error: "Tag name parameter is required" },
        { status: 400 }
      );
    }

    // Find all customers with this tag
    const targetCustomers = await prisma.customer.findMany({
      where: {
        tags: {
          has: tag,
        },
      },
      select: {
        id: true,
        tags: true,
      },
    });

    if (targetCustomers.length === 0) {
      return NextResponse.json({
        success: true,
        message: "No customers found with this tag",
        count: 0,
      });
    }

    // Process updates concurrently in smaller sub-chunks of 30 to avoid Prisma/DB pool exhaustion
    const batchSize = 30;
    let updatedCount = 0;

    for (let i = 0; i < targetCustomers.length; i += batchSize) {
      const chunk = targetCustomers.slice(i, i + batchSize);
      const updates = chunk.map((customer) => {
        const updatedTags = customer.tags.filter((t) => t !== tag);
        return prisma.customer.update({
          where: { id: customer.id },
          data: {
            tags: updatedTags,
          },
        });
      });
      await Promise.all(updates);
      updatedCount += chunk.length;
    }

    return NextResponse.json({
      success: true,
      message: `Successfully removed tag '${tag}' from ${updatedCount} customers.`,
      count: updatedCount,
    });
  } catch (error: any) {
    console.error("Error deleting batch tag:", error);
    return NextResponse.json(
      { error: "Failed to delete batch tag: " + error.message },
      { status: 500 }
    );
  }
}
