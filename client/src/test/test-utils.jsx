import { render } from "@testing-library/react";
import { CartProvider } from "../context/CartContext.jsx";

export function renderWithCart(ui) {
  return render(<CartProvider>{ui}</CartProvider>);
}
