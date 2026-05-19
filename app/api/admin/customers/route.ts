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

    const [customers, total] = await Promise.all([
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
      prisma.customer.count({ where: whereClause })
    ]);

    // Transform to include computed fields
    const result = customers.map((customer) => {
      const completedOrders = customer.orders.filter(
        (o) => o.status !== "CANCELLED"
      );
      
      // Use DB totalSpent if available, otherwise compute
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
