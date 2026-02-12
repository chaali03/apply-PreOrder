"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import MobileMenu from '../../../components/ui/mobile-menu';
import CurvedMenu from '../../../components/ui/curved-menu';
import { Spinner } from '../../../components/ui/ios-spinner';
import { fetchAPI } from '@/lib/fetch-api';
import './detail.css';

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
  stock: number;
  is_available: boolean;
  min_order: number;
}

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const productId = params.id as string;
  const [product, setProduct] = useState<Product | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);

  // Fetch product detail (pakai runtime config dari /config.json)
  useEffect(() => {
    fetchAPI(`/api/products/${productId}`)
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setProduct(data.data);
          setQuantity(data.data.min_order || 1);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [productId]);

  // Update quantity when product changes (for navigation between products)
  useEffect(() => {
    if (product) {
      const minOrder = product.min_order || 1;
      setQuantity(minOrder);
    }
  }, [product?.id, product?.min_order]);

  // Fetch related products
  useEffect(() => {
    fetchAPI('/api/products')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          const filtered = data.data.filter((p: Product) => p.id !== productId).slice(0, 3);
          setRelatedProducts(filtered);
        }
      })
      .catch(() => {});
  }, [productId]);

  if (loading) {
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
        <div className="loading-container">
          <Spinner size="lg" />
          <p>Loading product...</p>
        </div>
      </>
    );
  }

  if (!product) {
    return (
      <div className="not-found">
        <h1>Produk tidak ditemukan</h1>
        <Link href="/menu">Kembali ke Menu</Link>
      </div>
    );
  }

  const productImages = [
    product.image_url_1 || '/produk/placeholder.svg',
    product.image_url_2 || '/produk/placeholder.svg',
    product.image_url_3 || '/produk/placeholder.svg'
  ];

  const totalPrice = product.price * quantity;

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
        {/* Back Button & Breadcrumb */}
        <div className="breadcrumb">
          <button onClick={() => router.back()} className="back-button">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M12 19l-7-7 7-7"/>
            </svg>
            Kembali
          </button>
          <span>/</span>
          <Link href="/menu">Menu</Link>
          <span>/</span>
          <span>{product.name}</span>
        </div>

        {/* Product Detail Section */}
        <section className="product-detail-section">
          <div className="product-detail-grid">
            {/* Image */}
            <div className="product-detail-images">
              <div className="product-detail-image-wrapper">
                <span className="product-detail-tag" style={{ background: product.tag_color }}>
                  {product.tag}
                </span>
                <img src={productImages[selectedImage]} alt={product.name} className="product-detail-image" />
              </div>
              <div className="product-thumbnail-grid">
                {productImages.slice(1).map((img, index) => (
                  <div 
                    key={index + 1}
                    className={`product-thumbnail ${selectedImage === index + 1 ? 'active' : ''}`}
                    onClick={() => setSelectedImage(index + 1)}
                  >
                    <img src={img} alt={`${product.name} view ${index + 2}`} />
                  </div>
                ))}
              </div>
            </div>

            {/* Info */}
            <div className="product-detail-info">
              <div className="product-detail-category">{product.category}</div>
              <h1 className="product-detail-name">{product.name}</h1>
              <p className="product-detail-description">{product.short_description}</p>
              
              <div className="product-detail-price">
                Rp {product.price.toLocaleString()}
              </div>

              {/* Quantity Selector */}
              <div className="quantity-section">
                <label>Jumlah:</label>
                <div className="quantity-controls">
                  <button 
                    onClick={() => setQuantity(Math.max(product.min_order || 1, quantity - 1))}
                    className="quantity-btn"
                    disabled={quantity <= (product.min_order || 1)}
                  >
                    -
                  </button>
                  <span className="quantity-value">{quantity}</span>
                  <button 
                    onClick={() => setQuantity(quantity + 1)}
                    className="quantity-btn"
                  >
                    +
                  </button>
                </div>
                {product.min_order > 1 && (
                  <small style={{ color: '#666', fontSize: '13px', marginLeft: '10px' }}>
                    Min. order: {product.min_order} pcs
                  </small>
                )}
              </div>

              {/* Total Price */}
              <div className="total-price-section">
                <span>Total:</span>
                <span className="total-price">Rp {totalPrice.toLocaleString()}</span>
              </div>

              {/* Order Button */}
              <button 
                className="detail-order-btn"
                onClick={() => {
                  // Save order data to localStorage
                  const orderData = {
                    product: {
                      id: product.id,
                      name: product.name,
                      price: product.price,
                      image: product.image_url_1,
                      category: product.category,
                      min_order: product.min_order || 1
                    },
                    quantity: quantity,
                    total: totalPrice
                  };
                  localStorage.setItem('orderData', JSON.stringify(orderData));
                  // Navigate to order page
                  router.push('/order');
                }}
              >
                Pesan Sekarang - Rp {totalPrice.toLocaleString()}
              </button>

              {/* Full Description with Table Design */}
              {product.description && (
                <div className="description-section">
                  <h3 className="description-title">Deskripsi Produk</h3>
                  <div className="description-box">
                    <p className="description-text">{product.description}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Related Products */}
        <section className="related-section">
          <h2 className="related-title">Menu Lainnya</h2>
          <div className="related-grid">
            {relatedProducts.map((relatedProduct) => (
              <div key={relatedProduct.id} className="related-card">
                <img 
                  src={relatedProduct.image_url_1 || '/produk/placeholder.svg'} 
                  alt={relatedProduct.name} 
                />
                <div className="related-card-body">
                  <div className="related-card-content">
                    <div className="related-card-text">
                      <h3>{relatedProduct.name}</h3>
                      <p className="related-card-description">
                        {relatedProduct.short_description}
                      </p>
                    </div>
                    <div className="related-price-wrapper">
                      <span className="related-price">
                        Rp {relatedProduct.price.toLocaleString()}
                      </span>
                    </div>
                  </div>
                  <div className="related-card-footer">
                    <Link 
                      href={`/menu/${relatedProduct.id}`}
                      className="related-detail-btn"
                    >
                      Lihat Detail
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
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
