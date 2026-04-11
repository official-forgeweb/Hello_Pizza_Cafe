import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();

    const category = await prisma.category.update({
      where: { id },
      data: {
        name: body.name,
        slug: body.slug,
        description: body.description ?? null,
        icon: body.icon ?? null,
        displayOrder: body.displayOrder ?? 0,
        isActive: body.isActive ?? true,
      },
    });

    return NextResponse.json(category);
  } catch (error) {
    console.error("Error updating category:", error);
    return NextResponse.json({ error: "Failed to update category" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    // Check if category has items
    const itemCount = await prisma.menuItem.count({ where: { categoryId: id } });
    if (itemCount > 0) {
      return NextResponse.json(
        { error: `Cannot delete category with ${itemCount} items` },
        { status: 400 }
      );
    }

    await prisma.category.delete({ where: { id } });
    return NextResponse.json({ message: "Deleted" });
  } catch (error) {
    console.error("Error deleting category:", error);
    return NextResponse.json({ error: "Failed to delete category" }, { status: 500 });
  }
}
