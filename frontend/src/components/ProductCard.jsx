import { Link } from "react-router-dom";
import { toAbsoluteImageUrl } from "../api/http";
import { useCart } from "../context/CartContext";

function formatPrice(value) {
  return new Intl.NumberFormat("sv-SE", {
    style: "currency",
    currency: "SEK",
    maximumFractionDigits: 0,
  }).format(value ?? 0);
}

export default function ProductCard({ product }) {
  const { addItem } = useCart();

  return (
    <article className="glass-panel slide-up flex h-full flex-col overflow-hidden rounded-[1.75rem]">
      <Link to={`/shop/${product.id}`} className="group block overflow-hidden">
        <div className="relative h-72 overflow-hidden bg-[linear-gradient(180deg,#f7efe0,#f5f5f4)]">
          <img
            src={toAbsoluteImageUrl(product.primaryImageUrl) || "https://placehold.co/800x1000/f6f0e3/84662d?text=Silveria"}
            alt={product.name}
            className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
          />
          <div className="absolute left-4 top-4 rounded-full bg-white/80 px-3 py-1 text-xs font-bold uppercase tracking-[0.28em] text-slate-700">
            {product.category}
          </div>
        </div>
      </Link>
      <div className="flex flex-1 flex-col gap-4 p-5">
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-3">
            <h3 className="font-display text-3xl text-slate-900">{product.name}</h3>
            <span className="text-sm font-semibold uppercase tracking-[0.25em] text-slate-400">{product.sku}</span>
          </div>
          <p className="line-clamp-2 text-sm text-slate-600">{product.description}</p>
        </div>
        <div className="mt-auto flex items-center justify-between gap-3">
          <div>
            <div className="text-2xl font-black text-slate-900">{formatPrice(product.price)}</div>
            <div className="text-xs uppercase tracking-[0.28em] text-slate-400">{product.stock} i lager</div>
          </div>
          <button
            type="button"
            onClick={() => addItem(product)}
            className="brand-button rounded-full px-4 py-3 text-xs font-extrabold uppercase tracking-[0.2em]"
          >
            Lägg i varukorg
          </button>
        </div>
      </div>
    </article>
  );
}
