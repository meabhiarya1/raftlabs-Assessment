const defaultMenuItems = [
  {
    id: "menu-margherita-pizza",
    slug: "margherita-pizza",
    name: "Margherita Pizza",
    description: "Classic tomato sauce, mozzarella, and basil.",
    priceCents: 34900,
    imageUrl: "https://placehold.co/600x400?text=Margherita+Pizza",
    stockQty: 25,
    isAvailable: true
  },
  {
    id: "menu-veggie-burger",
    slug: "veggie-burger",
    name: "Veggie Burger",
    description: "Grilled veggie patty with lettuce, tomato, and house sauce.",
    priceCents: 25900,
    imageUrl: "https://placehold.co/600x400?text=Veggie+Burger",
    stockQty: 18,
    isAvailable: true
  },
  {
    id: "menu-crispy-fries",
    slug: "crispy-fries",
    name: "Crispy Fries",
    description: "Golden fries with a light sea salt finish.",
    priceCents: 9900,
    imageUrl: "https://placehold.co/600x400?text=Crispy+Fries",
    stockQty: 40,
    isAvailable: true
  },
  {
    id: "menu-paneer-wrap",
    slug: "paneer-wrap",
    name: "Paneer Wrap",
    description: "Soft wrap loaded with paneer tikka, onions, and mint mayo.",
    priceCents: 21900,
    imageUrl: "https://placehold.co/600x400?text=Paneer+Wrap",
    stockQty: 20,
    isAvailable: true
  },
  {
    id: "menu-garlic-bread",
    slug: "garlic-bread",
    name: "Garlic Bread",
    description: "Toasted bread with garlic butter and herbs.",
    priceCents: 12900,
    imageUrl: "https://placehold.co/600x400?text=Garlic+Bread",
    stockQty: 30,
    isAvailable: true
  },
  {
    id: "menu-chocolate-shake",
    slug: "chocolate-shake",
    name: "Chocolate Shake",
    description: "Rich chocolate milkshake topped with cocoa dust.",
    priceCents: 14900,
    imageUrl: "https://placehold.co/600x400?text=Chocolate+Shake",
    stockQty: 22,
    isAvailable: true
  },
  {
    id: "menu-caesar-salad",
    slug: "caesar-salad",
    name: "Caesar Salad",
    description: "Crisp greens, crunchy croutons, parmesan, and Caesar dressing.",
    priceCents: 19900,
    imageUrl: "https://placehold.co/600x400?text=Caesar+Salad",
    stockQty: 16,
    isAvailable: true
  },
  {
    id: "menu-cheese-pasta",
    slug: "cheese-pasta",
    name: "Cheese Pasta",
    description: "Creamy pasta tossed with herbs and a three-cheese blend.",
    priceCents: 28900,
    imageUrl: "https://placehold.co/600x400?text=Cheese+Pasta",
    stockQty: 14,
    isAvailable: true
  }
];

export async function seedMenuCatalog(db) {
  for (const item of defaultMenuItems) {
    await db.execute(
      `
        INSERT INTO menu_items (
          id,
          slug,
          name,
          description,
          price_cents,
          image_url,
          stock_qty,
          is_available
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
          name = VALUES(name),
          description = VALUES(description),
          price_cents = VALUES(price_cents),
          image_url = VALUES(image_url),
          stock_qty = VALUES(stock_qty),
          is_available = VALUES(is_available)
      `,
      [
        item.id,
        item.slug,
        item.name,
        item.description,
        item.priceCents,
        item.imageUrl,
        item.stockQty,
        item.isAvailable
      ]
    );
  }
}
