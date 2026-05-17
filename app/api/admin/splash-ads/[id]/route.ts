import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

import { requireAdmin } from "@/lib/admin-auth";

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin(request);
  if ("error" in auth) return auth.error;

  try {
    const { id } = await params;
    const body = await request.json();

    const ad = await prisma.splashAd.update({
      where: { id },
      data: {
        title: body.title,
        subtitle: body.subtitle,
        code: body.code,
        linkUrl: body.linkUrl ?? null,
        imageUrl: body.imageUrl,
        gradient: body.gradient,
        displayOrder: body.displayOrder,
        isActive: body.isActive,
      },
    });

    return NextResponse.json(ad);
  } catch (error) {
    return NextResponse.json({ error: "Failed to update splash ad" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin(request);
  if ("error" in auth) return auth.error;

  try {
    const { id } = await params;
    await prisma.splashAd.delete({ where: { id } });
    return NextResponse.json({ message: "Splash ad deleted" });
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete splash ad" }, { status: 500 });
  }
}
