export const orderAssociations = Object.freeze([
  {
    source: "Order",
    relation: "hasMany",
    target: "OrderItem",
    as: "items",
    foreignKey: "order_id"
  },
  {
    source: "Order",
    relation: "hasMany",
    target: "OrderStatusHistory",
    as: "statusHistory",
    foreignKey: "order_id"
  },
  {
    source: "OrderItem",
    relation: "belongsTo",
    target: "Order",
    as: "order",
    foreignKey: "order_id"
  },
  {
    source: "OrderItem",
    relation: "belongsTo",
    target: "MenuItem",
    as: "menuItem",
    foreignKey: "menu_item_id"
  },
  {
    source: "OrderStatusHistory",
    relation: "belongsTo",
    target: "Order",
    as: "order",
    foreignKey: "order_id"
  }
]);
