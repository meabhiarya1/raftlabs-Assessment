export const orderRoutes = async (app) => {
  app.get("/", app.controllers.orderController.listOrders);
  app.get("/:orderId", app.controllers.orderController.getOrderById);
  app.post("/", app.controllers.orderController.createOrder);
  app.patch("/:orderId", app.controllers.orderController.updateOrderDetails);
  app.patch("/:orderId/status", app.controllers.orderController.updateOrderStatus);
  app.delete("/:orderId", app.controllers.orderController.cancelOrder);
};
