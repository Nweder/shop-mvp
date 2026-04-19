import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiPost } from "../api/http";
import './Admin.css'

export default function Login() {
  const [email, setEmail] = useState("admin@webshop.se");
  const [password, setPassword] = useState("Admin123!");
  const [errorMsg, setErrorMsg] = useState("");
  const navigate = useNavigate();

  async function onSubmit(e) {
    e.preventDefault();
    setErrorMsg("");

    try {
      const data = await apiPost("/api/auth/login", { email, password });
      localStorage.setItem("token", data.token);
      navigate("/admin");
    } catch (err) {
      setErrorMsg(`❌ ${err.message}`);
    }
  }

  return (
    <div className="admin-container">
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

      {errorMsg && <p style={{ marginTop: 12 }}>{errorMsg}</p>}
    </div>
  );
}
