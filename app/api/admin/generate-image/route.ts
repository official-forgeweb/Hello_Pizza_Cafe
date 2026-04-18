import { NextRequest, NextResponse } from "next/server";

/**
 * Fetches a high-quality food photo from Unsplash (primary) or Pexels (fallback)
 * based on the menu item name and description.
 */

interface UnsplashResult {
  urls: { regular: string; small: string };
  alt_description: string | null;
  user: { name: string; links: { html: string } };
}

interface PexelsPhoto {
  src: { large: string; medium: string };
  alt: string | null;
  photographer: string;
}

async function searchUnsplash(query: string): Promise<string | null> {
  const key = process.env.UNSPLASH_ACCESS_KEY;
  if (!key) return null;

  try {
    const params = new URLSearchParams({
      query,
      per_page: "5",
      orientation: "squarish",
      content_filter: "high",
    });

    const res = await fetch(
      `https://api.unsplash.com/search/photos?${params}`,
      {
        headers: { Authorization: `Client-ID ${key}` },
        next: { revalidate: 3600 },
      }
    );

    if (!res.ok) {
      console.error("Unsplash API error:", res.status, await res.text());
      return null;
    }

    const data = await res.json();
    const results: UnsplashResult[] = data.results || [];

    if (results.length === 0) return null;

    // Pick a random result from the top results for variety
    const pick = results[Math.floor(Math.random() * results.length)];
    // Use the regular size (1080w) — good balance of quality and speed
    return pick.urls.regular;
  } catch (err) {
    console.error("Unsplash fetch error:", err);
    return null;
  }
}

async function searchPexels(query: string): Promise<string | null> {
  const key = process.env.PEXELS_API_KEY;
  if (!key) return null;

  try {
    const params = new URLSearchParams({
      query,
      per_page: "5",
      orientation: "square",
    });

    const res = await fetch(
      `https://api.pexels.com/v1/search?${params}`,
      {
        headers: { Authorization: key },
        next: { revalidate: 3600 },
      }
    );

    if (!res.ok) {
      console.error("Pexels API error:", res.status, await res.text());
      return null;
    }

    const data = await res.json();
    const photos: PexelsPhoto[] = data.photos || [];

    if (photos.length === 0) return null;

    const pick = photos[Math.floor(Math.random() * photos.length)];
    return pick.src.large;
  } catch (err) {
    console.error("Pexels fetch error:", err);
    return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    const { itemName, description, isVeg } = await request.json();

    if (!itemName) {
      return NextResponse.json(
        { error: "Item name is required" },
        { status: 400 }
      );
    }

    // Build a search query optimised for food photography
    const foodType = isVeg ? "vegetarian" : "";
    const searchTerms = [itemName, foodType, "food"].filter(Boolean).join(" ");
    const fallbackTerms = [itemName, "dish"].filter(Boolean).join(" ");

    // Try Unsplash first
    let imageUrl = await searchUnsplash(searchTerms);

    // If Unsplash returned nothing, try with simpler query
    if (!imageUrl) {
      imageUrl = await searchUnsplash(fallbackTerms);
    }

    // Fallback to Pexels
    if (!imageUrl) {
      imageUrl = await searchPexels(searchTerms);
    }

    if (!imageUrl) {
      imageUrl = await searchPexels(fallbackTerms);
    }

    if (!imageUrl) {
      return NextResponse.json(
        { error: "No matching food image found. Try a different item name." },
        { status: 422 }
      );
    }

    return NextResponse.json({
      success: true,
      imageUrl,
    });
  } catch (error: any) {
    console.error("Image search error:", error?.message || error);

    return NextResponse.json(
      { error: "Failed to fetch image. Please try again." },
      { status: 500 }
    );
  }
}
