import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  HOST: z.string().default("0.0.0.0"),
  PORT: z.coerce.number().int().positive().default(4000),
  DATABASE_URL: z.string().min(1).optional(),
  DB_HOST: z.string().default("localhost"),
  DB_PORT: z.coerce.number().int().positive().default(3306),
  DB_NAME: z.string().min(1).default("order_management"),
  DB_USER: z.string().min(1).default("root"),
  DB_PASSWORD: z.string().default(""),
  API_KEY: z.string().min(1).default("development-api-key"),
  CORS_ORIGIN: z.string().default("http://localhost:5173"),
  AUTO_MIGRATE_DB: z.coerce.boolean().default(true),
  AUTO_SEED_MENU: z.coerce.boolean().default(true),
  ORDER_STATUS_SIMULATION_ENABLED: z.coerce.boolean().default(true),
  ORDER_STATUS_STEP_MS: z.coerce.number().int().positive().default(15000),
  STATUS_POLL_INTERVAL_MS: z.coerce.number().int().positive().default(5000),
  DB_POOL_LIMIT: z.coerce.number().int().positive().default(10),
  LOG_LEVEL: z.string().default("info")
});

const parsedEnv = envSchema.parse(process.env);

export function parseDatabaseUrl(databaseUrl) {
  const url = new URL(databaseUrl);

  if (url.protocol !== "mysql:") {
    throw new Error("DATABASE_URL must use the mysql:// protocol.");
  }

  const database = url.pathname.replace(/^\//, "");

  if (!database) {
    throw new Error("DATABASE_URL must include a database name.");
  }

  return {
    host: url.hostname,
    port: url.port ? Number(url.port) : 3306,
    user: decodeURIComponent(url.username),
    password: decodeURIComponent(url.password),
    database
  };
}

export function resolveDatabaseConfig() {
  if (parsedEnv.DATABASE_URL) {
    return parseDatabaseUrl(parsedEnv.DATABASE_URL);
  }

  return {
    host: parsedEnv.DB_HOST,
    port: parsedEnv.DB_PORT,
    user: parsedEnv.DB_USER,
    password: parsedEnv.DB_PASSWORD,
    database: parsedEnv.DB_NAME
  };
}

export const env = {
  ...parsedEnv,
  CORS_ORIGINS: parsedEnv.CORS_ORIGIN.split(",")
    .map((origin) => origin.trim())
    .filter(Boolean)
};
