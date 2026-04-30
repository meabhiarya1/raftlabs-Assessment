import cors from "@fastify/cors";
import Fastify from "fastify";
import { AppError } from "./common/errors.js";
import { env } from "./config/env.js";
import { db } from "./lib/mysql.js";
import { orderEvents } from "./lib/order-events.js";
import { menuRoutes } from "./modules/menu/menu.routes.js";
import { MenuService } from "./modules/menu/menu.service.js";
import { orderRoutes } from "./modules/orders/orders.routes.js";
import { OrderService } from "./modules/orders/order.service.js";

export function buildApp(services) {
  const app = Fastify({
    logger: env.NODE_ENV === "test" ? false : { level: env.LOG_LEVEL }
  });

  const resolvedServices = services ?? {
    menuService: new MenuService(db),
    orderService: new OrderService(db, orderEvents)
  };

  app.decorate("services", resolvedServices);

  app.register(cors, {
    origin: env.CORS_ORIGINS
  });

  app.get("/health", async () => ({
    status: "ok",
    service: "order-management-api",
    timestamp: new Date().toISOString()
  }));

  app.register(menuRoutes, { prefix: "/api/menu" });
  app.register(orderRoutes, { prefix: "/api/orders" });

  app.setErrorHandler((error, request, reply) => {
    if (error instanceof AppError) {
      return reply.status(error.statusCode).send({
        error: {
          code: error.code,
          message: error.message,
          details: error.details
        }
      });
    }

    request.log.error({ err: error }, "Unhandled request error.");
    return reply.status(500).send({
      error: {
        code: "INTERNAL_SERVER_ERROR",
        message: "Something went wrong."
      }
    });
  });

  return app;
}
