import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { ensureMenuItemImage } from "@/lib/image-manager";

// Dummy type for the incoming sync data
interface SyncMenuItem {
  id: string; // The ID from offline software
  name: string;
  description: string;
  price: number;
  isVeg: boolean;
  categoryId: string;
}

export async function POST(request: NextRequest) {
  try {
    const rawData = await request.json();
    const itemsToSync: SyncMenuItem[] = Array.isArray(rawData) ? rawData : rawData.items;

    if (!itemsToSync || !itemsToSync.length) {
      return NextResponse.json({ success: true, message: "No items to sync" });
    }

    const processedItems = [];
    const imageFetchPromises = [];

    for (const item of itemsToSync) {
      // 1. Upsert database record
      // We do not overwrite imageUrl here so we don't wipe out existing images
      const savedItem = await prisma.menuItem.upsert({
        where: { id: item.id },
        update: {
          name: item.name,
          description: item.description,
          price: item.price,
          isVeg: item.isVeg,
          categoryId: item.categoryId
        },
        create: {
          id: item.id,
          name: item.name,
          description: item.description,
          price: item.price,
          isVeg: item.isVeg,
          categoryId: item.categoryId,
        }
      });

      processedItems.push(savedItem);

      // 2. Fetch image only if missing or not local!
      // This is done asynchronously so it doesn't block the 10-second sync loop
      if (!savedItem.imageUrl || !savedItem.imageUrl.startsWith("/menu-images/")) {
        imageFetchPromises.push(
          ensureMenuItemImage(savedItem.id, savedItem.name, savedItem.imageUrl)
            .catch(err => console.error(`Failed automated image sync for ${savedItem.name}`, err))
        );
      }
    }

    // Process images in background so we answer the POS software sync push immediately!
    Promise.all(imageFetchPromises).catch(err => {
      console.error("Background image fetching loop failed:", err);
    });

    return NextResponse.json({
      success: true,
      syncedCount: processedItems.length,
      imagesRequested: imageFetchPromises.length,
    });
  } catch (error: any) {
    console.error("Menu sync error:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
