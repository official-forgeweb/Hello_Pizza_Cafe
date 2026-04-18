import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const item = await prisma.menuItem.findUnique({
      where: { id },
      include: {
        category: true,
        variants: { orderBy: { displayOrder: "asc" } },
        addOns: { include: { addOn: true } },
      },
    });

    if (!item) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }

    return NextResponse.json(item);
  } catch (error) {
    console.error("Error fetching menu item:", error);
    return NextResponse.json(
      { error: "Failed to fetch menu item" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    // Map frontend fields (price, isVeg) to database fields (basePrice, itemType)
    const updateData: any = {};
    if (body.name !== undefined) updateData.name = body.name;
    if (body.description !== undefined) updateData.description = body.description;
    if (body.price !== undefined) updateData.basePrice = body.price;
    if (body.isVeg !== undefined) updateData.itemType = body.isVeg ? "VEG" : "NON_VEG";
    if (body.isBestSeller !== undefined) updateData.isBestSeller = body.isBestSeller;
    if (body.isAvailable !== undefined) updateData.isAvailable = body.isAvailable;
    if (body.imageUrl !== undefined) updateData.imageUrl = body.imageUrl;
    if (body.categoryId !== undefined) updateData.categoryId = body.categoryId;

    const updatedItem = await prisma.menuItem.update({
      where: { id },
      data: updateData,
      include: { category: true }
    });

    return NextResponse.json(updatedItem);
  } catch (error) {
    console.error("Error updating menu item:", error);
    return NextResponse.json(
      { error: "Failed to update menu item" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await prisma.menuItem.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, message: "Item deleted successfully" });
  } catch (error) {
    console.error("Error deleting menu item:", error);
    return NextResponse.json(
      { error: "Failed to delete menu item" },
      { status: 500 }
    );
  }
}
