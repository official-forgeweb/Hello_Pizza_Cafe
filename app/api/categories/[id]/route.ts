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

    // Instead of throwing an error, we move items to "Uncategorized"
    const itemCount = await prisma.menuItem.count({ where: { categoryId: id } });
    if (itemCount > 0) {
      let uncategorized = await prisma.category.findFirst({
        where: { name: "Uncategorized" },
      });

      if (!uncategorized) {
        uncategorized = await prisma.category.create({
          data: {
            name: "Uncategorized",
            slug: "uncategorized",
            description: "Default category for items without a category",
          },
        });
      }

      if (uncategorized.id === id) {
         return NextResponse.json({ error: "Cannot delete the Uncategorized category while it has items" }, { status: 400 });
      }

      await prisma.menuItem.updateMany({
        where: { categoryId: id },
        data: { categoryId: uncategorized.id },
      });
    }

    await prisma.category.delete({ where: { id } });
    return NextResponse.json({ message: "Category deleted and items moved to Uncategorized" });
  } catch (error) {
    console.error("Error deleting category:", error);
    return NextResponse.json({ error: "Failed to delete category" }, { status: 500 });
  }
}
