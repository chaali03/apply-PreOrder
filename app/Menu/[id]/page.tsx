"use client";

import { useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import MobileMenu from '../../../components/ui/mobile-menu';
import CurvedMenu from '../../../components/ui/curved-menu';
import './detail.css';

interface Product {
  id: number;
  name: string;
  price: number;
  description: string;
  image: string;
  category: string;
  tag: string;
  tagColor: string;
  ingredients?: string[];
  nutritionInfo?: { label: string; value: string }[];
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
    tagColor: "var(--primary)",
    ingredients: ["Tepung terigu premium", "Cokelat chip Belgium", "Butter", "Gula aren", "Telur organik"],
    nutritionInfo: [
      { label: "Kalori", value: "250 kcal" },
      { label: "Protein", value: "4g" },
      { label: "Karbohidrat", value: "35g" },
      { label: "Lemak", value: "12g" }
    ]
  },
  {
    id: 2,
    name: "Udang Keju 3pcs",
    price: 10000,
    description: "Udang keju dengan isian daging ayam dan udang, dibalut adonan renyah dan keju lumer.",
    image: "/produk/UdangKeju.jpeg",
    category: "Main Course",
    tag: "Wenak",
    tagColor: "var(--secondary)",
    ingredients: ["Udang segar", "Keju mozzarella", "Daging ayam", "Tepung panir", "Bumbu spesial"],
    nutritionInfo: [
      { label: "Kalori", value: "320 kcal" },
      { label: "Protein", value: "18g" },
      { label: "Karbohidrat", value: "28g" },
      { label: "Lemak", value: "15g" }
    ]
  },
];

export default function ProductDetailPage() {
  const params = useParams();
  const productId = parseInt(params.id as string);
  const product = products.find(p => p.id === productId);
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);

  if (!product) {
    return (
      <div className="not-found">
        <h1>Produk tidak ditemukan</h1>
        <Link href="/menu">Kembali ke Menu</Link>
      </div>
    );
  }

  // Array of images for the product (you can add more images later)
  const productImages = [
    product.image,
    product.image, // Replace with different image URLs when available
    product.image  // Replace with different image URLs when available
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
        {/* Breadcrumb */}
        <div className="breadcrumb">
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
                <span className="product-detail-tag" style={{ background: product.tagColor }}>
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
              <p className="product-detail-description">{product.description}</p>
              
              <div className="product-detail-price">
                Rp {product.price.toLocaleString()}
              </div>

              {/* Quantity Selector */}
              <div className="quantity-section">
                <label>Jumlah:</label>
                <div className="quantity-controls">
                  <button 
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="quantity-btn"
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
              </div>

              {/* Total Price */}
              <div className="total-price-section">
                <span>Total:</span>
                <span className="total-price">Rp {totalPrice.toLocaleString()}</span>
              </div>

              {/* Order Button */}
              <button className="detail-order-btn">
                Pesan Sekarang - Rp {totalPrice.toLocaleString()}
              </button>

              {/* Nutrition Info */}
              {product.nutritionInfo && (
                <div className="nutrition-section">
                  <h3>Informasi Nutrisi:</h3>
                  <div className="nutrition-grid">
                    {product.nutritionInfo.map((info, index) => (
                      <div key={index} className="nutrition-item">
                        <span className="nutrition-label">{info.label}</span>
                        <span className="nutrition-value">{info.value}</span>
                      </div>
                    ))}
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
            {products
              .filter(p => p.id !== product.id)
              .slice(0, 3)
              .map((relatedProduct) => (
                <Link 
                  key={relatedProduct.id} 
                  href={`/menu/${relatedProduct.id}`}
                  className="related-card"
                >
                  <img src={relatedProduct.image} alt={relatedProduct.name} />
                  <div className="related-card-body">
                    <h3>{relatedProduct.name}</h3>
                    <span className="related-price">Rp {relatedProduct.price.toLocaleString()}</span>
                  </div>
                </Link>
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
          <span>© 2025 VSCAFF.FOOD GROUP</span>
          <span>DESIGNED BY MAMAD RPL4</span>
          <span>IG / TW / TK</span>
        </div>
      </footer>

      <CurvedMenu />
    </>
  );
}
