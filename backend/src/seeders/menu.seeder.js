export const defaultMenuItems = [
  {
    id: "menu-margherita-pizza",
    slug: "margherita-pizza",
    name: "Margherita Pizza",
    description: "Classic tomato sauce, mozzarella, and basil.",
    priceCents: 34900,
    imageUrl: "https://www.foodandwine.com/thmb/7BpSJWDh1s-2M2ooRPHoy07apq4=/1500x0/filters:no_upscale():max_bytes(150000):strip_icc()/mozzarella-pizza-margherita-FT-RECIPE0621-11fa41ceb1a5465d9036a23da87dd3d4.jpg",
    stockQty: 25,
    isAvailable: true
  },
  {
    id: "menu-veggie-burger",
    slug: "veggie-burger",
    name: "Veggie Burger",
    description: "Grilled veggie patty with lettuce, tomato, and house sauce.",
    priceCents: 25900,
    imageUrl: "https://www.realsimple.com/thmb/z3cQCYXTyDQS9ddsqqlTVE8fnpc=/1500x0/filters:no_upscale():max_bytes(150000):strip_icc()/real-simple-mushroom-black-bean-burgers-recipe-0c365277d4294e6db2daa3353d6ff605.jpg",
    stockQty: 18,
    isAvailable: true
  },
  {
    id: "menu-crispy-fries",
    slug: "crispy-fries",
    name: "Crispy Fries",
    description: "Golden fries with a light sea salt finish.",
    priceCents: 9900,
    imageUrl: "https://www.allrecipes.com/thmb/cgbx7nNnNGRNXgUtWeLLBaYwua4=/1500x0/filters:no_upscale():max_bytes(150000):strip_icc()/163062-crispy-turnip-fries-ddmfs-57-step-478-4x3-c84399b1e5ba4f61872f74648966b2fc.jpg",
    stockQty: 40,
    isAvailable: true
  },
  {
    id: "menu-paneer-wrap",
    slug: "paneer-wrap",
    name: "Paneer Wrap",
    description: "Soft wrap loaded with paneer tikka, onions, and mint mayo.",
    priceCents: 21900,
    imageUrl: "https://www.indianhealthyrecipes.com/wp-content/uploads/2024/02/paneer-kathi-roll-recipe.jpg",
    stockQty: 20,
    isAvailable: true
  },
  {
    id: "menu-garlic-bread",
    slug: "garlic-bread",
    name: "Garlic Bread",
    description: "Toasted bread with garlic butter and herbs.",
    priceCents: 12900,
    imageUrl: "https://www.foodandwine.com/thmb/pxx49mdooRZWdYRsBFzygKIU4AE=/1500x0/filters:no_upscale():max_bytes(150000):strip_icc()/parmesan-garlic-bread-FT-RECIPE0825-2c5ceae59ad34210886c4576e89617cd.jpg",
    stockQty: 30,
    isAvailable: true
  },
  {
    id: "menu-chocolate-shake",
    slug: "chocolate-shake",
    name: "Chocolate Shake",
    description: "Rich chocolate milkshake topped with cocoa dust.",
    priceCents: 14900,
    imageUrl: "https://noblepig.com/site/wp-content/uploads/2025/07/ultimate-chocolate-freakshake.jpg",
    stockQty: 22,
    isAvailable: true
  },
  {
    id: "menu-caesar-salad",
    slug: "caesar-salad",
    name: "Caesar Salad",
    description: "Crisp greens, crunchy croutons, parmesan, and Caesar dressing.",
    priceCents: 19900,
    imageUrl: "https://cdn.loveandlemons.com/wp-content/uploads/2024/12/caesar-salad.jpg",
    stockQty: 16,
    isAvailable: true
  },
  {
    id: "menu-cheese-pasta",
    slug: "cheese-pasta",
    name: "Cheese Pasta",
    description: "Creamy pasta tossed with herbs and a three-cheese blend.",
    priceCents: 28900,
    imageUrl: "https://carlsbadcravings.com/wp-content/uploads/2016/11/One-Skillet-Cheesy-Penne-1.jpg",
    stockQty: 14,
    isAvailable: true
  }
];

export async function seedMenuCatalog(menuItemModel, executor) {
  await menuItemModel.upsertMany(defaultMenuItems, executor);
}
