import fs from "fs";
import path from "path";
import prisma from "@/lib/prisma";

const PUBLIC_DIR = path.join(process.cwd(), "public");
const MENU_IMAGES_DIR = path.join(PUBLIC_DIR, "menu-images");

// Ensure directory exists
if (!fs.existsSync(MENU_IMAGES_DIR)) {
  fs.mkdirSync(MENU_IMAGES_DIR, { recursive: true });
}

export function sanitizeFilename(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

/**
 * Searches Unsplash for an image.
 */
async function searchUnsplash(query: string): Promise<string | null> {
  const accessKey = process.env.UNSPLASH_ACCESS_KEY;
  if (!accessKey) return null;

  try {
    const res = await fetch(
      `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&orientation=landscape&per_page=1`,
      { headers: { Authorization: `Client-ID ${accessKey}` } }
    );
    if (!res.ok) return null;
    const data = await res.json();
    return data.results?.[0]?.urls?.regular || null;
  } catch (err) {
    console.error("Unsplash error:", err);
    return null;
  }
}

/**
 * Searches Pexels for an image (Fallback)
 */
async function searchPexels(query: string): Promise<string | null> {
  const apiKey = process.env.PEXELS_API_KEY;
  if (!apiKey) return null;

  try {
    const res = await fetch(
      `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&orientation=landscape&per_page=1`,
      { headers: { Authorization: apiKey } }
    );
    if (!res.ok) return null;
    const data = await res.json();
    return data.photos?.[0]?.src?.large || null;
  } catch (err) {
    console.error("Pexels error:", err);
    return null;
  }
}

/**
 * Downloads an image from a URL and saves it locally.
 */
async function downloadImage(url: string, filename: string): Promise<string | null> {
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Failed to fetch image: ${res.statusText}`);
    
    const buffer = Buffer.from(await res.arrayBuffer());
    const filePath = path.join(MENU_IMAGES_DIR, filename);
    fs.writeFileSync(filePath, buffer);
    
    return `/menu-images/${filename}`;
  } catch (err) {
    console.error(`Failed to download image for ${filename}:`, err);
    return null;
  }
}

/**
 * Main function to get or fetch an image for a menu item.
 */
export async function ensureMenuItemImage(itemId: string, itemName: string, currentImageUrl: string | null): Promise<string | null> {
  // If item already has a local image mapped, verify it exists on disk
  if (currentImageUrl?.startsWith("/menu-images/")) {
    const localPath = path.join(PUBLIC_DIR, currentImageUrl);
    if (fs.existsSync(localPath)) {
      return currentImageUrl; // Image exists and mapped perfectly
    }
  }

  // If item has an external URL mapped (not local), we might want to keep it or download it.
  // For this sync, we'll download if it's missing entirely or broken.
  
  const filename = `${sanitizeFilename(itemName)}.jpg`;
  const localPath = path.join(MENU_IMAGES_DIR, filename);
  const publicPath = `/menu-images/${filename}`;

  // Check if image already exists on disk from a previous run
  if (fs.existsSync(localPath)) {
    // Update mapping to use local path if it wasn't already
    if (currentImageUrl !== publicPath) {
      await prisma.menuItem.update({
        where: { id: itemId },
        data: { imageUrl: publicPath }
      });
    }
    return publicPath;
  }

  // Need to fetch fresh image
  console.log(`[Image Manager] Fetching image for: ${itemName}`);
  const query = `${itemName} food dish`;
  
  // Strategy: Try Unsplash -> Try Pexels -> Give up
  let urlToDownload = await searchUnsplash(query);
  if (!urlToDownload) {
    urlToDownload = await searchPexels(query);
  }

  if (urlToDownload) {
    const savedPath = await downloadImage(urlToDownload, filename);
    if (savedPath) {
      // Save mapping in database
      await prisma.menuItem.update({
        where: { id: itemId },
        data: { imageUrl: savedPath }
      });
      return savedPath;
    }
  }

  console.log(`[Image Manager] No external image found for: ${itemName}`);
  // Fallback scenario: if default-food.jpg exists in public/menu-images/
  // It won't update DB to the fallback so it can try again later, but we could.
  return null;
}
