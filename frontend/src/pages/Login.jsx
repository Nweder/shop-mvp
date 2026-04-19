import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const { login, extractApiError } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({
    email: "admin@silveria.se",
    password: "Admin123!",
  });
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setMessage("");
    setSubmitting(true);

    try {
      await login(form);
      navigate(location.state?.from || "/admin");
    } catch (error) {
      setMessage(extractApiError(error, "Login misslyckades."));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto grid max-w-5xl gap-8 lg:grid-cols-[0.9fr_1.1fr]">
      <section className="glass-panel rounded-[2rem] bg-[linear-gradient(135deg,rgba(23,53,42,0.98),rgba(14,23,36,0.96))] p-8 text-white">
        <div className="text-xs font-black uppercase tracking-[0.3em] text-white/55">Silveria Access</div>
        <h1 className="font-display mt-4 text-5xl">Admin inloggning</h1>
        <p className="mt-4 max-w-md text-white/75">
          Den här inloggningen är bara för dig som administrerar butiken. Kunder checkar ut som gäster utan konto.
        </p>
      </section>

      <form onSubmit={handleSubmit} className="glass-panel rounded-[2rem] p-8">
        <h2 className="font-display text-4xl text-slate-900">Logga in</h2>
        <div className="mt-6 space-y-5">
          <label>
            <span className="field-label">E-post</span>
            <input
              className="field"
              type="email"
              value={form.email}
              onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
            />
          </label>
          <label>
            <span className="field-label">Lösenord</span>
            <input
              className="field"
              type="password"
              value={form.password}
              onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
            />
          </label>
        </div>
        {message && <div className="mt-5 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">{message}</div>}
        <button
          type="submit"
          disabled={submitting}
          className="brand-button mt-8 rounded-full px-6 py-3 text-sm font-extrabold uppercase tracking-[0.2em]"
        >
          {submitting ? "Loggar in..." : "Logga in"}
        </button>
      </form>
    </div>
  );
}
