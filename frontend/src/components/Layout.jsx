import { NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";

function navClass({ isActive }) {
  return `rounded-full px-4 py-2 text-sm font-semibold transition ${
    isActive
      ? "bg-white text-slate-900 shadow-sm"
      : "text-slate-600 hover:bg-white/70 hover:text-slate-900"
  }`;
}

export default function Layout() {
  const { count } = useCart();
  const { isAuthenticated, isAdmin, logout, userName } = useAuth();

  return (
    <div className="page-shell">
      <header className="sticky top-0 z-30 border-b border-white/40 bg-[rgba(252,248,239,0.82)] backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
          <NavLink to="/" className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[radial-gradient(circle_at_top,#f3deb0,#c59d42_62%,#7d5a18)] text-sm font-black text-slate-950 shadow-lg">
              18K
            </div>
            <div>
              <div className="font-display text-3xl font-semibold leading-none text-slate-900">18K</div>
              <div className="text-xs uppercase tracking-[0.35em] text-slate-500">Fine scent & gold</div>
            </div>
          </NavLink>

          <nav className="hidden items-center gap-2 rounded-full border border-white/60 bg-white/45 p-2 md:flex">
            <NavLink to="/" className={navClass}>Hem</NavLink>
            <NavLink to="/shop" className={navClass}>Shop</NavLink>
            {isAdmin && <NavLink to="/admin" className={navClass}>Admin</NavLink>}
          </nav>

          <div className="flex items-center gap-2 sm:gap-3">
            <NavLink
              to="/cart"
              className="ghost-button inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold"
            >
              Varukorg
              <span className="rounded-full bg-slate-900 px-2 py-0.5 text-xs text-white">{count}</span>
            </NavLink>
            {isAuthenticated && (
              <>
                <span className="hidden text-sm font-semibold text-slate-600 sm:inline">{userName}</span>
                <button
                  type="button"
                  onClick={logout}
                  className="rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-white"
                >
                  Logga ut
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto min-h-[calc(100vh-5rem)] max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <Outlet />
      </main>
    </div>
  );
}
