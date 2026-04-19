import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { extractApiError, http } from "../api/http";
import { formatDate, formatPrice } from "../lib/format";
import { useAuth } from "../context/AuthContext";

export default function Orders() {
  const { isAuthenticated } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }

    let ignore = false;

    async function loadOrders() {
      try {
        const response = await http.get("/api/orders/my");
        if (!ignore) {
          setOrders(response.data);
          setLoading(false);
        }
      } catch (requestError) {
        if (!ignore) {
          setError(extractApiError(requestError, "Kunde inte hämta orderhistoriken."));
          setLoading(false);
        }
      }
    }

    loadOrders();
    return () => {
      ignore = true;
    };
  }, [isAuthenticated]);

  if (!isAuthenticated) {
    return (
      <div className="glass-panel rounded-[2rem] p-10 text-center">
        <div className="font-display text-5xl text-slate-900">Orderhistorik kräver konto</div>
        <p className="mt-4 text-slate-600">Logga in för att se dina tidigare köp och betalstatus.</p>
        <Link to="/login" className="brand-button mt-8 inline-flex rounded-full px-6 py-3 text-sm font-extrabold uppercase tracking-[0.2em]">
          Till login
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div>
        <div className="text-xs font-black uppercase tracking-[0.3em] text-slate-400">Mina ordrar</div>
        <h1 className="font-display text-5xl text-slate-900">Din historik</h1>
      </div>
      {loading && <div className="glass-panel rounded-[1.5rem] p-6 text-slate-500">Laddar ordrar...</div>}
      {error && <div className="rounded-[1.5rem] border border-rose-200 bg-rose-50 p-6 text-rose-700">{error}</div>}
      {!loading && !error && !orders.length && (
        <div className="glass-panel rounded-[1.5rem] p-8 text-slate-600">Du har inga ordrar ännu.</div>
      )}
      {!loading && !error && orders.map((order) => (
        <article key={order.id} className="glass-panel rounded-[2rem] p-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="font-display text-3xl text-slate-900">Order #{order.id}</div>
              <div className="text-sm text-slate-500">{formatDate(order.createdAt)}</div>
            </div>
            <div className="flex flex-wrap gap-2">
              <span className="rounded-full bg-slate-100 px-4 py-2 text-xs font-bold uppercase tracking-[0.24em] text-slate-700">{order.status}</span>
              <span className="rounded-full bg-emerald-100 px-4 py-2 text-xs font-bold uppercase tracking-[0.24em] text-emerald-700">{order.paymentStatus}</span>
            </div>
          </div>
          <div className="mt-5 grid gap-3 text-sm text-slate-600">
            {order.items.map((item) => (
              <div key={`${order.id}-${item.productId}`} className="flex justify-between gap-3">
                <span>{item.productName} x {item.quantity}</span>
                <span className="font-semibold text-slate-900">{formatPrice(item.lineTotal)}</span>
              </div>
            ))}
          </div>
          <div className="mt-5 border-t border-slate-200 pt-4 text-right text-lg font-black text-slate-900">
            Totalt {formatPrice(order.totalAmount)}
          </div>
        </article>
      ))}
    </div>
  );
}
