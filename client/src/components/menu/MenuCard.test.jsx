import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { MenuCard } from "./MenuCard.jsx";
import { renderWithCart } from "../../test/test-utils.jsx";

const baseItem = {
  id: "menu-margherita-pizza",
  slug: "margherita-pizza",
  name: "Margherita Pizza",
  description: "Classic tomato sauce, mozzarella, and basil.",
  priceCents: 34900,
  imageUrl: "https://placehold.co/600x400?text=Margherita+Pizza",
  stockQty: 2,
  isAvailable: true
};

describe("MenuCard", () => {
  it("disables add to cart when stock is zero", () => {
    renderWithCart(<MenuCard item={{ ...baseItem, stockQty: 0 }} />);

    expect(screen.getByText("0 left")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Out of stock" })).toBeDisabled();
  });

  it("disables add to cart after the cart reaches the available stock", async () => {
    const user = userEvent.setup();

    renderWithCart(<MenuCard item={baseItem} />);

    await user.click(screen.getByRole("button", { name: "Add to cart" }));
    await user.click(screen.getByRole("button", { name: "Add to cart" }));

    expect(screen.getByRole("button", { name: "Stock limit reached" })).toBeDisabled();
  });
});
