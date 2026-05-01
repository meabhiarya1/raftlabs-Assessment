import { clientEnv } from "../../config/env.js";
import { StatusPill } from "../common/StatusPill.jsx";

export function AppShell({
  children,
  searchTerm,
  onSearchChange,
  trackedOrder,
  trackerStatus,
  onRefreshOrder
}) {
  return (
    <div className="min-h-screen px-4 py-5 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="glass-panel overflow-hidden rounded-[2rem] border border-white/70 shadow-panel">
          <div className="grid gap-6 bg-[linear-gradient(135deg,rgba(28,37,51,0.95),rgba(47,111,84,0.88))] px-6 py-8 text-white lg:grid-cols-[1.2fr,0.8fr] lg:px-8">
            <div className="space-y-4">
              <span className="inline-flex rounded-full border border-white/20 px-3 py-1 text-xs uppercase tracking-[0.3em] text-white/70">
                React + Tailwind + Axios + Socket.IO
              </span>
              <div className="space-y-3">
                <h1 className="display-font text-4xl font-bold leading-tight sm:text-5xl">
                  OrderFlow Kitchen
                </h1>
                <p className="max-w-2xl text-base text-white/78 sm:text-lg">
                  A polished frontend for your backend assessment: menu browsing, cart-based checkout,
                  and live order tracking in one clear flow.
                </p>
              </div>
            </div>

            <div className="grid gap-3 rounded-[1.5rem] border border-white/15 bg-white/8 p-4 text-sm text-white/85">
              <div className="flex items-center justify-between gap-3">
                <span className="text-white/60">Tracking</span>
                {trackedOrder ? (
                  <StatusPill status={trackedOrder.status} dark />
                ) : (
                  <span className="font-medium text-white/70">Waiting for first order</span>
                )}
              </div>
              <label className="grid gap-2 pt-2">
                <span className="text-xs uppercase tracking-[0.25em] text-white/55">
                  Menu search
                </span>
                <input
                  value={searchTerm}
                  onChange={(event) => onSearchChange(event.target.value)}
                  className="min-w-0 w-full rounded-2xl border border-white/15 bg-white/10 px-4 py-3 text-sm text-white placeholder:text-white/40 focus:border-gold focus:outline-none"
                  placeholder="Search for pizza, burger, shake..."
                />
              </label>
              <div className="flex items-center justify-between gap-3 text-xs text-white/55">
                <span>
                  {trackerStatus.loading
                    ? "Fetching latest order..."
                    : trackedOrder
                      ? `Tracking ${trackedOrder.id.slice(0, 8)}`
                      : "Live view ready"}
                </span>
                <button
                  type="button"
                  onClick={onRefreshOrder}
                  className="rounded-full border border-white/15 px-3 py-1 text-white/80 transition hover:border-white/35 hover:text-white"
                >
                  Refresh
                </button>
              </div>
            </div>
          </div>
        </header>

        <div className="space-y-6">{children}</div>
      </div>
    </div>
  );
}
