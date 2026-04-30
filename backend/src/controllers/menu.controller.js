export function createMenuController(menuService) {
  return {
    listMenuItems: async () => ({
      data: await menuService.listMenuItems()
    })
  };
}
