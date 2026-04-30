import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { API_KEY_HEADER } from "../../src/config/constant.js";
import { createRealDatabaseTestHarness } from "../helpers/real-db.js";

const realDbDescribe =
  process.env.RUN_REAL_DB_TESTS === "true" ? describe.sequential : describe.skip;

const authHeaders = {
  [API_KEY_HEADER]: process.env.API_KEY || "development-api-key"
};

async function createOrder(app, payload = {}) {
  const response = await app.inject({
    method: "POST",
    url: "/api/orders",
    headers: authHeaders,
    payload: {
      customerName: "Alex Doe",
      customerAddress: "221B Baker Street, London",
      customerPhone: "+1234567890",
      items: [{ menuItemId: "menu-margherita-pizza", quantity: 2 }],
      ...payload
    }
  });

  return response;
}

realDbDescribe("app routes with real MySQL database", () => {
  let harness;

  beforeAll(async () => {
    harness = await createRealDatabaseTestHarness();
  });

  beforeEach(async () => {
    await harness.reset();
  });

  afterAll(async () => {
    if (harness) {
      await harness.close();
    }
  });

  it("reads seeded menu items from MySQL", async () => {
    const response = await harness.app.inject({
      method: "GET",
      url: "/api/menu",
      headers: authHeaders
    });

    expect(response.statusCode).toBe(200);

    const payload = response.json();
    expect(payload.data.length).toBeGreaterThan(0);
    expect(payload.data[0]).toMatchObject({
      id: expect.any(String),
      name: expect.any(String),
      description: expect.any(String),
      priceCents: expect.any(Number)
    });
  });

  it("creates an order, persists it, and decrements stock", async () => {
    const [beforeStockRow] = await harness.db.query(
      "SELECT stock_qty AS stockQty FROM menu_items WHERE id = ?",
      ["menu-margherita-pizza"]
    );

    const response = await createOrder(harness.app, {
      items: [{ menuItemId: "menu-margherita-pizza", quantity: 2 }]
    });

    expect(response.statusCode).toBe(201);
    const order = response.json().data;

    const [persistedOrder] = await harness.db.query("SELECT status FROM orders WHERE id = ?", [order.id]);
    const persistedItems = await harness.db.query(
      "SELECT quantity FROM order_items WHERE order_id = ?",
      [order.id]
    );
    const persistedHistory = await harness.db.query(
      "SELECT status FROM order_status_history WHERE order_id = ?",
      [order.id]
    );
    const [afterStockRow] = await harness.db.query(
      "SELECT stock_qty AS stockQty FROM menu_items WHERE id = ?",
      ["menu-margherita-pizza"]
    );

    expect(persistedOrder.status).toBe("RECEIVED");
    expect(persistedItems).toHaveLength(1);
    expect(Number(persistedItems[0].quantity)).toBe(2);
    expect(persistedHistory).toHaveLength(1);
    expect(afterStockRow.stockQty).toBe(beforeStockRow.stockQty - 2);
  });

  it("lists and fetches orders from the real database", async () => {
    const createdResponse = await createOrder(harness.app, {
      items: [{ menuItemId: "menu-garlic-bread", quantity: 1 }]
    });
    const orderId = createdResponse.json().data.id;

    const listResponse = await harness.app.inject({
      method: "GET",
      url: "/api/orders",
      headers: authHeaders
    });
    const singleResponse = await harness.app.inject({
      method: "GET",
      url: `/api/orders/${orderId}`,
      headers: authHeaders
    });

    expect(listResponse.statusCode).toBe(200);
    expect(listResponse.json().data).toHaveLength(1);
    expect(listResponse.json().data[0]).toMatchObject({
      id: orderId,
      itemCount: 1,
      status: "RECEIVED"
    });

    expect(singleResponse.statusCode).toBe(200);
    expect(singleResponse.json().data.id).toBe(orderId);
    expect(singleResponse.json().data.items).toHaveLength(1);
    expect(singleResponse.json().data.statusHistory).toHaveLength(1);
  });

  it("updates order details while the order is still editable", async () => {
    const createdResponse = await createOrder(harness.app);
    const orderId = createdResponse.json().data.id;

    const updateResponse = await harness.app.inject({
      method: "PATCH",
      url: `/api/orders/${orderId}`,
      headers: authHeaders,
      payload: {
        customerAddress: "742 Evergreen Terrace, Springfield"
      }
    });

    expect(updateResponse.statusCode).toBe(200);
    expect(updateResponse.json().data.customerAddress).toBe(
      "742 Evergreen Terrace, Springfield"
    );
  });

  it("updates order status and records status history in the database", async () => {
    const createdResponse = await createOrder(harness.app);
    const orderId = createdResponse.json().data.id;

    const statusResponse = await harness.app.inject({
      method: "PATCH",
      url: `/api/orders/${orderId}/status`,
      headers: authHeaders,
      payload: {
        status: "PREPARING",
        notes: "manual review"
      }
    });

    expect(statusResponse.statusCode).toBe(200);
    expect(statusResponse.json().data.status).toBe("PREPARING");
    expect(statusResponse.json().data.statusHistory).toHaveLength(2);

    const [persistedOrder] = await harness.db.query("SELECT status FROM orders WHERE id = ?", [orderId]);
    expect(persistedOrder.status).toBe("PREPARING");
  });

  it("rejects invalid status transitions against real data", async () => {
    const createdResponse = await createOrder(harness.app);
    const orderId = createdResponse.json().data.id;

    const invalidTransitionResponse = await harness.app.inject({
      method: "PATCH",
      url: `/api/orders/${orderId}/status`,
      headers: authHeaders,
      payload: {
        status: "DELIVERED"
      }
    });

    expect(invalidTransitionResponse.statusCode).toBe(409);
    expect(invalidTransitionResponse.json().error.code).toBe("CONFLICT");
  });

  it("restores stock when an order is cancelled", async () => {
    const [beforeStockRow] = await harness.db.query(
      "SELECT stock_qty AS stockQty FROM menu_items WHERE id = ?",
      ["menu-cheese-pasta"]
    );

    const createdResponse = await createOrder(harness.app, {
      items: [{ menuItemId: "menu-cheese-pasta", quantity: 3 }]
    });
    const orderId = createdResponse.json().data.id;

    const cancelResponse = await harness.app.inject({
      method: "DELETE",
      url: `/api/orders/${orderId}`,
      headers: authHeaders
    });

    expect(cancelResponse.statusCode).toBe(200);
    expect(cancelResponse.json().data.status).toBe("CANCELLED");

    const [afterStockRow] = await harness.db.query(
      "SELECT stock_qty AS stockQty FROM menu_items WHERE id = ?",
      ["menu-cheese-pasta"]
    );

    expect(afterStockRow.stockQty).toBe(beforeStockRow.stockQty);
  });

  it("returns a conflict when stock is insufficient in the real database", async () => {
    const response = await createOrder(harness.app, {
      items: [{ menuItemId: "menu-cheese-pasta", quantity: 15 }]
    });

    expect(response.statusCode).toBe(409);
    expect(response.json().error.code).toBe("CONFLICT");

    const [orderCountRow] = await harness.db.query("SELECT COUNT(*) AS count FROM orders");
    expect(Number(orderCountRow.count)).toBe(0);
  });
});
