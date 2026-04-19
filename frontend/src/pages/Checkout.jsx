import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { extractApiError, http } from "../api/http";
import { useCart } from "../context/CartContext";
import { formatPrice } from "../lib/format";

const initialForm = {
  shippingName: "",
  shippingEmail: "",
  shippingPhone: "",
  shippingAddressLine1: "",
  postalCode: "",
  city: "",
  country: "Sverige",
};

export default function Checkout() {
  const { items, subtotal, shipping, total, clearCart } = useCart();
  const navigate = useNavigate();
  const [form, setForm] = useState(initialForm);
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setMessage("");

    if (!items.length) {
      setMessage("Varukorgen är tom.");
      return;
    }

    setSubmitting(true);
    try {
      const response = await http.post("/api/orders/checkout-session", {
        ...form,
        successUrl: `${window.location.origin}/checkout/success`,
        cancelUrl: `${window.location.origin}/cart?checkout=cancelled`,
        items: items.map((item) => ({
          productId: item.id,
          quantity: item.quantity,
        })),
      });

      if (response.data.checkoutUrl) {
        window.location.assign(response.data.checkoutUrl);
        return;
      }

      clearCart();
      navigate(`/checkout/success?mode=created&orderId=${response.data.orderId}`);
    } catch (error) {
      setMessage(extractApiError(error, "Checkout kunde inte startas."));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_22rem]">
      <form onSubmit={handleSubmit} className="glass-panel rounded-[2rem] p-6 sm:p-8">
        <div className="text-xs font-black uppercase tracking-[0.3em] text-slate-400">Checkout</div>
        <h1 className="font-display mt-2 text-5xl text-slate-900">Leveransuppgifter</h1>
        <p className="mt-3 max-w-2xl text-sm text-slate-500">
          Kunder checkar ut som gäster. Du behöver alltså inget kundkonto för att slutföra köpet.
        </p>
        <div className="mt-8 grid gap-5 sm:grid-cols-2">
          {Object.entries(form).map(([key, value]) => (
            <label key={key} className={key === "shippingAddressLine1" ? "sm:col-span-2" : ""}>
              <span className="field-label">
                {{
                  shippingName: "Namn",
                  shippingEmail: "E-post",
                  shippingPhone: "Telefon",
                  shippingAddressLine1: "Adress",
                  postalCode: "Postnummer",
                  city: "Stad",
                  country: "Land",
                }[key]}
              </span>
              <input
                className="field"
                value={value}
                onChange={(event) => setForm((current) => ({ ...current, [key]: event.target.value }))}
              />
            </label>
          ))}
        </div>

        {message && <div className="mt-6 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">{message}</div>}

        <button
          type="submit"
          disabled={submitting || !items.length}
          className="brand-button mt-8 rounded-full px-6 py-3 text-sm font-extrabold uppercase tracking-[0.2em]"
        >
          {submitting ? "Startar..." : "Starta Stripe-checkout"}
        </button>
      </form>

      <aside className="glass-panel rounded-[2rem] p-6">
        <div className="text-xs font-black uppercase tracking-[0.3em] text-slate-400">Order</div>
        <div className="mt-6 space-y-4 text-sm text-slate-600">
          {items.map((item) => (
            <div key={item.id} className="flex justify-between gap-3">
              <span>{item.name} x {item.quantity}</span>
              <span className="font-semibold text-slate-900">{formatPrice(item.price * item.quantity)}</span>
            </div>
          ))}
          <div className="border-t border-slate-200 pt-4">
            <div className="flex justify-between gap-3">
              <span>Delsumma</span>
              <span className="font-semibold text-slate-900">{formatPrice(subtotal)}</span>
            </div>
            <div className="mt-2 flex justify-between gap-3">
              <span>Frakt</span>
              <span className="font-semibold text-slate-900">{formatPrice(shipping)}</span>
            </div>
            <div className="mt-4 flex justify-between gap-3 text-base">
              <span className="font-bold text-slate-900">Totalt</span>
              <span className="font-black text-slate-900">{formatPrice(total)}</span>
            </div>
          </div>
        </div>
      </aside>
    </div>
  );
}
