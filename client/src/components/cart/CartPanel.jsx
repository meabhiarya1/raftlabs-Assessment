import { CheckoutForm } from "./CheckoutForm.jsx";
import { useCart } from "../../context/CartContext.jsx";
import { formatCurrency } from "../../lib/format.js";

export function CartPanel({ onCheckout, checkoutStatus }) {
  const { items, incrementItem, decrementItem, removeItem, clearCart } = useCart();

  const subtotal = items.reduce((total, item) => total + item.priceCents * item.quantity, 0);
  const itemCount = items.reduce((total, item) => total + item.quantity, 0);

  return (
    <section className="glass-panel rounded-4xl border border-white/70 p-5 shadow-panel sm:p-6">
      <div className="space-y-6">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="display-font text-xs font-semibold uppercase tracking-[0.3em] text-ember">
              Cart
            </p>
            <h2 className="display-font mt-2 text-2xl font-bold text-ink">
              Checkout station
            </h2>
          </div>
          <button
            type="button"
            onClick={clearCart}
            disabled={items.length === 0}
            className="rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 transition hover:border-slate-400 hover:text-slate-700 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Clear
          </button>
        </div>

        <div className="space-y-3">
          {items.length === 0 ? (
            <div className="rounded-[1.5rem] border border-dashed border-slate-200 bg-white/70 px-5 py-8 text-center text-sm text-slate-500">
              Add a few dishes to start building the order.
            </div>
          ) : (
            items.map((item) => (
              <div
                key={item.id}
                className="rounded-[1.5rem] border border-slate-200/80 bg-white/80 p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <h3 className="display-font text-lg font-bold text-ink">{item.name}</h3>
                    <p className="text-sm text-slate-500">
                      {formatCurrency(item.priceCents)} each
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeItem(item.id)}
                    className="text-xs font-semibold uppercase tracking-[0.2em] text-rose-500"
                  >
                    Remove
                  </button>
                </div>

                <div className="mt-4 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 rounded-full border border-slate-200 bg-slate-50 px-3 py-2">
                    <button
                      type="button"
                      onClick={() => decrementItem(item.id)}
                      className="grid h-8 w-8 place-items-center rounded-full bg-white text-lg text-ink shadow-sm"
                    >
                      -
                    </button>
                    <span className="min-w-8 text-center text-sm font-semibold text-ink">
                      {item.quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() => incrementItem(item.id)}
                      disabled={item.quantity >= item.stockQty}
                      className="grid h-8 w-8 place-items-center rounded-full bg-white text-lg text-ink shadow-sm disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      +
                    </button>
                  </div>
                  <span className="display-font text-lg font-bold text-ink">
                    {formatCurrency(item.priceCents * item.quantity)}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="rounded-[1.75rem] bg-night px-5 py-5 text-white">
          <div className="flex items-center justify-between text-sm text-white/65">
            <span>Total items</span>
            <span>{itemCount}</span>
          </div>
          <div className="mt-3 flex items-end justify-between gap-3">
            <div>
              <p className="text-sm text-white/65">Grand total</p>
              <p className="display-font text-3xl font-bold">{formatCurrency(subtotal)}</p>
            </div>
            <span className="rounded-full bg-white/10 px-3 py-2 text-xs uppercase tracking-[0.2em] text-white/75">
              Backend calculated again on submit
            </span>
          </div>
        </div>

        {checkoutStatus.error ? (
          <div className="rounded-[1.5rem] border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {checkoutStatus.error}
          </div>
        ) : null}

        {checkoutStatus.successMessage ? (
          <div className="rounded-[1.5rem] border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            {checkoutStatus.successMessage}
          </div>
        ) : null}

        <CheckoutForm
          disabled={checkoutStatus.loading}
          fieldErrors={checkoutStatus.fieldErrors}
          resetSignal={checkoutStatus.completedOrderId}
          onSubmit={onCheckout}
        />
      </div>
    </section>
  );
}
