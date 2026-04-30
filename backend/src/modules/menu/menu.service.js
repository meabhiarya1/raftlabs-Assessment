import { seedMenuCatalog } from "./menu.seed.js";

function serializeMenuItem(item) {
  return {
    id: item.id,
    slug: item.slug,
    name: item.name,
    description: item.description,
    priceCents: item.priceCents,
    imageUrl: item.imageUrl,
    stockQty: item.stockQty,
    isAvailable: Boolean(item.isAvailable)
  };
}

export class MenuService {
  constructor(db) {
    this.db = db;
  }

  async listMenuItems() {
    const items = await this.db.query(
      `
        SELECT
          id,
          slug,
          name,
          description,
          price_cents AS priceCents,
          image_url AS imageUrl,
          stock_qty AS stockQty,
          is_available AS isAvailable
        FROM menu_items
        ORDER BY is_available DESC, name ASC
      `
    );

    return items.map(serializeMenuItem);
  }

  async seedMenuIfEmpty() {
    const [row] = await this.db.query("SELECT COUNT(*) AS count FROM menu_items");

    if (Number(row?.count ?? 0) === 0) {
      await seedMenuCatalog(this.db);
    }
  }
}
