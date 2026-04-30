import { ensureDatabaseSchema } from "../src/database/schema-manager.js";

async function main() {
  await ensureDatabaseSchema();
  console.log("Database schema is up to date.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
