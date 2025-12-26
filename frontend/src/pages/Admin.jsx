import { useState } from "react";
import { apiGet } from "../api/http";

export default function Admin() {
  const [data, setData] = useState(null);
  const [msg, setMsg] = useState("");

  async function testAuth() {
    setMsg("");
    try {
      const result = await apiGet("/api/admin/me");
      setData(result);
      setMsg("✅ 200 OK (token funkar)");
    } catch (err) {
      setData(null);
      setMsg(`❌ ${err.message}`);
    }
  }

  return (
    <div>
      <h1>Admin Panel</h1>

      <button onClick={testAuth}>Testa skyddad endpoint</button>

      {msg && <p style={{ marginTop: 12 }}>{msg}</p>}

      {data && (
        <pre style={{ marginTop: 12, background: "#111", color: "#0f0", padding: 12 }}>
          {JSON.stringify(data, null, 2)}
        </pre>
      )}
    </div>
  );
}
