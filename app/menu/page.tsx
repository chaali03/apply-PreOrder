"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import MobileMenu from '../../components/ui/mobile-menu';
import CurvedMenu from '../../components/ui/curved-menu';
import { Spinner } from '../../components/ui/ios-spinner';
import { fetchAPI } from '@/lib/fetch-api';
import './menu.css';

interface ProductVariant {
  id: string;
  product_id: string;
  name: string;
  price: number;
  stock: number;
  is_available: boolean;
}

interface ProductCondition {
  name: string;
  price_adjustment: number;
}

interface Product {
  id: string;
  name: string;
  price: number;
  short_description: string;
  description: string;
  image_url_1: string;
  image_url_2: string;
  image_url_3: string;
  category: string;
  tag: string;
  tag_color: string;
  is_available: boolean;
  variants?: ProductVariant[];
  conditions?: ProductCondition[];
}

export default function MenuPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  const categories = ["All", "Snack", "Main Course", "Beverage", "Dessert"];

  // Fetch products from API
  useEffect(() => {
    const loadProducts = async () => {
      console.log('Fetching products from API using fetchAPI helper...');
      setLoading(true);
      try {
        const res = await fetchAPI('/api/admin/products');
        const data = await res.json();

        console.log('Products fetched:', data);
        if (data.success) {
          console.log('Number of products:', data.data.length);
          console.log(
            'Products with is_available=false:',
            data.data.filter((p: Product) => !p.is_available).length
          );
          setProducts(data.data);
          setFilteredProducts(data.data);
        }
      } catch (error) {
        console.error('Error fetching products:', error);
      } finally {
        setLoading(false);
      }
    };

    loadProducts();
  }, []);

  // Filter products
  useEffect(() => {
    let filtered = products;

    if (selectedCategory !== "All") {
      // Support multiple categories (comma-separated)
      filtered = filtered.filter(p => {
        if (!p.category) return false;
        const productCategories = p.category.split(',').map(c => c.trim());
        return productCategories.includes(selectedCategory);
      });
    }

    if (searchQuery) {
      filtered = filtered.filter(p => 
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.short_description.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    setFilteredProducts(filtered);
  }, [searchQuery, selectedCategory, products]);

  return (
    <>
      <div className="grain-overlay" />

      <header className="header">
        <div className="logo">SCAFF*FOOD</div>
        <nav>
          <Link href="/">Home</Link>
          <Link href="/menu">Menu</Link>
          <Link href="/event">Event</Link>
          <Link href="/kurir">Kurir</Link>
          <Link href="/locations">Locations</Link>
        </nav>
        <div className="header-actions">
          <button className="btn-cta hidden md:block" style={{ padding: "8px 16px", fontSize: "12px" }}>
            <Link href="/login" style={{ textDecoration: "none", color: "inherit" }}>
              Login Admin
            </Link>
          </button>
        </div>
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
          {loading ? (
            <div className="loading">
              <Spinner size="lg" />
              <p>Loading products...</p>
            </div>
          ) : (
            <div className="products-grid">
              {filteredProducts.map((product) => {
                console.log(`Rendering product ${product.name}: is_available=${product.is_available}`);
                // Fix image path: if it's a full URL or starts with /, use it; otherwise prepend /produk/
                const getImagePath = (url: string) => {
                  if (!url) return '/produk/placeholder.svg';
                  if (url.startsWith('http')) return url; // Full URL from backend
                  if (url.startsWith('/produk/')) return url; // Already correct path
                  if (url.startsWith('/')) return url; // Other absolute path
                  return `/produk/${url}`; // Relative filename, add /produk/
                };
                
                return (
                  <div key={product.id} className={`product-card ${!product.is_available ? 'product-sold-out' : ''}`}>
                    <span className="product-tag" style={{ background: product.tag_color }}>
                      {product.tag}
                    </span>
                    {product.is_available ? (
                      <Link href={`/menu/${product.id}`}>
                        <img 
                          src={getImagePath(product.image_url_1)} 
                          alt={product.name} 
                          className="product-image" 
                        />
                      </Link>
                    ) : (
                      <div className="product-image-disabled">
                        <img 
                          src={getImagePath(product.image_url_1)} 
                          alt={product.name} 
                          className="product-image" 
                        />
                      </div>
                    )}
                    {!product.is_available && (
                      <div className="sold-out-overlay">
                        <div className="sold-out-watermark">HABIS</div>
                      </div>
                    )}
                    <div className="product-body">
                      <div className="product-header">
                        <h3 className="product-name">{product.name}</h3>
                        <span className="product-price">Rp {product.price.toLocaleString()}</span>
                      </div>
                      {/* Variant tags */}
                      {product.variants && product.variants.length > 0 && (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px', marginBottom: '8px' }}>
                          {product.variants.slice(0, 3).map((variant) => (
                            <span 
                              key={variant.id} 
                              style={{ 
                                background: '#f0f0f0', 
                                color: '#1a1a1a',
                                padding: '3px 8px', 
                                fontSize: '10px', 
                                fontWeight: 600,
                                border: '1px solid #ddd',
                                borderRadius: '3px',
                                textTransform: 'uppercase',
                                letterSpacing: '0.3px'
                              }}
                            >
                              {variant.name}
                            </span>
                          ))}
                          {product.variants.length > 3 && (
                            <span 
                              style={{ 
                                background: '#f0f0f0', 
                                color: '#1a1a1a',
                                padding: '3px 8px', 
                                fontSize: '10px', 
                                fontWeight: 600,
                                border: '1px solid #ddd',
                                borderRadius: '3px',
                                textTransform: 'uppercase'
                              }}
                            >
                              +{product.variants.length - 3}
                            </span>
                          )}
                        </div>
                      )}
                      <p className="product-description">{product.short_description}</p>
                      {product.is_available ? (
                        <Link href={`/menu/${product.id}`}>
                          <button className="product-order-btn">
                            Lihat Detail
                          </button>
                        </Link>
                      ) : (
                        <button className="product-order-btn product-order-btn-disabled" disabled>
                          Stok Habis
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {!loading && filteredProducts.length === 0 && (
            <div className="no-results">
              <p>Tidak ada menu yang ditemukan</p>
            </div>
          )}
        </section>

        {/* CTA Section */}
        <section className="menu-cta-section">
          <h2 className="menu-cta-title">Belum Menemukan yang Cocok?</h2>
          <p className="menu-cta-text">Hubungi kami untuk request menu spesial!</p>
          <a 
            href="https://wa.me/6281916203664?text=Halo%20SCAFF*FOOD,%20saya%20ingin%20request%20menu%20spesial" 
            target="_blank" 
            rel="noopener noreferrer"
            className="menu-cta-btn"
          >
            Hubungi Kami
          </a>
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
          <span>© 2025 SCAFF.FOOD GROUP</span>
          <span>DESIGNED BY MAMAD RPL4</span>

        </div>
      </footer>

      <CurvedMenu />
    </>
  );
}
