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

export function CheckoutForm({ disabled, onSubmit }) {
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

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <div className="space-y-2">
        <label className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
          Full name
        </label>
        <input
          required
          name="customerName"
          value={formValues.customerName}
          onChange={handleChange}
          className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-amber-400"
          placeholder="Abhishek Kumar"
        />
      </div>

      <div className="space-y-2">
        <label className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
          Delivery address
        </label>
        <textarea
          required
          name="customerAddress"
          value={formValues.customerAddress}
          onChange={handleChange}
          rows={3}
          className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-amber-400"
          placeholder="Flat, area, city, pin code"
        />
      </div>

      <div className="space-y-2">
        <label className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
          Phone number
        </label>
        <input
          required
          name="customerPhone"
          value={formValues.customerPhone}
          onChange={handleChange}
          className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-amber-400"
          placeholder="+91 99999 99999"
        />
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
