function mapOrder(row) {
  if (!row) {
    return null;
  }

  return {
    id: row.id,
    customerName: row.customerName,
    customerAddress: row.customerAddress,
    customerPhone: row.customerPhone,
    status: row.status,
    subtotalCents: Number(row.subtotalCents),
    totalCents: Number(row.totalCents),
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    lastStatusAt: row.lastStatusAt
  };
}

export class OrderModel {
  constructor(db) {
    this.db = db;
  }

  getExecutor(executor) {
    return executor ?? this.db;
  }

  async listSummaries(executor) {
    const rows = await this.getExecutor(executor).query(
      `
        SELECT
          o.id,
          o.customer_name AS customerName,
          o.status,
          o.total_cents AS totalCents,
          COALESCE(SUM(oi.quantity), 0) AS itemCount,
          o.created_at AS createdAt,
          o.updated_at AS updatedAt
        FROM orders o
        LEFT JOIN order_items oi ON oi.order_id = o.id
        GROUP BY
          o.id,
          o.customer_name,
          o.status,
          o.total_cents,
          o.created_at,
          o.updated_at
        ORDER BY o.created_at DESC
      `
    );

    return rows.map((row) => ({
      id: row.id,
      customerName: row.customerName,
      status: row.status,
      totalCents: Number(row.totalCents),
      itemCount: Number(row.itemCount),
      createdAt: row.createdAt,
      updatedAt: row.updatedAt
    }));
  }

  async findById(orderId, executor) {
    const [row] = await this.getExecutor(executor).query(
      `
        SELECT
          id,
          customer_name AS customerName,
          customer_address AS customerAddress,
          customer_phone AS customerPhone,
          status,
          subtotal_cents AS subtotalCents,
          total_cents AS totalCents,
          last_status_at AS lastStatusAt,
          created_at AS createdAt,
          updated_at AS updatedAt
        FROM orders
        WHERE id = ?
      `,
      [orderId]
    );

    return mapOrder(row);
  }

  async findStatusById(orderId, executor, options = {}) {
    const lockClause = options.lock ? "FOR UPDATE" : "";
    const [row] = await this.getExecutor(executor).query(
      `
        SELECT
          id,
          status
        FROM orders
        WHERE id = ?
        ${lockClause}
      `,
      [orderId]
    );

    return row ?? null;
  }

  async create(order, executor) {
    await this.getExecutor(executor).execute(
      `
        INSERT INTO orders (
          id,
          customer_name,
          customer_address,
          customer_phone,
          status,
          subtotal_cents,
          total_cents,
          last_status_at
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        order.id,
        order.customerName,
        order.customerAddress,
        order.customerPhone,
        order.status,
        order.subtotalCents,
        order.totalCents,
        order.lastStatusAt
      ]
    );
  }

  async updateDetails(orderId, input, executor) {
    const fields = [];
    const values = [];

    if (input.customerName) {
      fields.push("customer_name = ?");
      values.push(input.customerName);
    }

    if (input.customerAddress) {
      fields.push("customer_address = ?");
      values.push(input.customerAddress);
    }

    if (input.customerPhone) {
      fields.push("customer_phone = ?");
      values.push(input.customerPhone);
    }

    if (fields.length === 0) {
      return;
    }

    values.push(orderId);
    await this.getExecutor(executor).execute(
      `UPDATE orders SET ${fields.join(", ")} WHERE id = ?`,
      values
    );
  }

  async updateStatus(orderId, status, changedAt, executor) {
    await this.getExecutor(executor).execute(
      `
        UPDATE orders
        SET status = ?, last_status_at = ?
        WHERE id = ?
      `,
      [status, changedAt, orderId]
    );
  }

  async findEligibleForAutoAdvance(threshold, executor) {
    return this.getExecutor(executor).query(
      `
        SELECT
          id,
          status
        FROM orders
        WHERE status IN ('RECEIVED', 'PREPARING', 'OUT_FOR_DELIVERY')
          AND last_status_at <= ?
        ORDER BY last_status_at ASC
      `,
      [threshold]
    );
  }
}
