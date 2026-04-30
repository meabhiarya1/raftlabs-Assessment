import { createContext, useContext, useEffect, useReducer } from "react";

const CART_STORAGE_KEY = "order-management:cart";

const CartContext = createContext(null);

function readStoredCart() {
  try {
    const rawValue = window.localStorage.getItem(CART_STORAGE_KEY);
    return rawValue ? JSON.parse(rawValue) : [];
  } catch {
    return [];
  }
}

function cartReducer(state, action) {
  switch (action.type) {
    case "ADD_ITEM": {
      const existingItem = state.find((item) => item.id === action.payload.id);

      if (existingItem) {
        return state.map((item) =>
          item.id === action.payload.id
            ? { ...item, quantity: Math.min(item.quantity + 1, action.payload.stockQty) }
            : item
        );
      }

      return [...state, { ...action.payload, quantity: 1 }];
    }

    case "INCREMENT_ITEM":
      return state.map((item) =>
        item.id === action.payload
          ? { ...item, quantity: Math.min(item.quantity + 1, item.stockQty) }
          : item
      );

    case "DECREMENT_ITEM":
      return state
        .map((item) =>
          item.id === action.payload ? { ...item, quantity: item.quantity - 1 } : item
        )
        .filter((item) => item.quantity > 0);

    case "REMOVE_ITEM":
      return state.filter((item) => item.id !== action.payload);

    case "CLEAR":
      return [];

    default:
      return state;
  }
}

export function CartProvider({ children }) {
  const [items, dispatch] = useReducer(cartReducer, [], readStoredCart);

  useEffect(() => {
    window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  const value = {
    items,
    addItem: (item) => dispatch({ type: "ADD_ITEM", payload: item }),
    incrementItem: (itemId) => dispatch({ type: "INCREMENT_ITEM", payload: itemId }),
    decrementItem: (itemId) => dispatch({ type: "DECREMENT_ITEM", payload: itemId }),
    removeItem: (itemId) => dispatch({ type: "REMOVE_ITEM", payload: itemId }),
    clearCart: () => dispatch({ type: "CLEAR" })
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const value = useContext(CartContext);

  if (!value) {
    throw new Error("useCart must be used inside CartProvider.");
  }

  return value;
}
