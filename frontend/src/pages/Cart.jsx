import { Link, useSearchParams } from "react-router-dom";
import { toAbsoluteImageUrl } from "../api/http";
import { useCart } from "../context/CartContext";
import { formatPrice } from "../lib/format";

export default function Cart() {
  const [searchParams] = useSearchParams();
  const { items, subtotal, shipping, vat, total, updateQuantity, removeItem } = useCart();
  const checkoutState = searchParams.get("checkout");

  if (!items.length) {
    return (
      <div className="glass-panel rounded-[2rem] p-10 text-center">
        <div className="font-display text-5xl text-slate-900">Din varukorg är tom</div>
        <p className="mx-auto mt-4 max-w-xl text-slate-600">Lägg till parfym eller gulddetaljer från shoppen så visas totalsumman här.</p>
        <Link to="/shop" className="brand-button mt-8 inline-flex rounded-full px-6 py-3 text-sm font-extrabold uppercase tracking-[0.2em]">
          Till shoppen
        </Link>
      </div>
    );
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_22rem]">
      <section className="space-y-4">
        {checkoutState === "cancelled" && (
          <div className="rounded-[1.5rem] border border-amber-200 bg-amber-50 p-5 text-amber-900">
            Checkouten avbröts, så din varukorg ligger kvar här.
          </div>
        )}
        {items.map((item) => (
          <article key={item.id} className="glass-panel flex flex-col gap-5 rounded-[2rem] p-5 sm:flex-row sm:items-center">
            <img
              src={toAbsoluteImageUrl(item.imageUrl) || "https://placehold.co/240x240/f6f0e3/84662d?text=Silveria"}
              alt={item.name}
              className="h-28 w-28 rounded-[1.25rem] object-cover"
            />
            <div className="flex-1">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="font-display text-3xl text-slate-900">{item.name}</h2>
                  <div className="text-sm uppercase tracking-[0.22em] text-slate-400">{item.sku}</div>
                </div>
                <div className="text-xl font-black text-slate-900">{formatPrice(item.price * item.quantity)}</div>
              </div>
              <div className="mt-4 flex flex-wrap items-center gap-3">
                <input
                  type="number"
                  min="1"
                  max={item.stock}
                  value={item.quantity}
                  onChange={(event) => updateQuantity(item.id, Number(event.target.value))}
                  className="field max-w-24 text-center"
                />
                <button
                  type="button"
                  onClick={() => removeItem(item.id)}
                  className="rounded-full border border-rose-200 bg-rose-50 px-4 py-2 text-sm font-semibold text-rose-700"
                >
                  Ta bort
                </button>
              </div>
            </div>
          </article>
        ))}
      </section>

      <aside className="glass-panel rounded-[2rem] p-6">
        <div className="text-xs font-black uppercase tracking-[0.3em] text-slate-400">Summering</div>
        <div className="mt-6 space-y-4 text-sm text-slate-600">
          <div className="flex justify-between gap-3">
            <span>Delsumma</span>
            <span className="font-semibold text-slate-900">{formatPrice(subtotal)}</span>
          </div>
          <div className="flex justify-between gap-3">
            <span>Momsdel</span>
            <span className="font-semibold text-slate-900">{formatPrice(vat)}</span>
          </div>
          <div className="flex justify-between gap-3">
            <span>Frakt</span>
            <span className="font-semibold text-slate-900">{formatPrice(shipping)}</span>
          </div>
          <div className="border-t border-slate-200 pt-4 text-base">
            <div className="flex justify-between gap-3">
              <span className="font-bold text-slate-900">Totalt</span>
              <span className="font-black text-slate-900">{formatPrice(total)}</span>
            </div>
          </div>
        </div>
        <Link
          to="/checkout"
          className="brand-button mt-8 inline-flex w-full justify-center rounded-full px-5 py-3 text-sm font-extrabold uppercase tracking-[0.2em]"
        >
          Till checkout
        </Link>
      </aside>
    </div>
  );
}
