import { describe, expect, it } from "vitest";
import {
  buildOrderLineItems,
  calculateSubtotal,
  normalizeOrderItems
} from "../../src/modules/orders/order.pricing.js";

describe("order pricing helpers", () => {
  it("combines duplicate menu items into a single line", () => {
    const normalized = normalizeOrderItems([
      { menuItemId: "pizza", quantity: 1 },
      { menuItemId: "pizza", quantity: 2 },
      { menuItemId: "fries", quantity: 1 }
    ]);

    expect(normalized).toEqual([
      { menuItemId: "pizza", quantity: 3 },
      { menuItemId: "fries", quantity: 1 }
    ]);
  });

  it("builds line totals and subtotal correctly", () => {
    const lineItems = buildOrderLineItems(
      [
        { menuItemId: "pizza", quantity: 2 },
        { menuItemId: "fries", quantity: 1 }
      ],
      [
        { id: "pizza", name: "Pizza", priceCents: 30000 },
        { id: "fries", name: "Fries", priceCents: 10000 }
      ]
    );

    expect(lineItems).toEqual([
      {
        menuItemId: "pizza",
        itemNameSnapshot: "Pizza",
        unitPriceCents: 30000,
        quantity: 2,
        lineTotalCents: 60000
      },
      {
        menuItemId: "fries",
        itemNameSnapshot: "Fries",
        unitPriceCents: 10000,
        quantity: 1,
        lineTotalCents: 10000
      }
    ]);
    expect(calculateSubtotal(lineItems)).toBe(70000);
  });
});

