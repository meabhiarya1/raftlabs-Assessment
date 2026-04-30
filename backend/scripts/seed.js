import { db } from "../src/lib/mysql.js";
import { seedMenuCatalog } from "../src/modules/menu/menu.seed.js";

async function main() {
  await seedMenuCatalog(db);
  console.log("Menu seed completed.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await db.close();
  });
