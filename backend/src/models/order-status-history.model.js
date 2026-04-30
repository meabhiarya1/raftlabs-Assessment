import { randomUUID } from "node:crypto";

function mapStatusHistory(row) {
  return {
    id: row.id,
    status: row.status,
    notes: row.notes,
    changedAt: row.changedAt
  };
}

export class OrderStatusHistoryModel {
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
          status,
          notes,
          changed_at AS changedAt
        FROM order_status_history
        WHERE order_id = ?
        ORDER BY changed_at ASC, id ASC
      `,
      [orderId]
    );

    return rows.map(mapStatusHistory);
  }

  async create(entry, executor) {
    await this.getExecutor(executor).execute(
      `
        INSERT INTO order_status_history (
          id,
          order_id,
          status,
          notes
        )
        VALUES (?, ?, ?, ?)
      `,
      [randomUUID(), entry.orderId, entry.status, entry.notes ?? null]
    );
  }
}
