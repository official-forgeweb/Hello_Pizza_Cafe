/**
 * Menu Helper for WhatsApp Bot
 * 
 * Fetches and formats menu data from the database for WhatsApp display.
 * All output is plain text formatted for WhatsApp readability.
 */

import prisma from '@/lib/prisma';

// ─── Types ─────────────────────────────────────────────────

interface FormattedCategory {
  id: string;
  name: string;
  slug: string;
  itemCount: number;
}

interface FormattedMenuItem {
  id: string;
  name: string;
  basePrice: number;
  itemType: 'VEG' | 'NON_VEG';
  description: string | null;
  categoryId: string;
  categoryName: string;
  hasVariants: boolean;
  variants: { name: string; price: number; group: string }[];
  addOns: { id: string; name: string; price: number; group: string }[];
}

// ─── Category Emoji Map ────────────────────────────────────

const CATEGORY_EMOJIS: Record<string, string> = {
  starters: '🥗',
  appetizers: '🥗',
  'main course': '🍛',
  'main course - veg': '🌿',
  'main course - non veg': '🍗',
  breads: '🫓',
  bread: '🫓',
  pizza: '🍕',
  pizzas: '🍕',
  burger: '🍔',
  burgers: '🍔',
  'rice & biryani': '🍚',
  rice: '🍚',
  biryani: '🍚',
  desserts: '🍮',
  dessert: '🍮',
  beverages: '🥤',
  drinks: '🥤',
  'cold drinks': '🥤',
  'hot drinks': '☕',
  coffee: '☕',
  sides: '🥙',
  salads: '🥗',
  combos: '🎁',
  combo: '🎁',
  specials: '⭐',
  'today\'s special': '⭐',
  momos: '🥟',
  noodles: '🍜',
  chinese: '🥡',
  pasta: '🍝',
  sandwich: '🥪',
  sandwiches: '🥪',
  wraps: '🌯',
  rolls: '🌯',
  thali: '🍱',
};

function getCategoryEmoji(categoryName: string): string {
  const lower = categoryName.toLowerCase().trim();
  return CATEGORY_EMOJIS[lower] || '🍴';
}

// ─── Cache Configuration ───────────────────────────────────

let cachedCategories: FormattedCategory[] | null = null;
let cachedCategoriesTime = 0;

const cachedItems: Record<string, FormattedMenuItem[]> = {};
const cachedItemsTime: Record<string, number> = {};

const CACHE_TTL = 5 * 60 * 1000; // 5 minutes in milliseconds

export function clearMenuCache() {
  cachedCategories = null;
  cachedCategoriesTime = 0;
  for (const key in cachedItems) {
    delete cachedItems[key];
    delete cachedItemsTime[key];
  }
}

// ─── Public Functions ──────────────────────────────────────

/**
 * Fetch all active categories with item counts (cached for 5 minutes)
 */
export async function getMenuCategories(): Promise<FormattedCategory[]> {
  const now = Date.now();
  if (cachedCategories && (now - cachedCategoriesTime < CACHE_TTL)) {
    return cachedCategories;
  }

  const categories = await prisma.category.findMany({
    where: { isActive: true },
    orderBy: { displayOrder: 'asc' },
    include: {
      _count: {
        select: {
          menuItems: {
            where: { isAvailable: true },
          },
        },
      },
    },
  });

  const result = categories
    .filter((c) => c._count.menuItems > 0)
    .map((c) => ({
      id: c.id,
      name: c.name,
      slug: c.slug,
      itemCount: c._count.menuItems,
    }));

  cachedCategories = result;
  cachedCategoriesTime = now;
  return result;
}

/**
 * Format categories for WhatsApp display
 */
export async function formatCategoriesMessage(): Promise<string> {
  const categories = await getMenuCategories();

  if (categories.length === 0) {
    return "😔 Sorry, our menu isn't available right now. Please try again later!";
  }

  let msg = '🍽️ *Our Menu Categories*\n\nPlease select a category to explore:\n\n';

  categories.forEach((cat, idx) => {
    const emoji = getCategoryEmoji(cat.name);
    msg += `🔹 *${idx + 1}.* ${emoji} *${cat.name}* (${cat.itemCount} items)\n`;
  });

  msg += `\n🔹 *${categories.length + 1}.* 📋 *View Full Menu*`;
  msg += `\n🔹 *${categories.length + 2}.* 🛒 *Go to Cart / Place Order*`;

  return msg;
}

/**
 * Fetch items for a specific category (cached for 5 minutes)
 */
export async function getCategoryItems(categoryId: string): Promise<FormattedMenuItem[]> {
  const now = Date.now();
  if (cachedItems[categoryId] && (now - (cachedItemsTime[categoryId] || 0) < CACHE_TTL)) {
    return cachedItems[categoryId];
  }

  const items = await prisma.menuItem.findMany({
    where: {
      categoryId,
      isAvailable: true,
    },
    orderBy: [{ displayOrder: 'asc' }, { name: 'asc' }],
    include: {
      category: { select: { name: true } },
      variants: {
        where: { isAvailable: true },
        orderBy: { displayOrder: 'asc' },
      },
      addOns: {
        include: { addOn: true },
      },
    },
  });

  // Deduplicate by name within category
  const seen = new Set<string>();
  const unique: typeof items = [];
  for (const item of items) {
    const key = item.name.toLowerCase().trim();
    if (!seen.has(key)) {
      seen.add(key);
      unique.push(item);
    }
  }

  const result = unique.map((item) => ({
    id: item.id,
    name: item.name,
    basePrice: Number(item.basePrice),
    itemType: item.itemType as 'VEG' | 'NON_VEG',
    description: item.description,
    categoryId: item.categoryId,
    categoryName: item.category.name,
    hasVariants: item.variants.length > 0 || item.addOns.length > 0,
    variants: item.variants.map((v) => ({
      name: v.name,
      price: Number(v.priceModifier),
      group: v.variantGroup,
    })),
    addOns: item.addOns.map((a) => ({
      id: a.addOn.id,
      name: a.addOn.name,
      price: Number(a.priceOverride ?? a.addOn.price),
      group: a.addonGroup,
    })),
  }));

  cachedItems[categoryId] = result;
  cachedItemsTime[categoryId] = now;
  return result;
}

/**
 * Format category items for WhatsApp display (No Veg/Non-Veg indicators)
 */
export async function formatCategoryItemsMessage(
  categoryId: string,
  categoryName: string
): Promise<string> {
  const items = await getCategoryItems(categoryId);

  if (items.length === 0) {
    return `😔 No items available in *${categoryName}* right now.\n\nType *MENU* to browse other categories.`;
  }

  const emoji = getCategoryEmoji(categoryName);
  let msg = `${emoji} *${categoryName.toUpperCase()}*\n━━━━━━━━━━━━━━━\n`;

  items.forEach((item, idx) => {
    const price = formatPrice(item.basePrice);

    // If item has variants, show "starts at" price
    if (item.variants.length > 0) {
      const prices = item.variants.map((v) => v.price);
      const minPrice = Math.min(...prices);
      msg += `*${idx + 1}.* *${item.name}* - from *${formatPrice(minPrice)}*\n`;

      // Show variant options inline
      item.variants.forEach((v) => {
        msg += `   └ ${v.name}: ${formatPrice(v.price)}\n`;
      });
    } else {
      msg += `*${idx + 1}.* *${item.name}* - *${price}*\n`;
    }
  });

  msg += '━━━━━━━━━━━━━━━\n';
  msg += 'To add items, type item *number & quantity*\n';
  msg += 'Example: *"1*2"* or *"2 Paneer Tikka"*\n\n';
  msg += 'Type *MENU* to go back to categories\n';
  msg += 'Type *CART* to view your current cart 🛒';

  return msg;
}

/**
 * Format full menu for WhatsApp display (No Veg/Non-Veg indicators)
 */
export async function formatFullMenuMessage(): Promise<string> {
  const categories = await getMenuCategories();
  let msg = '📋 *FULL MENU*\n━━━━━━━━━━━━━━━━━━━━━━\n\n';

  for (const cat of categories) {
    const items = await getCategoryItems(cat.id);
    const emoji = getCategoryEmoji(cat.name);
    msg += `${emoji} *${cat.name.toUpperCase()}*\n`;

    items.forEach((item, idx) => {
      if (item.variants.length > 0) {
        const minPrice = Math.min(...item.variants.map((v) => v.price));
        msg += `  ${idx + 1}. *${item.name}* - from ${formatPrice(minPrice)}\n`;
      } else {
        msg += `  ${idx + 1}. *${item.name}* - ${formatPrice(item.basePrice)}\n`;
      }
    });

    msg += '\n';
  }

  msg += '━━━━━━━━━━━━━━━━━━━━━━\n';
  msg += 'To order, first select a category by number.\n';
  msg += 'Type *MENU* to see categories.\n';
  msg += 'Type *CART* to view your cart 🛒';

  return msg;
}

/**
 * Find a menu item by number within a category or by name search
 */
export async function findMenuItemInCategory(
  categoryId: string,
  query: string
): Promise<{ item: FormattedMenuItem; quantity: number } | null> {
  const items = await getCategoryItems(categoryId);
  if (items.length === 0) return null;

  // Parse quantity from input: "2*3", "1 x 2", "3 Paneer Tikka", "1", etc.
  let quantity = 1;
  let searchTerm = query.trim();

  // Pattern: "NUMBER separator QUANTITY" (supports *, x, X, ×, -, or space separator, e.g. 1*2, 1x2, 1-2, 1 2)
  const numXqty = searchTerm.match(/^(\d+)\s*[\*xX×\-]?\s*(\d+)$/);
  if (numXqty) {
    const itemNum = parseInt(numXqty[1]);
    quantity = parseInt(numXqty[2]) || 1;
    if (itemNum >= 1 && itemNum <= items.length) {
      return { item: items[itemNum - 1], quantity };
    }
    return null;
  }

  // Pattern: "QUANTITY ITEM_NAME" (e.g. "2 Paneer Tikka")
  const qtyName = searchTerm.match(/^(\d+)\s+(.+)$/);
  if (qtyName) {
    quantity = parseInt(qtyName[1]) || 1;
    searchTerm = qtyName[2].trim();
  }

  // Pattern: Just a number (item index)
  const justNum = searchTerm.match(/^(\d+)$/);
  if (justNum) {
    const itemNum = parseInt(justNum[1]);
    if (itemNum >= 1 && itemNum <= items.length) {
      return { item: items[itemNum - 1], quantity };
    }
    return null;
  }

  // Fuzzy name match
  const lowerSearch = searchTerm.toLowerCase();
  const found = items.find(
    (item) =>
      item.name.toLowerCase() === lowerSearch ||
      item.name.toLowerCase().includes(lowerSearch) ||
      lowerSearch.includes(item.name.toLowerCase())
  );

  if (found) {
    return { item: found, quantity };
  }

  return null;
}

/**
 * Search for a menu item across all categories by name
 */
export async function searchMenuItem(
  query: string
): Promise<FormattedMenuItem | null> {
  const lowerQuery = query.toLowerCase().trim();

  const items = await prisma.menuItem.findMany({
    where: {
      isAvailable: true,
      name: { contains: lowerQuery, mode: 'insensitive' },
    },
    take: 1,
    include: {
      category: { select: { name: true } },
      variants: {
        where: { isAvailable: true },
        orderBy: { displayOrder: 'asc' },
      },
      addOns: {
        include: { addOn: true },
      },
    },
  });

  if (items.length === 0) return null;

  const item = items[0];
  return {
    id: item.id,
    name: item.name,
    basePrice: Number(item.basePrice),
    itemType: item.itemType as 'VEG' | 'NON_VEG',
    description: item.description,
    categoryId: item.categoryId,
    categoryName: item.category.name,
    hasVariants: item.variants.length > 0 || item.addOns.length > 0,
    variants: item.variants.map((v) => ({
      name: v.name,
      price: Number(v.priceModifier),
      group: v.variantGroup,
    })),
    addOns: item.addOns.map((a) => ({
      id: a.addOn.id,
      name: a.addOn.name,
      price: Number(a.priceOverride ?? a.addOn.price),
      group: a.addonGroup,
    })),
  };
}

/**
 * Get category by index number (1-based)
 */
export async function getCategoryByIndex(index: number): Promise<{
  id: string;
  name: string;
} | null> {
  const categories = await getMenuCategories();
  if (index < 1 || index > categories.length) return null;
  const cat = categories[index - 1];
  return { id: cat.id, name: cat.name };
}

/**
 * Get total number of categories (for bounds checking)
 */
export async function getCategoryCount(): Promise<number> {
  const categories = await getMenuCategories();
  return categories.length;
}

// ─── Utilities ─────────────────────────────────────────────

export function formatPrice(amount: number): string {
  return `₹${amount.toLocaleString('en-IN')}`;
}
