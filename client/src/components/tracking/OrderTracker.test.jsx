import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { OrderTracker } from "./OrderTracker.jsx";
import { createOrderSocket } from "../../lib/socket.js";

vi.mock("../../lib/socket.js", () => ({
  createOrderSocket: vi.fn()
}));

function createMockSocket() {
  const handlers = new Map();

  return {
    emit: vi.fn(),
    on: vi.fn((event, callback) => {
      handlers.set(event, callback);
    }),
    off: vi.fn((event) => {
      handlers.delete(event);
    }),
    disconnect: vi.fn(),
    trigger(event, payload) {
      const handler = handlers.get(event);
      if (handler) {
        handler(payload);
      }
    }
  };
}

const baseOrder = {
  id: "order-1234",
  customerName: "Abhishek Kumar",
  customerAddress: "221B Baker Street, London",
  customerPhone: "+919999999999",
  status: "PREPARING",
  totalCents: 34900,
  statusHistory: [
    {
      id: "history-1",
      status: "RECEIVED",
      notes: "Order created",
      changedAt: "2026-05-01T10:00:00.000Z"
    }
  ],
  items: [
    {
      id: "item-1",
      itemNameSnapshot: "Margherita Pizza",
      quantity: 1,
      unitPriceCents: 34900,
      lineTotalCents: 34900
    }
  ]
};

describe("OrderTracker", () => {
  it("subscribes to socket updates and forwards live order events", async () => {
    const socket = createMockSocket();
    createOrderSocket.mockReturnValue(socket);
    const onRealtimeUpdate = vi.fn();

    const { unmount } = render(
      <OrderTracker
        order={baseOrder}
        trackedOrderId={baseOrder.id}
        trackerStatus={{ loading: false, error: "" }}
        onTrackOrder={vi.fn()}
        onRealtimeUpdate={onRealtimeUpdate}
        onRefreshOrder={vi.fn()}
      />
    );

    socket.trigger("connect");
    expect(socket.emit).toHaveBeenCalledWith("order:subscribe", baseOrder.id);
    await waitFor(() => {
      expect(screen.getByText("live")).toBeInTheDocument();
    });

    const deliveredOrder = {
      ...baseOrder,
      status: "DELIVERED"
    };
    socket.trigger("order.status.updated", deliveredOrder);

    expect(onRealtimeUpdate).toHaveBeenCalledWith(deliveredOrder);

    unmount();
    expect(socket.emit).toHaveBeenCalledWith("order:unsubscribe", baseOrder.id);
    expect(socket.disconnect).toHaveBeenCalled();
  });

  it("loads an order id entered by the user", async () => {
    const user = userEvent.setup();
    createOrderSocket.mockReturnValue(createMockSocket());
    const onTrackOrder = vi.fn();

    render(
      <OrderTracker
        order={null}
        trackedOrderId=""
        trackerStatus={{ loading: false, error: "" }}
        onTrackOrder={onTrackOrder}
        onRealtimeUpdate={vi.fn()}
        onRefreshOrder={vi.fn()}
      />
    );

    await user.click(screen.getByRole("button", { name: "Expand tracker" }));
    await user.type(screen.getByPlaceholderText("Paste order id"), "order-999");
    await user.click(screen.getByRole("button", { name: "Load" }));

    expect(onTrackOrder).toHaveBeenCalledWith("order-999");
  });
});
