import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q")?.trim() || "";

    const whereClause = query
      ? {
          OR: [
            { name: { contains: query, mode: "insensitive" as const } },
            { phone: { contains: query } },
            { email: { contains: query, mode: "insensitive" as const } },
          ],
        }
      : {};

    const customers = await prisma.customer.findMany({
      where: whereClause,
      orderBy: { createdAt: "desc" },
      include: {
        orders: {
          select: {
            id: true,
            totalAmount: true,
            status: true,
          },
        },
      },
    });

    // Transform to include computed fields
    const result = customers.map((customer) => {
      const completedOrders = customer.orders.filter(
        (o) => o.status !== "CANCELLED"
      );
      return {
        id: customer.id,
        name: customer.name,
        phone: customer.phone,
        email: customer.email,
        address: customer.address,
        createdAt: customer.createdAt,
        updatedAt: customer.updatedAt,
        totalOrders: customer.orders.length,
        completedOrders: completedOrders.length,
        totalSpend: completedOrders.reduce(
          (sum, o) => sum + Number(o.totalAmount),
          0
        ),
      };
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error fetching customers:", error);
    return NextResponse.json(
      { error: "Failed to fetch customers" },
      { status: 500 }
    );
  }
}
