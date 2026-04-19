import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { extractApiError, http, toAbsoluteImageUrl } from "../api/http";
import { useCart } from "../context/CartContext";
import { formatPrice } from "../lib/format";

export default function ProductDetail() {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const { addItem } = useCart();

  useEffect(() => {
    let ignore = false;

    async function loadProduct() {
      try {
        const response = await http.get(`/api/products/${id}`);
        if (!ignore) {
          setProduct(response.data);
          setLoading(false);
        }
      } catch (requestError) {
        if (!ignore) {
          setError(extractApiError(requestError, "Kunde inte hämta produkten."));
          setLoading(false);
        }
      }
    }

    loadProduct();
    return () => {
      ignore = true;
    };
  }, [id]);

  if (loading) {
    return <div className="glass-panel rounded-[1.5rem] p-8 text-slate-500">Laddar produkt...</div>;
  }

  if (error || !product) {
    return <div className="rounded-[1.5rem] border border-rose-200 bg-rose-50 p-6 text-rose-700">{error || "Produkten hittades inte."}</div>;
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_0.85fr]">
      <section className="glass-panel rounded-[2rem] p-4 sm:p-6">
        <img
          src={toAbsoluteImageUrl(product.primaryImageUrl) || "https://placehold.co/1200x1400/f6f0e3/84662d?text=Silveria"}
          alt={product.name}
          className="h-[28rem] w-full rounded-[1.5rem] object-cover sm:h-[38rem]"
        />
        {product.images?.length > 1 && (
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            {product.images.map((image) => (
              <img
                key={image.id || image.imageUrl}
                src={toAbsoluteImageUrl(image.imageUrl)}
                alt={product.name}
                className="h-28 w-full rounded-2xl object-cover"
              />
            ))}
          </div>
        )}
      </section>

      <aside className="glass-panel rounded-[2rem] p-8">
        <div className="text-xs font-black uppercase tracking-[0.3em] text-slate-400">{product.category}</div>
        <h1 className="font-display mt-3 text-5xl text-slate-900">{product.name}</h1>
        <div className="mt-4 flex items-center gap-4">
          <span className="text-3xl font-black text-slate-900">{formatPrice(product.price)}</span>
          <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold uppercase tracking-[0.24em] text-emerald-800">
            {product.stock} i lager
          </span>
        </div>
        <p className="mt-5 text-base leading-7 text-slate-600">{product.description}</p>

        <div className="mt-8 space-y-4 rounded-[1.5rem] border border-slate-200/70 bg-white/70 p-5">
          <div className="text-sm uppercase tracking-[0.22em] text-slate-400">Detaljer</div>
          <div className="grid gap-3 text-sm text-slate-600">
            <div className="flex justify-between gap-3">
              <span>SKU</span>
              <span className="font-semibold text-slate-900">{product.sku}</span>
            </div>
            <div className="flex justify-between gap-3">
              <span>Moms</span>
              <span className="font-semibold text-slate-900">25% inkluderat</span>
            </div>
            <div className="flex justify-between gap-3">
              <span>Frakt</span>
              <span className="font-semibold text-slate-900">99 kr fast pris</span>
            </div>
          </div>
        </div>

        <div className="mt-8 flex flex-wrap items-center gap-3">
          <label className="w-24">
            <span className="field-label">Antal</span>
            <input
              type="number"
              min="1"
              max={product.stock}
              className="field text-center"
              value={quantity}
              onChange={(event) => setQuantity(Number(event.target.value))}
            />
          </label>
          <button
            type="button"
            className="brand-button mt-7 rounded-full px-6 py-3 text-sm font-extrabold uppercase tracking-[0.2em]"
            onClick={() => addItem(product, quantity)}
          >
            Lägg i varukorg
          </button>
          <Link to="/cart" className="ghost-button mt-7 rounded-full px-6 py-3 text-sm font-semibold">
            Gå till varukorg
          </Link>
        </div>
      </aside>
    </div>
  );
}
