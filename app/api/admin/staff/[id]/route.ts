import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-auth";

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin(request);
  if ("error" in auth) return auth.error;

  try {
    const { id } = await params;
    const body = await request.json();

    const staff = await prisma.staff.update({
      where: { id },
      data: {
        name: body.name,
        phone: body.phone,
        email: body.email ?? null,
        role: body.role,
        avatar: body.avatar ?? null,
        isActive: body.isActive,
      },
    });

    return NextResponse.json(staff);
  } catch (error) {
    console.error("Failed to update staff:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin(request);
  if ("error" in auth) return auth.error;

  try {
    const { id } = await params;
    await prisma.staff.update({
      where: { id },
      data: { isActive: false },
    });
    return NextResponse.json({ message: "Staff deactivated" });
  } catch (error) {
    console.error("Failed to deactivate staff:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
