import { randomUUID } from "node:crypto";
import { ConflictError, NotFoundError, ValidationError } from "../common/errors.js";
import { env } from "../config/env.js";
import {
  buildOrderLineItems,
  calculateSubtotal,
  normalizeOrderItems
} from "../domain/order-pricing.js";
import {
  canCancelOrder,
  canEditOrderDetails,
  canTransitionStatus,
  getNextAutoStatus
} from "../domain/order-status.js";

export class OrderService {
  constructor({ db, events, orderModel, orderItemModel, orderStatusHistoryModel, menuItemModel }) {
    this.db = db;
    this.events = events;
    this.orderModel = orderModel;
    this.orderItemModel = orderItemModel;
    this.orderStatusHistoryModel = orderStatusHistoryModel;
    this.menuItemModel = menuItemModel;
  }

  async buildOrderDetails(orderId, executor = this.db) {
    const order = await this.orderModel.findById(orderId, executor);

    if (!order) {
      return null;
    }

    const [items, statusHistory] = await Promise.all([
      this.orderItemModel.findByOrderId(orderId, executor),
      this.orderStatusHistoryModel.findByOrderId(orderId, executor)
    ]);

    return {
      ...order,
      items,
      statusHistory
    };
  }

  async listOrders() {
    return this.orderModel.listSummaries();
  }

  async getOrderById(orderId) {
    const order = await this.buildOrderDetails(orderId);

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

    return this.db.transaction(async (tx) => {
      const ids = requestedItems.map((item) => item.menuItemId);
      const menuItems = await this.menuItemModel.findAndLockByIds(ids, tx);

      if (menuItems.length !== requestedItems.length) {
        throw new ValidationError("One or more selected menu items do not exist.");
      }

      for (const requestedItem of requestedItems) {
        const menuItem = menuItems.find((entry) => entry.id === requestedItem.menuItemId);

        if (!menuItem) {
          throw new ValidationError("One or more selected menu items do not exist.");
        }

        if (!menuItem.isAvailable) {
          throw new ConflictError(`${menuItem.name} is currently unavailable.`);
        }

        if (menuItem.stockQty < requestedItem.quantity) {
          throw new ConflictError(
            `${menuItem.name} only has ${menuItem.stockQty} item(s) left in stock.`
          );
        }
      }

      const lineItems = buildOrderLineItems(requestedItems, menuItems);
      const subtotalCents = calculateSubtotal(lineItems);
      const orderId = randomUUID();

      for (const lineItem of lineItems) {
        const updated = await this.menuItemModel.decrementStock(
          lineItem.menuItemId,
          lineItem.quantity,
          tx
        );

        if (Number(updated.affectedRows) === 0) {
          throw new ConflictError("Stock changed while placing the order. Please try again.");
        }
      }

      await this.orderModel.create(
        {
          id: orderId,
          customerName: input.customerName,
          customerAddress: input.customerAddress,
          customerPhone: input.customerPhone,
          status: "RECEIVED",
          subtotalCents,
          totalCents: subtotalCents,
          lastStatusAt: new Date()
        },
        tx
      );

      await this.orderItemModel.createMany(orderId, lineItems, tx);
      await this.orderStatusHistoryModel.create(
        {
          orderId,
          status: "RECEIVED",
          notes: "Order created"
        },
        tx
      );

      return this.buildOrderDetails(orderId, tx);
    });
  }

  async updateOrderDetails(orderId, input) {
    const currentOrder = await this.orderModel.findStatusById(orderId);

    if (!currentOrder) {
      throw new NotFoundError(`Order ${orderId} was not found.`);
    }

    if (!canEditOrderDetails(currentOrder.status)) {
      throw new ConflictError("Order details can only be updated before dispatch.");
    }

    await this.orderModel.updateDetails(orderId, input);
    return this.getOrderById(orderId);
  }

  async updateOrderStatus(orderId, input) {
    const updatedOrder = await this.db.transaction(async (tx) => {
      const existing = await this.orderModel.findStatusById(orderId, tx, {
        lock: true
      });

      if (!existing) {
        throw new NotFoundError(`Order ${orderId} was not found.`);
      }

      if (existing.status === input.status) {
        return this.buildOrderDetails(orderId, tx);
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

        const items = await this.orderItemModel.findByOrderId(orderId, tx);

        for (const item of items) {
          await this.menuItemModel.incrementStock(item.menuItemId, item.quantity, tx);
        }
      }

      await this.orderModel.updateStatus(orderId, input.status, new Date(), tx);
      await this.orderStatusHistoryModel.create(
        {
          orderId,
          status: input.status,
          notes: input.notes ?? null
        },
        tx
      );

      return this.buildOrderDetails(orderId, tx);
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
    const candidates = await this.orderModel.findEligibleForAutoAdvance(threshold);
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
