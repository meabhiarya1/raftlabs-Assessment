import { describe, expect, it } from "vitest";
import {
  canCancelOrder,
  canEditOrderDetails,
  canTransitionStatus,
  getNextAutoStatus
} from "../../src/domain/order-status.js";

describe("order status machine", () => {
  it("allows only valid forward transitions", () => {
    expect(canTransitionStatus("RECEIVED", "PREPARING")).toBe(true);
    expect(canTransitionStatus("PREPARING", "OUT_FOR_DELIVERY")).toBe(true);
    expect(canTransitionStatus("OUT_FOR_DELIVERY", "DELIVERED")).toBe(true);
    expect(canTransitionStatus("DELIVERED", "RECEIVED")).toBe(false);
  });

  it("returns the next automated status", () => {
    expect(getNextAutoStatus("RECEIVED")).toBe("PREPARING");
    expect(getNextAutoStatus("PREPARING")).toBe("OUT_FOR_DELIVERY");
    expect(getNextAutoStatus("OUT_FOR_DELIVERY")).toBe("DELIVERED");
    expect(getNextAutoStatus("DELIVERED")).toBeNull();
  });

  it("limits cancellation and details editing to early states", () => {
    expect(canCancelOrder("RECEIVED")).toBe(true);
    expect(canCancelOrder("OUT_FOR_DELIVERY")).toBe(false);
    expect(canEditOrderDetails("PREPARING")).toBe(true);
    expect(canEditOrderDetails("DELIVERED")).toBe(false);
  });
});
