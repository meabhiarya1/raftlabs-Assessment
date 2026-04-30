import { env } from "../config/env.js";

export class OrderStatusOrchestrator {
  constructor(orderService, logger) {
    this.orderService = orderService;
    this.logger = logger;
    this.timer = null;
  }

  start() {
    if (!env.ORDER_STATUS_SIMULATION_ENABLED || this.timer) {
      return;
    }

    this.timer = setInterval(() => {
      void this.tick();
    }, env.STATUS_POLL_INTERVAL_MS);
  }

  stop() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  async tick() {
    try {
      const progressed = await this.orderService.advanceEligibleOrders();

      if (progressed > 0) {
        this.logger.info({ progressed }, "Advanced simulated order statuses.");
      }
    } catch (error) {
      this.logger.error({ err: error }, "Failed to advance simulated order statuses.");
    }
  }
}
