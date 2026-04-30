import { prepareRuntime } from "./bootstrap/prepare-runtime.js";
import { buildApp } from "./app.js";
import { env } from "./config/env.js";
import { db } from "./database/connection.js";
import { orderEvents } from "./realtime/order-events.js";
import { OrderStatusOrchestrator } from "./realtime/order-status-orchestrator.js";
import { createRealtimeGateway } from "./realtime/socket-gateway.js";

async function bootstrap() {
  const app = buildApp();
  const realtimeGateway = createRealtimeGateway(app.server, orderEvents);
  const orchestrator = new OrderStatusOrchestrator(app.services.orderService, app.log);

  app.addHook("onClose", async () => {
    orchestrator.stop();
    await realtimeGateway.close();
    await db.close();
  });

  await prepareRuntime({
    services: app.services,
    logger: app.log
  });

  await app.listen({
    host: env.HOST,
    port: env.PORT
  });

  orchestrator.start();
}

bootstrap().catch(async (error) => {
  console.error(error);
  await db.close();
  process.exit(1);
});
