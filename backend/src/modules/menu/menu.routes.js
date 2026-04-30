export const menuRoutes = async (app) => {
  app.get("/", async () => {
    const items = await app.services.menuService.listMenuItems();

    return {
      data: items
    };
  });
};
