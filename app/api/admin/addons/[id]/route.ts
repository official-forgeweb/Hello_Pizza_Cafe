import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-auth";

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin(request);
  if ("error" in auth) return auth.error;

  try {
    const { id } = await params;
    const body = await request.json();
    const addon = await prisma.addOn.update({
      where: { id },
      data: {
        name: body.name,
        description: body.description ?? null,
        price: body.price,
        addonGroup: body.addonGroup,
        itemType: body.itemType,
        isAvailable: body.isAvailable,
        displayOrder: body.displayOrder,
      },
    });
    return NextResponse.json(addon);
  } catch (error) {
    console.error("Failed to update addon:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin(request);
  if ("error" in auth) return auth.error;

  try {
    const { id } = await params;
    await prisma.addOn.delete({ where: { id } });
    return NextResponse.json({ message: "Deleted" });
  } catch (error) {
    console.error("Failed to delete addon:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
