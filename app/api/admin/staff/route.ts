import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-auth";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const role = searchParams.get("role");

    const staff = await prisma.staff.findMany({
      where: {
        ...(role && role !== "ALL" ? { role: role as any } : {}),
      },
      orderBy: { createdAt: "desc" },
      include: {
        _count: { select: { assignedOrders: true } },
      },
    });

    return NextResponse.json(staff);
  } catch (error) {
    console.error("Failed to fetch staff:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireAdmin(request);
  if ("error" in auth) return auth.error;

  try {
    const body = await request.json();
    const { name, phone, email, role, avatar } = body;

    if (!name || !phone) {
      return NextResponse.json({ error: "Name and phone are required" }, { status: 400 });
    }

    const staff = await prisma.staff.create({
      data: {
        name,
        phone,
        email: email || null,
        role: role || "DELIVERY",
        avatar: avatar || null,
      },
    });

    return NextResponse.json(staff, { status: 201 });
  } catch (error) {
    console.error("Failed to create staff:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
