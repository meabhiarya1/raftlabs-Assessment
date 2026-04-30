import { useCart } from "../../context/CartContext.jsx";
import { formatCurrency } from "../../lib/format.js";

export function MenuCard({ item }) {
  const { addItem, items } = useCart();
  const cartItem = items.find((entry) => entry.id === item.id);
  const isAtStockLimit = cartItem ? cartItem.quantity >= item.stockQty : false;

  return (
    <article className="glass-panel overflow-hidden rounded-4xl border border-white/70 shadow-panel transition duration-200 hover:-translate-y-1">
      <div className="relative h-48 overflow-hidden">
        <img
          src={item.imageUrl}
          alt={item.name}
          className="h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-ink/60 via-transparent to-transparent" />
        <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between gap-3">
          <span className="display-font rounded-full bg-white/90 px-3 py-1 text-xs font-bold uppercase tracking-[0.25em] text-ink">
            {item.stockQty} left
          </span>
          <span className="display-font rounded-full bg-ember px-3 py-1 text-sm font-bold text-white">
            {formatCurrency(item.priceCents)}
          </span>
        </div>
      </div>

      <div className="space-y-4 p-5">
        <div className="space-y-2">
          <h3 className="display-font text-xl font-bold text-ink">{item.name}</h3>
          <p className="text-sm leading-7 text-slate-600">{item.description}</p>
        </div>

        <button
          type="button"
          onClick={() => addItem(item)}
          disabled={!item.isAvailable || isAtStockLimit}
          className="w-full rounded-2xl bg-ink px-4 py-3 text-sm font-semibold text-white transition hover:bg-night disabled:cursor-not-allowed disabled:bg-slate-300"
        >
          {!item.isAvailable
            ? "Unavailable"
            : isAtStockLimit
              ? "Stock limit reached"
              : "Add to cart"}
        </button>
      </div>
    </article>
  );
}
