import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-auth";

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin(request);
  if ("error" in auth) return auth.error;

  try {
    const { id } = await params;
    const body = await request.json();

    const slide = await prisma.heroSlide.update({
      where: { id },
      data: {
        title: body.title,
        description: body.description ?? null,
        imageUrl: body.imageUrl,
        tag: body.tag,
        discount: body.discount ?? null,
        linkUrl: body.linkUrl ?? null,
        displayOrder: body.displayOrder,
        isActive: body.isActive,
      },
    });

    return NextResponse.json(slide);
  } catch (error) {
    console.error("Failed to update hero slide:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin(request);
  if ("error" in auth) return auth.error;

  try {
    const { id } = await params;
    await prisma.heroSlide.delete({ where: { id } });
    return NextResponse.json({ message: "Deleted" });
  } catch (error) {
    console.error("Failed to delete hero slide:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
