import { afterEach, describe, expect, it, vi } from "vitest";
import { buildApp } from "../../src/app.js";
import { API_KEY_HEADER } from "../../src/config/constant.js";

const authHeaders = {
  [API_KEY_HEADER]: "development-api-key"
};

function createServices() {
  return {
    menuService: {
      seedMenuIfEmpty: vi.fn(async () => undefined),
      listMenuItems: vi.fn(async () => [
        {
          id: "pizza-1",
          slug: "margherita-pizza",
          name: "Margherita Pizza",
          description: "Classic pizza",
          priceCents: 34900,
          imageUrl: "https://placehold.co/600x400?text=Pizza",
          stockQty: 12,
          isAvailable: true
        }
      ])
    },
    orderService: {
      listOrders: vi.fn(async () => []),
      getOrderById: vi.fn(async () => ({
        id: "order-1",
        customerName: "Alex Doe",
        customerAddress: "221B Baker Street, London",
        customerPhone: "1234567890",
        status: "RECEIVED",
        subtotalCents: 34900,
        totalCents: 34900,
        createdAt: new Date("2026-01-01T00:00:00.000Z"),
        updatedAt: new Date("2026-01-01T00:00:00.000Z"),
        items: [],
        statusHistory: []
      })),
      createOrder: vi.fn(async () => ({
        id: "order-1",
        customerName: "Alex Doe",
        customerAddress: "221B Baker Street, London",
        customerPhone: "1234567890",
        status: "RECEIVED",
        subtotalCents: 34900,
        totalCents: 34900,
        createdAt: new Date("2026-01-01T00:00:00.000Z"),
        updatedAt: new Date("2026-01-01T00:00:00.000Z"),
        items: [],
        statusHistory: []
      })),
      updateOrderDetails: vi.fn(async () => ({
        id: "order-1",
        customerName: "Updated Name",
        customerAddress: "Updated Address 123456",
        customerPhone: "1234567890",
        status: "RECEIVED",
        subtotalCents: 34900,
        totalCents: 34900,
        createdAt: new Date("2026-01-01T00:00:00.000Z"),
        updatedAt: new Date("2026-01-01T00:00:00.000Z"),
        items: [],
        statusHistory: []
      })),
      updateOrderStatus: vi.fn(async () => ({
        id: "order-1",
        customerName: "Alex Doe",
        customerAddress: "221B Baker Street, London",
        customerPhone: "1234567890",
        status: "PREPARING",
        subtotalCents: 34900,
        totalCents: 34900,
        createdAt: new Date("2026-01-01T00:00:00.000Z"),
        updatedAt: new Date("2026-01-01T00:00:00.000Z"),
        items: [],
        statusHistory: []
      })),
      cancelOrder: vi.fn(async () => ({
        id: "order-1",
        customerName: "Alex Doe",
        customerAddress: "221B Baker Street, London",
        customerPhone: "1234567890",
        status: "CANCELLED",
        subtotalCents: 34900,
        totalCents: 34900,
        createdAt: new Date("2026-01-01T00:00:00.000Z"),
        updatedAt: new Date("2026-01-01T00:00:00.000Z"),
        items: [],
        statusHistory: []
      })),
      advanceEligibleOrders: vi.fn(async () => 0)
    }
  };
}

const apps = [];

afterEach(async () => {
  await Promise.all(apps.splice(0).map((app) => app.close()));
});

describe("app routes", () => {
  it("serves the menu", async () => {
    const app = buildApp(createServices());
    apps.push(app);

    const response = await app.inject({
      method: "GET",
      url: "/api/menu",
      headers: authHeaders
    });

    expect(response.statusCode).toBe(200);
    expect(response.json().data).toHaveLength(1);
  });

  it("blocks api routes when api key is missing", async () => {
    const app = buildApp(createServices());
    apps.push(app);

    const response = await app.inject({
      method: "GET",
      url: "/api/menu"
    });

    expect(response.statusCode).toBe(401);
    expect(response.json().error.code).toBe("UNAUTHORIZED");
  });

  it("validates order creation payload", async () => {
    const app = buildApp(createServices());
    apps.push(app);

    const response = await app.inject({
      method: "POST",
      url: "/api/orders",
      headers: authHeaders,
      payload: {
        customerName: "Alex 123",
        customerAddress: "short",
        customerPhone: "123",
        items: []
      }
    });

    expect(response.statusCode).toBe(400);
    expect(response.json().error.code).toBe("VALIDATION_ERROR");
    expect(response.json().error.details.fieldErrors.customerName).toContain(
      "Full name must contain only letters and spaces."
    );
    expect(response.json().error.details.fieldErrors.customerPhone).toContain(
      "Mobile number must be exactly 10 digits."
    );
  });

  it("shows a digit-only validation error before phone length errors", async () => {
    const app = buildApp(createServices());
    apps.push(app);

    const response = await app.inject({
      method: "POST",
      url: "/api/orders",
      headers: authHeaders,
      payload: {
        customerName: "Alex Doe",
        customerAddress: "221B Baker Street, London",
        customerPhone: "62019508jj",
        items: [{ menuItemId: "pizza-1", quantity: 1 }]
      }
    });

    expect(response.statusCode).toBe(400);
    expect(response.json().error.details.fieldErrors.customerPhone[0]).toBe(
      "Mobile number must contain only digits."
    );
  });

  it("creates an order when payload is valid", async () => {
    const app = buildApp(createServices());
    apps.push(app);

    const response = await app.inject({
      method: "POST",
      url: "/api/orders",
      headers: authHeaders,
      payload: {
        customerName: "Alex Doe",
        customerAddress: "221B Baker Street, London",
        customerPhone: "1234567890",
        items: [{ menuItemId: "pizza-1", quantity: 2 }]
      }
    });

    expect(response.statusCode).toBe(201);
    expect(response.json().data.status).toBe("RECEIVED");
  });
});
