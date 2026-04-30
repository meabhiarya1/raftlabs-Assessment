import { associations } from "../associations/index.js";
import { createMenuController } from "../controllers/menu.controller.js";
import { createOrderController } from "../controllers/order.controller.js";
import { db } from "../database/connection.js";
import { MenuItemModel } from "../models/menu-item.model.js";
import { OrderItemModel } from "../models/order-item.model.js";
import { OrderModel } from "../models/order.model.js";
import { OrderStatusHistoryModel } from "../models/order-status-history.model.js";
import { orderEvents } from "../realtime/order-events.js";
import { MenuService } from "../services/menu.service.js";
import { OrderService } from "../services/order.service.js";

function createControllers(services) {
  return {
    menuController: createMenuController(services.menuService),
    orderController: createOrderController(services.orderService)
  };
}

export function createAppContext(services) {
  if (services) {
    return {
      associations,
      services,
      controllers: createControllers(services)
    };
  }

  const models = {
    menuItemModel: new MenuItemModel(db),
    orderModel: new OrderModel(db),
    orderItemModel: new OrderItemModel(db),
    orderStatusHistoryModel: new OrderStatusHistoryModel(db)
  };

  const serviceInstances = {
    menuService: new MenuService(models.menuItemModel),
    orderService: new OrderService({
      db,
      events: orderEvents,
      ...models
    })
  };

  return {
    associations,
    models,
    services: serviceInstances,
    controllers: createControllers(serviceInstances)
  };
}
