import { seedMenuCatalog } from "../seeders/menu.seeder.js";

export class MenuService {
  constructor(menuItemModel) {
    this.menuItemModel = menuItemModel;
  }

  async listMenuItems() {
    return this.menuItemModel.listAll();
  }

  async seedMenuIfEmpty() {
    const totalItems = await this.menuItemModel.countAll();

    if (totalItems === 0) {
      await seedMenuCatalog(this.menuItemModel);
    }
  }
}
