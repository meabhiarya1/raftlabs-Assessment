import mysql from "mysql2/promise";
import { env, resolveDatabaseConfig } from "../config/env.js";

function createConnectionAdapter(connection) {
  return {
    async query(sql, params = []) {
      const [rows] = await connection.execute(sql, params);
      return rows;
    },
    async execute(sql, params = []) {
      const [result] = await connection.execute(sql, params);
      return result;
    }
  };
}

export function createDatabaseClient() {
  const pool = mysql.createPool({
    ...resolveDatabaseConfig(),
    waitForConnections: true,
    connectionLimit: env.DB_POOL_LIMIT,
    queueLimit: 0,
    enableKeepAlive: true
  });

  return {
    async query(sql, params = []) {
      const [rows] = await pool.execute(sql, params);
      return rows;
    },
    async execute(sql, params = []) {
      const [result] = await pool.execute(sql, params);
      return result;
    },
    async transaction(work) {
      const connection = await pool.getConnection();
      const tx = createConnectionAdapter(connection);

      try {
        await connection.beginTransaction();
        const result = await work(tx);
        await connection.commit();
        return result;
      } catch (error) {
        await connection.rollback();
        throw error;
      } finally {
        connection.release();
      }
    },
    async close() {
      await pool.end();
    }
  };
}

export const db = createDatabaseClient();
