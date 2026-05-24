/**
 * Returns a high-quality fallback image based on the item name and category.
 * Uses a deterministic hash so each item gets a unique but consistent image
 * from a pool of options per category.
 */

// Simple string hash to pick a consistent image for each item name
function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0; // Convert to 32bit integer
  }
  return Math.abs(hash);
}

// Pool of unique, high-quality Unsplash food images per category
const IMAGE_POOLS: Record<string, string[]> = {
  pizza: [
    "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=600&h=400&fit=crop&q=80",
    "https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=600&h=400&fit=crop&q=80",
    "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=600&h=400&fit=crop&q=80",
    "https://images.unsplash.com/photo-1604382354936-07c5d9983bd3?w=600&h=400&fit=crop&q=80",
    "https://images.unsplash.com/photo-1588315029754-2dd089d39a1a?w=600&h=400&fit=crop&q=80",
    "https://images.unsplash.com/photo-1571407970349-bc81e7e96d47?w=600&h=400&fit=crop&q=80",
    "https://images.unsplash.com/photo-1593560708920-61dd98c46a4e?w=600&h=400&fit=crop&q=80",
    "https://images.unsplash.com/photo-1571997478779-2adcbbe9ab2f?w=600&h=400&fit=crop&q=80",
    "https://images.unsplash.com/photo-1595854341625-f33ee10dbf94?w=600&h=400&fit=crop&q=80",
    "https://images.unsplash.com/photo-1628840042765-356cda07504e?w=600&h=400&fit=crop&q=80",
  ],
  burger: [
    "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600&h=400&fit=crop&q=80",
    "https://images.unsplash.com/photo-1550547660-d9450f859349?w=600&h=400&fit=crop&q=80",
    "https://images.unsplash.com/photo-1553979459-d2229ba7433b?w=600&h=400&fit=crop&q=80",
    "https://images.unsplash.com/photo-1572802419224-296b0aeee15d?w=600&h=400&fit=crop&q=80",
    "https://images.unsplash.com/photo-1586816001966-79b736744398?w=600&h=400&fit=crop&q=80",
  ],
  roll: [
    "https://images.unsplash.com/photo-1626700051175-6818013e1d4f?w=600&h=400&fit=crop&q=80",
    "https://images.unsplash.com/photo-1561651823-34feb02250e4?w=600&h=400&fit=crop&q=80",
    "https://images.unsplash.com/photo-1529006557810-274b9b2fc783?w=600&h=400&fit=crop&q=80",
    "https://images.unsplash.com/photo-1600891964599-f61ba0e24092?w=600&h=400&fit=crop&q=80",
  ],
  coffee: [
    "https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=600&h=400&fit=crop&q=80",
    "https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=600&h=400&fit=crop&q=80",
    "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=600&h=400&fit=crop&q=80",
    "https://images.unsplash.com/photo-1514432324607-a09d9b4aefda?w=600&h=400&fit=crop&q=80",
  ],
  shake: [
    "https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=600&h=400&fit=crop&q=80",
    "https://images.unsplash.com/photo-1553787499-6f9133860278?w=600&h=400&fit=crop&q=80",
    "https://images.unsplash.com/photo-1541658016709-82535e94bc69?w=600&h=400&fit=crop&q=80",
  ],
  mocktail: [
    "https://images.unsplash.com/photo-1513558161293-cdaf765ed514?w=600&h=400&fit=crop&q=80",
    "https://images.unsplash.com/photo-1536935338788-846bb9981813?w=600&h=400&fit=crop&q=80",
    "https://images.unsplash.com/photo-1544145945-f90425340c7e?w=600&h=400&fit=crop&q=80",
    "https://images.unsplash.com/photo-1497534446932-c925b458314e?w=600&h=400&fit=crop&q=80",
  ],
  fries: [
    "https://images.unsplash.com/photo-1630384060421-cb20aeb68f95?w=600&h=400&fit=crop&q=80",
    "https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=600&h=400&fit=crop&q=80",
    "https://images.unsplash.com/photo-1541592106381-b31e9677c0e4?w=600&h=400&fit=crop&q=80",
  ],
  bread: [
    "https://images.unsplash.com/photo-1549931319-a545753467c8?w=600&h=400&fit=crop&q=80",
    "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=600&h=400&fit=crop&q=80",
    "https://images.unsplash.com/photo-1586444248902-2367d1a45fee?w=600&h=400&fit=crop&q=80",
  ],
  momo: [
    "https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?w=600&h=400&fit=crop&q=80",
    "https://images.unsplash.com/photo-1496116218417-1a781b1c416c?w=600&h=400&fit=crop&q=80",
    "https://images.unsplash.com/photo-1563245372-f21724e3856d?w=600&h=400&fit=crop&q=80",
  ],
  chinese: [
    "https://images.unsplash.com/photo-1585032226651-759b368d7246?w=600&h=400&fit=crop&q=80",
    "https://images.unsplash.com/photo-1569058242253-92a9c755a0ec?w=600&h=400&fit=crop&q=80",
    "https://images.unsplash.com/photo-1526318896980-cf78c088247c?w=600&h=400&fit=crop&q=80",
  ],
  noodle: [
    "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=600&h=400&fit=crop&q=80",
    "https://images.unsplash.com/photo-1552611052-33e04de1b100?w=600&h=400&fit=crop&q=80",
    "https://images.unsplash.com/photo-1612929633738-8fe44f7ec841?w=600&h=400&fit=crop&q=80",
  ],
  chaat: [
    "https://images.unsplash.com/photo-1601050690117-94f5f6fa8bd7?w=600&h=400&fit=crop&q=80",
    "https://images.unsplash.com/photo-1606491956689-2ea866880049?w=600&h=400&fit=crop&q=80",
  ],
  parantha: [
    "https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=600&h=400&fit=crop&q=80",
    "https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=600&h=400&fit=crop&q=80",
  ],
  dosa: [
    "https://images.unsplash.com/photo-1668236543090-82eba5ee5976?w=600&h=400&fit=crop&q=80",
    "https://images.unsplash.com/photo-1630383249896-424e482df921?w=600&h=400&fit=crop&q=80",
  ],
  salad: [
    "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=600&h=400&fit=crop&q=80",
    "https://images.unsplash.com/photo-1540420773420-3366772f4999?w=600&h=400&fit=crop&q=80",
    "https://images.unsplash.com/photo-1607532941433-304659e8198a?w=600&h=400&fit=crop&q=80",
  ],
  dessert: [
    "https://images.unsplash.com/photo-1551024506-0bccd828d307?w=600&h=400&fit=crop&q=80",
    "https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=600&h=400&fit=crop&q=80",
    "https://images.unsplash.com/photo-1488477181946-6428a0291777?w=600&h=400&fit=crop&q=80",
    "https://images.unsplash.com/photo-1587314168485-3236d6710814?w=600&h=400&fit=crop&q=80",
  ],
  sandwich: [
    "https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=600&h=400&fit=crop&q=80",
    "https://images.unsplash.com/photo-1553909489-cd47e0907980?w=600&h=400&fit=crop&q=80",
    "https://images.unsplash.com/photo-1481070555726-e2fe8357725c?w=600&h=400&fit=crop&q=80",
  ],
  pasta: [
    "https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?w=600&h=400&fit=crop&q=80",
    "https://images.unsplash.com/photo-1563379926898-05f4575a45d8?w=600&h=400&fit=crop&q=80",
    "https://images.unsplash.com/photo-1555949258-eb67b1ef0ceb?w=600&h=400&fit=crop&q=80",
  ],
  biryani: [
    "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=600&h=400&fit=crop&q=80",
    "https://images.unsplash.com/photo-1589302168068-964664d93dc0?w=600&h=400&fit=crop&q=80",
  ],
  rice: [
    "https://images.unsplash.com/photo-1596097635121-14b63a7cec75?w=600&h=400&fit=crop&q=80",
    "https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=600&h=400&fit=crop&q=80",
  ],
  paneer: [
    "https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=600&h=400&fit=crop&q=80",
    "https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?w=600&h=400&fit=crop&q=80",
  ],
  chicken: [
    "https://images.unsplash.com/photo-1598515214211-89d3c73ae83b?w=600&h=400&fit=crop&q=80",
    "https://images.unsplash.com/photo-1610057099443-fde6c99db9e1?w=600&h=400&fit=crop&q=80",
    "https://images.unsplash.com/photo-1632778149955-e80f8ceca2e8?w=600&h=400&fit=crop&q=80",
  ],
  default: [
    "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=600&h=400&fit=crop&q=80",
    "https://images.unsplash.com/photo-1498837167922-ddd27525d352?w=600&h=400&fit=crop&q=80",
    "https://images.unsplash.com/photo-1476224203421-9ac39bcb3327?w=600&h=400&fit=crop&q=80",
    "https://images.unsplash.com/photo-1499028344343-cd173ffc68a9?w=600&h=400&fit=crop&q=80",
    "https://images.unsplash.com/photo-1493770348161-369560ae357d?w=600&h=400&fit=crop&q=80",
  ],
};

// Keywords to match items to category pools
const CATEGORY_KEYWORDS: [string[], string][] = [
  [["pizza"], "pizza"],
  [["burger"], "burger"],
  [["roll", "wrap", "shawarma", "kathi"], "roll"],
  [["coffee", "latte", "cappuccino", "espresso"], "coffee"],
  [["shake", "milkshake", "smoothie"], "shake"],
  [["mojito", "mocktail", "drink", "soda", "lemonade", "juice", "beverage", "cooler"], "mocktail"],
  [["fries", "french fries", "wedges"], "fries"],
  [["bread", "toast", "garlic bread", "bun"], "bread"],
  [["momo", "dumpling"], "momo"],
  [["noodle", "chow", "hakka"], "noodle"],
  [["chinese", "manchurian"], "chinese"],
  [["chaat", "poha", "bhalla", "tikki"], "chaat"],
  [["parantha", "paratha", "kulcha", "roti", "naan"], "parantha"],
  [["dosa", "idli", "uttapam", "south indian"], "dosa"],
  [["salad"], "salad"],
  [["dessert", "ice cream", "brownie", "cake", "sundae", "pastry", "gulab"], "dessert"],
  [["sandwich", "sub", "club"], "sandwich"],
  [["pasta", "spaghetti", "penne", "macaroni"], "pasta"],
  [["biryani", "pulao"], "biryani"],
  [["rice", "fried rice", "jeera rice"], "rice"],
  [["paneer", "tikka", "malai"], "paneer"],
  [["chicken", "tandoori", "wings"], "chicken"],
];

function detectCategory(itemName: string, categoryName: string): string {
  const combined = (itemName + " " + categoryName).toLowerCase();
  
  for (const [keywords, pool] of CATEGORY_KEYWORDS) {
    for (const kw of keywords) {
      if (combined.includes(kw)) {
        return pool;
      }
    }
  }
  return "default";
}

export const getFallbackImage = (itemName: string, categoryName: string = ""): string => {
  const pool = detectCategory(itemName, categoryName);
  const images = IMAGE_POOLS[pool] || IMAGE_POOLS.default;
  
  // Use item name hash to deterministically pick a unique image
  const index = hashString(itemName.toLowerCase().trim()) % images.length;
  return images[index];
};
