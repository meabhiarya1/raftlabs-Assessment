export const SERVICE_NAME = "order-management-api";

export const API_PREFIX = "/api";

export const ROUTE_PATHS = Object.freeze({
  menu: "/menu",
  orders: "/orders"
});

export const API_KEY_HEADER = "x-api-key";

export const ORDER_SOCKET_EVENTS = Object.freeze({
  subscribe: "order:subscribe",
  unsubscribe: "order:unsubscribe",
  statusUpdated: "order.status.updated"
});

export const ORDER_SOCKET_ROOM_PREFIX = "order:";
