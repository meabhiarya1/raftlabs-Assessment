import { startTransition, useDeferredValue, useEffect, useState } from "react";
import { AppShell } from "./components/layout/AppShell.jsx";
import { CartPanel } from "./components/cart/CartPanel.jsx";
import { EmptyState } from "./components/common/EmptyState.jsx";
import { SectionHeading } from "./components/common/SectionHeading.jsx";
import { MenuCard } from "./components/menu/MenuCard.jsx";
import { OrderTracker } from "./components/tracking/OrderTracker.jsx";
import { useCart } from "./context/CartContext.jsx";
import { api } from "./lib/axios.js";
import { getErrorMessage } from "./lib/format.js";

const TRACKED_ORDER_STORAGE_KEY = "order-management:last-order-id";

export default function App() {
  const { items, clearCart } = useCart();
  const [menuItems, setMenuItems] = useState([]);
  const [menuStatus, setMenuStatus] = useState({ loading: true, error: "" });
  const [searchTerm, setSearchTerm] = useState("");
  const deferredSearchTerm = useDeferredValue(searchTerm);

  const [checkoutStatus, setCheckoutStatus] = useState({
    loading: false,
    error: "",
    successMessage: ""
  });

  const [trackedOrder, setTrackedOrder] = useState(null);
  const [trackedOrderId, setTrackedOrderId] = useState("");
  const [trackerStatus, setTrackerStatus] = useState({
    loading: false,
    error: ""
  });

  useEffect(() => {
    loadMenu();

    const storedOrderId = window.localStorage.getItem(TRACKED_ORDER_STORAGE_KEY);

    if (storedOrderId) {
      setTrackedOrderId(storedOrderId);
      loadOrder(storedOrderId, { silent: false });
    }
  }, []);

  async function loadMenu() {
    setMenuStatus({ loading: true, error: "" });

    try {
      const response = await api.get("/menu");
      setMenuItems(response.data.data);
      setMenuStatus({ loading: false, error: "" });
    } catch (error) {
      setMenuStatus({
        loading: false,
        error: getErrorMessage(error, "Menu could not be loaded right now.")
      });
    }
  }

  async function loadOrder(orderId, options = { silent: true }) {
    if (!orderId) {
      return;
    }

    setTrackerStatus((current) => ({
      loading: !options.silent,
      error: ""
    }));

    try {
      const response = await api.get(`/orders/${orderId}`);
      const order = response.data.data;

      startTransition(() => {
        setTrackedOrder(order);
        setTrackedOrderId(order.id);
      });

      window.localStorage.setItem(TRACKED_ORDER_STORAGE_KEY, order.id);
      setTrackerStatus({ loading: false, error: "" });
    } catch (error) {
      setTrackerStatus({
        loading: false,
        error: getErrorMessage(error, "We could not find that order yet.")
      });
    }
  }

  async function handleCheckout(formValues) {
    if (items.length === 0) {
      setCheckoutStatus({
        loading: false,
        error: "Add at least one menu item before placing the order.",
        successMessage: ""
      });
      return;
    }

    setCheckoutStatus({
      loading: true,
      error: "",
      successMessage: ""
    });

    try {
      const response = await api.post("/orders", {
        ...formValues,
        items: items.map((item) => ({
          menuItemId: item.id,
          quantity: item.quantity
        }))
      });

      const order = response.data.data;

      clearCart();
      startTransition(() => {
        setTrackedOrder(order);
        setTrackedOrderId(order.id);
      });
      window.localStorage.setItem(TRACKED_ORDER_STORAGE_KEY, order.id);

      setCheckoutStatus({
        loading: false,
        error: "",
        successMessage: `Order ${order.id.slice(0, 8)} is confirmed and now being tracked live.`
      });
    } catch (error) {
      setCheckoutStatus({
        loading: false,
        error: getErrorMessage(error, "Order could not be placed."),
        successMessage: ""
      });
    }
  }

  function handleTrackOrder(orderId) {
    setTrackedOrderId(orderId);
    loadOrder(orderId, { silent: false });
  }

  const normalizedSearch = deferredSearchTerm.trim().toLowerCase();
  const filteredMenuItems = !normalizedSearch
    ? menuItems
    : menuItems.filter((item) => {
        const haystack = `${item.name} ${item.description}`.toLowerCase();
        return haystack.includes(normalizedSearch);
      });

  function handleRealtimeOrderUpdate(nextOrder) {
    startTransition(() => {
      setTrackedOrder(nextOrder);
      setTrackedOrderId(nextOrder.id);
    });
    window.localStorage.setItem(TRACKED_ORDER_STORAGE_KEY, nextOrder.id);
  }

  return (
    <AppShell
      searchTerm={searchTerm}
      onSearchChange={setSearchTerm}
      trackedOrder={trackedOrder}
      trackerStatus={trackerStatus}
      onRefreshOrder={() => loadOrder(trackedOrderId, { silent: false })}
    >
      <OrderTracker
        order={trackedOrder}
        trackedOrderId={trackedOrderId}
        trackerStatus={trackerStatus}
        onTrackOrder={handleTrackOrder}
        onRealtimeUpdate={handleRealtimeOrderUpdate}
        onRefreshOrder={() => loadOrder(trackedOrderId, { silent: false })}
      />

      <div className="grid gap-6 xl:grid-cols-[1.45fr,0.95fr]">
        <section className="space-y-6">
          <SectionHeading
            eyebrow="Menu"
            title="Crafted comfort food, built for a smooth demo."
            description="Browse the seeded catalog from your backend, build a cart, and place a live order without leaving the page."
          />

          {menuStatus.loading ? (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 6 }).map((_, index) => (
                <div
                  key={index}
                  className="glass-panel h-72 animate-pulse rounded-4xl border border-white/70 shadow-panel"
                />
              ))}
            </div>
          ) : null}

          {!menuStatus.loading && menuStatus.error ? (
            <EmptyState
              title="Menu unavailable"
              description={menuStatus.error}
              actionLabel="Try again"
              onAction={loadMenu}
            />
          ) : null}

          {!menuStatus.loading && !menuStatus.error && filteredMenuItems.length === 0 ? (
            <EmptyState
              title="No dishes matched that search"
              description="Try a broader keyword like pizza, shake, or burger."
            />
          ) : null}

          {!menuStatus.loading && !menuStatus.error && filteredMenuItems.length > 0 ? (
            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {filteredMenuItems.map((item) => (
                <MenuCard key={item.id} item={item} />
              ))}
            </div>
          ) : null}
        </section>

        <aside className="space-y-6 xl:sticky xl:top-6">
          <CartPanel
            onCheckout={handleCheckout}
            checkoutStatus={checkoutStatus}
          />
        </aside>
      </div>
    </AppShell>
  );
}
