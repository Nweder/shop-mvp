import React, { useEffect, useState } from 'react'
import './Home.css'
import Logo from '../assets/logo-gold.svg'
import HeroImg from '../assets/hero-placeholder.svg'
import CatPerfume from '../assets/category-perfume.svg'
import CatSilver from '../assets/category-silver.svg'
import CatTshirt from '../assets/category-tshirt.svg'
import { apiGet } from '../api/http'

const fallbackProducts = []

function formatPrice(v) {
  if (v == null) return ''
  // v may be number or string
  const n = typeof v === 'number' ? v : parseFloat(v)
  if (Number.isNaN(n)) return v
  return n.toLocaleString('sv-SE', { style: 'currency', currency: 'SEK', maximumFractionDigits: 0 })
}

export default function Home() {
  const [products, setProducts] = useState(fallbackProducts)
  const [loading, setLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState('All')
  // preferred order and thumbnails for categories; fallback uses first product image
  const categoryOrder = ['Perfume', 'Silver', 'T-Shirt']
  const categoryMeta = {
    'Perfume': {thumb: CatPerfume},
    'Silver': {thumb: CatSilver},
    'T-Shirt': {thumb: CatTshirt}
  }
  useEffect(() => {
    let mounted = true
    async function load() {
      try {
        const data = await apiGet('/api/products')
        if (mounted) setProducts(data || [])
      } catch (e) {
        console.warn('Failed to load products', e)
      } finally {
        if (mounted) setLoading(false)
      }
    }
    load()
    return () => { mounted = false }
  }, [])

  // compute categories in preferred order, include any other categories afterwards
  const catsFromProducts = Array.from(new Set(products.map(p => p.category).filter(Boolean)));
  const orderedCats = categoryOrder.filter(c => catsFromProducts.includes(c)).concat(catsFromProducts.filter(c => !categoryOrder.includes(c)));
  const categoriesToRender = selectedCategory === 'All' ? orderedCats : [selectedCategory];

  return (
    <div className="home-container">
      {/* Category navigation */}
      <div className="category-nav">
        <button className={`category-chip ${selectedCategory==='All'?'active':''}`} onClick={() => setSelectedCategory('All')}>All</button>
        {Array.from(new Set(products.map(p => p.category).filter(Boolean))).map(c => (
          <button key={c} className={`category-chip ${selectedCategory===c?'active':''}`} onClick={() => setSelectedCategory(c)}>{c}</button>
        ))}
      </div>
      <header style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:8}}>
        <div style={{display:'flex',alignItems:'center',gap:12}}>
          <img src={Logo} alt="logo" style={{height:56}} />
          <div style={{fontFamily:"Playfair Display, serif", color:'#b78f2a', fontWeight:700, fontSize:20}}>WebShop</div>
        </div>
        <nav style={{display:'flex',gap:12,alignItems:'center'}}>
          <a href="#">Nyheter</a>
          <a href="#">Smycken</a>
          <a href="#">Klockor</a>
          <a className="btn btn-primary" href="#">Kundklubb</a>
        </nav>
      </header>

      <section className="hero">
        <div className="hero-left">
          <h1 className="hero-title">REA — Upp till <span>50%</span> exklusivt utvalt</h1>
          <p className="hero-sub">Skapa en tidlös look med våra bästa smycken. Begränsad upplaga — fri frakt över 499 kr.</p>
          <div className="hero-actions">
            <a className="btn btn-primary" href="#">Shoppa REA</a>
            <a className="btn" href="#">Nyheter</a>
          </div>
        </div>
        <div className="hero-image">
          <img src={HeroImg} alt="Hero" />
        </div>
      </section>

      <h2 className="section-title">Produkter</h2>

      {loading && <div style={{padding:12}}>Läser produkter…</div>}
      {!loading && products.length === 0 && <div style={{padding:12}}>Inga produkter att visa.</div>}

      {/* Render sections per category */}
      {!loading && categoriesToRender.map(category => {
        const items = products.filter(p => (p.category ?? 'Uncategorized') === category);
        if (items.length === 0) return null;
        return (
          <section key={category} className="category-section">
            <div className="category-header">
              <h3 className="category-title">{category}</h3>
              {categoryMeta[category]?.thumb ? <img className="category-thumb" src={categoryMeta[category].thumb} alt={category} /> : null}
            </div>
            <div className="category-products">
              {items.map(p => (
                <article className="product-card" key={p.id}>
                  {p.price && <div className="badge">{p.discount ?? ''}</div>}
                  <img src={p.imageUrl ?? HeroImg} alt={p.name ?? p.title} />
                  <div className="product-title">{p.name ?? p.title}</div>
                  <div className="price"><span className="old">{p.oldPrice ?? ''}</span>{formatPrice(p.price)}</div>
                </article>
              ))}
            </div>
          </section>
        )
      })}

      <div className="offers-grid">
        <div className="offer" style={{background:'#17452b'}}>
          <div>
            <h3>REA 50%</h3>
            <p>Utvalda smycken</p>
          </div>
        </div>
        <div className="offer" style={{background:'#b52b2b'}}>
          <div>
            <h3>Nyheter</h3>
            <p>Exklusiva tillskott</p>
          </div>
        </div>
        <div className="offer" style={{background:'#223a54'}}>
          <div>
            <h3>Fri frakt</h3>
            <p>Över 499 kr</p>
          </div>
        </div>
      </div>

      <footer className="site-footer">
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
          <div>© 2026 WebShop</div>
          <nav style={{display:'flex',gap:12}}>
            <a href="#">Kontakt</a>
            <a href="#">Leverans</a>
            <a href="#">Villkor</a>
          </nav>
        </div>
      </footer>
    </div>
  )
}
