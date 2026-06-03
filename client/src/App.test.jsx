import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import App from "./App.jsx";
import { renderWithCart } from "./test/test-utils.jsx";
import { api } from "./lib/axios.js";
import { createOrderSocket } from "./lib/socket.js";

vi.mock("./lib/axios.js", () => ({
  api: {
    get: vi.fn(),
    post: vi.fn()
  }
}));

vi.mock("./lib/socket.js", () => ({
  createOrderSocket: vi.fn(() => ({
    emit: vi.fn(),
    on: vi.fn(),
    off: vi.fn(),
    disconnect: vi.fn()
  }))
}));

const sampleMenu = [
  {
    id: "menu-margherita-pizza",
    slug: "margherita-pizza",
    name: "Margherita Pizza",
    description: "Classic tomato sauce, mozzarella, and basil.",
    priceCents: 34900,
    imageUrl: "https://placehold.co/600x400?text=Margherita+Pizza",
    stockQty: 10,
    isAvailable: true
  },
  {
    id: "menu-veggie-burger",
    slug: "veggie-burger",
    name: "Veggie Burger",
    description: "Grilled veggie patty with lettuce.",
    priceCents: 25900,
    imageUrl: "https://placehold.co/600x400?text=Veggie+Burger",
    stockQty: 10,
    isAvailable: true
  }
];

const menuAfterOrder = [
  {
    ...sampleMenu[0],
    stockQty: 9
  },
  sampleMenu[1]
];

const createdOrder = {
  id: "order-12345678",
  customerName: "Abhishek Kumar",
  customerAddress: "221B Baker Street, London",
  customerPhone: "9999999999",
  status: "RECEIVED",
  subtotalCents: 34900,
  totalCents: 34900,
  createdAt: "2026-05-01T10:00:00.000Z",
  updatedAt: "2026-05-01T10:00:00.000Z",
  lastStatusAt: "2026-05-01T10:00:00.000Z",
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
      menuItemId: "menu-margherita-pizza",
      itemNameSnapshot: "Margherita Pizza",
      unitPriceCents: 34900,
      quantity: 1,
      lineTotalCents: 34900
    }
  ]
};

describe("App", () => {
  it("loads the menu, filters it, and places an order", async () => {
    const user = userEvent.setup();
    api.get
      .mockResolvedValueOnce({ data: { data: sampleMenu } })
      .mockResolvedValueOnce({ data: { data: menuAfterOrder } });
    api.post.mockResolvedValueOnce({ data: { data: createdOrder } });
    createOrderSocket.mockClear();

    renderWithCart(<App />);

    expect(await screen.findByText("Margherita Pizza")).toBeInTheDocument();
    expect(screen.getByText("Veggie Burger")).toBeInTheDocument();

    await user.type(screen.getByPlaceholderText("Search for pizza, burger, shake..."), "pizza");
    expect(screen.getByText("Margherita Pizza")).toBeInTheDocument();
    expect(screen.queryByText("Veggie Burger")).not.toBeInTheDocument();

    await user.clear(screen.getByPlaceholderText("Search for pizza, burger, shake..."));
    await user.click(screen.getAllByRole("button", { name: "Add to cart" })[0]);

    await user.type(screen.getByLabelText("Full name"), "Abhishek Kumar");
    await user.type(screen.getByLabelText("Delivery address"), "221B Baker Street, London");
    await user.type(screen.getByLabelText("Phone number"), "9999999999");
    await user.click(screen.getByRole("button", { name: "Place order" }));

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith("/orders", {
        customerName: "Abhishek Kumar",
        customerAddress: "221B Baker Street, London",
        customerPhone: "9999999999",
        items: [{ menuItemId: "menu-margherita-pizza", quantity: 1 }]
      });
    });

    expect(
      await screen.findByText(/is confirmed and now being tracked live/i)
    ).toBeInTheDocument();
    expect(await screen.findByText("9 left")).toBeInTheDocument();
    expect(screen.getByText("Tracking order-12")).toBeInTheDocument();
    expect(screen.getByText(/tracking order-12 with status received/i)).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByLabelText("Full name")).toHaveValue("");
      expect(screen.getByLabelText("Delivery address")).toHaveValue("");
      expect(screen.getByLabelText("Phone number")).toHaveValue("");
    });
    expect(window.localStorage.getItem("order-management:customer-name")).toBeNull();
    expect(window.localStorage.getItem("order-management:customer-address")).toBeNull();
    expect(window.localStorage.getItem("order-management:customer-phone")).toBeNull();
    expect(window.localStorage.getItem("order-management:last-order-id")).toBe(createdOrder.id);
    await user.click(screen.getByRole("button", { name: "Expand tracker" }));
    expect(screen.getByText("Order created")).toBeInTheDocument();
    expect(createOrderSocket).toHaveBeenCalled();
  });

  it("shows backend checkout field validation errors to the user", async () => {
    const user = userEvent.setup();
    api.get.mockResolvedValueOnce({ data: { data: sampleMenu } });
    api.post.mockRejectedValueOnce({
      response: {
        data: {
          error: {
            code: "VALIDATION_ERROR",
            message: "Request validation failed",
            details: {
              formErrors: [],
              fieldErrors: {
                customerPhone: ["Mobile number must be exactly 10 digits."]
              }
            }
          }
        }
      }
    });

    renderWithCart(<App />);

    expect(await screen.findByText("Margherita Pizza")).toBeInTheDocument();
    await user.click(screen.getAllByRole("button", { name: "Add to cart" })[0]);

    await user.type(screen.getByLabelText("Full name"), "Abhishek Kumar");
    await user.type(screen.getByLabelText("Delivery address"), "221B Baker Street, London");
    await user.type(screen.getByLabelText("Phone number"), "123");
    await user.click(screen.getByRole("button", { name: "Place order" }));

    expect(await screen.findByText("Mobile number must be exactly 10 digits.")).toBeInTheDocument();
    expect(screen.getByLabelText("Phone number")).toHaveAttribute("aria-invalid", "true");
    expect(screen.getByLabelText("Full name")).toHaveValue("Abhishek Kumar");
    expect(screen.getByLabelText("Delivery address")).toHaveValue("221B Baker Street, London");
    expect(screen.getByLabelText("Phone number")).toHaveValue("123");
  });
});
