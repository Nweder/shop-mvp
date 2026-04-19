import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Register() {
  const { register, extractApiError } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    password: "",
  });
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setMessage("");
    setSubmitting(true);

    try {
      await register(form);
      navigate("/");
    } catch (error) {
      setMessage(extractApiError(error, "Registreringen misslyckades."));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl">
      <form onSubmit={handleSubmit} className="glass-panel rounded-[2rem] p-8">
        <div className="text-xs font-black uppercase tracking-[0.3em] text-slate-400">Kundkonto</div>
        <h1 className="font-display mt-3 text-5xl text-slate-900">Skapa konto</h1>
        <div className="mt-8 grid gap-5 sm:grid-cols-2">
          <label className="sm:col-span-2">
            <span className="field-label">Namn</span>
            <input className="field" value={form.fullName} onChange={(event) => setForm((current) => ({ ...current, fullName: event.target.value }))} />
          </label>
          <label>
            <span className="field-label">E-post</span>
            <input className="field" type="email" value={form.email} onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))} />
          </label>
          <label>
            <span className="field-label">Lösenord</span>
            <input className="field" type="password" value={form.password} onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))} />
          </label>
        </div>
        {message && <div className="mt-5 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">{message}</div>}
        <div className="mt-8 flex flex-wrap items-center gap-4">
          <button type="submit" disabled={submitting} className="brand-button rounded-full px-6 py-3 text-sm font-extrabold uppercase tracking-[0.2em]">
            {submitting ? "Skapar..." : "Skapa konto"}
          </button>
          <Link to="/login" className="text-sm font-semibold text-slate-500">Har du redan konto? Logga in</Link>
        </div>
      </form>
    </div>
  );
}
