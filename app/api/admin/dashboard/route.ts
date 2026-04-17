import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // Today's stats
    const [todayOrders, todayRevenue, totalOrders, activeStaff, pendingOrders, totalCustomers] = await Promise.all([
      prisma.order.count({ where: { placedAt: { gte: todayStart } } }),
      prisma.order.aggregate({
        where: { placedAt: { gte: todayStart }, status: { not: "CANCELLED" } },
        _sum: { totalAmount: true },
      }),
      prisma.order.count(),
      prisma.staff.count({ where: { isActive: true } }),
      prisma.order.count({ where: { status: "PENDING" } }),
      prisma.customer.count(),
    ]);

    // Last 7 days revenue for chart
    const dailyRevenue = [];
    for (let i = 6; i >= 0; i--) {
      const dayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
      const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);

      const rev = await prisma.order.aggregate({
        where: {
          placedAt: { gte: dayStart, lt: dayEnd },
          status: { not: "CANCELLED" },
        },
        _sum: { totalAmount: true },
        _count: true,
      });

      dailyRevenue.push({
        date: dayStart.toISOString().split("T")[0],
        day: dayStart.toLocaleDateString("en-IN", { weekday: "short" }),
        revenue: Number(rev._sum.totalAmount || 0),
        orders: rev._count,
      });
    }

    // Top selling items
    const topItems = await prisma.orderItem.groupBy({
      by: ["itemName"],
      _sum: { itemTotal: true, quantity: true },
      orderBy: { _sum: { quantity: "desc" } },
      take: 5,
    });

    // Recent orders
    const recentOrders = await prisma.order.findMany({
      take: 5,
      orderBy: { placedAt: "desc" },
      select: {
        id: true,
        orderNumber: true,
        customerName: true,
        totalAmount: true,
        status: true,
        placedAt: true,
        items: { select: { id: true } },
      },
    });

    // Status distribution
    const statusCounts = await prisma.order.groupBy({
      by: ["status"],
      _count: true,
    });

    return NextResponse.json({
      stats: {
        todayOrders,
        todayRevenue: Number(todayRevenue._sum.totalAmount || 0),
        totalOrders,
        activeStaff,
        pendingOrders,
        totalCustomers,
        avgOrderValue: todayOrders > 0 ? Math.round(Number(todayRevenue._sum.totalAmount || 0) / todayOrders) : 0,
      },
      dailyRevenue,
      topItems: topItems.map((item) => ({
        name: item.itemName,
        orders: Number(item._sum.quantity || 0),
        revenue: Number(item._sum.itemTotal || 0),
      })),
      recentOrders: recentOrders.map((o) => ({
        id: o.orderNumber,
        customer: o.customerName,
        items: o.items.length,
        total: Number(o.totalAmount),
        status: o.status,
        time: o.placedAt.toISOString(),
      })),
      statusCounts: Object.fromEntries(statusCounts.map((s) => [s.status, s._count])),
    });
  } catch (error) {
    console.error("Dashboard API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
