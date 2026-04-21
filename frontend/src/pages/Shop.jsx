import { startTransition, useDeferredValue, useEffect, useMemo, useState } from "react";
import ProductCard from "../components/ProductCard";
import { extractApiError, http } from "../api/http";

const CATEGORIES = ["Alla", "Parfym", "Guld"];

export default function Shop() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("Alla");
  const [priceCap, setPriceCap] = useState(3000);
  const deferredSearch = useDeferredValue(search);

  useEffect(() => {
    let ignore = false;

    async function loadProducts() {
      try {
        const response = await http.get("/api/products");
        if (!ignore) {
          setProducts(response.data);
          setLoading(false);
        }
      } catch (requestError) {
        if (!ignore) {
          setError(extractApiError(requestError, "Kunde inte ladda shoppen."));
          setLoading(false);
        }
      }
    }

    loadProducts();
    return () => {
      ignore = true;
    };
  }, []);

  const filtered = useMemo(() => {
    return products.filter((product) => {
      const matchesCategory = category === "Alla" || product.category === category;
      const matchesSearch =
        `${product.name} ${product.description} ${product.sku}`.toLowerCase().includes(deferredSearch.toLowerCase());
      const matchesPrice = product.price <= priceCap;
      return matchesCategory && matchesSearch && matchesPrice;
    });
  }, [products, category, deferredSearch, priceCap]);

  return (
    <div className="space-y-8">
      <section className="glass-panel rounded-[2rem] p-6 sm:p-8">
        <div className="grid gap-6 lg:grid-cols-[1.3fr_0.7fr]">
          <div>
            <div className="text-xs font-black uppercase tracking-[0.3em] text-slate-400">Shop</div>
            <h1 className="font-display text-5xl text-slate-900">Bygg din 18K-kombination</h1>
            <p className="mt-3 max-w-2xl text-slate-600">
              Filtrera mellan parfym och guld, sök på namn eller SKU och se priset direkt i SEK.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="sm:col-span-2">
              <span className="field-label">Sök</span>
              <input
                className="field"
                value={search}
                onChange={(event) =>
                  startTransition(() => {
                    setSearch(event.target.value);
                  })
                }
                placeholder="Sök efter produkt eller SKU"
              />
            </label>
            <label>
              <span className="field-label">Kategori</span>
              <select className="field" value={category} onChange={(event) => setCategory(event.target.value)}>
                {CATEGORIES.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span className="field-label">Maxpris: {priceCap} kr</span>
              <input
                className="field px-0"
                type="range"
                min="500"
                max="5000"
                step="100"
                value={priceCap}
                onChange={(event) => setPriceCap(Number(event.target.value))}
              />
            </label>
          </div>
        </div>
      </section>

      {loading && <div className="glass-panel rounded-[1.5rem] p-6 text-slate-500">Laddar produkter...</div>}
      {error && <div className="rounded-[1.5rem] border border-rose-200 bg-rose-50 p-6 text-rose-700">{error}</div>}

      {!loading && !error && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="text-sm uppercase tracking-[0.25em] text-slate-400">{filtered.length} produkter</div>
            <div className="text-sm text-slate-500">Moms 25% ingår i alla priser.</div>
          </div>
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {filtered.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
