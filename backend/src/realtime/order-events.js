import { EventEmitter } from "node:events";
import { ORDER_SOCKET_EVENTS } from "../config/constant.js";

export class OrderEvents {
  constructor() {
    this.emitter = new EventEmitter();
  }

  emitOrderStatusUpdated(order) {
    this.emitter.emit(ORDER_SOCKET_EVENTS.statusUpdated, order);
  }

  onOrderStatusUpdated(listener) {
    this.emitter.on(ORDER_SOCKET_EVENTS.statusUpdated, listener);

    return () => {
      this.emitter.off(ORDER_SOCKET_EVENTS.statusUpdated, listener);
    };
  }
}

export const orderEvents = new OrderEvents();
