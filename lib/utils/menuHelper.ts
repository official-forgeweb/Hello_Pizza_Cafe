/**
 * Returns a high-quality Wikimedia placeholder image based on the item name and category name.
 */
export const getFallbackImage = (itemName: string, categoryName: string = ""): string => {
  const name = itemName.toLowerCase();
  const cat = categoryName.toLowerCase();
  
  if (name.includes("pizza") || cat.includes("pizza")) {
    return "https://upload.wikimedia.org/wikipedia/commons/9/91/Pizza-3007395.jpg";
  }
  if (name.includes("burger") || cat.includes("burger")) {
    return "https://upload.wikimedia.org/wikipedia/commons/4/4d/Cheeseburger.jpg";
  }
  if (name.includes("roll") || name.includes("wrap") || cat.includes("roll") || cat.includes("wrap")) {
    return "https://upload.wikimedia.org/wikipedia/commons/e/ec/Shawarma_2020.jpg";
  }
  if (name.includes("coffee") || name.includes("shake") || cat.includes("coffee") || cat.includes("shake")) {
    return "https://upload.wikimedia.org/wikipedia/commons/c/c5/Iced_Coffee_in_Glass.jpg";
  }
  if (name.includes("mojito") || name.includes("mocktail") || name.includes("drink") || cat.includes("mocktail") || cat.includes("beverag") || cat.includes("drink")) {
    return "https://upload.wikimedia.org/wikipedia/commons/d/da/Mojito_glass.jpg";
  }
  if (name.includes("fries") || cat.includes("fries")) {
    return "https://upload.wikimedia.org/wikipedia/commons/c/c2/French_Fries_in_Paris.jpg";
  }
  if (name.includes("bread") || name.includes("toast") || cat.includes("bread") || cat.includes("toast")) {
    return "https://upload.wikimedia.org/wikipedia/commons/d/d4/Garlic_bread_ex.JPG";
  }
  if (name.includes("momo") || name.includes("chinese") || name.includes("noodle") || cat.includes("momo") || cat.includes("chinese")) {
    return "https://upload.wikimedia.org/wikipedia/commons/a/a1/Momo_Nepal.jpg";
  }
  if (name.includes("chaat") || name.includes("poha") || name.includes("bhalla") || cat.includes("chaat")) {
    return "https://upload.wikimedia.org/wikipedia/commons/b/bb/Samosa_Chaat.jpg";
  }
  if (name.includes("parantha") || cat.includes("parantha")) {
    return "https://upload.wikimedia.org/wikipedia/commons/8/8c/Aloo_Paratha_unrolled.jpg";
  }
  if (name.includes("dosa") || name.includes("idli") || cat.includes("dosa")) {
    return "https://upload.wikimedia.org/wikipedia/commons/0/0b/Plain_Dosa%2C_Sambar_and_Chutney.jpg";
  }
  if (name.includes("salad") || cat.includes("salad")) {
    return "https://upload.wikimedia.org/wikipedia/commons/9/94/Salad_platter.jpg";
  }
  if (name.includes("dessert") || name.includes("ice cream") || name.includes("brownie") || name.includes("cake") || cat.includes("dessert") || cat.includes("ice cream")) {
    return "https://upload.wikimedia.org/wikipedia/commons/d/d8/Strawberry_ice_cream_cone.jpg";
  }
  
  // Default general food placeholder
  return "https://upload.wikimedia.org/wikipedia/commons/6/6d/Good_Food_Display_-_GDFL.jpg";
};
