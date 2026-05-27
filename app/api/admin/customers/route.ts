import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q")?.trim() || searchParams.get("search")?.trim() || "";
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");
    const group = searchParams.get("group") || "all";
    const optIn = searchParams.get("optIn");

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

    // Fetch paginated customers + global aggregate stats in parallel
    const [customers, total, optedInCount, revenueAgg, ordersAgg] = await Promise.all([
      prisma.customer.findMany({
        where: whereClause,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
        include: {
          orders: {
            select: {
              id: true,
              totalAmount: true,
              status: true,
            },
          },
        },
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

    // Transform to include computed fields
    const result = customers.map((customer) => {
      const completedOrders = customer.orders.filter(
        (o) => o.status !== "CANCELLED"
      );
      
      // Use DB totalSpent if available, otherwise compute from orders
      const calculatedSpend = completedOrders.reduce(
        (sum, o) => sum + Number(o.totalAmount),
        0
      );
      
      return {
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
        totalOrders: customer.totalOrders > 0 ? customer.totalOrders : customer.orders.length,
        completedOrders: completedOrders.length,
        totalSpend: Number(customer.totalSpent) > 0 ? Number(customer.totalSpent) : calculatedSpend,
        lastOrderDate: customer.lastOrderDate,
      };
    });

    return NextResponse.json({
      customers: result,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      },
      stats: {
        totalCustomers: total,
        optedInCount,
        totalRevenue: Number(revenueAgg._sum.totalSpent || 0),
        avgOrders: Number((ordersAgg._avg.totalOrders || 0).toFixed(1)),
      }
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
