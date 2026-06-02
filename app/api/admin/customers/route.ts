/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    console.log("API GET /api/admin/customers called with:", searchParams.toString());
    const query = searchParams.get("q")?.trim() || searchParams.get("search")?.trim() || "";
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "24");
    const group = searchParams.get("group") || "all";
    const optIn = searchParams.get("optIn");
    const marketingStatus = searchParams.get("marketingStatus") || "all";
    const tag = searchParams.get("tag") || "all";
    const createdDate = searchParams.get("createdDate") || "all";
    const minSpentParam = searchParams.get("minSpent");
    const maxSpentParam = searchParams.get("maxSpent");
    const minDaysParam = searchParams.get("minDays");
    const maxDaysParam = searchParams.get("maxDays");

    const skip = (page - 1) * limit;

    const whereClause: any = query
      ? {
          OR: [
            { name: { contains: query, mode: "insensitive" as const } },
            { phone: { contains: query } },
            { email: { contains: query, mode: "insensitive" as const } },
          ],
        }
      : {};

    if (group && group !== "all") {
      whereClause.group = group;
    }

    if (optIn === 'true') {
      whereClause.whatsappOptIn = true;
    } else if (optIn === 'false') {
      whereClause.whatsappOptIn = false;
    }

    // Filter by marketing message log status
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

    // Filter by customer tags
    if (tag && tag !== "all") {
      whereClause.tags = {
        has: tag,
      };
    }

    // Filter by createdAt date range
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
    if (minSpentParam || maxSpentParam) {
      const minSpent = minSpentParam ? parseFloat(minSpentParam) : 0;
      const maxSpent = maxSpentParam ? parseFloat(maxSpentParam) : null;
      
      whereClause.totalSpent = {};
      if (minSpent > 0) {
        whereClause.totalSpent.gte = minSpent;
      }
      if (maxSpent !== null && maxSpent < 20000) {
        whereClause.totalSpent.lte = maxSpent;
      }
      if (Object.keys(whereClause.totalSpent).length === 0) {
        delete whereClause.totalSpent;
      }
    }

    // Filter by lastOrderDate recency range (days since last order)
    if (minDaysParam || maxDaysParam) {
      const minDays = minDaysParam ? parseInt(minDaysParam) : 0;
      const maxDays = maxDaysParam ? parseInt(maxDaysParam) : null;
      
      const now = new Date();
      whereClause.lastOrderDate = {};
      
      if (minDays > 0) {
        const maxDate = new Date(now);
        maxDate.setDate(maxDate.getDate() - minDays);
        whereClause.lastOrderDate.lte = maxDate;
      }
      if (maxDays !== null && maxDays < 365) {
        const minDate = new Date(now);
        minDate.setDate(minDate.getDate() - maxDays);
        whereClause.lastOrderDate.gte = minDate;
      }
      if (Object.keys(whereClause.lastOrderDate).length === 0) {
        delete whereClause.lastOrderDate;
      }
    }

    // Fetch paginated customers + global aggregate stats in parallel (excluding the expensive orders relation join)
    let customers: any[] = [];
    let total = 0;
    let optedInCount = 0;
    let totalRevenue = 0;
    let avgOrders = 0;

    if (page === 1) {
      const [dbCustomers, dbTotal, dbOptedInCount, revenueAgg, ordersAgg] = await Promise.all([
        prisma.customer.findMany({
          where: whereClause,
          orderBy: { createdAt: "desc" },
          skip,
          take: limit,
        }),
        prisma.customer.count({ where: whereClause }),
        // Global stats: count opted-in customers (matching current filters)
        prisma.customer.count({ where: { ...whereClause, whatsappOptIn: true } }),
        // Global stats: sum of totalSpent across all matching customers
        prisma.customer.aggregate({
          where: whereClause,
          _sum: { totalSpent: true },
        }),
        // Global stats: average totalOrders across all matching customers
        prisma.customer.aggregate({
          where: whereClause,
          _avg: { totalOrders: true },
        }),
      ]);
      customers = dbCustomers;
      total = dbTotal;
      optedInCount = dbOptedInCount;
      totalRevenue = Number(revenueAgg._sum.totalSpent || 0);
      avgOrders = Number((ordersAgg._avg.totalOrders || 0).toFixed(1));
    } else {
      const [dbCustomers, dbTotal] = await Promise.all([
        prisma.customer.findMany({
          where: whereClause,
          orderBy: { createdAt: "desc" },
          skip,
          take: limit,
        }),
        prisma.customer.count({ where: whereClause }),
      ]);
      customers = dbCustomers;
      total = dbTotal;
    }

    // Transform using fast denormalized columns direct from database
    const result = customers.map((customer) => ({
      id: customer.id,
      name: customer.name,
      phone: customer.phone,
      email: customer.email,
      address: customer.address,
      whatsappOptIn: customer.whatsappOptIn,
      group: customer.group,
      tags: customer.tags,
      createdAt: customer.createdAt,
      updatedAt: customer.updatedAt,
      totalOrders: customer.totalOrders,
      completedOrders: customer.totalOrders,
      totalSpend: Number(customer.totalSpent || 0),
      lastOrderDate: customer.lastOrderDate,
    }));

    return NextResponse.json({
      customers: result,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      },
      stats: page === 1 ? {
        totalCustomers: total,
        optedInCount,
        totalRevenue,
        avgOrders,
      } : null
    });
  } catch (error) {
    console.error("Error fetching customers:", error);
    return NextResponse.json(
      { error: "Failed to fetch customers" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { group } = body;

    const whereClause: any = {};
    if (group && group !== "all") {
      whereClause.group = group;
    }

    const result = await prisma.customer.updateMany({
      where: whereClause,
      data: {
        whatsappOptIn: true
      }
    });

    return NextResponse.json({ success: true, count: result.count });
  } catch (error: any) {
    console.error("Error bulk updating customers:", error);
    return NextResponse.json(
      { error: "Failed to bulk update customers: " + error.message },
      { status: 500 }
    );
  }
}
