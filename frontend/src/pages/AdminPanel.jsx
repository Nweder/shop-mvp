import { useEffect, useState } from "react";
import { extractApiError, http, toAbsoluteImageUrl } from "../api/http";
import { formatDate, formatPrice } from "../lib/format";

const emptyForm = {
  id: null,
  name: "",
  description: "",
  price: 899,
  category: "Parfym",
  stock: 10,
  sku: "",
  isActive: true,
  imageUrls: [],
};

export default function AdminPanel() {
  const [dashboard, setDashboard] = useState(null);
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  async function loadAdminData() {
    try {
      const [dashboardResponse, productsResponse, ordersResponse] = await Promise.all([
        http.get("/api/admin/dashboard"),
        http.get("/api/admin/products"),
        http.get("/api/admin/orders"),
      ]);

      setDashboard(dashboardResponse.data);
      setProducts(productsResponse.data);
      setOrders(ordersResponse.data);
    } catch (error) {
      setMessage(extractApiError(error, "Kunde inte ladda adminpanelen."));
    }
  }

  useEffect(() => {
    loadAdminData();
  }, []);

  async function handleUpload(event) {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    const payload = new FormData();
    payload.append("file", file);
    setUploading(true);
    setMessage("");

    try {
      const response = await http.post("/api/products/upload", payload, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setForm((current) => ({
        ...current,
        imageUrls: [...current.imageUrls, response.data.imageUrl],
      }));
    } catch (error) {
      setMessage(extractApiError(error, "Bilduppladdningen misslyckades."));
    } finally {
      setUploading(false);
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setSaving(true);
    setMessage("");

    try {
      if (form.id) {
        await http.put(`/api/products/${form.id}`, form);
      } else {
        await http.post("/api/products", form);
      }

      setForm(emptyForm);
      setMessage("Produkten sparades.");
      await loadAdminData();
    } catch (error) {
      setMessage(extractApiError(error, "Produkten kunde inte sparas."));
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id) {
    try {
      await http.delete(`/api/products/${id}`);
      setMessage("Produkten togs bort.");
      await loadAdminData();
    } catch (error) {
      setMessage(extractApiError(error, "Produkten kunde inte tas bort."));
    }
  }

  function editProduct(product) {
    setForm({
      id: product.id,
      name: product.name,
      description: product.description,
      price: product.price,
      category: product.category,
      stock: product.stock,
      sku: product.sku,
      isActive: product.isActive,
      imageUrls: product.images?.map((image) => image.imageUrl) ?? [],
    });
  }

  return (
    <div className="space-y-8">
      <section className="grid gap-4 md:grid-cols-3">
        {[
          { label: "Aktiva produkter", value: dashboard?.activeProducts ?? "-" },
          { label: "Ordrar", value: dashboard?.orders ?? "-" },
          { label: "Omsättning", value: dashboard ? formatPrice(dashboard.revenue) : "-" },
        ].map((item) => (
          <div key={item.label} className="glass-panel rounded-[1.75rem] p-6">
            <div className="text-xs font-black uppercase tracking-[0.3em] text-slate-400">{item.label}</div>
            <div className="mt-3 font-display text-5xl text-slate-900">{item.value}</div>
          </div>
        ))}
      </section>

      <section className="grid gap-8 xl:grid-cols-[0.9fr_1.1fr]">
        <form onSubmit={handleSubmit} className="glass-panel rounded-[2rem] p-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-xs font-black uppercase tracking-[0.3em] text-slate-400">Produkter</div>
              <h1 className="font-display text-4xl text-slate-900">{form.id ? "Redigera produkt" : "Ny produkt"}</h1>
            </div>
            {form.id && (
              <button type="button" onClick={() => setForm(emptyForm)} className="ghost-button rounded-full px-4 py-2 text-sm font-semibold">
                Avbryt
              </button>
            )}
          </div>

          <div className="mt-6 grid gap-5 sm:grid-cols-2">
            <label className="sm:col-span-2">
              <span className="field-label">Namn</span>
              <input className="field" value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} />
            </label>
            <label className="sm:col-span-2">
              <span className="field-label">Beskrivning</span>
              <textarea className="field min-h-32" value={form.description} onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))} />
            </label>
            <label>
              <span className="field-label">Pris</span>
              <input className="field" type="number" value={form.price} onChange={(event) => setForm((current) => ({ ...current, price: Number(event.target.value) }))} />
            </label>
            <label>
              <span className="field-label">Lager</span>
              <input className="field" type="number" value={form.stock} onChange={(event) => setForm((current) => ({ ...current, stock: Number(event.target.value) }))} />
            </label>
            <label>
              <span className="field-label">Kategori</span>
              <select className="field" value={form.category} onChange={(event) => setForm((current) => ({ ...current, category: event.target.value }))}>
                <option value="Parfym">Parfym</option>
                <option value="Guld">Guld</option>
              </select>
            </label>
            <label>
              <span className="field-label">SKU</span>
              <input className="field" value={form.sku} onChange={(event) => setForm((current) => ({ ...current, sku: event.target.value }))} />
            </label>
            <label className="sm:col-span-2 flex items-center gap-3 rounded-2xl border border-slate-200 bg-white/60 p-4 text-sm text-slate-600">
              <input type="checkbox" checked={form.isActive} onChange={(event) => setForm((current) => ({ ...current, isActive: event.target.checked }))} />
              Aktiv produkt
            </label>
            <label className="sm:col-span-2">
              <span className="field-label">Bilduppladdning</span>
              <input className="field" type="file" accept="image/*" onChange={handleUpload} />
            </label>
          </div>

          {form.imageUrls.length > 0 && (
            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              {form.imageUrls.map((imageUrl) => (
                <div key={imageUrl} className="relative">
                  <img src={toAbsoluteImageUrl(imageUrl)} alt="Produkt" className="h-28 w-full rounded-2xl object-cover" />
                  <button
                    type="button"
                    onClick={() => setForm((current) => ({ ...current, imageUrls: current.imageUrls.filter((url) => url !== imageUrl) }))}
                    className="absolute right-2 top-2 rounded-full bg-white/80 px-2 py-1 text-xs font-bold text-slate-800"
                  >
                    X
                  </button>
                </div>
              ))}
            </div>
          )}

          {message && <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">{message}</div>}

          <button type="submit" disabled={saving || uploading} className="brand-button mt-6 rounded-full px-6 py-3 text-sm font-extrabold uppercase tracking-[0.2em]">
            {saving ? "Sparar..." : form.id ? "Uppdatera produkt" : "Skapa produkt"}
          </button>
        </form>

        <div className="space-y-6">
          <div className="glass-panel rounded-[2rem] p-6">
            <div className="text-xs font-black uppercase tracking-[0.3em] text-slate-400">Produkter</div>
            <div className="mt-4 space-y-4">
              {products.map((product) => (
                <article key={product.id} className="flex flex-col gap-4 rounded-[1.5rem] border border-slate-200/70 bg-white/80 p-4 sm:flex-row sm:items-center">
                  <img src={toAbsoluteImageUrl(product.primaryImageUrl)} alt={product.name} className="h-24 w-24 rounded-[1.2rem] object-cover" />
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <h2 className="font-display text-3xl text-slate-900">{product.name}</h2>
                      <span className="text-sm font-semibold text-slate-500">{formatPrice(product.price)}</span>
                    </div>
                    <div className="text-sm text-slate-500">{product.category} • {product.stock} i lager • {product.sku}</div>
                  </div>
                  <div className="flex gap-2">
                    <button type="button" onClick={() => editProduct(product)} className="ghost-button rounded-full px-4 py-2 text-sm font-semibold">Redigera</button>
                    <button type="button" onClick={() => handleDelete(product.id)} className="rounded-full border border-rose-200 bg-rose-50 px-4 py-2 text-sm font-semibold text-rose-700">Ta bort</button>
                  </div>
                </article>
              ))}
            </div>
          </div>

          <div className="glass-panel rounded-[2rem] p-6">
            <div className="text-xs font-black uppercase tracking-[0.3em] text-slate-400">Senaste ordrar</div>
            <div className="mt-4 space-y-4">
              {orders.map((order) => (
                <article key={order.id} className="rounded-[1.5rem] border border-slate-200/70 bg-white/80 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <div className="font-display text-3xl text-slate-900">Order #{order.id}</div>
                      <div className="text-sm text-slate-500">{formatDate(order.createdAt)}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-semibold text-slate-500">{order.paymentStatus}</div>
                      <div className="text-lg font-black text-slate-900">{formatPrice(order.totalAmount)}</div>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
