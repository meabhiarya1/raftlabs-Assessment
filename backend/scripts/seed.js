import { db } from "../src/database/connection.js";
import { MenuItemModel } from "../src/models/menu-item.model.js";
import { seedMenuCatalog } from "../src/seeders/menu.seeder.js";

async function main() {
  await seedMenuCatalog(new MenuItemModel(db));
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
