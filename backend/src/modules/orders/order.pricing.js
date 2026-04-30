import { ValidationError } from "../../common/errors.js";

export function normalizeOrderItems(items) {
  const aggregate = new Map();

  for (const item of items) {
    aggregate.set(item.menuItemId, (aggregate.get(item.menuItemId) ?? 0) + item.quantity);
  }

  return Array.from(aggregate.entries()).map(([menuItemId, quantity]) => ({
    menuItemId,
    quantity
  }));
}

export function buildOrderLineItems(items, menuItems) {
  const menuItemsById = new Map(menuItems.map((item) => [item.id, item]));

  return items.map((item) => {
    const menuItem = menuItemsById.get(item.menuItemId);

    if (!menuItem) {
      throw new ValidationError(`Menu item ${item.menuItemId} does not exist.`);
    }

    return {
      menuItemId: menuItem.id,
      itemNameSnapshot: menuItem.name,
      unitPriceCents: menuItem.priceCents,
      quantity: item.quantity,
      lineTotalCents: menuItem.priceCents * item.quantity
    };
  });
}

export function calculateSubtotal(lineItems) {
  return lineItems.reduce((sum, item) => sum + item.lineTotalCents, 0);
}
