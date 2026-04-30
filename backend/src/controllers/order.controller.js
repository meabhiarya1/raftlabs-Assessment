import { parseWithSchema } from "../common/http.js";
import {
  createOrderSchema,
  orderIdParamSchema,
  updateOrderDetailsSchema,
  updateOrderStatusSchema
} from "../validators/order.validator.js";

export function createOrderController(orderService) {
  return {
    listOrders: async () => ({
      data: await orderService.listOrders()
    }),

    getOrderById: async (request) => {
      const params = parseWithSchema(orderIdParamSchema, request.params);
      const order = await orderService.getOrderById(params.orderId);

      return {
        data: order
      };
    },

    createOrder: async (request, reply) => {
      const body = parseWithSchema(createOrderSchema, request.body);
      const order = await orderService.createOrder(body);

      return reply.status(201).send({
        data: order
      });
    },

    updateOrderDetails: async (request) => {
      const params = parseWithSchema(orderIdParamSchema, request.params);
      const body = parseWithSchema(updateOrderDetailsSchema, request.body);
      const order = await orderService.updateOrderDetails(params.orderId, body);

      return {
        data: order
      };
    },

    updateOrderStatus: async (request) => {
      const params = parseWithSchema(orderIdParamSchema, request.params);
      const body = parseWithSchema(updateOrderStatusSchema, request.body);
      const order = await orderService.updateOrderStatus(params.orderId, body);

      return {
        data: order
      };
    },

    cancelOrder: async (request) => {
      const params = parseWithSchema(orderIdParamSchema, request.params);
      const order = await orderService.cancelOrder(params.orderId);

      return {
        data: order
      };
    }
  };
}
