import { useEffect, useState } from "react";
import { apiDelete, apiGet, apiPost, apiUpload } from "../api/http";
import './Admin.css'

export default function AdminProducts() {
  const [items, setItems] = useState([]);
  const [msg, setMsg] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);

  const [name, setName] = useState("");
  const [price, setPrice] = useState("199");
  const [stock, setStock] = useState("10");
  const [category, setCategory] = useState("Perfume");
  const [imageUrl, setImageUrl] = useState("");
  const [filePreview, setFilePreview] = useState("");
  const [uploading, setUploading] = useState(false);

  async function load() {
    setMsg("");
    const data = await apiGet("/api/products");
    setItems(data);
  }

  useEffect(() => {
    load().catch((e) => setMsg(e.message));

    // Check if current user is admin (will fail/401 if not logged in)
    (async function checkAdmin() {
      try {
        const r = await apiGet('/api/admin/me');
        // r.claims is array of { type, value } -- find role
        const roleClaim = (r.claims || []).find(c => c.Type && c.Type.toLowerCase().includes('role')) || (r.claims || []).find(c => c.type && c.type.toLowerCase().includes('role'));
        const roleValue = roleClaim?.Value ?? roleClaim?.value ?? null;
        setIsAdmin(roleValue === 'Admin' || roleValue === 'admin');
      } catch (err) {
        setIsAdmin(false);
      }
    })();
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
        imageUrl: imageUrl || null,
      });
      setName("");
      setImageUrl("");
      await load();
      setMsg("✅ Produkt skapad");
    } catch (e) {
      setMsg("❌ " + e.message);
    }
  }

  async function onFileChange(e) {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    setFilePreview(URL.createObjectURL(file));
    // Upload file
    try {
      setUploading(true);
      const fd = new FormData();
      fd.append('file', file);
      const resp = await apiUpload('/api/products/upload', fd);
      // Use fullUrl if available, otherwise relative imageUrl
      setImageUrl(resp.fullUrl ?? resp.imageUrl ?? '');
      setMsg('✅ Bild uppladdad');
    } catch (err) {
      setMsg('❌ Bilduppladdning misslyckades: ' + err.message);
    } finally {
      setUploading(false);
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
    <div className="admin-container">
      <h1>Admin Products</h1>
      {!isAdmin && (
        <div style={{ padding: 8, background: '#fff7e6', borderRadius: 8, marginBottom: 12 }}>
          <strong>Administrera produkter:</strong> Du måste vara inloggad som admin för att ändra innehåll.
          <div style={{ marginTop: 8 }}>
            Logga in via /login och spara token i localStorage (nyckel: "token").
          </div>
        </div>
      )}

      {isAdmin && (
        <div className="admin-form">
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Name" />
          <input value={price} onChange={(e) => setPrice(e.target.value)} placeholder="Price" />
          <input value={stock} onChange={(e) => setStock(e.target.value)} placeholder="Stock" />
          <select value={category} onChange={(e) => setCategory(e.target.value)}>
            <option>Perfume</option>
            <option>Silver</option>
            <option>T-Shirt</option>
          </select>
          <input value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} placeholder="Image URL (optional)" />
          <input type="file" accept="image/*" onChange={onFileChange} />
          <button onClick={create}>Create</button>
        </div>
      )}

      {msg && <p style={{ marginTop: 12 }}>{msg}</p>}
      {filePreview && (
        <div style={{ marginTop: 8 }}>
          <strong>Preview:</strong>
          <div>
            <img src={filePreview} alt="preview" style={{ width: 120, height: 120, objectFit: 'cover', borderRadius: 8 }} />
          </div>
        </div>
      )}

      <ul className="admin-list">
        {items.map((p) => (
          <li key={p.id}>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
              <b>#{p.id}</b>
              {p.imageUrl && (
                <img src={p.imageUrl} alt={p.name} />
              )}
              <div style={{ flex: 1 }}>{p.name} - {p.category} - {p.price} kr (stock {p.stock})</div>
              <button onClick={() => remove(p.id)} disabled={!isAdmin}>Delete</button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
