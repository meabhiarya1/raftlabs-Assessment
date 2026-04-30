import fs from "node:fs/promises";
import path from "node:path";
import mysql from "mysql2/promise";
import { fileURLToPath } from "node:url";
import { env, resolveDatabaseConfig } from "../config/env.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function ensureDatabaseSchema() {
  const schemaPath = path.resolve(__dirname, "../../database/schema.sql");
  const schemaSql = await fs.readFile(schemaPath, "utf8");
  const { database, ...connectionConfig } = resolveDatabaseConfig();

  const connection = await mysql.createConnection({
    ...connectionConfig,
    multipleStatements: true
  });

  try {
    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${database}\``);
    await connection.query(`USE \`${database}\``);
    await connection.query(schemaSql);
  } finally {
    await connection.end();
  }
}
