/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { prefix, customerIds, filters } = body;

    if (!prefix || typeof prefix !== "string" || !prefix.trim()) {
      return NextResponse.json(
        { error: "Valid tag prefix is required" },
        { status: 400 }
      );
    }

    let targetCustomers: { id: string; tags: string[] }[] = [];

    if (Array.isArray(customerIds) && customerIds.length > 0) {
      // Use explicit customer list
      targetCustomers = await prisma.customer.findMany({
        where: {
          id: { in: customerIds },
          whatsappOptIn: true,
        },
        select: {
          id: true,
          tags: true,
        },
        orderBy: { createdAt: "desc" },
      });
    } else if (filters) {
      // Use query filters
      const { q, group, optIn, marketingStatus, tag, createdDate, minSpent, maxSpent, minDays, maxDays } = filters;
      const whereClause: any = {
        whatsappOptIn: true, // Only tag opted-in customers for marketing
      };

      if (q?.trim()) {
        const searchQuery = q.trim();
        whereClause.OR = [
          { name: { contains: searchQuery, mode: "insensitive" as const } },
          { phone: { contains: searchQuery } },
          { email: { contains: searchQuery, mode: "insensitive" as const } },
        ];
      }

      if (group && group !== "all") {
        whereClause.group = group;
      }

      if (optIn === 'true') {
        whereClause.whatsappOptIn = true;
      } else if (optIn === 'false') {
        whereClause.whatsappOptIn = false;
      }

      if (marketingStatus === "never_sent") {
        whereClause.messageLogs = {
          none: {
            messageType: "marketing",
          },
        };
      } else if (marketingStatus === "sent") {
        whereClause.messageLogs = {
          some: {
            messageType: "marketing",
          },
        };
      }

      if (tag && tag !== "all") {
        whereClause.tags = {
          has: tag,
        };
      }

      if (createdDate === "today") {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        whereClause.createdAt = { gte: today };
      } else if (createdDate === "yesterday") {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        yesterday.setHours(0, 0, 0, 0);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        whereClause.createdAt = { gte: yesterday, lt: today };
      } else if (createdDate === "week") {
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        whereClause.createdAt = { gte: weekAgo };
      }

      // Filter by totalSpent range
      if (minSpent !== undefined || maxSpent !== undefined) {
        const minVal = minSpent !== undefined ? parseFloat(minSpent) : 0;
        const maxVal = maxSpent !== undefined ? parseFloat(maxSpent) : null;
        
        whereClause.totalSpent = {};
        if (minVal > 0) {
          whereClause.totalSpent.gte = minVal;
        }
        if (maxVal !== null && maxVal < 20000) {
          whereClause.totalSpent.lte = maxVal;
        }
        if (Object.keys(whereClause.totalSpent).length === 0) {
          delete whereClause.totalSpent;
        }
      }

      // Filter by lastOrderDate recency range (days since last order)
      if (minDays !== undefined || maxDays !== undefined) {
        const minD = minDays !== undefined ? parseInt(minDays) : 0;
        const maxD = maxDays !== undefined ? parseInt(maxDays) : null;
        
        const now = new Date();
        whereClause.lastOrderDate = {};
        
        if (minD > 0) {
          const maxDate = new Date(now);
          maxDate.setDate(maxDate.getDate() - minD);
          whereClause.lastOrderDate.lte = maxDate;
        }
        if (maxD !== null && maxD < 365) {
          const minDate = new Date(now);
          minDate.setDate(minDate.getDate() - maxD);
          whereClause.lastOrderDate.gte = minDate;
        }
        if (Object.keys(whereClause.lastOrderDate).length === 0) {
          delete whereClause.lastOrderDate;
        }
      }

      targetCustomers = await prisma.customer.findMany({
        where: whereClause,
        select: {
          id: true,
          tags: true,
        },
        orderBy: { createdAt: "desc" },
      });
    }

    if (targetCustomers.length === 0) {
      return NextResponse.json(
        { error: "No opted-in customers found matching the criteria" },
        { status: 400 }
      );
    }

    const batchSize = 300;
    const generatedTags: string[] = [];
    let taggedCount = 0;

    // Chunk customers into batches of 300
    for (let i = 0; i < targetCustomers.length; i += batchSize) {
      const chunk = targetCustomers.slice(i, i + batchSize);
      const batchNum = Math.floor(i / batchSize) + 1;
      const tagName = `${prefix.trim()}-${batchNum}`;
      generatedTags.push(tagName);

      // Process updates concurrently in smaller sub-chunks of 30 to avoid Prisma/DB pool exhaustion
      const subBatchSize = 30;
      for (let j = 0; j < chunk.length; j += subBatchSize) {
        const subChunk = chunk.slice(j, j + subBatchSize);
        const subUpdates = subChunk.map((customer) => {
          const updatedTags = Array.from(new Set([...customer.tags, tagName]));
          return prisma.customer.update({
            where: { id: customer.id },
            data: {
              tags: updatedTags,
            },
          });
        });
        await Promise.all(subUpdates);
      }
      taggedCount += chunk.length;
    }

    return NextResponse.json({
      success: true,
      message: `Successfully grouped ${taggedCount} customers into ${generatedTags.length} batches of 300.`,
      stats: {
        totalTagged: taggedCount,
        batchesCreated: generatedTags.length,
        tags: generatedTags,
      },
    });
  } catch (error: any) {
    console.error("Error generating batch tags:", error);
    return NextResponse.json(
      { error: "Failed to generate batch tags: " + error.message },
      { status: 500 }
    );
  }
}
