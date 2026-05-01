import { useEffect, useRef, useState } from "react";
import { createOrderSocket } from "../../lib/socket.js";
import { formatCurrency, formatDateTime } from "../../lib/format.js";
import { StatusPill } from "../common/StatusPill.jsx";

const socketEvents = {
  subscribe: "order:subscribe",
  unsubscribe: "order:unsubscribe",
  statusUpdated: "order.status.updated"
};

const deliveryTimelineStages = [
  {
    status: "RECEIVED",
    label: "Received",
    emoji: "✅"
  },
  {
    status: "PREPARING",
    label: "Preparing",
    emoji: "👨‍🍳"
  },
  {
    status: "OUT_FOR_DELIVERY",
    label: "Out for delivery",
    emoji: "🏍️"
  },
  {
    status: "DELIVERED",
    label: "Delivered",
    emoji: "🎉"
  }
];

const cancelledTimelineStages = [
  {
    status: "RECEIVED",
    label: "Received",
    emoji: "✅"
  },
  {
    status: "PREPARING",
    label: "Preparing",
    emoji: "👨‍🍳"
  },
  {
    status: "CANCELLED",
    label: "Cancelled",
    emoji: "❌"
  }
];

function formatTrackerSummary(order, trackerStatus) {
  if (trackerStatus.loading) {
    return "Refreshing the latest order state.";
  }

  if (trackerStatus.error) {
    return trackerStatus.error;
  }

  if (!order) {
    return "Closed by default so menu and checkout stay visible. Open it to track an order.";
  }

  return `Tracking ${order.id.slice(0, 8)} with status ${order.status.replaceAll("_", " ").toLowerCase()}.`;
}

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
  const [isExpanded, setIsExpanded] = useState(false);
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

  const timelineStages = order?.status === "CANCELLED"
    ? cancelledTimelineStages
    : deliveryTimelineStages;

  const statusHistoryMap = new Map(
    (order?.statusHistory || []).map((entry) => [entry.status, entry])
  );
  const currentStageEntry = order ? statusHistoryMap.get(order.status) : null;
  const trackerSummary = formatTrackerSummary(order, trackerStatus);
  const currentStageIndex = order
    ? timelineStages.findIndex((stage) => stage.status === order.status)
    : -1;

  return (
    <section className="glass-panel rounded-4xl border border-white/70 p-5 shadow-panel sm:p-6">
      <div className="space-y-4">
        <div className="space-y-2">
          <p className="display-font text-xs font-semibold uppercase tracking-[0.3em] text-moss">
            Tracker
          </p>
          <button
            type="button"
            onClick={() => setIsExpanded((current) => !current)}
            aria-expanded={isExpanded}
            aria-label={isExpanded ? "Collapse tracker" : "Expand tracker"}
            className="flex w-full items-center justify-between gap-4 rounded-[1.75rem] border border-slate-200/80 bg-white/80 px-4 py-4 text-left transition hover:border-slate-300 hover:bg-white"
          >
            <div className="min-w-0 space-y-2">
              <div className="flex flex-wrap items-center gap-3">
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
                {order ? <StatusPill status={order.status} /> : null}
              </div>
              <p className="text-sm text-slate-500">{trackerSummary}</p>
            </div>

            <span
              className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-slate-50 text-slate-600 transition ${
                isExpanded ? "rotate-180" : ""
              }`}
            >
              <svg
                className="h-5 w-5"
                viewBox="0 0 20 20"
                fill="none"
                aria-hidden="true"
              >
                <path
                  d="M5 7.5L10 12.5L15 7.5"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </span>
          </button>
        </div>

        {isExpanded ? (
          <div className="max-h-[42rem] space-y-5 overflow-y-auto pr-1">
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
                        <p className="text-xs uppercase tracking-[0.25em] text-slate-500">
                          Total
                        </p>
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
                  <div className="overflow-x-auto pb-2">
                    <div className="w-full min-w-[720px]">
                      <div className="flex w-full items-start">
                        {timelineStages.map((stage, index) => {
                          const isCurrent = stage.status === order.status;
                          const isReached = isCurrent || statusHistoryMap.has(stage.status);
                          const stageEntry = statusHistoryMap.get(stage.status);
                          const isTerminalCurrent = isCurrent && (
                            stage.status === "DELIVERED" || stage.status === "CANCELLED"
                          );
                          const nextStageReached = index < timelineStages.length - 1
                            ? timelineStages[index + 1].status === order.status ||
                              statusHistoryMap.has(timelineStages[index + 1].status)
                            : false;

                          return (
                            <div
                              key={stage.status}
                              className={`flex min-w-0 items-start ${
                                index === timelineStages.length - 1 ? "shrink-0" : "flex-1"
                              }`}
                            >
                              <div
                                className={`min-w-0 ${
                                  index === timelineStages.length - 1 ? "w-auto" : "flex-1"
                                }`}
                              >
                                <div className="flex items-center">
                                  <div
                                    className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-full border-4 text-2xl shadow-sm transition-all duration-700 ${
                                      isCurrent
                                        ? "tracker-stage-pulse border-sky-600 bg-sky-50 ring-4 ring-sky-100"
                                        : isReached
                                          ? "border-emerald-500 bg-emerald-50"
                                          : "border-slate-200 bg-slate-100"
                                    }`}
                                  >
                                    {stage.emoji}
                                  </div>
                                  {index < timelineStages.length - 1 ? (
                                    <div
                                      className="relative h-1 flex-1 overflow-hidden rounded-full bg-slate-200"
                                    >
                                      <div
                                        className={`h-full origin-left rounded-full bg-emerald-400 transition-transform duration-700 ease-out ${
                                          nextStageReached ? "scale-x-100" : "scale-x-0"
                                        }`}
                                      />
                                      {isCurrent && !isTerminalCurrent && index === currentStageIndex ? (
                                        <div className="tracker-progress-sweep absolute inset-y-0 left-0 w-24 rounded-full" />
                                      ) : null}
                                    </div>
                                  ) : null}
                                </div>

                                <div
                                  className={`mt-3 space-y-1 ${
                                    index === timelineStages.length - 1 ? "pr-0" : "pr-4"
                                  }`}
                                >
                                  <p
                                    className={`text-sm font-semibold ${
                                      isCurrent
                                        ? "text-sky-700"
                                        : isReached
                                          ? "text-slate-800"
                                          : "text-slate-400"
                                    }`}
                                  >
                                    {stage.label}
                                  </p>
                                  <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                                    {isCurrent
                                      ? "Current"
                                      : isReached
                                        ? "Done"
                                        : "Pending"}
                                  </p>
                                  <p className="text-xs text-slate-500">
                                    {stageEntry ? formatDateTime(stageEntry.changedAt) : "Waiting"}
                                  </p>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {currentStageEntry?.notes ? (
                    <div className="rounded-[1.5rem] border border-slate-200 bg-white/80 px-4 py-3 text-sm text-slate-600">
                      <span className="font-semibold text-slate-800">Latest update:</span>{" "}
                      {currentStageEntry.notes}
                    </div>
                  ) : null}
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
          </div>
        ) : null}
      </div>
    </section>
  );
}
