import { parseWithSchema } from "../../common/http.js";
import {
  createOrderSchema,
  orderIdParamSchema,
  updateOrderDetailsSchema,
  updateOrderStatusSchema
} from "./order.schemas.js";

export const orderRoutes = async (app) => {
  app.get("/", async () => {
    const orders = await app.services.orderService.listOrders();

    return {
      data: orders
    };
  });

  app.get("/:orderId", async (request) => {
    const params = parseWithSchema(orderIdParamSchema, request.params);
    const order = await app.services.orderService.getOrderById(params.orderId);

    return {
      data: order
    };
  });

  app.post("/", async (request, reply) => {
    const body = parseWithSchema(createOrderSchema, request.body);
    const order = await app.services.orderService.createOrder(body);

    return reply.status(201).send({
      data: order
    });
  });

  app.patch("/:orderId", async (request) => {
    const params = parseWithSchema(orderIdParamSchema, request.params);
    const body = parseWithSchema(updateOrderDetailsSchema, request.body);
    const order = await app.services.orderService.updateOrderDetails(params.orderId, body);

    return {
      data: order
    };
  });

  app.patch("/:orderId/status", async (request) => {
    const params = parseWithSchema(orderIdParamSchema, request.params);
    const body = parseWithSchema(updateOrderStatusSchema, request.body);
    const order = await app.services.orderService.updateOrderStatus(params.orderId, body);

    return {
      data: order
    };
  });

  app.delete("/:orderId", async (request) => {
    const params = parseWithSchema(orderIdParamSchema, request.params);
    const order = await app.services.orderService.cancelOrder(params.orderId);

    return {
      data: order
    };
  });
};
