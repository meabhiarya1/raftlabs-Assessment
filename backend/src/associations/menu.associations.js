export const menuAssociations = Object.freeze([
  {
    source: "MenuItem",
    relation: "hasMany",
    target: "OrderItem",
    as: "orderItems",
    foreignKey: "menu_item_id"
  }
]);
