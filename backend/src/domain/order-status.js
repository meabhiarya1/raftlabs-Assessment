export const ORDER_STATUSES = [
  "RECEIVED",
  "PREPARING",
  "OUT_FOR_DELIVERY",
  "DELIVERED",
  "CANCELLED"
];

const transitions = {
  RECEIVED: ["PREPARING", "CANCELLED"],
  PREPARING: ["OUT_FOR_DELIVERY", "CANCELLED"],
  OUT_FOR_DELIVERY: ["DELIVERED"],
  DELIVERED: [],
  CANCELLED: []
};

export function canTransitionStatus(from, to) {
  return transitions[from].includes(to);
}

export function getNextAutoStatus(status) {
  switch (status) {
    case "RECEIVED":
      return "PREPARING";
    case "PREPARING":
      return "OUT_FOR_DELIVERY";
    case "OUT_FOR_DELIVERY":
      return "DELIVERED";
    default:
      return null;
  }
}

export function canCancelOrder(status) {
  return status === "RECEIVED" || status === "PREPARING";
}

export function canEditOrderDetails(status) {
  return status === "RECEIVED" || status === "PREPARING";
}
