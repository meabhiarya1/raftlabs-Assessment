import cors from "@fastify/cors";
import Fastify from "fastify";
import { createAppContext } from "./bootstrap/create-app-context.js";
import { AppError } from "./common/errors.js";
import { API_PREFIX, ROUTE_PATHS, SERVICE_NAME } from "./config/constant.js";
import { env } from "./config/env.js";
import { verifyApiKey } from "./middleware/api-key.middleware.js";
import { menuRoutes } from "./routes/menu.routes.js";
import { orderRoutes } from "./routes/order.routes.js";

export function buildApp(services) {
  const app = Fastify({
    logger: env.NODE_ENV === "test" ? false : { level: env.LOG_LEVEL }
  });

  const context = createAppContext(services);

  app.decorate("associations", context.associations);
  app.decorate("models", context.models ?? {});
  app.decorate("services", context.services);
  app.decorate("controllers", context.controllers);

  app.register(cors, {
    origin: env.CORS_ORIGINS
  });

  app.get("/health", async () => ({
    status: "ok",
    service: SERVICE_NAME,
    timestamp: new Date().toISOString()
  }));

  app.register(
    async (apiRoutes) => {
      apiRoutes.addHook("preHandler", verifyApiKey);
      apiRoutes.register(menuRoutes, { prefix: ROUTE_PATHS.menu });
      apiRoutes.register(orderRoutes, { prefix: ROUTE_PATHS.orders });
    },
    { prefix: API_PREFIX }
  );

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
