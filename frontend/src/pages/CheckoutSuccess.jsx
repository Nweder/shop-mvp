import { useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useCart } from "../context/CartContext";

export default function CheckoutSuccess() {
  const [searchParams] = useSearchParams();
  const { clearCart } = useCart();
  const orderId = searchParams.get("orderId");
  const mode = searchParams.get("mode");

  useEffect(() => {
    clearCart();
  }, [clearCart]);

  return (
    <div className="mx-auto max-w-3xl">
      <div className="glass-panel rounded-[2rem] p-10 text-center">
        <div className="text-xs font-black uppercase tracking-[0.3em] text-slate-400">Tack för din beställning</div>
        <h1 className="font-display mt-3 text-5xl text-slate-900">
          {mode === "created" ? "Ordern är mottagen" : "Checkout slutförd"}
        </h1>
        <p className="mx-auto mt-5 max-w-2xl text-slate-600">
          {mode === "created"
            ? "Stripe är inte fullt konfigurerat ännu, så ordern sparades lokalt utan extern betalningssida."
            : "Om betalningen gick igenom via Stripe kommer ordern att uppdateras automatiskt när betalningsbekräftelsen kommer in."}
        </p>
        {orderId && (
          <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-amber-900">
            Ordernummer: <strong>#{orderId}</strong>
          </div>
        )}
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link to="/shop" className="brand-button rounded-full px-6 py-3 text-sm font-extrabold uppercase tracking-[0.2em]">
            Fortsätt handla
          </Link>
          <Link to="/" className="ghost-button rounded-full px-6 py-3 text-sm font-semibold">
            Till startsidan
          </Link>
        </div>
      </div>
    </div>
  );
}
