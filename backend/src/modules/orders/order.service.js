import { randomUUID } from "node:crypto";
import { ConflictError, NotFoundError, ValidationError } from "../../common/errors.js";
import { env } from "../../config/env.js";
import {
  buildOrderLineItems,
  calculateSubtotal,
  normalizeOrderItems
} from "./order.pricing.js";
import {
  canCancelOrder,
  canEditOrderDetails,
  canTransitionStatus,
  getNextAutoStatus
} from "./order-status.machine.js";

function buildPlaceholders(count) {
  return Array.from({ length: count }, () => "?").join(", ");
}

function mapOrderRecord(row) {
  if (!row) {
    return null;
  }

  return {
    id: row.id,
    customerName: row.customerName,
    customerAddress: row.customerAddress,
    customerPhone: row.customerPhone,
    status: row.status,
    subtotalCents: row.subtotalCents,
    totalCents: row.totalCents,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt
  };
}

function mapOrderItem(row) {
  return {
    id: row.id,
    menuItemId: row.menuItemId,
    itemNameSnapshot: row.itemNameSnapshot,
    unitPriceCents: row.unitPriceCents,
    quantity: row.quantity,
    lineTotalCents: row.lineTotalCents
  };
}

function mapOrderStatusHistory(row) {
  return {
    id: row.id,
    status: row.status,
    notes: row.notes,
    changedAt: row.changedAt
  };
}

async function getOrderDetails(executor, orderId) {
  const [orderRow] = await executor.query(
    `
      SELECT
        id,
        customer_name AS customerName,
        customer_address AS customerAddress,
        customer_phone AS customerPhone,
        status,
        subtotal_cents AS subtotalCents,
        total_cents AS totalCents,
        created_at AS createdAt,
        updated_at AS updatedAt
      FROM orders
      WHERE id = ?
    `,
    [orderId]
  );

  if (!orderRow) {
    return null;
  }

  const items = await executor.query(
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

  const statusHistory = await executor.query(
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

  return {
    ...mapOrderRecord(orderRow),
    items: items.map(mapOrderItem),
    statusHistory: statusHistory.map(mapOrderStatusHistory)
  };
}

export class OrderService {
  constructor(db, events) {
    this.db = db;
    this.events = events;
  }

  async listOrders() {
    const rows = await this.db.query(
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
      totalCents: row.totalCents,
      itemCount: Number(row.itemCount),
      createdAt: row.createdAt,
      updatedAt: row.updatedAt
    }));
  }

  async getOrderById(orderId) {
    const order = await getOrderDetails(this.db, orderId);

    if (!order) {
      throw new NotFoundError(`Order ${orderId} was not found.`);
    }

    return order;
  }

  async createOrder(input) {
    const requestedItems = normalizeOrderItems(input.items);

    if (requestedItems.length === 0) {
      throw new ValidationError("At least one order item is required.");
    }

    const createdOrder = await this.db.transaction(async (tx) => {
      const ids = requestedItems.map((item) => item.menuItemId);
      const menuItems = await tx.query(
        `
          SELECT
            id,
            name,
            price_cents AS priceCents,
            stock_qty AS stockQty,
            is_available AS isAvailable
          FROM menu_items
          WHERE id IN (${buildPlaceholders(ids.length)})
          FOR UPDATE
        `,
        ids
      );

      if (menuItems.length !== requestedItems.length) {
        throw new ValidationError("One or more selected menu items do not exist.");
      }

      for (const requestedItem of requestedItems) {
        const menuItem = menuItems.find((entry) => entry.id === requestedItem.menuItemId);

        if (!menuItem) {
          throw new ValidationError("One or more selected menu items do not exist.");
        }

        if (!Boolean(menuItem.isAvailable)) {
          throw new ConflictError(`${menuItem.name} is currently unavailable.`);
        }

        if (Number(menuItem.stockQty) < requestedItem.quantity) {
          throw new ConflictError(
            `${menuItem.name} only has ${menuItem.stockQty} item(s) left in stock.`
          );
        }
      }

      const lineItems = buildOrderLineItems(requestedItems, menuItems);
      const subtotalCents = calculateSubtotal(lineItems);
      const orderId = randomUUID();

      for (const lineItem of lineItems) {
        const updated = await tx.execute(
          `
            UPDATE menu_items
            SET stock_qty = stock_qty - ?
            WHERE id = ? AND is_available = TRUE AND stock_qty >= ?
          `,
          [lineItem.quantity, lineItem.menuItemId, lineItem.quantity]
        );

        if (Number(updated.affectedRows) === 0) {
          throw new ConflictError("Stock changed while placing the order. Please try again.");
        }
      }

      await tx.execute(
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
          VALUES (?, ?, ?, ?, 'RECEIVED', ?, ?, ?)
        `,
        [
          orderId,
          input.customerName,
          input.customerAddress,
          input.customerPhone,
          subtotalCents,
          subtotalCents,
          new Date()
        ]
      );

      for (const lineItem of lineItems) {
        await tx.execute(
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

      await tx.execute(
        `
          INSERT INTO order_status_history (
            id,
            order_id,
            status,
            notes
          )
          VALUES (?, ?, 'RECEIVED', ?)
        `,
        [randomUUID(), orderId, "Order created"]
      );

      return getOrderDetails(tx, orderId);
    });

    return createdOrder;
  }

  async updateOrderDetails(orderId, input) {
    const existing = await this.db.query("SELECT status FROM orders WHERE id = ?", [orderId]);
    const currentOrder = existing[0];

    if (!currentOrder) {
      throw new NotFoundError(`Order ${orderId} was not found.`);
    }

    if (!canEditOrderDetails(currentOrder.status)) {
      throw new ConflictError("Order details can only be updated before dispatch.");
    }

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

    if (fields.length > 0) {
      values.push(orderId);
      await this.db.execute(`UPDATE orders SET ${fields.join(", ")} WHERE id = ?`, values);
    }

    return this.getOrderById(orderId);
  }

  async updateOrderStatus(orderId, input) {
    const updatedOrder = await this.db.transaction(async (tx) => {
      const [existing] = await tx.query(
        `
          SELECT
            id,
            status
          FROM orders
          WHERE id = ?
          FOR UPDATE
        `,
        [orderId]
      );

      if (!existing) {
        throw new NotFoundError(`Order ${orderId} was not found.`);
      }

      if (existing.status === input.status) {
        return getOrderDetails(tx, orderId);
      }

      if (!canTransitionStatus(existing.status, input.status)) {
        throw new ConflictError(
          `Order cannot move from ${existing.status} to ${input.status}.`
        );
      }

      if (input.status === "CANCELLED") {
        if (!canCancelOrder(existing.status)) {
          throw new ConflictError("Only received or preparing orders can be cancelled.");
        }

        const items = await tx.query(
          `
            SELECT
              menu_item_id AS menuItemId,
              quantity
            FROM order_items
            WHERE order_id = ?
          `,
          [orderId]
        );

        for (const item of items) {
          await tx.execute(
            "UPDATE menu_items SET stock_qty = stock_qty + ? WHERE id = ?",
            [item.quantity, item.menuItemId]
          );
        }
      }

      await tx.execute(
        `
          UPDATE orders
          SET status = ?, last_status_at = ?
          WHERE id = ?
        `,
        [input.status, new Date(), orderId]
      );

      await tx.execute(
        `
          INSERT INTO order_status_history (
            id,
            order_id,
            status,
            notes
          )
          VALUES (?, ?, ?, ?)
        `,
        [randomUUID(), orderId, input.status, input.notes ?? null]
      );

      return getOrderDetails(tx, orderId);
    });

    this.events.emitOrderStatusUpdated(updatedOrder);
    return updatedOrder;
  }

  async cancelOrder(orderId) {
    return this.updateOrderStatus(orderId, {
      status: "CANCELLED",
      notes: "Order cancelled by user"
    });
  }

  async advanceEligibleOrders() {
    const threshold = new Date(Date.now() - env.ORDER_STATUS_STEP_MS);
    const candidates = await this.db.query(
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

    let progressed = 0;

    for (const candidate of candidates) {
      const nextStatus = getNextAutoStatus(candidate.status);

      if (!nextStatus) {
        continue;
      }

      await this.updateOrderStatus(candidate.id, {
        status: nextStatus,
        notes: "Automated status progression"
      });
      progressed += 1;
    }

    return progressed;
  }
}
