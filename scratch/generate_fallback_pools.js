require('dotenv').config();
const fs = require('fs');
const path = require('path');

const accessKey = process.env.UNSPLASH_ACCESS_KEY;

const CATEGORIES = {
  pizza: "pizza food",
  burger: "burger food",
  roll: "wrap roll food",
  coffee: "coffee drink",
  shake: "milkshake",
  mocktail: "cocktail mocktail drink",
  fries: "french fries",
  bread: "garlic bread toast",
  momo: "momos dumpling",
  chinese: "chinese food manchurian",
  noodle: "noodles pasta",
  chaat: "indian chaat samosa",
  parantha: "paratha roti naan",
  dosa: "dosa south indian",
  salad: "salad healthy food",
  dessert: "dessert sweet ice cream",
  sandwich: "sandwich food",
  pasta: "pasta food spaghetti",
  biryani: "biryani rice dish",
  rice: "fried rice",
  paneer: "paneer indian dish",
  chicken: "chicken food dish",
};

async function fetchUnsplashImages(query, count = 12) {
  if (!accessKey) {
    console.warn("No Unsplash Access Key found.");
    return [];
  }
  try {
    const url = `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&orientation=landscape&per_page=${count}`;
    const res = await fetch(url, {
      headers: { Authorization: `Client-ID ${accessKey}` }
    });
    if (!res.ok) {
      console.error(`Failed to fetch for ${query}: ${res.statusText}`);
      return [];
    }
    const data = await res.json();
    return (data.results || []).map(item => {
      // Clean regular URL and attach standard width/height cropping for menu layout
      const baseUrl = item.urls.raw;
      return `${baseUrl}&w=600&h=400&fit=crop&q=80`;
    });
  } catch (err) {
    console.error(`Error searching Unsplash for ${query}:`, err);
    return [];
  }
}

async function main() {
  console.log("🚀 Fetching unique fallback images from Unsplash...");
  
  const newPools = {};
  for (const cat in CATEGORIES) {
    console.log(`Searching for category "${cat}" using query "${CATEGORIES[cat]}"...`);
    const urls = await fetchUnsplashImages(CATEGORIES[cat], 12);
    if (urls.length > 0) {
      newPools[cat] = urls;
      console.log(`✅ Found ${urls.length} images.`);
    } else {
      console.log(`❌ Failed to find images. Falling back to default list.`);
    }
    // Small delay to avoid Unsplash rate limit issues
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  // Generate file content for menuHelper.ts
  const filePath = path.join(__dirname, "..", "lib", "utils", "menuHelper.ts");
  if (!fs.existsSync(filePath)) {
    console.error(`Could not find menuHelper.ts at ${filePath}`);
    return;
  }

  // Build the pools JavaScript string
  let poolsStr = "const IMAGE_POOLS: Record<string, string[]> = {\n";
  for (const cat in newPools) {
    poolsStr += `  ${cat}: [\n`;
    for (const url of newPools[cat]) {
      poolsStr += `    "${url}",\n`;
    }
    poolsStr += `  ],\n`;
  }
  // Add a generic default pool
  poolsStr += `  default: [\n`;
  poolsStr += `    "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=600&h=400&fit=crop&q=80",\n`;
  poolsStr += `    "https://images.unsplash.com/photo-1498837167922-ddd27525d352?w=600&h=400&fit=crop&q=80",\n`;
  poolsStr += `    "https://images.unsplash.com/photo-1476224203421-9ac39bcb3327?w=600&h=400&fit=crop&q=80",\n`;
  poolsStr += `  ]\n`;
  poolsStr += "};\n";

  // Read current menuHelper.ts and replace the IMAGE_POOLS block
  let helperContent = fs.readFileSync(filePath, 'utf8');
  
  // Replace the block between const IMAGE_POOLS ... and const CATEGORY_KEYWORDS
  const startTag = "const IMAGE_POOLS: Record<string, string[]> = {";
  const endTag = "const CATEGORY_KEYWORDS: [string[], string][] = [";
  
  const startIndex = helperContent.indexOf(startTag);
  const endIndex = helperContent.indexOf(endTag);

  if (startIndex !== -1 && endIndex !== -1) {
    const updatedContent = helperContent.substring(0, startIndex) + poolsStr + "\n" + helperContent.substring(endIndex);
    fs.writeFileSync(filePath, updatedContent, 'utf8');
    console.log(`\n🎉 Successfully updated fallback pools in ${filePath}!`);
  } else {
    console.error("Could not locate IMAGE_POOLS block in menuHelper.ts to perform replacement.");
  }
}

main();
