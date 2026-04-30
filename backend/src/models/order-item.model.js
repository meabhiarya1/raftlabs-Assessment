import { randomUUID } from "node:crypto";

function mapOrderItem(row) {
  return {
    id: row.id,
    menuItemId: row.menuItemId,
    itemNameSnapshot: row.itemNameSnapshot,
    unitPriceCents: Number(row.unitPriceCents),
    quantity: Number(row.quantity),
    lineTotalCents: Number(row.lineTotalCents)
  };
}

export class OrderItemModel {
  constructor(db) {
    this.db = db;
  }

  getExecutor(executor) {
    return executor ?? this.db;
  }

  async findByOrderId(orderId, executor) {
    const rows = await this.getExecutor(executor).query(
      `
        SELECT
          id,
          menu_item_id AS menuItemId,
          item_name_snapshot AS itemNameSnapshot,
          unit_price_cents AS unitPriceCents,
          quantity,
          line_total_cents AS lineTotalCents
        FROM order_items
        WHERE order_id = ?
        ORDER BY created_at ASC, id ASC
      `,
      [orderId]
    );

    return rows.map(mapOrderItem);
  }

  async createMany(orderId, lineItems, executor) {
    for (const lineItem of lineItems) {
      await this.getExecutor(executor).execute(
        `
          INSERT INTO order_items (
            id,
            order_id,
            menu_item_id,
            item_name_snapshot,
            unit_price_cents,
            quantity,
            line_total_cents
          )
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `,
        [
          randomUUID(),
          orderId,
          lineItem.menuItemId,
          lineItem.itemNameSnapshot,
          lineItem.unitPriceCents,
          lineItem.quantity,
          lineItem.lineTotalCents
        ]
      );
    }
  }
}
