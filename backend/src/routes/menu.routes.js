export const menuRoutes = async (app) => {
  app.get("/", app.controllers.menuController.listMenuItems);
};
