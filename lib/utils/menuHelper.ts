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
    "https://images.unsplash.com/photo-1513104890138-7c749659a591?ixid=M3w5MjcyNjF8MHwxfHNlYXJjaHwxfHxwaXp6YSUyMGZvb2R8ZW58MHwwfHx8MTc3OTc4OTU2NHww&ixlib=rb-4.1.0&w=600&h=400&fit=crop&q=80",
    "https://images.unsplash.com/photo-1604382354936-07c5d9983bd3?ixid=M3w5MjcyNjF8MHwxfHNlYXJjaHwyfHxwaXp6YSUyMGZvb2R8ZW58MHwwfHx8MTc3OTc4OTU2NHww&ixlib=rb-4.1.0&w=600&h=400&fit=crop&q=80",
    "https://images.unsplash.com/photo-1574071318508-1cdbab80d002?ixid=M3w5MjcyNjF8MHwxfHNlYXJjaHwzfHxwaXp6YSUyMGZvb2R8ZW58MHwwfHx8MTc3OTc4OTU2NHww&ixlib=rb-4.1.0&w=600&h=400&fit=crop&q=80",
    "https://images.unsplash.com/photo-1611915365928-565c527a0590?ixid=M3w5MjcyNjF8MHwxfHNlYXJjaHw0fHxwaXp6YSUyMGZvb2R8ZW58MHwwfHx8MTc3OTc4OTU2NHww&ixlib=rb-4.1.0&w=600&h=400&fit=crop&q=80",
    "https://images.unsplash.com/photo-1590947132387-155cc02f3212?ixid=M3w5MjcyNjF8MHwxfHNlYXJjaHw1fHxwaXp6YSUyMGZvb2R8ZW58MHwwfHx8MTc3OTc4OTU2NHww&ixlib=rb-4.1.0&w=600&h=400&fit=crop&q=80",
    "https://images.unsplash.com/photo-1506354666786-959d6d497f1a?ixid=M3w5MjcyNjF8MHwxfHNlYXJjaHw2fHxwaXp6YSUyMGZvb2R8ZW58MHwwfHx8MTc3OTc4OTU2NHww&ixlib=rb-4.1.0&w=600&h=400&fit=crop&q=80",
    "https://images.unsplash.com/photo-1669895616443-5d21d5acc6e0?ixid=M3w5MjcyNjF8MHwxfHNlYXJjaHw3fHxwaXp6YSUyMGZvb2R8ZW58MHwwfHx8MTc3OTc4OTU2NHww&ixlib=rb-4.1.0&w=600&h=400&fit=crop&q=80",
    "https://images.unsplash.com/photo-1571407970349-bc81e7e96d47?ixid=M3w5MjcyNjF8MHwxfHNlYXJjaHw4fHxwaXp6YSUyMGZvb2R8ZW58MHwwfHx8MTc3OTc4OTU2NHww&ixlib=rb-4.1.0&w=600&h=400&fit=crop&q=80",
    "https://images.unsplash.com/photo-1595854341625-f33ee10dbf94?ixid=M3w5MjcyNjF8MHwxfHNlYXJjaHw5fHxwaXp6YSUyMGZvb2R8ZW58MHwwfHx8MTc3OTc4OTU2NHww&ixlib=rb-4.1.0&w=600&h=400&fit=crop&q=80",
    "https://images.unsplash.com/photo-1716237389458-be18cf75fafe?ixid=M3w5MjcyNjF8MHwxfHNlYXJjaHwxMHx8cGl6emElMjBmb29kfGVufDB8MHx8fDE3Nzk3ODk1NjR8MA&ixlib=rb-4.1.0&w=600&h=400&fit=crop&q=80",
    "https://images.unsplash.com/photo-1600628421066-f6bda6a7b976?ixid=M3w5MjcyNjF8MHwxfHNlYXJjaHwxMXx8cGl6emElMjBmb29kfGVufDB8MHx8fDE3Nzk3ODk1NjR8MA&ixlib=rb-4.1.0&w=600&h=400&fit=crop&q=80",
    "https://images.unsplash.com/photo-1542834369-f10ebf06d3e0?ixid=M3w5MjcyNjF8MHwxfHNlYXJjaHwxMnx8cGl6emElMjBmb29kfGVufDB8MHx8fDE3Nzk3ODk1NjR8MA&ixlib=rb-4.1.0&w=600&h=400&fit=crop&q=80",
  ],
  burger: [
    "https://images.unsplash.com/photo-1572802419224-296b0aeee0d9?ixid=M3w5MjcyNjF8MHwxfHNlYXJjaHwxfHxidXJnZXIlMjBmb29kfGVufDB8MHx8fDE3Nzk3ODk1NjV8MA&ixlib=rb-4.1.0&w=600&h=400&fit=crop&q=80",
    "https://images.unsplash.com/photo-1571091718767-18b5b1457add?ixid=M3w5MjcyNjF8MHwxfHNlYXJjaHwyfHxidXJnZXIlMjBmb29kfGVufDB8MHx8fDE3Nzk3ODk1NjV8MA&ixlib=rb-4.1.0&w=600&h=400&fit=crop&q=80",
    "https://images.unsplash.com/photo-1561758033-d89a9ad46330?ixid=M3w5MjcyNjF8MHwxfHNlYXJjaHwzfHxidXJnZXIlMjBmb29kfGVufDB8MHx8fDE3Nzk3ODk1NjV8MA&ixlib=rb-4.1.0&w=600&h=400&fit=crop&q=80",
    "https://images.unsplash.com/photo-1551782450-a2132b4ba21d?ixid=M3w5MjcyNjF8MHwxfHNlYXJjaHw0fHxidXJnZXIlMjBmb29kfGVufDB8MHx8fDE3Nzk3ODk1NjV8MA&ixlib=rb-4.1.0&w=600&h=400&fit=crop&q=80",
    "https://images.unsplash.com/photo-1594212699903-ec8a3eca50f5?ixid=M3w5MjcyNjF8MHwxfHNlYXJjaHw1fHxidXJnZXIlMjBmb29kfGVufDB8MHx8fDE3Nzk3ODk1NjV8MA&ixlib=rb-4.1.0&w=600&h=400&fit=crop&q=80",
    "https://images.unsplash.com/photo-1499028344343-cd173ffc68a9?ixid=M3w5MjcyNjF8MHwxfHNlYXJjaHw2fHxidXJnZXIlMjBmb29kfGVufDB8MHx8fDE3Nzk3ODk1NjV8MA&ixlib=rb-4.1.0&w=600&h=400&fit=crop&q=80",
    "https://images.unsplash.com/photo-1460306855393-0410f61241c7?ixid=M3w5MjcyNjF8MHwxfHNlYXJjaHw3fHxidXJnZXIlMjBmb29kfGVufDB8MHx8fDE3Nzk3ODk1NjV8MA&ixlib=rb-4.1.0&w=600&h=400&fit=crop&q=80",
    "https://images.unsplash.com/photo-1512152272829-e3139592d56f?ixid=M3w5MjcyNjF8MHwxfHNlYXJjaHw4fHxidXJnZXIlMjBmb29kfGVufDB8MHx8fDE3Nzk3ODk1NjV8MA&ixlib=rb-4.1.0&w=600&h=400&fit=crop&q=80",
    "https://images.unsplash.com/photo-1586816001966-79b736744398?ixid=M3w5MjcyNjF8MHwxfHNlYXJjaHw5fHxidXJnZXIlMjBmb29kfGVufDB8MHx8fDE3Nzk3ODk1NjV8MA&ixlib=rb-4.1.0&w=600&h=400&fit=crop&q=80",
    "https://images.unsplash.com/photo-1610970878459-a0e464d7592b?ixid=M3w5MjcyNjF8MHwxfHNlYXJjaHwxMHx8YnVyZ2VyJTIwZm9vZHxlbnwwfDB8fHwxNzc5Nzg5NTY1fDA&ixlib=rb-4.1.0&w=600&h=400&fit=crop&q=80",
    "https://images.unsplash.com/photo-1551782450-17144efb9c50?ixid=M3w5MjcyNjF8MHwxfHNlYXJjaHwxMXx8YnVyZ2VyJTIwZm9vZHxlbnwwfDB8fHwxNzc5Nzg5NTY1fDA&ixlib=rb-4.1.0&w=600&h=400&fit=crop&q=80",
    "https://images.unsplash.com/photo-1571091655789-405eb7a3a3a8?ixid=M3w5MjcyNjF8MHwxfHNlYXJjaHwxMnx8YnVyZ2VyJTIwZm9vZHxlbnwwfDB8fHwxNzc5Nzg5NTY1fDA&ixlib=rb-4.1.0&w=600&h=400&fit=crop&q=80",
  ],
  roll: [
    "https://images.unsplash.com/photo-1734988149239-85943a98833c?ixid=M3w5MjcyNjF8MHwxfHNlYXJjaHwxfHx3cmFwJTIwcm9sbCUyMGZvb2R8ZW58MHwwfHx8MTc3OTc4OTU2N3ww&ixlib=rb-4.1.0&w=600&h=400&fit=crop&q=80",
    "https://images.unsplash.com/photo-1578823126918-40a7dd2d9fa5?ixid=M3w5MjcyNjF8MHwxfHNlYXJjaHwyfHx3cmFwJTIwcm9sbCUyMGZvb2R8ZW58MHwwfHx8MTc3OTc4OTU2N3ww&ixlib=rb-4.1.0&w=600&h=400&fit=crop&q=80",
  ],
  coffee: [
    "https://images.unsplash.com/photo-1541167760496-1628856ab772?ixid=M3w5MjcyNjF8MHwxfHNlYXJjaHwxfHxjb2ZmZWUlMjBkcmlua3xlbnwwfDB8fHwxNzc5Nzg5NTY4fDA&ixlib=rb-4.1.0&w=600&h=400&fit=crop&q=80",
    "https://images.unsplash.com/photo-1506619216599-9d16d0903dfd?ixid=M3w5MjcyNjF8MHwxfHNlYXJjaHwyfHxjb2ZmZWUlMjBkcmlua3xlbnwwfDB8fHwxNzc5Nzg5NTY4fDA&ixlib=rb-4.1.0&w=600&h=400&fit=crop&q=80",
    "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?ixid=M3w5MjcyNjF8MHwxfHNlYXJjaHwzfHxjb2ZmZWUlMjBkcmlua3xlbnwwfDB8fHwxNzc5Nzg5NTY4fDA&ixlib=rb-4.1.0&w=600&h=400&fit=crop&q=80",
    "https://images.unsplash.com/photo-1497515114629-f71d768fd07c?ixid=M3w5MjcyNjF8MHwxfHNlYXJjaHw0fHxjb2ZmZWUlMjBkcmlua3xlbnwwfDB8fHwxNzc5Nzg5NTY4fDA&ixlib=rb-4.1.0&w=600&h=400&fit=crop&q=80",
    "https://images.unsplash.com/photo-1461023058943-07fcbe16d735?ixid=M3w5MjcyNjF8MHwxfHNlYXJjaHw1fHxjb2ZmZWUlMjBkcmlua3xlbnwwfDB8fHwxNzc5Nzg5NTY4fDA&ixlib=rb-4.1.0&w=600&h=400&fit=crop&q=80",
    "https://images.unsplash.com/photo-1506372023823-741c83b836fe?ixid=M3w5MjcyNjF8MHwxfHNlYXJjaHw2fHxjb2ZmZWUlMjBkcmlua3xlbnwwfDB8fHwxNzc5Nzg5NTY4fDA&ixlib=rb-4.1.0&w=600&h=400&fit=crop&q=80",
    "https://images.unsplash.com/photo-1502462041640-b3d7e50d0662?ixid=M3w5MjcyNjF8MHwxfHNlYXJjaHw3fHxjb2ZmZWUlMjBkcmlua3xlbnwwfDB8fHwxNzc5Nzg5NTY4fDA&ixlib=rb-4.1.0&w=600&h=400&fit=crop&q=80",
    "https://images.unsplash.com/photo-1598908314732-07113901949e?ixid=M3w5MjcyNjF8MHwxfHNlYXJjaHw4fHxjb2ZmZWUlMjBkcmlua3xlbnwwfDB8fHwxNzc5Nzg5NTY4fDA&ixlib=rb-4.1.0&w=600&h=400&fit=crop&q=80",
    "https://images.unsplash.com/photo-1504630083234-14187a9df0f5?ixid=M3w5MjcyNjF8MHwxfHNlYXJjaHw5fHxjb2ZmZWUlMjBkcmlua3xlbnwwfDB8fHwxNzc5Nzg5NTY4fDA&ixlib=rb-4.1.0&w=600&h=400&fit=crop&q=80",
    "https://images.unsplash.com/photo-1536227661368-deef57acf708?ixid=M3w5MjcyNjF8MHwxfHNlYXJjaHwxMHx8Y29mZmVlJTIwZHJpbmt8ZW58MHwwfHx8MTc3OTc4OTU2OHww&ixlib=rb-4.1.0&w=600&h=400&fit=crop&q=80",
    "https://images.unsplash.com/photo-1503481766315-7a586b20f66d?ixid=M3w5MjcyNjF8MHwxfHNlYXJjaHwxMXx8Y29mZmVlJTIwZHJpbmt8ZW58MHwwfHx8MTc3OTc4OTU2OHww&ixlib=rb-4.1.0&w=600&h=400&fit=crop&q=80",
    "https://images.unsplash.com/photo-1567309966795-5ad24aa39971?ixid=M3w5MjcyNjF8MHwxfHNlYXJjaHwxMnx8Y29mZmVlJTIwZHJpbmt8ZW58MHwwfHx8MTc3OTc4OTU2OHww&ixlib=rb-4.1.0&w=600&h=400&fit=crop&q=80",
  ],
  shake: [
    "https://images.unsplash.com/photo-1579954115545-a95591f28bfc?ixid=M3w5MjcyNjF8MHwxfHNlYXJjaHwxfHxtaWxrc2hha2V8ZW58MHwwfHx8MTc3OTc4OTU2OXww&ixlib=rb-4.1.0&w=600&h=400&fit=crop&q=80",
    "https://images.unsplash.com/photo-1678712803863-6cd22f6b9dba?ixid=M3w5MjcyNjF8MHwxfHNlYXJjaHwyfHxtaWxrc2hha2V8ZW58MHwwfHx8MTc3OTc4OTU2OXww&ixlib=rb-4.1.0&w=600&h=400&fit=crop&q=80",
    "https://images.unsplash.com/photo-1528740096961-3798add19cb7?ixid=M3w5MjcyNjF8MHwxfHNlYXJjaHwzfHxtaWxrc2hha2V8ZW58MHwwfHx8MTc3OTc4OTU2OXww&ixlib=rb-4.1.0&w=600&h=400&fit=crop&q=80",
    "https://images.unsplash.com/photo-1541658016709-82535e94bc69?ixid=M3w5MjcyNjF8MHwxfHNlYXJjaHw0fHxtaWxrc2hha2V8ZW58MHwwfHx8MTc3OTc4OTU2OXww&ixlib=rb-4.1.0&w=600&h=400&fit=crop&q=80",
    "https://images.unsplash.com/photo-1625242662167-9ba73d268139?ixid=M3w5MjcyNjF8MHwxfHNlYXJjaHw1fHxtaWxrc2hha2V8ZW58MHwwfHx8MTc3OTc4OTU2OXww&ixlib=rb-4.1.0&w=600&h=400&fit=crop&q=80",
    "https://images.unsplash.com/photo-1662192511709-e75d67367638?ixid=M3w5MjcyNjF8MHwxfHNlYXJjaHw2fHxtaWxrc2hha2V8ZW58MHwwfHx8MTc3OTc4OTU2OXww&ixlib=rb-4.1.0&w=600&h=400&fit=crop&q=80",
    "https://images.unsplash.com/photo-1588775226864-8f71b7b86420?ixid=M3w5MjcyNjF8MHwxfHNlYXJjaHw3fHxtaWxrc2hha2V8ZW58MHwwfHx8MTc3OTc4OTU2OXww&ixlib=rb-4.1.0&w=600&h=400&fit=crop&q=80",
    "https://images.unsplash.com/photo-1696487774050-ba56e4b62359?ixid=M3w5MjcyNjF8MHwxfHNlYXJjaHw4fHxtaWxrc2hha2V8ZW58MHwwfHx8MTc3OTc4OTU2OXww&ixlib=rb-4.1.0&w=600&h=400&fit=crop&q=80",
    "https://images.unsplash.com/photo-1635415720363-99434d8fcf11?ixid=M3w5MjcyNjF8MHwxfHNlYXJjaHw5fHxtaWxrc2hha2V8ZW58MHwwfHx8MTc3OTc4OTU2OXww&ixlib=rb-4.1.0&w=600&h=400&fit=crop&q=80",
    "https://images.unsplash.com/photo-1591864384134-8a21ffb51cb5?ixid=M3w5MjcyNjF8MHwxfHNlYXJjaHwxMHx8bWlsa3NoYWtlfGVufDB8MHx8fDE3Nzk3ODk1Njl8MA&ixlib=rb-4.1.0&w=600&h=400&fit=crop&q=80",
    "https://images.unsplash.com/photo-1714799263245-4fc7cc21911e?ixid=M3w5MjcyNjF8MHwxfHNlYXJjaHwxMXx8bWlsa3NoYWtlfGVufDB8MHx8fDE3Nzk3ODk1Njl8MA&ixlib=rb-4.1.0&w=600&h=400&fit=crop&q=80",
    "https://images.unsplash.com/photo-1603903631623-3a1f769e45cf?ixid=M3w5MjcyNjF8MHwxfHNlYXJjaHwxMnx8bWlsa3NoYWtlfGVufDB8MHx8fDE3Nzk3ODk1Njl8MA&ixlib=rb-4.1.0&w=600&h=400&fit=crop&q=80",
  ],
  mocktail: [
    "https://images.unsplash.com/photo-1551024709-8f23befc6f87?ixid=M3w5MjcyNjF8MHwxfHNlYXJjaHwxfHxjb2NrdGFpbCUyMG1vY2t0YWlsJTIwZHJpbmt8ZW58MHwwfHx8MTc3OTc4OTU3MHww&ixlib=rb-4.1.0&w=600&h=400&fit=crop&q=80",
    "https://images.unsplash.com/photo-1514361892635-6b07e31e75f9?ixid=M3w5MjcyNjF8MHwxfHNlYXJjaHwyfHxjb2NrdGFpbCUyMG1vY2t0YWlsJTIwZHJpbmt8ZW58MHwwfHx8MTc3OTc4OTU3MHww&ixlib=rb-4.1.0&w=600&h=400&fit=crop&q=80",
    "https://images.unsplash.com/photo-1595981267035-7b04ca84a82d?ixid=M3w5MjcyNjF8MHwxfHNlYXJjaHwzfHxjb2NrdGFpbCUyMG1vY2t0YWlsJTIwZHJpbmt8ZW58MHwwfHx8MTc3OTc4OTU3MHww&ixlib=rb-4.1.0&w=600&h=400&fit=crop&q=80",
    "https://images.unsplash.com/photo-1654074518423-750767f571a9?ixid=M3w5MjcyNjF8MHwxfHNlYXJjaHw0fHxjb2NrdGFpbCUyMG1vY2t0YWlsJTIwZHJpbmt8ZW58MHwwfHx8MTc3OTc4OTU3MHww&ixlib=rb-4.1.0&w=600&h=400&fit=crop&q=80",
    "https://images.unsplash.com/photo-1654074518426-7ef871efccce?ixid=M3w5MjcyNjF8MHwxfHNlYXJjaHw1fHxjb2NrdGFpbCUyMG1vY2t0YWlsJTIwZHJpbmt8ZW58MHwwfHx8MTc3OTc4OTU3MHww&ixlib=rb-4.1.0&w=600&h=400&fit=crop&q=80",
    "https://images.unsplash.com/photo-1551782450-3939704166fc?ixid=M3w5MjcyNjF8MHwxfHNlYXJjaHw2fHxjb2NrdGFpbCUyMG1vY2t0YWlsJTIwZHJpbmt8ZW58MHwwfHx8MTc3OTc4OTU3MHww&ixlib=rb-4.1.0&w=600&h=400&fit=crop&q=80",
    "https://images.unsplash.com/photo-1641924671908-43928ddba115?ixid=M3w5MjcyNjF8MHwxfHNlYXJjaHw3fHxjb2NrdGFpbCUyMG1vY2t0YWlsJTIwZHJpbmt8ZW58MHwwfHx8MTc3OTc4OTU3MHww&ixlib=rb-4.1.0&w=600&h=400&fit=crop&q=80",
    "https://images.unsplash.com/photo-1596463989140-3b600dab72e5?ixid=M3w5MjcyNjF8MHwxfHNlYXJjaHw4fHxjb2NrdGFpbCUyMG1vY2t0YWlsJTIwZHJpbmt8ZW58MHwwfHx8MTc3OTc4OTU3MHww&ixlib=rb-4.1.0&w=600&h=400&fit=crop&q=80",
    "https://images.unsplash.com/photo-1671118718666-54ef852a769a?ixid=M3w5MjcyNjF8MHwxfHNlYXJjaHw5fHxjb2NrdGFpbCUyMG1vY2t0YWlsJTIwZHJpbmt8ZW58MHwwfHx8MTc3OTc4OTU3MHww&ixlib=rb-4.1.0&w=600&h=400&fit=crop&q=80",
    "https://images.unsplash.com/photo-1654074517219-85e6f3f6f85d?ixid=M3w5MjcyNjF8MHwxfHNlYXJjaHwxMHx8Y29ja3RhaWwlMjBtb2NrdGFpbCUyMGRyaW5rfGVufDB8MHx8fDE3Nzk3ODk1NzB8MA&ixlib=rb-4.1.0&w=600&h=400&fit=crop&q=80",
    "https://images.unsplash.com/photo-1514361526511-a1ecd83f89d1?ixid=M3w5MjcyNjF8MHwxfHNlYXJjaHwxMXx8Y29ja3RhaWwlMjBtb2NrdGFpbCUyMGRyaW5rfGVufDB8MHx8fDE3Nzk3ODk1NzB8MA&ixlib=rb-4.1.0&w=600&h=400&fit=crop&q=80",
    "https://images.unsplash.com/photo-1619604395920-a16f33192a50?ixid=M3w5MjcyNjF8MHwxfHNlYXJjaHwxMnx8Y29ja3RhaWwlMjBtb2NrdGFpbCUyMGRyaW5rfGVufDB8MHx8fDE3Nzk3ODk1NzB8MA&ixlib=rb-4.1.0&w=600&h=400&fit=crop&q=80",
  ],
  fries: [
    "https://images.unsplash.com/photo-1630384060421-cb20d0e0649d?ixid=M3w5MjcyNjF8MHwxfHNlYXJjaHwxfHxmcmVuY2glMjBmcmllc3xlbnwwfDB8fHwxNzc5Nzg5NTcyfDA&ixlib=rb-4.1.0&w=600&h=400&fit=crop&q=80",
    "https://images.unsplash.com/photo-1518013431117-eb1465fa5752?ixid=M3w5MjcyNjF8MHwxfHNlYXJjaHwyfHxmcmVuY2glMjBmcmllc3xlbnwwfDB8fHwxNzc5Nzg5NTcyfDA&ixlib=rb-4.1.0&w=600&h=400&fit=crop&q=80",
    "https://images.unsplash.com/photo-1585109649139-366815a0d713?ixid=M3w5MjcyNjF8MHwxfHNlYXJjaHwzfHxmcmVuY2glMjBmcmllc3xlbnwwfDB8fHwxNzc5Nzg5NTcyfDA&ixlib=rb-4.1.0&w=600&h=400&fit=crop&q=80",
    "https://images.unsplash.com/photo-1541592106381-b31e9677c0e5?ixid=M3w5MjcyNjF8MHwxfHNlYXJjaHw0fHxmcmVuY2glMjBmcmllc3xlbnwwfDB8fHwxNzc5Nzg5NTcyfDA&ixlib=rb-4.1.0&w=600&h=400&fit=crop&q=80",
    "https://images.unsplash.com/photo-1688978181542-87a886a16fbe?ixid=M3w5MjcyNjF8MHwxfHNlYXJjaHw1fHxmcmVuY2glMjBmcmllc3xlbnwwfDB8fHwxNzc5Nzg5NTcyfDA&ixlib=rb-4.1.0&w=600&h=400&fit=crop&q=80",
    "https://images.unsplash.com/photo-1605262157780-8910063b2bf9?ixid=M3w5MjcyNjF8MHwxfHNlYXJjaHw2fHxmcmVuY2glMjBmcmllc3xlbnwwfDB8fHwxNzc5Nzg5NTcyfDA&ixlib=rb-4.1.0&w=600&h=400&fit=crop&q=80",
    "https://images.unsplash.com/photo-1661081090290-9b66fd49d882?ixid=M3w5MjcyNjF8MHwxfHNlYXJjaHw3fHxmcmVuY2glMjBmcmllc3xlbnwwfDB8fHwxNzc5Nzg5NTcyfDA&ixlib=rb-4.1.0&w=600&h=400&fit=crop&q=80",
    "https://images.unsplash.com/photo-1594212699903-ec8a3eca50f5?ixid=M3w5MjcyNjF8MHwxfHNlYXJjaHw4fHxmcmVuY2glMjBmcmllc3xlbnwwfDB8fHwxNzc5Nzg5NTcyfDA&ixlib=rb-4.1.0&w=600&h=400&fit=crop&q=80",
    "https://images.unsplash.com/photo-1676566399758-51b0d3927d48?ixid=M3w5MjcyNjF8MHwxfHNlYXJjaHw5fHxmcmVuY2glMjBmcmllc3xlbnwwfDB8fHwxNzc5Nzg5NTcyfDA&ixlib=rb-4.1.0&w=600&h=400&fit=crop&q=80",
    "https://images.unsplash.com/photo-1600891964092-4316c288032e?ixid=M3w5MjcyNjF8MHwxfHNlYXJjaHwxMHx8ZnJlbmNoJTIwZnJpZXN8ZW58MHwwfHx8MTc3OTc4OTU3Mnww&ixlib=rb-4.1.0&w=600&h=400&fit=crop&q=80",
    "https://images.unsplash.com/photo-1707773726979-4b87cd1c838a?ixid=M3w5MjcyNjF8MHwxfHNlYXJjaHwxMXx8ZnJlbmNoJTIwZnJpZXN8ZW58MHwwfHx8MTc3OTc4OTU3Mnww&ixlib=rb-4.1.0&w=600&h=400&fit=crop&q=80",
    "https://images.unsplash.com/photo-1484009902830-a314db11070c?ixid=M3w5MjcyNjF8MHwxfHNlYXJjaHwxMnx8ZnJlbmNoJTIwZnJpZXN8ZW58MHwwfHx8MTc3OTc4OTU3Mnww&ixlib=rb-4.1.0&w=600&h=400&fit=crop&q=80",
  ],
  bread: [
    "https://images.unsplash.com/photo-1612827788868-c8632040ab64?ixid=M3w5MjcyNjF8MHwxfHNlYXJjaHwxfHxnYXJsaWMlMjBicmVhZCUyMHRvYXN0fGVufDB8MHx8fDE3Nzk3ODk1NzN8MA&ixlib=rb-4.1.0&w=600&h=400&fit=crop&q=80",
    "https://images.unsplash.com/photo-1619095762086-66b82f914dcf?ixid=M3w5MjcyNjF8MHwxfHNlYXJjaHwyfHxnYXJsaWMlMjBicmVhZCUyMHRvYXN0fGVufDB8MHx8fDE3Nzk3ODk1NzN8MA&ixlib=rb-4.1.0&w=600&h=400&fit=crop&q=80",
    "https://images.unsplash.com/photo-1619535860434-ba1d8fa12536?ixid=M3w5MjcyNjF8MHwxfHNlYXJjaHwzfHxnYXJsaWMlMjBicmVhZCUyMHRvYXN0fGVufDB8MHx8fDE3Nzk3ODk1NzN8MA&ixlib=rb-4.1.0&w=600&h=400&fit=crop&q=80",
    "https://images.unsplash.com/photo-1598785244280-7a428600d053?ixid=M3w5MjcyNjF8MHwxfHNlYXJjaHw0fHxnYXJsaWMlMjBicmVhZCUyMHRvYXN0fGVufDB8MHx8fDE3Nzk3ODk1NzN8MA&ixlib=rb-4.1.0&w=600&h=400&fit=crop&q=80",
    "https://images.unsplash.com/photo-1556008531-57e6eefc7be4?ixid=M3w5MjcyNjF8MHwxfHNlYXJjaHw1fHxnYXJsaWMlMjBicmVhZCUyMHRvYXN0fGVufDB8MHx8fDE3Nzk3ODk1NzN8MA&ixlib=rb-4.1.0&w=600&h=400&fit=crop&q=80",
    "https://images.unsplash.com/photo-1558679582-7fe9071024c9?ixid=M3w5MjcyNjF8MHwxfHNlYXJjaHw2fHxnYXJsaWMlMjBicmVhZCUyMHRvYXN0fGVufDB8MHx8fDE3Nzk3ODk1NzN8MA&ixlib=rb-4.1.0&w=600&h=400&fit=crop&q=80",
    "https://images.unsplash.com/photo-1558679582-dac5f374f01c?ixid=M3w5MjcyNjF8MHwxfHNlYXJjaHw3fHxnYXJsaWMlMjBicmVhZCUyMHRvYXN0fGVufDB8MHx8fDE3Nzk3ODk1NzN8MA&ixlib=rb-4.1.0&w=600&h=400&fit=crop&q=80",
    "https://images.unsplash.com/photo-1761344788266-5f6957aeea33?ixid=M3w5MjcyNjF8MHwxfHNlYXJjaHw4fHxnYXJsaWMlMjBicmVhZCUyMHRvYXN0fGVufDB8MHx8fDE3Nzk3ODk1NzN8MA&ixlib=rb-4.1.0&w=600&h=400&fit=crop&q=80",
    "https://images.unsplash.com/photo-1612544409881-b34e29453666?ixid=M3w5MjcyNjF8MHwxfHNlYXJjaHw5fHxnYXJsaWMlMjBicmVhZCUyMHRvYXN0fGVufDB8MHx8fDE3Nzk3ODk1NzN8MA&ixlib=rb-4.1.0&w=600&h=400&fit=crop&q=80",
    "https://images.unsplash.com/photo-1619531039667-928e5288a715?ixid=M3w5MjcyNjF8MHwxfHNlYXJjaHwxMHx8Z2FybGljJTIwYnJlYWQlMjB0b2FzdHxlbnwwfDB8fHwxNzc5Nzg5NTczfDA&ixlib=rb-4.1.0&w=600&h=400&fit=crop&q=80",
    "https://images.unsplash.com/photo-1619531039203-6ef429ef30b9?ixid=M3w5MjcyNjF8MHwxfHNlYXJjaHwxMXx8Z2FybGljJTIwYnJlYWQlMjB0b2FzdHxlbnwwfDB8fHwxNzc5Nzg5NTczfDA&ixlib=rb-4.1.0&w=600&h=400&fit=crop&q=80",
    "https://images.unsplash.com/photo-1619531039787-8905bd34b585?ixid=M3w5MjcyNjF8MHwxfHNlYXJjaHwxMnx8Z2FybGljJTIwYnJlYWQlMjB0b2FzdHxlbnwwfDB8fHwxNzc5Nzg5NTczfDA&ixlib=rb-4.1.0&w=600&h=400&fit=crop&q=80",
  ],
  momo: [
    "https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?ixid=M3w5MjcyNjF8MHwxfHNlYXJjaHwxfHxtb21vcyUyMGR1bXBsaW5nfGVufDB8MHx8fDE3Nzk3ODk1NzR8MA&ixlib=rb-4.1.0&w=600&h=400&fit=crop&q=80",
    "https://images.unsplash.com/photo-1625220194771-7ebdea0b70b9?ixid=M3w5MjcyNjF8MHwxfHNlYXJjaHwyfHxtb21vcyUyMGR1bXBsaW5nfGVufDB8MHx8fDE3Nzk3ODk1NzR8MA&ixlib=rb-4.1.0&w=600&h=400&fit=crop&q=80",
    "https://images.unsplash.com/photo-1738608084602-f9543952188e?ixid=M3w5MjcyNjF8MHwxfHNlYXJjaHwzfHxtb21vcyUyMGR1bXBsaW5nfGVufDB8MHx8fDE3Nzk3ODk1NzR8MA&ixlib=rb-4.1.0&w=600&h=400&fit=crop&q=80",
    "https://images.unsplash.com/photo-1496116218417-1a781b1c416c?ixid=M3w5MjcyNjF8MHwxfHNlYXJjaHw0fHxtb21vcyUyMGR1bXBsaW5nfGVufDB8MHx8fDE3Nzk3ODk1NzR8MA&ixlib=rb-4.1.0&w=600&h=400&fit=crop&q=80",
    "https://images.unsplash.com/photo-1638502338747-f7f368214cce?ixid=M3w5MjcyNjF8MHwxfHNlYXJjaHw1fHxtb21vcyUyMGR1bXBsaW5nfGVufDB8MHx8fDE3Nzk3ODk1NzR8MA&ixlib=rb-4.1.0&w=600&h=400&fit=crop&q=80",
    "https://images.unsplash.com/photo-1543198432-a20fa3055570?ixid=M3w5MjcyNjF8MHwxfHNlYXJjaHw2fHxtb21vcyUyMGR1bXBsaW5nfGVufDB8MHx8fDE3Nzk3ODk1NzR8MA&ixlib=rb-4.1.0&w=600&h=400&fit=crop&q=80",
    "https://images.unsplash.com/photo-1638502521795-89107ac5e246?ixid=M3w5MjcyNjF8MHwxfHNlYXJjaHw3fHxtb21vcyUyMGR1bXBsaW5nfGVufDB8MHx8fDE3Nzk3ODk1NzR8MA&ixlib=rb-4.1.0&w=600&h=400&fit=crop&q=80",
    "https://images.unsplash.com/photo-1589047133531-570405874c6a?ixid=M3w5MjcyNjF8MHwxfHNlYXJjaHw4fHxtb21vcyUyMGR1bXBsaW5nfGVufDB8MHx8fDE3Nzk3ODk1NzR8MA&ixlib=rb-4.1.0&w=600&h=400&fit=crop&q=80",
    "https://images.unsplash.com/photo-1541696432-82c6da8ce7bf?ixid=M3w5MjcyNjF8MHwxfHNlYXJjaHw5fHxtb21vcyUyMGR1bXBsaW5nfGVufDB8MHx8fDE3Nzk3ODk1NzR8MA&ixlib=rb-4.1.0&w=600&h=400&fit=crop&q=80",
    "https://images.unsplash.com/photo-1647999019630-dabe1a837693?ixid=M3w5MjcyNjF8MHwxfHNlYXJjaHwxMHx8bW9tb3MlMjBkdW1wbGluZ3xlbnwwfDB8fHwxNzc5Nzg5NTc0fDA&ixlib=rb-4.1.0&w=600&h=400&fit=crop&q=80",
    "https://images.unsplash.com/photo-1590385014317-6a78bc23b090?ixid=M3w5MjcyNjF8MHwxfHNlYXJjaHwxMXx8bW9tb3MlMjBkdW1wbGluZ3xlbnwwfDB8fHwxNzc5Nzg5NTc0fDA&ixlib=rb-4.1.0&w=600&h=400&fit=crop&q=80",
    "https://images.unsplash.com/photo-1619528395522-997915c3b518?ixid=M3w5MjcyNjF8MHwxfHNlYXJjaHwxMnx8bW9tb3MlMjBkdW1wbGluZ3xlbnwwfDB8fHwxNzc5Nzg5NTc0fDA&ixlib=rb-4.1.0&w=600&h=400&fit=crop&q=80",
  ],
  chinese: [
    "https://images.unsplash.com/photo-1643268972535-a2b100ff3632?ixid=M3w5MjcyNjF8MHwxfHNlYXJjaHwxfHxjaGluZXNlJTIwZm9vZCUyMG1hbmNodXJpYW58ZW58MHwwfHx8MTc3OTc4OTU3NXww&ixlib=rb-4.1.0&w=600&h=400&fit=crop&q=80",
  ],
  noodle: [
    "https://images.unsplash.com/photo-1598720290281-9f26ae6d6f81?ixid=M3w5MjcyNjF8MHwxfHNlYXJjaHwxfHxub29kbGVzJTIwcGFzdGF8ZW58MHwwfHx8MTc3OTc4OTU3N3ww&ixlib=rb-4.1.0&w=600&h=400&fit=crop&q=80",
    "https://images.unsplash.com/photo-1684707878393-02606f779d7f?ixid=M3w5MjcyNjF8MHwxfHNlYXJjaHwyfHxub29kbGVzJTIwcGFzdGF8ZW58MHwwfHx8MTc3OTc4OTU3N3ww&ixlib=rb-4.1.0&w=600&h=400&fit=crop&q=80",
    "https://images.unsplash.com/photo-1551183053-bf91a1d81141?ixid=M3w5MjcyNjF8MHwxfHNlYXJjaHwzfHxub29kbGVzJTIwcGFzdGF8ZW58MHwwfHx8MTc3OTc4OTU3N3ww&ixlib=rb-4.1.0&w=600&h=400&fit=crop&q=80",
    "https://images.unsplash.com/photo-1607328874071-45a9cd600644?ixid=M3w5MjcyNjF8MHwxfHNlYXJjaHw0fHxub29kbGVzJTIwcGFzdGF8ZW58MHwwfHx8MTc3OTc4OTU3N3ww&ixlib=rb-4.1.0&w=600&h=400&fit=crop&q=80",
    "https://images.unsplash.com/photo-1612966874574-e0a92ad2bc43?ixid=M3w5MjcyNjF8MHwxfHNlYXJjaHw1fHxub29kbGVzJTIwcGFzdGF8ZW58MHwwfHx8MTc3OTc4OTU3N3ww&ixlib=rb-4.1.0&w=600&h=400&fit=crop&q=80",
    "https://images.unsplash.com/photo-1597692493647-25bd4240a3f2?ixid=M3w5MjcyNjF8MHwxfHNlYXJjaHw2fHxub29kbGVzJTIwcGFzdGF8ZW58MHwwfHx8MTc3OTc4OTU3N3ww&ixlib=rb-4.1.0&w=600&h=400&fit=crop&q=80",
    "https://images.unsplash.com/photo-1608665000007-990496020c73?ixid=M3w5MjcyNjF8MHwxfHNlYXJjaHw3fHxub29kbGVzJTIwcGFzdGF8ZW58MHwwfHx8MTc3OTc4OTU3N3ww&ixlib=rb-4.1.0&w=600&h=400&fit=crop&q=80",
    "https://images.unsplash.com/photo-1597394412452-60ed971d3917?ixid=M3w5MjcyNjF8MHwxfHNlYXJjaHw4fHxub29kbGVzJTIwcGFzdGF8ZW58MHwwfHx8MTc3OTc4OTU3N3ww&ixlib=rb-4.1.0&w=600&h=400&fit=crop&q=80",
    "https://images.unsplash.com/photo-1603729362753-f8162ac6c3df?ixid=M3w5MjcyNjF8MHwxfHNlYXJjaHw5fHxub29kbGVzJTIwcGFzdGF8ZW58MHwwfHx8MTc3OTc4OTU3N3ww&ixlib=rb-4.1.0&w=600&h=400&fit=crop&q=80",
    "https://images.unsplash.com/photo-1646953568310-8def6eb5a317?ixid=M3w5MjcyNjF8MHwxfHNlYXJjaHwxMHx8bm9vZGxlcyUyMHBhc3RhfGVufDB8MHx8fDE3Nzk3ODk1Nzd8MA&ixlib=rb-4.1.0&w=600&h=400&fit=crop&q=80",
    "https://images.unsplash.com/photo-1559942144-92147a3adb0f?ixid=M3w5MjcyNjF8MHwxfHNlYXJjaHwxMXx8bm9vZGxlcyUyMHBhc3RhfGVufDB8MHx8fDE3Nzk3ODk1Nzd8MA&ixlib=rb-4.1.0&w=600&h=400&fit=crop&q=80",
    "https://images.unsplash.com/photo-1634864572865-1cf8ff8bd23d?ixid=M3w5MjcyNjF8MHwxfHNlYXJjaHwxMnx8bm9vZGxlcyUyMHBhc3RhfGVufDB8MHx8fDE3Nzk3ODk1Nzd8MA&ixlib=rb-4.1.0&w=600&h=400&fit=crop&q=80",
  ],
  chaat: [
    "https://images.unsplash.com/photo-1601050690597-df0568f70950?ixid=M3w5MjcyNjF8MHwxfHNlYXJjaHwxfHxpbmRpYW4lMjBjaGFhdCUyMHNhbW9zYXxlbnwwfDB8fHwxNzc5Nzg5NTc4fDA&ixlib=rb-4.1.0&w=600&h=400&fit=crop&q=80",
    "https://images.unsplash.com/photo-1732519970445-8f2d6998961f?ixid=M3w5MjcyNjF8MHwxfHNlYXJjaHwyfHxpbmRpYW4lMjBjaGFhdCUyMHNhbW9zYXxlbnwwfDB8fHwxNzc5Nzg5NTc4fDA&ixlib=rb-4.1.0&w=600&h=400&fit=crop&q=80",
    "https://images.unsplash.com/photo-1666190091090-1d312a4b04c2?ixid=M3w5MjcyNjF8MHwxfHNlYXJjaHwzfHxpbmRpYW4lMjBjaGFhdCUyMHNhbW9zYXxlbnwwfDB8fHwxNzc5Nzg5NTc4fDA&ixlib=rb-4.1.0&w=600&h=400&fit=crop&q=80",
    "https://images.unsplash.com/photo-1601050690117-94f5f6fa8bd7?ixid=M3w5MjcyNjF8MHwxfHNlYXJjaHw0fHxpbmRpYW4lMjBjaGFhdCUyMHNhbW9zYXxlbnwwfDB8fHwxNzc5Nzg5NTc4fDA&ixlib=rb-4.1.0&w=600&h=400&fit=crop&q=80",
    "https://images.unsplash.com/photo-1601050690294-397f3c324515?ixid=M3w5MjcyNjF8MHwxfHNlYXJjaHw1fHxpbmRpYW4lMjBjaGFhdCUyMHNhbW9zYXxlbnwwfDB8fHwxNzc5Nzg5NTc4fDA&ixlib=rb-4.1.0&w=600&h=400&fit=crop&q=80",
    "https://images.unsplash.com/photo-1589301773859-bb024d3ad558?ixid=M3w5MjcyNjF8MHwxfHNlYXJjaHw2fHxpbmRpYW4lMjBjaGFhdCUyMHNhbW9zYXxlbnwwfDB8fHwxNzc5Nzg5NTc4fDA&ixlib=rb-4.1.0&w=600&h=400&fit=crop&q=80",
    "https://images.unsplash.com/photo-1714799263348-41c7245cd714?ixid=M3w5MjcyNjF8MHwxfHNlYXJjaHw3fHxpbmRpYW4lMjBjaGFhdCUyMHNhbW9zYXxlbnwwfDB8fHwxNzc5Nzg5NTc4fDA&ixlib=rb-4.1.0&w=600&h=400&fit=crop&q=80",
    "https://images.unsplash.com/photo-1697155836252-d7f969108b5a?ixid=M3w5MjcyNjF8MHwxfHNlYXJjaHw4fHxpbmRpYW4lMjBjaGFhdCUyMHNhbW9zYXxlbnwwfDB8fHwxNzc5Nzg5NTc4fDA&ixlib=rb-4.1.0&w=600&h=400&fit=crop&q=80",
    "https://images.unsplash.com/photo-1597581366015-87b44b235ef8?ixid=M3w5MjcyNjF8MHwxfHNlYXJjaHw5fHxpbmRpYW4lMjBjaGFhdCUyMHNhbW9zYXxlbnwwfDB8fHwxNzc5Nzg5NTc4fDA&ixlib=rb-4.1.0&w=600&h=400&fit=crop&q=80",
    "https://images.unsplash.com/photo-1598087337774-9d0e877d9b2b?ixid=M3w5MjcyNjF8MHwxfHNlYXJjaHwxMHx8aW5kaWFuJTIwY2hhYXQlMjBzYW1vc2F8ZW58MHwwfHx8MTc3OTc4OTU3OHww&ixlib=rb-4.1.0&w=600&h=400&fit=crop&q=80",
    "https://images.unsplash.com/photo-1605333409672-4f7db57ba3a2?ixid=M3w5MjcyNjF8MHwxfHNlYXJjaHwxMXx8aW5kaWFuJTIwY2hhYXQlMjBzYW1vc2F8ZW58MHwwfHx8MTc3OTc4OTU3OHww&ixlib=rb-4.1.0&w=600&h=400&fit=crop&q=80",
    "https://images.unsplash.com/photo-1661105031570-35e4da706f6a?ixid=M3w5MjcyNjF8MHwxfHNlYXJjaHwxMnx8aW5kaWFuJTIwY2hhYXQlMjBzYW1vc2F8ZW58MHwwfHx8MTc3OTc4OTU3OHww&ixlib=rb-4.1.0&w=600&h=400&fit=crop&q=80",
  ],
  parantha: [
    "https://images.unsplash.com/photo-1683533743190-89c9b19f9ea6?ixid=M3w5MjcyNjF8MHwxfHNlYXJjaHwxfHxwYXJhdGhhJTIwcm90aSUyMG5hYW58ZW58MHwwfHx8MTc3OTc4OTU3OXww&ixlib=rb-4.1.0&w=600&h=400&fit=crop&q=80",
    "https://images.unsplash.com/photo-1683533746199-9e3920bf3eab?ixid=M3w5MjcyNjF8MHwxfHNlYXJjaHwyfHxwYXJhdGhhJTIwcm90aSUyMG5hYW58ZW58MHwwfHx8MTc3OTc4OTU3OXww&ixlib=rb-4.1.0&w=600&h=400&fit=crop&q=80",
    "https://images.unsplash.com/photo-1619714604882-db1396d4a718?ixid=M3w5MjcyNjF8MHwxfHNlYXJjaHwzfHxwYXJhdGhhJTIwcm90aSUyMG5hYW58ZW58MHwwfHx8MTc3OTc4OTU3OXww&ixlib=rb-4.1.0&w=600&h=400&fit=crop&q=80",
    "https://images.unsplash.com/photo-1655979284091-eea0e93405ee?ixid=M3w5MjcyNjF8MHwxfHNlYXJjaHw0fHxwYXJhdGhhJTIwcm90aSUyMG5hYW58ZW58MHwwfHx8MTc3OTc4OTU3OXww&ixlib=rb-4.1.0&w=600&h=400&fit=crop&q=80",
    "https://images.unsplash.com/photo-1583057341912-a0df64b8da4d?ixid=M3w5MjcyNjF8MHwxfHNlYXJjaHw1fHxwYXJhdGhhJTIwcm90aSUyMG5hYW58ZW58MHwwfHx8MTc3OTc4OTU3OXww&ixlib=rb-4.1.0&w=600&h=400&fit=crop&q=80",
    "https://images.unsplash.com/photo-1724116382212-2d18c7272318?ixid=M3w5MjcyNjF8MHwxfHNlYXJjaHw2fHxwYXJhdGhhJTIwcm90aSUyMG5hYW58ZW58MHwwfHx8MTc3OTc4OTU3OXww&ixlib=rb-4.1.0&w=600&h=400&fit=crop&q=80",
    "https://images.unsplash.com/photo-1722239312666-84328fce4c6f?ixid=M3w5MjcyNjF8MHwxfHNlYXJjaHw3fHxwYXJhdGhhJTIwcm90aSUyMG5hYW58ZW58MHwwfHx8MTc3OTc4OTU3OXww&ixlib=rb-4.1.0&w=600&h=400&fit=crop&q=80",
    "https://images.unsplash.com/photo-1754394483922-4d3a10cc6187?ixid=M3w5MjcyNjF8MHwxfHNlYXJjaHw4fHxwYXJhdGhhJTIwcm90aSUyMG5hYW58ZW58MHwwfHx8MTc3OTc4OTU3OXww&ixlib=rb-4.1.0&w=600&h=400&fit=crop&q=80",
    "https://images.unsplash.com/photo-1559561724-4ea348cd867f?ixid=M3w5MjcyNjF8MHwxfHNlYXJjaHw5fHxwYXJhdGhhJTIwcm90aSUyMG5hYW58ZW58MHwwfHx8MTc3OTc4OTU3OXww&ixlib=rb-4.1.0&w=600&h=400&fit=crop&q=80",
    "https://images.unsplash.com/photo-1750190624221-fdbd17f40eda?ixid=M3w5MjcyNjF8MHwxfHNlYXJjaHwxMHx8cGFyYXRoYSUyMHJvdGklMjBuYWFufGVufDB8MHx8fDE3Nzk3ODk1Nzl8MA&ixlib=rb-4.1.0&w=600&h=400&fit=crop&q=80",
    "https://images.unsplash.com/photo-1599232288126-7dbd2127db14?ixid=M3w5MjcyNjF8MHwxfHNlYXJjaHwxMXx8cGFyYXRoYSUyMHJvdGklMjBuYWFufGVufDB8MHx8fDE3Nzk3ODk1Nzl8MA&ixlib=rb-4.1.0&w=600&h=400&fit=crop&q=80",
    "https://images.unsplash.com/photo-1718874635150-85070e62fcf1?ixid=M3w5MjcyNjF8MHwxfHNlYXJjaHwxMnx8cGFyYXRoYSUyMHJvdGklMjBuYWFufGVufDB8MHx8fDE3Nzk3ODk1Nzl8MA&ixlib=rb-4.1.0&w=600&h=400&fit=crop&q=80",
  ],
  dosa: [
    "https://images.unsplash.com/photo-1725483990257-59313381ad1f?ixid=M3w5MjcyNjF8MHwxfHNlYXJjaHwxfHxkb3NhJTIwc291dGglMjBpbmRpYW58ZW58MHwwfHx8MTc3OTc4OTU4MHww&ixlib=rb-4.1.0&w=600&h=400&fit=crop&q=80",
    "https://images.unsplash.com/photo-1725483990122-802996d84699?ixid=M3w5MjcyNjF8MHwxfHNlYXJjaHwyfHxkb3NhJTIwc291dGglMjBpbmRpYW58ZW58MHwwfHx8MTc3OTc4OTU4MHww&ixlib=rb-4.1.0&w=600&h=400&fit=crop&q=80",
    "https://images.unsplash.com/photo-1743517894265-c86ab035adef?ixid=M3w5MjcyNjF8MHwxfHNlYXJjaHwzfHxkb3NhJTIwc291dGglMjBpbmRpYW58ZW58MHwwfHx8MTc3OTc4OTU4MHww&ixlib=rb-4.1.0&w=600&h=400&fit=crop&q=80",
    "https://images.unsplash.com/photo-1725483990070-509319bc6ecc?ixid=M3w5MjcyNjF8MHwxfHNlYXJjaHw0fHxkb3NhJTIwc291dGglMjBpbmRpYW58ZW58MHwwfHx8MTc3OTc4OTU4MHww&ixlib=rb-4.1.0&w=600&h=400&fit=crop&q=80",
    "https://images.unsplash.com/photo-1743615467204-8fdaa85ff2db?ixid=M3w5MjcyNjF8MHwxfHNlYXJjaHw1fHxkb3NhJTIwc291dGglMjBpbmRpYW58ZW58MHwwfHx8MTc3OTc4OTU4MHww&ixlib=rb-4.1.0&w=600&h=400&fit=crop&q=80",
    "https://images.unsplash.com/photo-1743615467363-250466982515?ixid=M3w5MjcyNjF8MHwxfHNlYXJjaHw2fHxkb3NhJTIwc291dGglMjBpbmRpYW58ZW58MHwwfHx8MTc3OTc4OTU4MHww&ixlib=rb-4.1.0&w=600&h=400&fit=crop&q=80",
    "https://images.unsplash.com/photo-1668236543090-82eba5ee5976?ixid=M3w5MjcyNjF8MHwxfHNlYXJjaHw3fHxkb3NhJTIwc291dGglMjBpbmRpYW58ZW58MHwwfHx8MTc3OTc4OTU4MHww&ixlib=rb-4.1.0&w=600&h=400&fit=crop&q=80",
    "https://images.unsplash.com/photo-1668236499396-a62d2d1cb0cf?ixid=M3w5MjcyNjF8MHwxfHNlYXJjaHw4fHxkb3NhJTIwc291dGglMjBpbmRpYW58ZW58MHwwfHx8MTc3OTc4OTU4MHww&ixlib=rb-4.1.0&w=600&h=400&fit=crop&q=80",
    "https://images.unsplash.com/photo-1725483990551-d9268479f3f4?ixid=M3w5MjcyNjF8MHwxfHNlYXJjaHw5fHxkb3NhJTIwc291dGglMjBpbmRpYW58ZW58MHwwfHx8MTc3OTc4OTU4MHww&ixlib=rb-4.1.0&w=600&h=400&fit=crop&q=80",
    "https://images.unsplash.com/photo-1725483990685-820291c0fca1?ixid=M3w5MjcyNjF8MHwxfHNlYXJjaHwxMHx8ZG9zYSUyMHNvdXRoJTIwaW5kaWFufGVufDB8MHx8fDE3Nzk3ODk1ODB8MA&ixlib=rb-4.1.0&w=600&h=400&fit=crop&q=80",
    "https://images.unsplash.com/photo-1725483990707-1584a62acd0f?ixid=M3w5MjcyNjF8MHwxfHNlYXJjaHwxMXx8ZG9zYSUyMHNvdXRoJTIwaW5kaWFufGVufDB8MHx8fDE3Nzk3ODk1ODB8MA&ixlib=rb-4.1.0&w=600&h=400&fit=crop&q=80",
  ],
  salad: [
    "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?ixid=M3w5MjcyNjF8MHwxfHNlYXJjaHwxfHxzYWxhZCUyMGhlYWx0aHklMjBmb29kfGVufDB8MHx8fDE3Nzk3ODk1ODJ8MA&ixlib=rb-4.1.0&w=600&h=400&fit=crop&q=80",
    "https://images.unsplash.com/photo-1607532941433-304659e8198a?ixid=M3w5MjcyNjF8MHwxfHNlYXJjaHwyfHxzYWxhZCUyMGhlYWx0aHklMjBmb29kfGVufDB8MHx8fDE3Nzk3ODk1ODJ8MA&ixlib=rb-4.1.0&w=600&h=400&fit=crop&q=80",
    "https://images.unsplash.com/photo-1490645935967-10de6ba17061?ixid=M3w5MjcyNjF8MHwxfHNlYXJjaHwzfHxzYWxhZCUyMGhlYWx0aHklMjBmb29kfGVufDB8MHx8fDE3Nzk3ODk1ODJ8MA&ixlib=rb-4.1.0&w=600&h=400&fit=crop&q=80",
    "https://images.unsplash.com/photo-1543339308-43e59d6b73a6?ixid=M3w5MjcyNjF8MHwxfHNlYXJjaHw0fHxzYWxhZCUyMGhlYWx0aHklMjBmb29kfGVufDB8MHx8fDE3Nzk3ODk1ODJ8MA&ixlib=rb-4.1.0&w=600&h=400&fit=crop&q=80",
    "https://images.unsplash.com/photo-1494859802809-d069c3b71a8a?ixid=M3w5MjcyNjF8MHwxfHNlYXJjaHw1fHxzYWxhZCUyMGhlYWx0aHklMjBmb29kfGVufDB8MHx8fDE3Nzk3ODk1ODJ8MA&ixlib=rb-4.1.0&w=600&h=400&fit=crop&q=80",
    "https://images.unsplash.com/photo-1561043433-aaf687c4cf04?ixid=M3w5MjcyNjF8MHwxfHNlYXJjaHw2fHxzYWxhZCUyMGhlYWx0aHklMjBmb29kfGVufDB8MHx8fDE3Nzk3ODk1ODJ8MA&ixlib=rb-4.1.0&w=600&h=400&fit=crop&q=80",
    "https://images.unsplash.com/photo-1599021419847-d8a7a6aba5b4?ixid=M3w5MjcyNjF8MHwxfHNlYXJjaHw3fHxzYWxhZCUyMGhlYWx0aHklMjBmb29kfGVufDB8MHx8fDE3Nzk3ODk1ODJ8MA&ixlib=rb-4.1.0&w=600&h=400&fit=crop&q=80",
    "https://images.unsplash.com/photo-1578687388049-079580e6eb2d?ixid=M3w5MjcyNjF8MHwxfHNlYXJjaHw4fHxzYWxhZCUyMGhlYWx0aHklMjBmb29kfGVufDB8MHx8fDE3Nzk3ODk1ODJ8MA&ixlib=rb-4.1.0&w=600&h=400&fit=crop&q=80",
    "https://images.unsplash.com/photo-1529059997568-3d847b1154f0?ixid=M3w5MjcyNjF8MHwxfHNlYXJjaHw5fHxzYWxhZCUyMGhlYWx0aHklMjBmb29kfGVufDB8MHx8fDE3Nzk3ODk1ODJ8MA&ixlib=rb-4.1.0&w=600&h=400&fit=crop&q=80",
    "https://images.unsplash.com/photo-1569760142069-bc6838de16c1?ixid=M3w5MjcyNjF8MHwxfHNlYXJjaHwxMHx8c2FsYWQlMjBoZWFsdGh5JTIwZm9vZHxlbnwwfDB8fHwxNzc5Nzg5NTgyfDA&ixlib=rb-4.1.0&w=600&h=400&fit=crop&q=80",
    "https://images.unsplash.com/photo-1546069901-5ec6a79120b0?ixid=M3w5MjcyNjF8MHwxfHNlYXJjaHwxMXx8c2FsYWQlMjBoZWFsdGh5JTIwZm9vZHxlbnwwfDB8fHwxNzc5Nzg5NTgyfDA&ixlib=rb-4.1.0&w=600&h=400&fit=crop&q=80",
    "https://images.unsplash.com/photo-1523986371872-9d3ba2e2a389?ixid=M3w5MjcyNjF8MHwxfHNlYXJjaHwxMnx8c2FsYWQlMjBoZWFsdGh5JTIwZm9vZHxlbnwwfDB8fHwxNzc5Nzg5NTgyfDA&ixlib=rb-4.1.0&w=600&h=400&fit=crop&q=80",
  ],
  dessert: [
    "https://images.unsplash.com/photo-1629385697093-57be2cc97fa6?ixid=M3w5MjcyNjF8MHwxfHNlYXJjaHwxfHxkZXNzZXJ0JTIwc3dlZXQlMjBpY2UlMjBjcmVhbXxlbnwwfDB8fHwxNzc5Nzg5NTgzfDA&ixlib=rb-4.1.0&w=600&h=400&fit=crop&q=80",
    "https://images.unsplash.com/photo-1705103654884-cbd03d95761a?ixid=M3w5MjcyNjF8MHwxfHNlYXJjaHwyfHxkZXNzZXJ0JTIwc3dlZXQlMjBpY2UlMjBjcmVhbXxlbnwwfDB8fHwxNzc5Nzg5NTgzfDA&ixlib=rb-4.1.0&w=600&h=400&fit=crop&q=80",
    "https://images.unsplash.com/photo-1629385738750-5617b763a80b?ixid=M3w5MjcyNjF8MHwxfHNlYXJjaHwzfHxkZXNzZXJ0JTIwc3dlZXQlMjBpY2UlMjBjcmVhbXxlbnwwfDB8fHwxNzc5Nzg5NTgzfDA&ixlib=rb-4.1.0&w=600&h=400&fit=crop&q=80",
    "https://images.unsplash.com/photo-1561845730-208ad5910553?ixid=M3w5MjcyNjF8MHwxfHNlYXJjaHw0fHxkZXNzZXJ0JTIwc3dlZXQlMjBpY2UlMjBjcmVhbXxlbnwwfDB8fHwxNzc5Nzg5NTgzfDA&ixlib=rb-4.1.0&w=600&h=400&fit=crop&q=80",
    "https://images.unsplash.com/photo-1599038064230-17a52bd8f2f5?ixid=M3w5MjcyNjF8MHwxfHNlYXJjaHw1fHxkZXNzZXJ0JTIwc3dlZXQlMjBpY2UlMjBjcmVhbXxlbnwwfDB8fHwxNzc5Nzg5NTgzfDA&ixlib=rb-4.1.0&w=600&h=400&fit=crop&q=80",
    "https://images.unsplash.com/photo-1616166534966-7334430168c1?ixid=M3w5MjcyNjF8MHwxfHNlYXJjaHw2fHxkZXNzZXJ0JTIwc3dlZXQlMjBpY2UlMjBjcmVhbXxlbnwwfDB8fHwxNzc5Nzg5NTgzfDA&ixlib=rb-4.1.0&w=600&h=400&fit=crop&q=80",
    "https://images.unsplash.com/photo-1645878490155-a0dbcd313645?ixid=M3w5MjcyNjF8MHwxfHNlYXJjaHw3fHxkZXNzZXJ0JTIwc3dlZXQlMjBpY2UlMjBjcmVhbXxlbnwwfDB8fHwxNzc5Nzg5NTgzfDA&ixlib=rb-4.1.0&w=600&h=400&fit=crop&q=80",
    "https://images.unsplash.com/photo-1602296751206-d611e4b4fe89?ixid=M3w5MjcyNjF8MHwxfHNlYXJjaHw4fHxkZXNzZXJ0JTIwc3dlZXQlMjBpY2UlMjBjcmVhbXxlbnwwfDB8fHwxNzc5Nzg5NTgzfDA&ixlib=rb-4.1.0&w=600&h=400&fit=crop&q=80",
    "https://images.unsplash.com/photo-1674941351643-e4dacaef2757?ixid=M3w5MjcyNjF8MHwxfHNlYXJjaHw5fHxkZXNzZXJ0JTIwc3dlZXQlMjBpY2UlMjBjcmVhbXxlbnwwfDB8fHwxNzc5Nzg5NTgzfDA&ixlib=rb-4.1.0&w=600&h=400&fit=crop&q=80",
    "https://images.unsplash.com/photo-1499287846893-3836a8142739?ixid=M3w5MjcyNjF8MHwxfHNlYXJjaHwxMHx8ZGVzc2VydCUyMHN3ZWV0JTIwaWNlJTIwY3JlYW18ZW58MHwwfHx8MTc3OTc4OTU4M3ww&ixlib=rb-4.1.0&w=600&h=400&fit=crop&q=80",
    "https://images.unsplash.com/photo-1586590830950-2f308452eebc?ixid=M3w5MjcyNjF8MHwxfHNlYXJjaHwxMXx8ZGVzc2VydCUyMHN3ZWV0JTIwaWNlJTIwY3JlYW18ZW58MHwwfHx8MTc3OTc4OTU4M3ww&ixlib=rb-4.1.0&w=600&h=400&fit=crop&q=80",
    "https://images.unsplash.com/photo-1595275320712-24b6f2b0a984?ixid=M3w5MjcyNjF8MHwxfHNlYXJjaHwxMnx8ZGVzc2VydCUyMHN3ZWV0JTIwaWNlJTIwY3JlYW18ZW58MHwwfHx8MTc3OTc4OTU4M3ww&ixlib=rb-4.1.0&w=600&h=400&fit=crop&q=80",
  ],
  sandwich: [
    "https://images.unsplash.com/photo-1553909489-cd47e0907980?ixid=M3w5MjcyNjF8MHwxfHNlYXJjaHwxfHxzYW5kd2ljaCUyMGZvb2R8ZW58MHwwfHx8MTc3OTc4OTU4NHww&ixlib=rb-4.1.0&w=600&h=400&fit=crop&q=80",
    "https://images.unsplash.com/photo-1528735602780-2552fd46c7af?ixid=M3w5MjcyNjF8MHwxfHNlYXJjaHwyfHxzYW5kd2ljaCUyMGZvb2R8ZW58MHwwfHx8MTc3OTc4OTU4NHww&ixlib=rb-4.1.0&w=600&h=400&fit=crop&q=80",
    "https://images.unsplash.com/photo-1509722747041-616f39b57569?ixid=M3w5MjcyNjF8MHwxfHNlYXJjaHwzfHxzYW5kd2ljaCUyMGZvb2R8ZW58MHwwfHx8MTc3OTc4OTU4NHww&ixlib=rb-4.1.0&w=600&h=400&fit=crop&q=80",
    "https://images.unsplash.com/photo-1481070414801-51fd732d7184?ixid=M3w5MjcyNjF8MHwxfHNlYXJjaHw0fHxzYW5kd2ljaCUyMGZvb2R8ZW58MHwwfHx8MTc3OTc4OTU4NHww&ixlib=rb-4.1.0&w=600&h=400&fit=crop&q=80",
    "https://images.unsplash.com/photo-1475090169767-40ed8d18f67d?ixid=M3w5MjcyNjF8MHwxfHNlYXJjaHw1fHxzYW5kd2ljaCUyMGZvb2R8ZW58MHwwfHx8MTc3OTc4OTU4NHww&ixlib=rb-4.1.0&w=600&h=400&fit=crop&q=80",
    "https://images.unsplash.com/photo-1550507992-eb63ffee0847?ixid=M3w5MjcyNjF8MHwxfHNlYXJjaHw2fHxzYW5kd2ljaCUyMGZvb2R8ZW58MHwwfHx8MTc3OTc4OTU4NHww&ixlib=rb-4.1.0&w=600&h=400&fit=crop&q=80",
    "https://images.unsplash.com/photo-1567234669003-dce7a7a88821?ixid=M3w5MjcyNjF8MHwxfHNlYXJjaHw3fHxzYW5kd2ljaCUyMGZvb2R8ZW58MHwwfHx8MTc3OTc4OTU4NHww&ixlib=rb-4.1.0&w=600&h=400&fit=crop&q=80",
    "https://images.unsplash.com/photo-1639667852145-466e29aa49fd?ixid=M3w5MjcyNjF8MHwxfHNlYXJjaHw4fHxzYW5kd2ljaCUyMGZvb2R8ZW58MHwwfHx8MTc3OTc4OTU4NHww&ixlib=rb-4.1.0&w=600&h=400&fit=crop&q=80",
    "https://images.unsplash.com/photo-1485451456034-3f9391c6f769?ixid=M3w5MjcyNjF8MHwxfHNlYXJjaHw5fHxzYW5kd2ljaCUyMGZvb2R8ZW58MHwwfHx8MTc3OTc4OTU4NHww&ixlib=rb-4.1.0&w=600&h=400&fit=crop&q=80",
    "https://images.unsplash.com/photo-1621800043295-a73fe2f76e2c?ixid=M3w5MjcyNjF8MHwxfHNlYXJjaHwxMHx8c2FuZHdpY2glMjBmb29kfGVufDB8MHx8fDE3Nzk3ODk1ODR8MA&ixlib=rb-4.1.0&w=600&h=400&fit=crop&q=80",
    "https://images.unsplash.com/photo-1558985250-27a406d64cb3?ixid=M3w5MjcyNjF8MHwxfHNlYXJjaHwxMXx8c2FuZHdpY2glMjBmb29kfGVufDB8MHx8fDE3Nzk3ODk1ODR8MA&ixlib=rb-4.1.0&w=600&h=400&fit=crop&q=80",
    "https://images.unsplash.com/photo-1716834092510-3be5db563920?ixid=M3w5MjcyNjF8MHwxfHNlYXJjaHwxMnx8c2FuZHdpY2glMjBmb29kfGVufDB8MHx8fDE3Nzk3ODk1ODR8MA&ixlib=rb-4.1.0&w=600&h=400&fit=crop&q=80",
  ],
  pasta: [
    "https://images.unsplash.com/photo-1622973536968-3ead9e780960?ixid=M3w5MjcyNjF8MHwxfHNlYXJjaHwxfHxwYXN0YSUyMGZvb2QlMjBzcGFnaGV0dGl8ZW58MHwwfHx8MTc3OTc4OTU4Nnww&ixlib=rb-4.1.0&w=600&h=400&fit=crop&q=80",
    "https://images.unsplash.com/photo-1713561058969-793049b01712?ixid=M3w5MjcyNjF8MHwxfHNlYXJjaHwyfHxwYXN0YSUyMGZvb2QlMjBzcGFnaGV0dGl8ZW58MHwwfHx8MTc3OTc4OTU4Nnww&ixlib=rb-4.1.0&w=600&h=400&fit=crop&q=80",
    "https://images.unsplash.com/photo-1633337474564-1d9478ca4e2e?ixid=M3w5MjcyNjF8MHwxfHNlYXJjaHwzfHxwYXN0YSUyMGZvb2QlMjBzcGFnaGV0dGl8ZW58MHwwfHx8MTc3OTc4OTU4Nnww&ixlib=rb-4.1.0&w=600&h=400&fit=crop&q=80",
    "https://images.unsplash.com/photo-1571175534150-72cd2b5a6039?ixid=M3w5MjcyNjF8MHwxfHNlYXJjaHw0fHxwYXN0YSUyMGZvb2QlMjBzcGFnaGV0dGl8ZW58MHwwfHx8MTc3OTc4OTU4Nnww&ixlib=rb-4.1.0&w=600&h=400&fit=crop&q=80",
    "https://images.unsplash.com/photo-1719250726371-b4076d48ce6c?ixid=M3w5MjcyNjF8MHwxfHNlYXJjaHw1fHxwYXN0YSUyMGZvb2QlMjBzcGFnaGV0dGl8ZW58MHwwfHx8MTc3OTc4OTU4Nnww&ixlib=rb-4.1.0&w=600&h=400&fit=crop&q=80",
    "https://images.unsplash.com/photo-1576698961137-6832c546e321?ixid=M3w5MjcyNjF8MHwxfHNlYXJjaHw2fHxwYXN0YSUyMGZvb2QlMjBzcGFnaGV0dGl8ZW58MHwwfHx8MTc3OTc4OTU4Nnww&ixlib=rb-4.1.0&w=600&h=400&fit=crop&q=80",
    "https://images.unsplash.com/photo-1648141294660-78c4e41f99a3?ixid=M3w5MjcyNjF8MHwxfHNlYXJjaHw3fHxwYXN0YSUyMGZvb2QlMjBzcGFnaGV0dGl8ZW58MHwwfHx8MTc3OTc4OTU4Nnww&ixlib=rb-4.1.0&w=600&h=400&fit=crop&q=80",
    "https://images.unsplash.com/photo-1548247661-3d7905940716?ixid=M3w5MjcyNjF8MHwxfHNlYXJjaHw4fHxwYXN0YSUyMGZvb2QlMjBzcGFnaGV0dGl8ZW58MHwwfHx8MTc3OTc4OTU4Nnww&ixlib=rb-4.1.0&w=600&h=400&fit=crop&q=80",
    "https://images.unsplash.com/photo-1675101298938-1b15fc61c603?ixid=M3w5MjcyNjF8MHwxfHNlYXJjaHw5fHxwYXN0YSUyMGZvb2QlMjBzcGFnaGV0dGl8ZW58MHwwfHx8MTc3OTc4OTU4Nnww&ixlib=rb-4.1.0&w=600&h=400&fit=crop&q=80",
    "https://images.unsplash.com/photo-1675169594106-a3898f9fe59d?ixid=M3w5MjcyNjF8MHwxfHNlYXJjaHwxMHx8cGFzdGElMjBmb29kJTIwc3BhZ2hldHRpfGVufDB8MHx8fDE3Nzk3ODk1ODZ8MA&ixlib=rb-4.1.0&w=600&h=400&fit=crop&q=80",
    "https://images.unsplash.com/photo-1685156329688-ffe9c1a99a06?ixid=M3w5MjcyNjF8MHwxfHNlYXJjaHwxMXx8cGFzdGElMjBmb29kJTIwc3BhZ2hldHRpfGVufDB8MHx8fDE3Nzk3ODk1ODZ8MA&ixlib=rb-4.1.0&w=600&h=400&fit=crop&q=80",
    "https://images.unsplash.com/photo-1576698960744-965caaa271cf?ixid=M3w5MjcyNjF8MHwxfHNlYXJjaHwxMnx8cGFzdGElMjBmb29kJTIwc3BhZ2hldHRpfGVufDB8MHx8fDE3Nzk3ODk1ODZ8MA&ixlib=rb-4.1.0&w=600&h=400&fit=crop&q=80",
  ],
  biryani: [
    "https://images.unsplash.com/photo-1631515243349-e0cb75fb8d3a?ixid=M3w5MjcyNjF8MHwxfHNlYXJjaHwxfHxiaXJ5YW5pJTIwcmljZSUyMGRpc2h8ZW58MHwwfHx8MTc3OTc4OTU4N3ww&ixlib=rb-4.1.0&w=600&h=400&fit=crop&q=80",
    "https://images.unsplash.com/photo-1697155406055-2db32d47ca07?ixid=M3w5MjcyNjF8MHwxfHNlYXJjaHwyfHxiaXJ5YW5pJTIwcmljZSUyMGRpc2h8ZW58MHwwfHx8MTc3OTc4OTU4N3ww&ixlib=rb-4.1.0&w=600&h=400&fit=crop&q=80",
    "https://images.unsplash.com/photo-1633945274405-b6c8069047b0?ixid=M3w5MjcyNjF8MHwxfHNlYXJjaHwzfHxiaXJ5YW5pJTIwcmljZSUyMGRpc2h8ZW58MHwwfHx8MTc3OTc4OTU4N3ww&ixlib=rb-4.1.0&w=600&h=400&fit=crop&q=80",
    "https://images.unsplash.com/photo-1633945274309-2c16c9682a8c?ixid=M3w5MjcyNjF8MHwxfHNlYXJjaHw0fHxiaXJ5YW5pJTIwcmljZSUyMGRpc2h8ZW58MHwwfHx8MTc3OTc4OTU4N3ww&ixlib=rb-4.1.0&w=600&h=400&fit=crop&q=80",
    "https://images.unsplash.com/photo-1630851840633-f96999247032?ixid=M3w5MjcyNjF8MHwxfHNlYXJjaHw1fHxiaXJ5YW5pJTIwcmljZSUyMGRpc2h8ZW58MHwwfHx8MTc3OTc4OTU4N3ww&ixlib=rb-4.1.0&w=600&h=400&fit=crop&q=80",
    "https://images.unsplash.com/photo-1599043513900-ed6fe01d3833?ixid=M3w5MjcyNjF8MHwxfHNlYXJjaHw2fHxiaXJ5YW5pJTIwcmljZSUyMGRpc2h8ZW58MHwwfHx8MTc3OTc4OTU4N3ww&ixlib=rb-4.1.0&w=600&h=400&fit=crop&q=80",
    "https://images.unsplash.com/photo-1666190092689-e3968aa0c32c?ixid=M3w5MjcyNjF8MHwxfHNlYXJjaHw3fHxiaXJ5YW5pJTIwcmljZSUyMGRpc2h8ZW58MHwwfHx8MTc3OTc4OTU4N3ww&ixlib=rb-4.1.0&w=600&h=400&fit=crop&q=80",
    "https://images.unsplash.com/photo-1634324092526-91f5e878b72f?ixid=M3w5MjcyNjF8MHwxfHNlYXJjaHw4fHxiaXJ5YW5pJTIwcmljZSUyMGRpc2h8ZW58MHwwfHx8MTc3OTc4OTU4N3ww&ixlib=rb-4.1.0&w=600&h=400&fit=crop&q=80",
    "https://images.unsplash.com/photo-1642821373181-696a54913e93?ixid=M3w5MjcyNjF8MHwxfHNlYXJjaHw5fHxiaXJ5YW5pJTIwcmljZSUyMGRpc2h8ZW58MHwwfHx8MTc3OTc4OTU4N3ww&ixlib=rb-4.1.0&w=600&h=400&fit=crop&q=80",
    "https://images.unsplash.com/photo-1728745118618-941ec839208f?ixid=M3w5MjcyNjF8MHwxfHNlYXJjaHwxMHx8YmlyeWFuaSUyMHJpY2UlMjBkaXNofGVufDB8MHx8fDE3Nzk3ODk1ODd8MA&ixlib=rb-4.1.0&w=600&h=400&fit=crop&q=80",
    "https://images.unsplash.com/photo-1714611626323-5ba6204453be?ixid=M3w5MjcyNjF8MHwxfHNlYXJjaHwxMXx8YmlyeWFuaSUyMHJpY2UlMjBkaXNofGVufDB8MHx8fDE3Nzk3ODk1ODd8MA&ixlib=rb-4.1.0&w=600&h=400&fit=crop&q=80",
    "https://images.unsplash.com/photo-1642972420043-4736c570a716?ixid=M3w5MjcyNjF8MHwxfHNlYXJjaHwxMnx8YmlyeWFuaSUyMHJpY2UlMjBkaXNofGVufDB8MHx8fDE3Nzk3ODk1ODd8MA&ixlib=rb-4.1.0&w=600&h=400&fit=crop&q=80",
  ],
  rice: [
    "https://images.unsplash.com/photo-1603133872878-684f208fb84b?ixid=M3w5MjcyNjF8MHwxfHNlYXJjaHwxfHxmcmllZCUyMHJpY2V8ZW58MHwwfHx8MTc3OTc4OTU4OHww&ixlib=rb-4.1.0&w=600&h=400&fit=crop&q=80",
    "https://images.unsplash.com/photo-1512058564366-18510be2db19?ixid=M3w5MjcyNjF8MHwxfHNlYXJjaHwyfHxmcmllZCUyMHJpY2V8ZW58MHwwfHx8MTc3OTc4OTU4OHww&ixlib=rb-4.1.0&w=600&h=400&fit=crop&q=80",
    "https://images.unsplash.com/photo-1596560548464-f010549b84d7?ixid=M3w5MjcyNjF8MHwxfHNlYXJjaHwzfHxmcmllZCUyMHJpY2V8ZW58MHwwfHx8MTc3OTc4OTU4OHww&ixlib=rb-4.1.0&w=600&h=400&fit=crop&q=80",
    "https://images.unsplash.com/photo-1609570324378-ec0c4c9b6ba8?ixid=M3w5MjcyNjF8MHwxfHNlYXJjaHw0fHxmcmllZCUyMHJpY2V8ZW58MHwwfHx8MTc3OTc4OTU4OHww&ixlib=rb-4.1.0&w=600&h=400&fit=crop&q=80",
    "https://images.unsplash.com/photo-1584269600464-37b1b58a9fe7?ixid=M3w5MjcyNjF8MHwxfHNlYXJjaHw1fHxmcmllZCUyMHJpY2V8ZW58MHwwfHx8MTc3OTc4OTU4OHww&ixlib=rb-4.1.0&w=600&h=400&fit=crop&q=80",
    "https://images.unsplash.com/photo-1551326844-4df70f78d0e9?ixid=M3w5MjcyNjF8MHwxfHNlYXJjaHw2fHxmcmllZCUyMHJpY2V8ZW58MHwwfHx8MTc3OTc4OTU4OHww&ixlib=rb-4.1.0&w=600&h=400&fit=crop&q=80",
    "https://images.unsplash.com/photo-1540100716001-4b432820e37f?ixid=M3w5MjcyNjF8MHwxfHNlYXJjaHw3fHxmcmllZCUyMHJpY2V8ZW58MHwwfHx8MTc3OTc4OTU4OHww&ixlib=rb-4.1.0&w=600&h=400&fit=crop&q=80",
    "https://images.unsplash.com/photo-1723691802798-fa6efc67b2c9?ixid=M3w5MjcyNjF8MHwxfHNlYXJjaHw4fHxmcmllZCUyMHJpY2V8ZW58MHwwfHx8MTc3OTc4OTU4OHww&ixlib=rb-4.1.0&w=600&h=400&fit=crop&q=80",
    "https://images.unsplash.com/photo-1578160112054-954a67602b88?ixid=M3w5MjcyNjF8MHwxfHNlYXJjaHw5fHxmcmllZCUyMHJpY2V8ZW58MHwwfHx8MTc3OTc4OTU4OHww&ixlib=rb-4.1.0&w=600&h=400&fit=crop&q=80",
    "https://images.unsplash.com/photo-1637759079728-3f900db7a782?ixid=M3w5MjcyNjF8MHwxfHNlYXJjaHwxMHx8ZnJpZWQlMjByaWNlfGVufDB8MHx8fDE3Nzk3ODk1ODh8MA&ixlib=rb-4.1.0&w=600&h=400&fit=crop&q=80",
    "https://images.unsplash.com/photo-1664717698774-84f62382613b?ixid=M3w5MjcyNjF8MHwxfHNlYXJjaHwxMXx8ZnJpZWQlMjByaWNlfGVufDB8MHx8fDE3Nzk3ODk1ODh8MA&ixlib=rb-4.1.0&w=600&h=400&fit=crop&q=80",
    "https://images.unsplash.com/photo-1705088293300-8fc8c7be90e2?ixid=M3w5MjcyNjF8MHwxfHNlYXJjaHwxMnx8ZnJpZWQlMjByaWNlfGVufDB8MHx8fDE3Nzk3ODk1ODh8MA&ixlib=rb-4.1.0&w=600&h=400&fit=crop&q=80",
  ],
  paneer: [
    "https://images.unsplash.com/photo-1631452180539-96aca7d48617?ixid=M3w5MjcyNjF8MHwxfHNlYXJjaHwxfHxwYW5lZXIlMjBpbmRpYW4lMjBkaXNofGVufDB8MHx8fDE3Nzk3ODk1ODl8MA&ixlib=rb-4.1.0&w=600&h=400&fit=crop&q=80",
    "https://images.unsplash.com/photo-1710091691780-c7eb0dc50cf8?ixid=M3w5MjcyNjF8MHwxfHNlYXJjaHwyfHxwYW5lZXIlMjBpbmRpYW4lMjBkaXNofGVufDB8MHx8fDE3Nzk3ODk1ODl8MA&ixlib=rb-4.1.0&w=600&h=400&fit=crop&q=80",
    "https://images.unsplash.com/photo-1683533738338-19b9a22c6405?ixid=M3w5MjcyNjF8MHwxfHNlYXJjaHwzfHxwYW5lZXIlMjBpbmRpYW4lMjBkaXNofGVufDB8MHx8fDE3Nzk3ODk1ODl8MA&ixlib=rb-4.1.0&w=600&h=400&fit=crop&q=80",
    "https://images.unsplash.com/photo-1524239077444-27413e763bba?ixid=M3w5MjcyNjF8MHwxfHNlYXJjaHw0fHxwYW5lZXIlMjBpbmRpYW4lMjBkaXNofGVufDB8MHx8fDE3Nzk3ODk1ODl8MA&ixlib=rb-4.1.0&w=600&h=400&fit=crop&q=80",
    "https://images.unsplash.com/photo-1536304575888-ccb70eeef59b?ixid=M3w5MjcyNjF8MHwxfHNlYXJjaHw1fHxwYW5lZXIlMjBpbmRpYW4lMjBkaXNofGVufDB8MHx8fDE3Nzk3ODk1ODl8MA&ixlib=rb-4.1.0&w=600&h=400&fit=crop&q=80",
    "https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?ixid=M3w5MjcyNjF8MHwxfHNlYXJjaHw2fHxwYW5lZXIlMjBpbmRpYW4lMjBkaXNofGVufDB8MHx8fDE3Nzk3ODk1ODl8MA&ixlib=rb-4.1.0&w=600&h=400&fit=crop&q=80",
    "https://images.unsplash.com/photo-1559203244-78de52adba0e?ixid=M3w5MjcyNjF8MHwxfHNlYXJjaHw3fHxwYW5lZXIlMjBpbmRpYW4lMjBkaXNofGVufDB8MHx8fDE3Nzk3ODk1ODl8MA&ixlib=rb-4.1.0&w=600&h=400&fit=crop&q=80",
    "https://images.unsplash.com/photo-1589647363585-f4a7d3877b10?ixid=M3w5MjcyNjF8MHwxfHNlYXJjaHw4fHxwYW5lZXIlMjBpbmRpYW4lMjBkaXNofGVufDB8MHx8fDE3Nzk3ODk1ODl8MA&ixlib=rb-4.1.0&w=600&h=400&fit=crop&q=80",
    "https://images.unsplash.com/photo-1767114915936-745dd372f1d8?ixid=M3w5MjcyNjF8MHwxfHNlYXJjaHw5fHxwYW5lZXIlMjBpbmRpYW4lMjBkaXNofGVufDB8MHx8fDE3Nzk3ODk1ODl8MA&ixlib=rb-4.1.0&w=600&h=400&fit=crop&q=80",
    "https://images.unsplash.com/photo-1767114915989-c6ab3c8fc42e?ixid=M3w5MjcyNjF8MHwxfHNlYXJjaHwxMHx8cGFuZWVyJTIwaW5kaWFuJTIwZGlzaHxlbnwwfDB8fHwxNzc5Nzg5NTg5fDA&ixlib=rb-4.1.0&w=600&h=400&fit=crop&q=80",
    "https://images.unsplash.com/photo-1642821369314-100fece91d3c?ixid=M3w5MjcyNjF8MHwxfHNlYXJjaHwxMXx8cGFuZWVyJTIwaW5kaWFuJTIwZGlzaHxlbnwwfDB8fHwxNzc5Nzg5NTg5fDA&ixlib=rb-4.1.0&w=600&h=400&fit=crop&q=80",
    "https://images.unsplash.com/photo-1587040690786-b091531837a2?ixid=M3w5MjcyNjF8MHwxfHNlYXJjaHwxMnx8cGFuZWVyJTIwaW5kaWFuJTIwZGlzaHxlbnwwfDB8fHwxNzc5Nzg5NTg5fDA&ixlib=rb-4.1.0&w=600&h=400&fit=crop&q=80",
  ],
  chicken: [
    "https://images.unsplash.com/photo-1670398564097-0762e1b30b3a?ixid=M3w5MjcyNjF8MHwxfHNlYXJjaHwxfHxjaGlja2VuJTIwZm9vZCUyMGRpc2h8ZW58MHwwfHx8MTc3OTc4OTU5MXww&ixlib=rb-4.1.0&w=600&h=400&fit=crop&q=80",
    "https://images.unsplash.com/photo-1615557960916-5f4791effe9d?ixid=M3w5MjcyNjF8MHwxfHNlYXJjaHwyfHxjaGlja2VuJTIwZm9vZCUyMGRpc2h8ZW58MHwwfHx8MTc3OTc4OTU5MXww&ixlib=rb-4.1.0&w=600&h=400&fit=crop&q=80",
    "https://images.unsplash.com/photo-1603496987351-f84a3ba5ec85?ixid=M3w5MjcyNjF8MHwxfHNlYXJjaHwzfHxjaGlja2VuJTIwZm9vZCUyMGRpc2h8ZW58MHwwfHx8MTc3OTc4OTU5MXww&ixlib=rb-4.1.0&w=600&h=400&fit=crop&q=80",
    "https://images.unsplash.com/photo-1598515214211-89d3c73ae83b?ixid=M3w5MjcyNjF8MHwxfHNlYXJjaHw0fHxjaGlja2VuJTIwZm9vZCUyMGRpc2h8ZW58MHwwfHx8MTc3OTc4OTU5MXww&ixlib=rb-4.1.0&w=600&h=400&fit=crop&q=80",
    "https://images.unsplash.com/photo-1652545296821-09a023a9fd08?ixid=M3w5MjcyNjF8MHwxfHNlYXJjaHw1fHxjaGlja2VuJTIwZm9vZCUyMGRpc2h8ZW58MHwwfHx8MTc3OTc4OTU5MXww&ixlib=rb-4.1.0&w=600&h=400&fit=crop&q=80",
    "https://images.unsplash.com/photo-1687020835890-b0b8c6a04613?ixid=M3w5MjcyNjF8MHwxfHNlYXJjaHw2fHxjaGlja2VuJTIwZm9vZCUyMGRpc2h8ZW58MHwwfHx8MTc3OTc4OTU5MXww&ixlib=rb-4.1.0&w=600&h=400&fit=crop&q=80",
    "https://images.unsplash.com/photo-1567121938596-6d9d015d348b?ixid=M3w5MjcyNjF8MHwxfHNlYXJjaHw3fHxjaGlja2VuJTIwZm9vZCUyMGRpc2h8ZW58MHwwfHx8MTc3OTc4OTU5MXww&ixlib=rb-4.1.0&w=600&h=400&fit=crop&q=80",
    "https://images.unsplash.com/photo-1605490500023-b96e71486495?ixid=M3w5MjcyNjF8MHwxfHNlYXJjaHw4fHxjaGlja2VuJTIwZm9vZCUyMGRpc2h8ZW58MHwwfHx8MTc3OTc4OTU5MXww&ixlib=rb-4.1.0&w=600&h=400&fit=crop&q=80",
    "https://images.unsplash.com/photo-1514536958296-436f46226e74?ixid=M3w5MjcyNjF8MHwxfHNlYXJjaHw5fHxjaGlja2VuJTIwZm9vZCUyMGRpc2h8ZW58MHwwfHx8MTc3OTc4OTU5MXww&ixlib=rb-4.1.0&w=600&h=400&fit=crop&q=80",
    "https://images.unsplash.com/photo-1697155836250-e3ba3a24fbd5?ixid=M3w5MjcyNjF8MHwxfHNlYXJjaHwxMHx8Y2hpY2tlbiUyMGZvb2QlMjBkaXNofGVufDB8MHx8fDE3Nzk3ODk1OTF8MA&ixlib=rb-4.1.0&w=600&h=400&fit=crop&q=80",
    "https://images.unsplash.com/photo-1628839168545-bfa1bc1d6706?ixid=M3w5MjcyNjF8MHwxfHNlYXJjaHwxMXx8Y2hpY2tlbiUyMGZvb2QlMjBkaXNofGVufDB8MHx8fDE3Nzk3ODk1OTF8MA&ixlib=rb-4.1.0&w=600&h=400&fit=crop&q=80",
    "https://images.unsplash.com/photo-1764304733301-3a9f335f0c67?ixid=M3w5MjcyNjF8MHwxfHNlYXJjaHwxMnx8Y2hpY2tlbiUyMGZvb2QlMjBkaXNofGVufDB8MHx8fDE3Nzk3ODk1OTF8MA&ixlib=rb-4.1.0&w=600&h=400&fit=crop&q=80",
  ],
  default: [
    "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=600&h=400&fit=crop&q=80",
    "https://images.unsplash.com/photo-1498837167922-ddd27525d352?w=600&h=400&fit=crop&q=80",
    "https://images.unsplash.com/photo-1476224203421-9ac39bcb3327?w=600&h=400&fit=crop&q=80",
  ]
};

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
  const nameLower = itemName.toLowerCase();
  
  // First try to match keywords in the item name
  for (const [keywords, pool] of CATEGORY_KEYWORDS) {
    for (const kw of keywords) {
      if (nameLower.includes(kw)) {
        return pool;
      }
    }
  }
  
  // If no match in item name, try matching in the category name
  const catLower = categoryName.toLowerCase();
  for (const [keywords, pool] of CATEGORY_KEYWORDS) {
    for (const kw of keywords) {
      if (catLower.includes(kw)) {
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
