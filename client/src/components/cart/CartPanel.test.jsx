import { useEffect } from "react";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { CartPanel } from "./CartPanel.jsx";
import { useCart } from "../../context/CartContext.jsx";
import { renderWithCart } from "../../test/test-utils.jsx";

const sampleItem = {
  id: "menu-margherita-pizza",
  name: "Margherita Pizza",
  description: "Classic pizza",
  priceCents: 34900,
  stockQty: 3,
  isAvailable: true
};

function SeededCartPanel(props) {
  const { addItem } = useCart();

  useEffect(() => {
    addItem(sampleItem);
  }, []);

  return <CartPanel {...props} />;
}

describe("CartPanel", () => {
  it("updates cart quantities and clears the cart", async () => {
    const user = userEvent.setup();

    renderWithCart(
      <SeededCartPanel
        onCheckout={vi.fn()}
        checkoutStatus={{ loading: false, error: "", successMessage: "" }}
      />
    );

    expect(await screen.findByText("Margherita Pizza")).toBeInTheDocument();
    expect(screen.getByText("₹349.00 each")).toBeInTheDocument();

    const incrementButton = screen.getByRole("button", { name: "+" });
    await user.click(incrementButton);
    expect(screen.getAllByText("₹698.00")).toHaveLength(2);

    const decrementButton = screen.getByRole("button", { name: "-" });
    await user.click(decrementButton);
    expect(screen.getByText("₹349.00 each")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Clear" }));
    expect(screen.getByText("Add a few dishes to start building the order.")).toBeInTheDocument();
  });

  it("submits customer details through the checkout form", async () => {
    const user = userEvent.setup();
    const onCheckout = vi.fn();

    renderWithCart(
      <SeededCartPanel
        onCheckout={onCheckout}
        checkoutStatus={{ loading: false, error: "", successMessage: "" }}
      />
    );

    await screen.findByText("Margherita Pizza");

    await user.type(screen.getByLabelText("Full name"), "Abhishek Kumar");
    await user.type(screen.getByLabelText("Delivery address"), "221B Baker Street, London");
    await user.type(screen.getByLabelText("Phone number"), "+919999999999");
    await user.click(screen.getByRole("button", { name: "Place order" }));

    expect(onCheckout).toHaveBeenCalledWith({
      customerName: "Abhishek Kumar",
      customerAddress: "221B Baker Street, London",
      customerPhone: "+919999999999"
    });
  });
});
