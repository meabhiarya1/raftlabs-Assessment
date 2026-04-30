export function EmptyState({ title, description, actionLabel, onAction }) {
  return (
    <div className="glass-panel rounded-4xl border border-white/70 px-6 py-10 text-center shadow-panel">
      <div className="mx-auto max-w-md space-y-3">
        <h3 className="display-font text-2xl font-bold text-ink">{title}</h3>
        <p className="text-sm leading-7 text-slate-600">{description}</p>
        {actionLabel && onAction ? (
          <button
            type="button"
            onClick={onAction}
            className="rounded-full bg-ink px-5 py-3 text-sm font-semibold text-white transition hover:bg-night"
          >
            {actionLabel}
          </button>
        ) : null}
      </div>
    </div>
  );
}
