import { useEffect, useState } from "react";
import { apiDelete, apiGet, apiPost } from "../api/http";

export default function AdminProducts() {
  const [items, setItems] = useState([]);
  const [msg, setMsg] = useState("");

  const [name, setName] = useState("");
  const [price, setPrice] = useState("199");
  const [stock, setStock] = useState("10");
  const [category, setCategory] = useState("Perfume");

  async function load() {
    setMsg("");
    const data = await apiGet("/api/products");
    setItems(data);
  }

  useEffect(() => {
    load().catch((e) => setMsg(e.message));
  }, []);

  async function create() {
    setMsg("");
    try {
      await apiPost("/api/products", {
        name,
        price: Number(price),
        stock: Number(stock),
        category,
        description: "",
      });
      setName("");
      await load();
      setMsg("✅ Produkt skapad");
    } catch (e) {
      setMsg("❌ " + e.message);
    }
  }

  async function remove(id) {
    setMsg("");
    try {
      await apiDelete(`/api/products/${id}`);
      await load();
      setMsg("✅ Borttagen");
    } catch (e) {
      setMsg("❌ " + e.message);
    }
  }

  return (
    <div style={{ maxWidth: 700 }}>
      <h1>Admin Products</h1>

      <div style={{ display: "grid", gap: 8, gridTemplateColumns: "1fr 120px 120px 140px 120px" }}>
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Name" />
        <input value={price} onChange={(e) => setPrice(e.target.value)} placeholder="Price" />
        <input value={stock} onChange={(e) => setStock(e.target.value)} placeholder="Stock" />
        <select value={category} onChange={(e) => setCategory(e.target.value)}>
          <option>Perfume</option>
          <option>Silver</option>
          <option>T-Shirt</option>
        </select>
        <button onClick={create}>Create</button>
      </div>

      {msg && <p style={{ marginTop: 12 }}>{msg}</p>}

      <ul style={{ marginTop: 16 }}>
        {items.map((p) => (
          <li key={p.id} style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 8 }}>
            <b>#{p.id}</b> {p.name} - {p.category} - {p.price} kr (stock {p.stock})
            <button onClick={() => remove(p.id)}>Delete</button>
          </li>
        ))}
      </ul>
    </div>
  );
}
