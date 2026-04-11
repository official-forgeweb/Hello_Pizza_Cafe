import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-auth";

export async function GET() {
  try {
    const slides = await prisma.heroSlide.findMany({
      orderBy: { displayOrder: "asc" },
    });
    return NextResponse.json(slides);
  } catch (error) {
    console.error("Failed to fetch hero slides:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireAdmin(request);
  if ("error" in auth) return auth.error;

  try {
    const body = await request.json();
    const { title, description, imageUrl, tag, discount, linkUrl, isActive } = body;

    if (!title || !imageUrl) {
      return NextResponse.json({ error: "Title and image URL are required" }, { status: 400 });
    }

    const maxOrder = await prisma.heroSlide.aggregate({ _max: { displayOrder: true } });
    const nextOrder = (maxOrder._max.displayOrder ?? -1) + 1;

    const slide = await prisma.heroSlide.create({
      data: {
        title,
        description: description || null,
        imageUrl,
        tag: tag || "NEW",
        discount: discount || null,
        linkUrl: linkUrl || null,
        displayOrder: nextOrder,
        isActive: isActive ?? true,
      },
    });

    return NextResponse.json(slide, { status: 201 });
  } catch (error) {
    console.error("Failed to create hero slide:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
