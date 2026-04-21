import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { extractApiError, http } from "../api/http";
import ProductCard from "../components/ProductCard";

export default function Home() {
  const [products, setProducts] = useState([]);
  const [status, setStatus] = useState({ loading: true, error: "" });

  useEffect(() => {
    let ignore = false;

    async function loadProducts() {
      try {
        const response = await http.get("/api/products");
        if (!ignore) {
          setProducts(response.data.slice(0, 4));
          setStatus({ loading: false, error: "" });
        }
      } catch (error) {
        if (!ignore) {
          setStatus({ loading: false, error: extractApiError(error, "Kunde inte hämta produkterna.") });
        }
      }
    }

    loadProducts();
    return () => {
      ignore = true;
    };
  }, []);

  return (
    <div className="space-y-16">
      <section className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="glass-panel fade-in relative overflow-hidden rounded-[2rem] px-6 py-8 sm:px-10 sm:py-12">
          <div className="absolute inset-y-0 right-0 hidden w-48 bg-[radial-gradient(circle_at_center,rgba(197,157,66,0.18),transparent_70%)] lg:block" />
          <div className="relative max-w-2xl space-y-6">
            <div className="inline-flex rounded-full border border-amber-200 bg-amber-50/80 px-4 py-2 text-xs font-bold uppercase tracking-[0.35em] text-amber-900">
              18K Signature Edit
            </div>
            <div className="space-y-4">
              <h1 className="font-display text-5xl leading-none text-slate-900 sm:text-7xl">
                Parfym och gulddetaljer för ett mer minnesvärt intryck.
              </h1>
              <p className="max-w-xl text-lg text-slate-600">
                18K kombinerar doft, värme och gulddetaljer i ett lugnt men exklusivt uttryck. Allt visas i SEK, med 25% moms och fast frakt på 99 kr.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link to="/shop" className="brand-button rounded-full px-6 py-3 text-sm font-extrabold uppercase tracking-[0.2em]">
                Utforska shoppen
              </Link>
              <Link to="/checkout" className="ghost-button rounded-full px-6 py-3 text-sm font-bold">
                Gäst-checkout
              </Link>
            </div>
          </div>
        </div>

        <aside className="grid gap-4">
          <div className="glass-panel slide-up rounded-[2rem] p-6">
            <div className="text-xs font-black uppercase tracking-[0.3em] text-slate-400">Leverans</div>
            <div className="mt-2 font-display text-4xl text-slate-900">99 kr</div>
            <p className="mt-2 text-sm text-slate-600">Enkel, fast frakt oavsett om du handlar parfym eller guldprodukter.</p>
          </div>
          <div className="glass-panel slide-up rounded-[2rem] bg-[linear-gradient(135deg,rgba(23,53,42,0.97),rgba(20,34,53,0.94))] p-6 text-white">
            <div className="text-xs font-black uppercase tracking-[0.3em] text-white/60">Checkout</div>
            <div className="mt-2 font-display text-4xl">Stripe-flöde</div>
            <p className="mt-2 text-sm text-white/75">
              Frontenden kommer att skicka dig vidare till Stripe Checkout när betalningen startar.
            </p>
          </div>
        </aside>
      </section>

      <section className="space-y-6">
        <div className="flex items-end justify-between gap-4">
          <div>
            <div className="text-xs font-black uppercase tracking-[0.3em] text-slate-400">Utvalt</div>
            <h2 className="font-display text-4xl text-slate-900">Några favoriter just nu</h2>
          </div>
          <Link to="/shop" className="text-sm font-bold uppercase tracking-[0.25em] text-amber-800">
            Se alla
          </Link>
        </div>

        {status.loading && <div className="glass-panel rounded-[1.5rem] p-8 text-slate-500">Laddar produkter...</div>}
        {status.error && <div className="rounded-[1.5rem] border border-rose-200 bg-rose-50 p-6 text-rose-700">{status.error}</div>}

        {!status.loading && !status.error && (
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
