import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

import { requireAdmin } from "@/lib/admin-auth";

export async function GET() {
  try {
    const ads = await prisma.splashAd.findMany({
      orderBy: { displayOrder: "asc" },
    });
    return NextResponse.json(ads, {
      headers: {
        "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
      },
    });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch splash ads" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireAdmin(request);
  if ("error" in auth) return auth.error;

  try {
    const body = await request.json();
    const ad = await prisma.splashAd.create({
      data: {
        title: body.title,
        subtitle: body.subtitle,
        code: body.code,
        linkUrl: body.linkUrl ?? null,
        imageUrl: body.imageUrl,
        gradient: body.gradient || "from-orange-600 to-red-600",
        displayOrder: body.displayOrder || 0,
        isActive: body.isActive ?? true,
      },
    });
    return NextResponse.json(ad);
  } catch (error) {
    return NextResponse.json({ error: "Failed to create splash ad" }, { status: 500 });
  }
}
