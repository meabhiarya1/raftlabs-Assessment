import { EventEmitter } from "node:events";

export class OrderEvents {
  constructor() {
    this.emitter = new EventEmitter();
  }

  emitOrderStatusUpdated(order) {
    this.emitter.emit("order.status.updated", order);
  }

  onOrderStatusUpdated(listener) {
    this.emitter.on("order.status.updated", listener);

    return () => {
      this.emitter.off("order.status.updated", listener);
    };
  }
}

export const orderEvents = new OrderEvents();
