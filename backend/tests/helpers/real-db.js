import { buildApp } from "../../src/app.js";
import { resolveDatabaseConfig } from "../../src/config/env.js";
import { createDatabaseClient } from "../../src/database/connection.js";
import { ensureDatabaseSchema } from "../../src/database/schema-manager.js";
import { MenuItemModel } from "../../src/models/menu-item.model.js";
import { OrderItemModel } from "../../src/models/order-item.model.js";
import { OrderModel } from "../../src/models/order.model.js";
import { OrderStatusHistoryModel } from "../../src/models/order-status-history.model.js";
import { OrderEvents } from "../../src/realtime/order-events.js";
import { seedMenuCatalog } from "../../src/seeders/menu.seeder.js";
import { MenuService } from "../../src/services/menu.service.js";
import { OrderService } from "../../src/services/order.service.js";

function resolveRealTestDatabaseConfig() {
  const baseConfig = resolveDatabaseConfig();

  return {
    ...baseConfig,
    database: process.env.DB_TEST_NAME || `${baseConfig.database}_vitest`
  };
}

async function resetDatabaseTables(db) {
  await db.execute("SET FOREIGN_KEY_CHECKS = 0");

  try {
    await db.execute("TRUNCATE TABLE order_status_history");
    await db.execute("TRUNCATE TABLE order_items");
    await db.execute("TRUNCATE TABLE orders");
    await db.execute("TRUNCATE TABLE menu_items");
  } finally {
    await db.execute("SET FOREIGN_KEY_CHECKS = 1");
  }
}

export async function createRealDatabaseTestHarness() {
  const databaseConfig = resolveRealTestDatabaseConfig();
  await ensureDatabaseSchema(databaseConfig);

  const db = createDatabaseClient(databaseConfig);
  const models = {
    menuItemModel: new MenuItemModel(db),
    orderModel: new OrderModel(db),
    orderItemModel: new OrderItemModel(db),
    orderStatusHistoryModel: new OrderStatusHistoryModel(db)
  };

  const orderEvents = new OrderEvents();
  const services = {
    menuService: new MenuService(models.menuItemModel),
    orderService: new OrderService({
      db,
      events: orderEvents,
      ...models
    })
  };

  const app = buildApp(services);

  return {
    app,
    db,
    models,
    services,
    async reset() {
      await resetDatabaseTables(db);
      await seedMenuCatalog(models.menuItemModel);
    },
    async close() {
      await app.close();
      await db.close();
    }
  };
}
