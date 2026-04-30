function mapMenuItem(row) {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    description: row.description,
    priceCents: Number(row.priceCents),
    imageUrl: row.imageUrl,
    stockQty: Number(row.stockQty),
    isAvailable: Boolean(row.isAvailable)
  };
}

function buildPlaceholders(count) {
  return Array.from({ length: count }, () => "?").join(", ");
}

export class MenuItemModel {
  constructor(db) {
    this.db = db;
  }

  getExecutor(executor) {
    return executor ?? this.db;
  }

  async listAll(executor) {
    const rows = await this.getExecutor(executor).query(
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

    return rows.map(mapMenuItem);
  }

  async countAll(executor) {
    const [row] = await this.getExecutor(executor).query("SELECT COUNT(*) AS count FROM menu_items");
    return Number(row?.count ?? 0);
  }

  async findAndLockByIds(ids, executor) {
    if (ids.length === 0) {
      return [];
    }

    const rows = await this.getExecutor(executor).query(
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
        WHERE id IN (${buildPlaceholders(ids.length)})
        FOR UPDATE
      `,
      ids
    );

    return rows.map(mapMenuItem);
  }

  async decrementStock(menuItemId, quantity, executor) {
    return this.getExecutor(executor).execute(
      `
        UPDATE menu_items
        SET stock_qty = stock_qty - ?
        WHERE id = ? AND is_available = TRUE AND stock_qty >= ?
      `,
      [quantity, menuItemId, quantity]
    );
  }

  async incrementStock(menuItemId, quantity, executor) {
    return this.getExecutor(executor).execute(
      "UPDATE menu_items SET stock_qty = stock_qty + ? WHERE id = ?",
      [quantity, menuItemId]
    );
  }

  async upsertMany(items, executor) {
    for (const item of items) {
      await this.getExecutor(executor).execute(
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
}
