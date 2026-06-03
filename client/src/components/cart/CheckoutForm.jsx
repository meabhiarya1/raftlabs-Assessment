import { useEffect, useState } from "react";

const initialFormState = {
  customerName: "",
  customerAddress: "",
  customerPhone: ""
};

const formStorageKeys = {
  customerName: "order-management:customer-name",
  customerAddress: "order-management:customer-address",
  customerPhone: "order-management:customer-phone"
};

export function CheckoutForm({ disabled, fieldErrors = {}, resetSignal, onSubmit }) {
  const [formValues, setFormValues] = useState(initialFormState);

  useEffect(() => {
    const storedName = window.localStorage.getItem(formStorageKeys.customerName);
    const storedPhone = window.localStorage.getItem(formStorageKeys.customerPhone);
    const storedAddress = window.localStorage.getItem(formStorageKeys.customerAddress);

    setFormValues({
      customerName: storedName || "",
      customerAddress: storedAddress || "",
      customerPhone: storedPhone || ""
    });
  }, []);

  useEffect(() => {
    if (!resetSignal) {
      return;
    }

    setFormValues(initialFormState);
    Object.values(formStorageKeys).forEach((storageKey) => {
      window.localStorage.removeItem(storageKey);
    });
  }, [resetSignal]);

  function handleChange(event) {
    const { name, value } = event.target;
    setFormValues((current) => ({
      ...current,
      [name]: value
    }));

    window.localStorage.setItem(formStorageKeys[name], value);
  }

  function handleSubmit(event) {
    event.preventDefault();
    onSubmit(formValues);
  }

  function getFieldError(name) {
    return fieldErrors[name]?.[0] || "";
  }

  function getInputClassName(name) {
    const hasError = Boolean(getFieldError(name));

    return [
      "w-full rounded-2xl border bg-white px-4 py-3 outline-none transition focus:border-amber-400",
      hasError ? "border-rose-300 focus:border-rose-400" : "border-slate-200"
    ].join(" ");
  }

  return (
    <form className="space-y-4" noValidate onSubmit={handleSubmit}>
      <div className="space-y-2">
        <label
          htmlFor="customerName"
          className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500"
        >
          Full name
        </label>
        <input
          id="customerName"
          required
          name="customerName"
          value={formValues.customerName}
          onChange={handleChange}
          aria-invalid={Boolean(getFieldError("customerName"))}
          aria-describedby={getFieldError("customerName") ? "customerName-error" : undefined}
          className={getInputClassName("customerName")}
          placeholder="Abhishek Kumar"
        />
        {getFieldError("customerName") ? (
          <p id="customerName-error" className="text-sm font-medium text-rose-600">
            {getFieldError("customerName")}
          </p>
        ) : null}
      </div>

      <div className="space-y-2">
        <label
          htmlFor="customerAddress"
          className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500"
        >
          Delivery address
        </label>
        <textarea
          id="customerAddress"
          required
          name="customerAddress"
          value={formValues.customerAddress}
          onChange={handleChange}
          rows={3}
          aria-invalid={Boolean(getFieldError("customerAddress"))}
          aria-describedby={
            getFieldError("customerAddress") ? "customerAddress-error" : undefined
          }
          className={getInputClassName("customerAddress")}
          placeholder="Flat, area, city, pin code"
        />
        {getFieldError("customerAddress") ? (
          <p id="customerAddress-error" className="text-sm font-medium text-rose-600">
            {getFieldError("customerAddress")}
          </p>
        ) : null}
      </div>

      <div className="space-y-2">
        <label
          htmlFor="customerPhone"
          className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500"
        >
          Phone number
        </label>
        <input
          id="customerPhone"
          required
          name="customerPhone"
          value={formValues.customerPhone}
          onChange={handleChange}
          inputMode="numeric"
          maxLength={10}
          pattern="[0-9]{10}"
          aria-invalid={Boolean(getFieldError("customerPhone"))}
          aria-describedby={getFieldError("customerPhone") ? "customerPhone-error" : undefined}
          className={getInputClassName("customerPhone")}
          placeholder="9999999999"
        />
        {getFieldError("customerPhone") ? (
          <p id="customerPhone-error" className="text-sm font-medium text-rose-600">
            {getFieldError("customerPhone")}
          </p>
        ) : null}
      </div>

      <button
        type="submit"
        disabled={disabled}
        className="w-full rounded-2xl bg-ember px-4 py-3 font-semibold text-white transition hover:bg-[#dd5a2a] disabled:cursor-not-allowed disabled:bg-orange-300"
      >
        {disabled ? "Placing order..." : "Place order"}
      </button>
    </form>
  );
}
