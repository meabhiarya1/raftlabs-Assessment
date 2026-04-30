import { env } from "../config/env.js";
import { ensureDatabaseSchema } from "../database/schema-manager.js";

export async function prepareRuntime({ services, logger }) {
  if (env.AUTO_MIGRATE_DB) {
    await ensureDatabaseSchema();
    logger.info("Database schema ensured.");
  }

  if (env.AUTO_SEED_MENU) {
    await services.menuService.seedMenuIfEmpty();
    logger.info("Menu seed check completed.");
  }
}
