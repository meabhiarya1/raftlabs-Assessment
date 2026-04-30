import { useEffect, useRef, useState } from "react";
import { createOrderSocket } from "../../lib/socket.js";
import { formatCurrency, formatDateTime } from "../../lib/format.js";
import { StatusPill } from "../common/StatusPill.jsx";

const socketEvents = {
  subscribe: "order:subscribe",
  unsubscribe: "order:unsubscribe",
  statusUpdated: "order.status.updated"
};

export function OrderTracker({
  order,
  trackedOrderId,
  trackerStatus,
  onTrackOrder,
  onRealtimeUpdate,
  onRefreshOrder
}) {
  const [lookupValue, setLookupValue] = useState(trackedOrderId || "");
  const [socketConnected, setSocketConnected] = useState(false);
  const realtimeUpdateRef = useRef(onRealtimeUpdate);

  useEffect(() => {
    realtimeUpdateRef.current = onRealtimeUpdate;
  }, [onRealtimeUpdate]);

  useEffect(() => {
    setLookupValue(trackedOrderId || "");
  }, [trackedOrderId]);

  useEffect(() => {
    if (!order?.id) {
      return undefined;
    }

    const socket = createOrderSocket();

    const handleConnect = () => {
      setSocketConnected(true);
      socket.emit(socketEvents.subscribe, order.id);
    };

    const handleDisconnect = () => {
      setSocketConnected(false);
    };

    const handleOrderUpdate = (nextOrder) => {
      if (nextOrder.id === order.id) {
        realtimeUpdateRef.current(nextOrder);
      }
    };

    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);
    socket.on(socketEvents.statusUpdated, handleOrderUpdate);

    return () => {
      socket.emit(socketEvents.unsubscribe, order.id);
      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);
      socket.off(socketEvents.statusUpdated, handleOrderUpdate);
      socket.disconnect();
    };
  }, [order?.id]);

  function handleSubmit(event) {
    event.preventDefault();
    onTrackOrder(lookupValue.trim());
  }

  return (
    <section className="glass-panel rounded-4xl border border-white/70 p-5 shadow-panel sm:p-6">
      <div className="space-y-5">
        <div className="space-y-2">
          <p className="display-font text-xs font-semibold uppercase tracking-[0.3em] text-moss">
            Tracker
          </p>
          <div className="flex items-center justify-between gap-4">
            <h2 className="display-font text-2xl font-bold text-ink">Live order view</h2>
            <span
              className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] ${
                socketConnected
                  ? "bg-emerald-100 text-emerald-700"
                  : "bg-slate-100 text-slate-500"
              }`}
            >
              {socketConnected ? "live" : "Waiting"}
            </span>
          </div>
        </div>

        <form className="flex gap-2" onSubmit={handleSubmit}>
          <input
            value={lookupValue}
            onChange={(event) => setLookupValue(event.target.value)}
            className="min-w-0 flex-1 rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-amber-400"
            placeholder="Paste order id"
          />
          <button
            type="submit"
            className="rounded-2xl bg-ink px-4 py-3 text-sm font-semibold text-white transition hover:bg-night"
          >
            Load
          </button>
        </form>

        {trackerStatus.error ? (
          <div className="rounded-[1.5rem] border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {trackerStatus.error}
          </div>
        ) : null}

        {!order ? (
          <div className="rounded-[1.5rem] border border-dashed border-slate-200 bg-white/70 px-5 py-8 text-center text-sm text-slate-500">
            Place an order or paste an existing order ID to start tracking.
          </div>
        ) : (
          <div className="space-y-4">
            <div className="rounded-[1.75rem] bg-[linear-gradient(135deg,#ef6a3c,#f7be38)] p-[1px]">
              <div className="rounded-[1.7rem] bg-[#fff8ef] p-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="space-y-2">
                    <p className="text-xs uppercase tracking-[0.25em] text-slate-500">
                      Order ID
                    </p>
                    <p className="display-font text-lg font-bold text-ink">{order.id}</p>
                  </div>
                  <StatusPill status={order.status} />
                </div>

                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <div>
                    <p className="text-xs uppercase tracking-[0.25em] text-slate-500">
                      Customer
                    </p>
                    <p className="mt-2 font-medium text-slate-700">{order.customerName}</p>
                    <p className="mt-1 text-sm text-slate-500">{order.customerPhone}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.25em] text-slate-500">
                      Delivery
                    </p>
                    <p className="mt-2 text-sm leading-7 text-slate-600">
                      {order.customerAddress}
                    </p>
                  </div>
                </div>

                <div className="mt-5 flex items-center justify-between gap-4 rounded-[1.25rem] bg-white p-4">
                  <div>
                    <p className="text-xs uppercase tracking-[0.25em] text-slate-500">Total</p>
                    <p className="display-font mt-1 text-2xl font-bold text-ink">
                      {formatCurrency(order.totalCents)}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={onRefreshOrder}
                    className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-400"
                  >
                    Refresh now
                  </button>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="display-font text-lg font-bold text-ink">Timeline</h3>
              {order.statusHistory.map((entry) => (
                <div
                  key={entry.id}
                  className="rounded-[1.5rem] border border-slate-200 bg-white/80 p-4"
                >
                  <div className="flex items-center justify-between gap-3">
                    <StatusPill status={entry.status} />
                    <span className="text-sm text-slate-500">
                      {formatDateTime(entry.changedAt)}
                    </span>
                  </div>
                  {entry.notes ? (
                    <p className="mt-3 text-sm leading-7 text-slate-600">{entry.notes}</p>
                  ) : null}
                </div>
              ))}
            </div>

            <div className="space-y-3">
              <h3 className="display-font text-lg font-bold text-ink">Items</h3>
              {order.items.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between gap-3 rounded-[1.5rem] border border-slate-200 bg-white/80 p-4"
                >
                  <div>
                    <p className="font-semibold text-slate-800">{item.itemNameSnapshot}</p>
                    <p className="text-sm text-slate-500">
                      Qty {item.quantity} x {formatCurrency(item.unitPriceCents)}
                    </p>
                  </div>
                  <p className="display-font text-lg font-bold text-ink">
                    {formatCurrency(item.lineTotalCents)}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {trackerStatus.loading ? (
          <p className="text-sm text-slate-500">Fetching latest order state...</p>
        ) : null}
      </div>
    </section>
  );
}
