import { useState } from "react";
import { apiPost } from "../api/http";

export default function Login() {
  const [email, setEmail] = useState("admin@webshop.se");
  const [password, setPassword] = useState("Admin123!");
  const [msg, setMsg] = useState("");

  async function onSubmit(e) {
    e.preventDefault();
    setMsg("");

    try {
      const data = await apiPost("/api/auth/login", { email, password });
      localStorage.setItem("token", data.token);
      setMsg("✅ Inloggad. Token sparad i localStorage.");
    } catch (err) {
      setMsg(`❌ ${err.message}`);
    }
  }

  return (
    <div style={{ maxWidth: 360 }}>
      <h1>Admin Login</h1>

      <form onSubmit={onSubmit} style={{ display: "grid", gap: 8 }}>
        <input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
        />
        <input
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          type="password"
        />
        <button type="submit">Login</button>
      </form>

      {msg && <p style={{ marginTop: 12 }}>{msg}</p>}
    </div>
  );
}
