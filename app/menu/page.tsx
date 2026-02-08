"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import MobileMenu from '../../components/ui/mobile-menu';
import CurvedMenu from '../../components/ui/curved-menu';
import './menu.css';

interface Product {
  id: number;
  name: string;
  price: number;
  description: string;
  image: string;
  category: string;
  tag: string;
  tagColor: string;
}

const products: Product[] = [
  {
    id: 1,
    name: "Cookies",
    price: 5000,
    description: "Cookies panggang maksimal, cokelat lumer, resep rahasia khas kami, empuk dan wangi.",
    image: "/produk/Cookies.jpeg",
    category: "Snack",
    tag: "Mantul",
    tagColor: "var(--primary)"
  },
  {
    id: 2,
    name: "Udang Keju 3pcs",
    price: 10000,
    description: "Udang keju dengan isian daging ayam dan udang, dibalut adonan renyah dan keju lumer.",
    image: "/produk/UdangKeju.jpeg",
    category: "Main Course",
    tag: "Wenak",
    tagColor: "var(--secondary)"
  },
  // Add more products as needed
];

export default function MenuPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [filteredProducts, setFilteredProducts] = useState(products);

  const categories = ["All", "Snack", "Main Course", "Beverage", "Dessert"];

  // Filter products
  useEffect(() => {
    let filtered = products;

    if (selectedCategory !== "All") {
      filtered = filtered.filter(p => p.category === selectedCategory);
    }

    if (searchQuery) {
      filtered = filtered.filter(p => 
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    setFilteredProducts(filtered);
  }, [searchQuery, selectedCategory]);

  return (
    <>
      <div className="grain-overlay" />

      <header className="header">
        <div className="logo">SCAFF*FOOD</div>
        <nav>
          <Link href="/">Home</Link>
          <Link href="/menu">Menu</Link>
          <Link href="/kurir">Kurir</Link>
          <Link href="/locations">Locations</Link>
        </nav>
        <button className="btn-cta hidden md:block" style={{ padding: "8px 16px", fontSize: "12px", marginLeft: "20px" }}>
          <Link href="/login" style={{ textDecoration: "none", color: "inherit" }}>
            Login Admin
          </Link>
        </button>
        <MobileMenu />
      </header>

      <main>
        {/* Hero Section */}
        <section className="menu-hero">
          <div className="menu-hero-content">
            <h1 className="menu-hero-title">
              MENU
              <br />
              <span>KAMI</span>
            </h1>
            <p className="menu-hero-subtitle">
              Pilih menu favorit kamu dan nikmati kelezatan yang tak terlupakan
            </p>
          </div>
        </section>

        {/* Search & Filter Section */}
        <section className="search-filter-section">
          <div className="search-container">
            <input
              type="text"
              placeholder="Cari menu..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
            />
            <svg className="search-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8"></circle>
              <path d="m21 21-4.35-4.35"></path>
            </svg>
          </div>

          <div className="filter-container">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`filter-btn ${selectedCategory === category ? 'active' : ''}`}
              >
                {category}
              </button>
            ))}
          </div>
        </section>

        {/* Products Grid */}
        <section className="products-section">
          <div className="products-grid">
            {filteredProducts.map((product) => (
              <div key={product.id} className="product-card">
                <span className="product-tag" style={{ background: product.tagColor }}>
                  {product.tag}
                </span>
                <img src={product.image} alt={product.name} className="product-image" />
                <div className="product-body">
                  <div className="product-header">
                    <h3 className="product-name">{product.name}</h3>
                    <span className="product-price">Rp {product.price.toLocaleString()}</span>
                  </div>
                  <p className="product-description">{product.description}</p>
                  <button className="product-order-btn">
                    Order Sekarang
                  </button>
                </div>
              </div>
            ))}
          </div>

          {filteredProducts.length === 0 && (
            <div className="no-results">
              <p>Tidak ada menu yang ditemukan</p>
            </div>
          )}
        </section>

        {/* CTA Section */}
        <section className="menu-cta-section">
          <h2 className="menu-cta-title">Belum Menemukan yang Cocok?</h2>
          <p className="menu-cta-text">Hubungi kami untuk request menu spesial!</p>
          <button className="menu-cta-btn">Hubungi Kami</button>
        </section>
      </main>

      <footer>
        <div>
          <div className="footer-logo">SCAFF*FOOD</div>
          <p style={{ color: "#666", lineHeight: 1.6 }}>
            Dari dapur, kami menghadirkan menu dengan rasa yang konsisten dan nuansa yang hangat.
          </p>
        </div>
        <div className="footer-links">
          <h4>Nav</h4>
          <ul>
            <li><Link href="/">Home</Link></li>
            <li><Link href="/menu">Menu</Link></li>
            <li><a href="#">Kurir</a></li>
            <li><a href="#">Location</a></li>
          </ul>
        </div>
        <div className="footer-links">
          <h4>BUKA</h4>
          <ul>
            <li>Buka Setiap Hari Operasional TB</li>
          </ul>
        </div>
        <div className="footer-bottom">
          <span>© 2025 VSCAFF.FOOD GROUP</span>
          <span>DESIGNED BY MAMAD RPL4</span>
          <span>IG / TW / TK</span>
        </div>
      </footer>

      <CurvedMenu />
    </>
  );
}
