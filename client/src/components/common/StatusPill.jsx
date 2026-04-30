import { titleCaseStatus } from "../../lib/format.js";

const stylesByStatus = {
  RECEIVED: "bg-sky-100 text-sky-700 border-sky-200",
  PREPARING: "bg-amber-100 text-amber-700 border-amber-200",
  OUT_FOR_DELIVERY: "bg-violet-100 text-violet-700 border-violet-200",
  DELIVERED: "bg-emerald-100 text-emerald-700 border-emerald-200",
  CANCELLED: "bg-rose-100 text-rose-700 border-rose-200"
};

const darkStylesByStatus = {
  RECEIVED: "bg-sky-500/15 text-sky-100 border-sky-400/20",
  PREPARING: "bg-amber-500/15 text-amber-100 border-amber-400/20",
  OUT_FOR_DELIVERY: "bg-violet-500/15 text-violet-100 border-violet-400/20",
  DELIVERED: "bg-emerald-500/15 text-emerald-100 border-emerald-400/20",
  CANCELLED: "bg-rose-500/15 text-rose-100 border-rose-400/20"
};

export function StatusPill({ status, dark = false }) {
  const palette = dark ? darkStylesByStatus : stylesByStatus;

  return (
    <span
      className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] ${
        palette[status] || (dark ? "bg-white/10 text-white border-white/20" : "bg-slate-100 text-slate-700 border-slate-200")
      }`}
    >
      {titleCaseStatus(status)}
    </span>
  );
}
