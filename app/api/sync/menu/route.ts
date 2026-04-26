import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

interface SyncCategory {
  id: string;
  name: string;
  description: string;
  displayOrder: number;
}

interface SyncAddon {
  name: string;
  price: number;
  type?: string;
}

interface SyncVariant {
  name: string;
  price: number;
}

interface SyncMenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  isVeg: boolean;
  categoryId: string;
  isAvailable?: boolean;
  variants?: SyncVariant[];
  addons?: SyncAddon[];
  addonGroups?: {
    groupName: string;
    variantName: string | null;
    addons: SyncAddon[];
  }[];
}

interface SyncGlobalAddon {
  id: string;
  name: string;
  price: number;
  type?: string;
}

export async function POST(request: NextRequest) {
  try {
    const rawData = await request.json();
    const categoriesToSync: SyncCategory[] = rawData.categories || [];
    const itemsToSync: SyncMenuItem[] = Array.isArray(rawData) ? rawData : rawData.items || [];
    const globalAddons: SyncGlobalAddon[] = rawData.globalAddons || [];

    if (!itemsToSync.length && !categoriesToSync.length) {
      return NextResponse.json({ success: true, message: "No data to sync" });
    }

    // We process without a global transaction to avoid Supabase connection pool timeouts on large menus.
    // Sync is naturally idempotent due to upserts.
    let categoriesSynced = 0;
    let itemsSynced = 0;
    let variantsSynced = 0;
    let addonsSynced = 0;
    let globalAddonsSynced = 0;

    // Helper function to process in chunks
    const processInChunks = async <T>(items: T[], chunkSize: number, processor: (chunk: T[]) => Promise<void>) => {
      for (let i = 0; i < items.length; i += chunkSize) {
        const chunk = items.slice(i, i + chunkSize);
        await processor(chunk);
      }
    };

    // ── Step 1: Upsert categories ──
    await processInChunks(categoriesToSync, 50, async (chunk) => {
      await Promise.all(chunk.map(async (cat) => {
        if (!cat.id || !cat.name) return;
        const slug = cat.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
        await prisma.category.upsert({
          where: { id: cat.id },
          update: {
            name: cat.name,
            slug: slug + '-' + cat.id.slice(0, 8),
            description: cat.description || null,
            displayOrder: cat.displayOrder || 0,
          },
          create: {
            id: cat.id,
            name: cat.name,
            slug: slug + '-' + cat.id.slice(0, 8),
            description: cat.description || null,
            displayOrder: cat.displayOrder || 0,
          }
        });
        categoriesSynced++;
      }));
    });

    const validCatIds = new Set(categoriesToSync.map(c => c.id));

    // ── Step 2: Upsert global addons from POS ──
    const addonNameToId: Record<string, string> = {};
    
    const existingAddons = await prisma.addOn.findMany({ select: { id: true, name: true } });
    const existingAddonMap = new Map(existingAddons.map(a => [a.name, a.id]));

    await processInChunks(globalAddons, 50, async (chunk) => {
      await Promise.all(chunk.map(async (ga) => {
        const existingId = existingAddonMap.get(ga.name);
        if (existingId) {
          await prisma.addOn.update({
            where: { id: existingId },
            data: {
              price: ga.price || 0,
              itemType: ga.type === 'non-veg' ? "NON_VEG" : "VEG",
            }
          });
          addonNameToId[ga.name] = existingId;
        } else {
          const created = await prisma.addOn.create({
            data: {
              name: ga.name,
              price: ga.price || 0,
              addonGroup: "Extras",
              itemType: ga.type === 'non-veg' ? "NON_VEG" : "VEG",
              isAvailable: true,
            }
          });
          addonNameToId[ga.name] = created.id;
        }
        globalAddonsSynced++;
      }));
    });

    // ── Step 3: Upsert menu items ──
    const allCategories = await prisma.category.findMany({ select: { id: true } });
    const dbCatIds = new Set(allCategories.map(c => c.id));

    await processInChunks(itemsToSync, 20, async (chunk) => {
      // Small chunk size of 20 for menu items because each item performs multiple queries (variants, addons)
      await Promise.all(chunk.map(async (item) => {
        let categoryId = item.categoryId;
        if (categoryId && !validCatIds.has(categoryId) && !dbCatIds.has(categoryId)) {
          console.warn(`[MenuSync] Skipping item "${item.name}" - categoryId "${categoryId}" not found`);
          return;
        }

        const itemSlug = item.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') + '-' + item.id.slice(0, 8);

        await prisma.menuItem.upsert({
          where: { id: item.id },
          update: {
            name: item.name,
            slug: itemSlug,
            description: item.description || null,
            basePrice: item.price,
            itemType: item.isVeg ? "VEG" : "NON_VEG",
            categoryId: categoryId || undefined,
            isAvailable: item.isAvailable !== false,
          },
          create: {
            id: item.id,
            name: item.name,
            slug: itemSlug,
            description: item.description || null,
            basePrice: item.price,
            itemType: item.isVeg ? "VEG" : "NON_VEG",
            categoryId: categoryId,
            isAvailable: item.isAvailable !== false,
          }
        });
        itemsSynced++;

        // ── Step 4: Sync Variants ──
        if (item.variants && Array.isArray(item.variants) && item.variants.length > 0) {
          await prisma.itemVariant.deleteMany({ where: { menuItemId: item.id } });
          
          const variantsToCreate = item.variants.map((v, idx) => ({
            menuItemId: item.id,
            name: v.name,
            variantGroup: "Size",
            priceModifier: v.price || 0,
            isDefault: idx === 0,
            isAvailable: true,
            displayOrder: idx,
          }));
          
          if (variantsToCreate.length > 0) {
             await prisma.itemVariant.createMany({ data: variantsToCreate });
             variantsSynced += variantsToCreate.length;
          }
        }

        // ── Step 5: Sync item-level addons ──
        // Support both the new addonGroups structure (grouped by variant) and legacy flat addons array
        const hasAddonGroups = item.addonGroups && Array.isArray(item.addonGroups) && item.addonGroups.length > 0;
        const hasFlatAddons = item.addons && Array.isArray(item.addons) && item.addons.length > 0;
        
        if (hasAddonGroups || hasFlatAddons) {
          await prisma.menuItemAddOn.deleteMany({ where: { menuItemId: item.id } });
          
          const addonsToCreate: any[] = [];
          
          if (hasAddonGroups) {
            for (const group of item.addonGroups!) {
              for (const addon of group.addons) {
                let addonId = addonNameToId[addon.name] || existingAddonMap.get(addon.name);
                
                if (!addonId) {
                  const created = await prisma.addOn.create({
                    data: {
                      name: addon.name,
                      price: addon.price || 0,
                      addonGroup: "Extras",
                      itemType: addon.type === 'non-veg' ? "NON_VEG" : "VEG",
                      isAvailable: true,
                    }
                  });
                  addonId = created.id;
                  addonNameToId[addon.name] = addonId;
                }

                addonsToCreate.push({ 
                  menuItemId: item.id, 
                  addOnId: addonId,
                  addonGroup: group.groupName || "Extras",
                  variantName: group.variantName || null
                });
                addonsSynced++;
              }
            }
          } else if (hasFlatAddons) {
            // Legacy flat processing
            for (const addon of item.addons!) {
              let addonId = addonNameToId[addon.name] || existingAddonMap.get(addon.name);
              
              if (!addonId) {
                const created = await prisma.addOn.create({
                  data: {
                    name: addon.name,
                    price: addon.price || 0,
                    addonGroup: "Extras",
                    itemType: addon.type === 'non-veg' ? "NON_VEG" : "VEG",
                    isAvailable: true,
                  }
                });
                addonId = created.id;
                addonNameToId[addon.name] = addonId;
              }

              addonsToCreate.push({ 
                menuItemId: item.id, 
                addOnId: addonId,
                addonGroup: "Extras",
                variantName: null
              });
              addonsSynced++;
            }
          }

          if (addonsToCreate.length > 0) {
            // Filter duplicates (same addon in same item can happen if we are not careful)
            const uniqueAddonsToCreate = [];
            const seen = new Set();
            for (const a of addonsToCreate) {
              // Key must match Prisma's unique constraint: [menuItemId, addOnId, variantName]
              const key = a.menuItemId + '-' + a.addOnId + '-' + (a.variantName || '_global_');
              if (!seen.has(key)) {
                seen.add(key);
                uniqueAddonsToCreate.push(a);
              }
            }

            if (uniqueAddonsToCreate.length > 0) {
              try {
                await prisma.menuItemAddOn.createMany({
                  data: uniqueAddonsToCreate,
                  skipDuplicates: true
                });
              } catch (e: any) {
                require('fs').writeFileSync('C:\\Users\\lenovo\\OneDrive\\Desktop\\Projects\\ZapBill_offline-software\\tmp\\sync_error.txt', e.message + '\n\n' + JSON.stringify(uniqueAddonsToCreate, null, 2));
                throw e;
              }
            }
          }
        }
      }));
    });

    const result = { categoriesSynced, itemsSynced, variantsSynced, addonsSynced, globalAddonsSynced };

    console.log(`[MenuSync] Synced ${result.itemsSynced} items, ${result.variantsSynced} variants, ${result.addonsSynced} addons, ${result.globalAddonsSynced} global addons`);

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (error: any) {
    console.error("Menu sync error:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
