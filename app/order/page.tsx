"use client";

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import './order.css';

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
  category?: string;
}

export default function OrderPage() {
  const [step, setStep] = useState<"cart" | "checkout" | "payment" | "success">("cart");
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  
  // Load order data from localStorage
  useEffect(() => {
    const orderDataStr = localStorage.getItem('orderData');
    if (orderDataStr) {
      const orderData = JSON.parse(orderDataStr);
      setCartItems([{
        id: orderData.product.id,
        name: orderData.product.name,
        price: orderData.product.price,
        quantity: orderData.quantity,
        image: orderData.product.image,
        category: orderData.product.category
      }]);
    }
  }, []);
  
  const [customerInfo, setCustomerInfo] = useState({
    name: "",
    phone: "",
    address: "",
    notes: ""
  });

  const [paymentMethod, setPaymentMethod] = useState<"cash" | "transfer" | "qris">("cash");

  const updateQuantity = (id: string, change: number) => {
    setCartItems(items =>
      items.map(item =>
        item.id === id
          ? { ...item, quantity: Math.max(1, item.quantity + change) }
          : item
      )
    );
    
    // Update localStorage
    const updatedItems = cartItems.map(item =>
      item.id === id
        ? { ...item, quantity: Math.max(1, item.quantity + change) }
        : item
    );
    if (updatedItems.length > 0) {
      const orderData = {
        product: {
          id: updatedItems[0].id,
          name: updatedItems[0].name,
          price: updatedItems[0].price,
          image: updatedItems[0].image,
          category: updatedItems[0].category,
        },
        quantity: updatedItems[0].quantity,
        total: updatedItems[0].price * updatedItems[0].quantity
      };
      localStorage.setItem('orderData', JSON.stringify(orderData));
    }
  };

  const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const deliveryFee = 5000;
  const total = subtotal + deliveryFee;

  const handleCheckout = () => {
    if (customerInfo.name && customerInfo.phone && customerInfo.address) {
      setStep("payment");
    } else {
      alert("Mohon lengkapi data pengiriman");
    }
  };

  const handlePayment = () => {
    // Simulate payment processing
    setTimeout(() => {
      setStep("success");
    }, 1500);
  };

  return (
    <div className="order-container">
      <header className="order-header">
        <button 
          onClick={() => window.history.back()}
          className="order-back-btn"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5M12 19l-7-7 7-7"/>
          </svg>
        </button>
        <h1 className="order-header-title">
          {step === "cart" && "Keranjang"}
          {step === "checkout" && "Data Pengiriman"}
          {step === "payment" && "Pembayaran"}
          {step === "success" && "Pesanan Berhasil"}
        </h1>
        <div className="order-header-spacer"></div>
      </header>

      <div className="order-content">
        <AnimatePresence mode="wait">
          {/* Cart Step */}
          {step === "cart" && (
            <motion.div
              key="cart"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="order-step"
            >
              <div className="cart-items">
                {cartItems.length === 0 ? (
                  <div className="empty-cart">
                    <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="9" cy="21" r="1"></circle>
                      <circle cx="20" cy="21" r="1"></circle>
                      <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
                    </svg>
                    <p>Keranjang kosong</p>
                    <a href="/menu" className="btn-primary">Lihat Menu</a>
                  </div>
                ) : (
                  <>
                    {cartItems.map(item => (
                      <div key={item.id} className="cart-item">
                        <img src={item.image} alt={item.name} className="cart-item-image" />
                        <div className="cart-item-info">
                          <h3 className="cart-item-name">{item.name}</h3>
                          <p className="cart-item-price">Rp {item.price.toLocaleString()}</p>
                        </div>
                        <div className="cart-item-quantity">
                          <button onClick={() => updateQuantity(item.id, -1)} className="qty-btn">-</button>
                          <span className="qty-value">{item.quantity}</span>
                          <button onClick={() => updateQuantity(item.id, 1)} className="qty-btn">+</button>
                        </div>
                      </div>
                    ))}

                    <div className="order-summary">
                      <div className="summary-row">
                        <span>Subtotal</span>
                        <span>Rp {subtotal.toLocaleString()}</span>
                      </div>
                      <div className="summary-row">
                        <span>Biaya Pengiriman</span>
                        <span>Rp {deliveryFee.toLocaleString()}</span>
                      </div>
                      <div className="summary-row summary-total">
                        <span>Total</span>
                        <span>Rp {total.toLocaleString()}</span>
                      </div>
                    </div>

                    <button onClick={() => setStep("checkout")} className="btn-primary btn-full">
                      Lanjut ke Checkout
                    </button>
                  </>
                )}
              </div>
            </motion.div>
          )}

          {/* Checkout Step */}
          {step === "checkout" && (
            <motion.div
              key="checkout"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="order-step"
            >
              <div className="checkout-form">
                <div className="form-group">
                  <label className="form-label">Nama Lengkap</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Masukkan nama lengkap"
                    value={customerInfo.name}
                    onChange={(e) => setCustomerInfo({...customerInfo, name: e.target.value})}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Nomor Telepon</label>
                  <input
                    type="tel"
                    className="form-input"
                    placeholder="08xxxxxxxxxx"
                    value={customerInfo.phone}
                    onChange={(e) => setCustomerInfo({...customerInfo, phone: e.target.value})}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Alamat Lengkap</label>
                  <textarea
                    className="form-textarea"
                    placeholder="Masukkan alamat lengkap pengiriman"
                    rows={4}
                    value={customerInfo.address}
                    onChange={(e) => setCustomerInfo({...customerInfo, address: e.target.value})}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Catatan (Opsional)</label>
                  <textarea
                    className="form-textarea"
                    placeholder="Catatan untuk penjual"
                    rows={3}
                    value={customerInfo.notes}
                    onChange={(e) => setCustomerInfo({...customerInfo, notes: e.target.value})}
                  />
                </div>

                <div className="order-summary">
                  <h3 className="summary-title">Ringkasan Pesanan</h3>
                  {cartItems.map(item => (
                    <div key={item.id} className="summary-row">
                      <span>{item.name} x{item.quantity}</span>
                      <span>Rp {(item.price * item.quantity).toLocaleString()}</span>
                    </div>
                  ))}
                  <div className="summary-row">
                    <span>Biaya Pengiriman</span>
                    <span>Rp {deliveryFee.toLocaleString()}</span>
                  </div>
                  <div className="summary-row summary-total">
                    <span>Total</span>
                    <span>Rp {total.toLocaleString()}</span>
                  </div>
                </div>

                <div className="checkout-actions">
                  <button onClick={() => setStep("cart")} className="btn-secondary">
                    Kembali
                  </button>
                  <button onClick={handleCheckout} className="btn-primary">
                    Lanjut Bayar
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {/* Payment Step */}
          {step === "payment" && (
            <motion.div
              key="payment"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="order-step"
            >
              <div className="payment-section">
                <h2 className="section-title">Pilih Metode Pembayaran</h2>
                
                <div className="payment-methods">
                  <div 
                    className={`payment-method ${paymentMethod === "cash" ? "active" : ""}`}
                    onClick={() => setPaymentMethod("cash")}
                  >
                    <div className="payment-icon">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <line x1="12" y1="1" x2="12" y2="23"></line>
                        <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
                      </svg>
                    </div>
                    <div className="payment-info">
                      <h3>Cash on Delivery</h3>
                      <p>Bayar saat pesanan tiba</p>
                    </div>
                    <div className="payment-check">
                      {paymentMethod === "cash" && "✓"}
                    </div>
                  </div>

                  <div 
                    className={`payment-method ${paymentMethod === "transfer" ? "active" : ""}`}
                    onClick={() => setPaymentMethod("transfer")}
                  >
                    <div className="payment-icon">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect>
                        <line x1="1" y1="10" x2="23" y2="10"></line>
                      </svg>
                    </div>
                    <div className="payment-info">
                      <h3>Transfer Bank</h3>
                      <p>BCA, Mandiri, BNI, BRI</p>
                    </div>
                    <div className="payment-check">
                      {paymentMethod === "transfer" && "✓"}
                    </div>
                  </div>

                  <div 
                    className={`payment-method ${paymentMethod === "qris" ? "active" : ""}`}
                    onClick={() => setPaymentMethod("qris")}
                  >
                    <div className="payment-icon">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="3" y="3" width="7" height="7"></rect>
                        <rect x="14" y="3" width="7" height="7"></rect>
                        <rect x="14" y="14" width="7" height="7"></rect>
                        <rect x="3" y="14" width="7" height="7"></rect>
                      </svg>
                    </div>
                    <div className="payment-info">
                      <h3>QRIS</h3>
                      <p>Scan QR untuk bayar</p>
                    </div>
                    <div className="payment-check">
                      {paymentMethod === "qris" && "✓"}
                    </div>
                  </div>
                </div>

                {paymentMethod === "transfer" && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    className="payment-details"
                  >
                    <h3 className="details-title">Informasi Transfer</h3>
                    <div className="bank-info">
                      <p><strong>Bank BCA</strong></p>
                      <p>No. Rekening: 1234567890</p>
                      <p>a.n. SCAFF FOOD</p>
                    </div>
                  </motion.div>
                )}

                {paymentMethod === "qris" && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    className="payment-details"
                  >
                    <h3 className="details-title">Scan QR Code</h3>
                    <div className="qris-code">
                      <div className="qr-image-container">
                        <img 
                          src="/qris-code.jpg" 
                          alt="QRIS Code" 
                          className="qr-image"
                          onError={(e) => {
                            // Fallback jika gambar tidak ada
                            e.currentTarget.style.display = 'none';
                            const placeholder = e.currentTarget.nextElementSibling;
                            if (placeholder) placeholder.style.display = 'flex';
                          }}
                        />
                        <div className="qr-placeholder" style={{ display: 'none' }}>
                          <svg width="200" height="200" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
                            <rect x="3" y="3" width="7" height="7"></rect>
                            <rect x="14" y="3" width="7" height="7"></rect>
                            <rect x="14" y="14" width="7" height="7"></rect>
                            <rect x="3" y="14" width="7" height="7"></rect>
                          </svg>
                          <p style={{ marginTop: '1rem', fontSize: '0.875rem', color: '#6b7280' }}>
                            Upload foto QRIS ke /public/qris-code.jpg
                          </p>
                        </div>
                      </div>
                      <p className="qris-instruction">Scan dengan aplikasi pembayaran Anda</p>
                      <div className="qris-apps">
                        <span className="qris-app-badge">GoPay</span>
                        <span className="qris-app-badge">OVO</span>
                        <span className="qris-app-badge">Dana</span>
                        <span className="qris-app-badge">ShopeePay</span>
                      </div>
                      <div className="qris-amount">
                        <p>Total Pembayaran</p>
                        <h3>Rp {total.toLocaleString()}</h3>
                      </div>
                    </div>
                  </motion.div>
                )}

                <div className="order-summary">
                  <div className="summary-row summary-total">
                    <span>Total Pembayaran</span>
                    <span>Rp {total.toLocaleString()}</span>
                  </div>
                </div>

                <div className="checkout-actions">
                  <button onClick={() => setStep("checkout")} className="btn-secondary">
                    Kembali
                  </button>
                  <button onClick={handlePayment} className="btn-primary">
                    Konfirmasi Pembayaran
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {/* Success Step */}
          {step === "success" && (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="order-step"
            >
              <div className="success-content">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                  className="success-icon"
                >
                  <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                    <polyline points="20 6 9 17 4 12"></polyline>
                  </svg>
                </motion.div>

                <h2 className="success-title">Pesanan Berhasil!</h2>
                <p className="success-message">
                  Terima kasih telah memesan. Pesanan Anda sedang diproses.
                </p>

                <div className="order-info">
                  <div className="info-row">
                    <span>Nomor Pesanan</span>
                    <strong>#ORD-{Math.floor(Math.random() * 10000)}</strong>
                  </div>
                  <div className="info-row">
                    <span>Total Pembayaran</span>
                    <strong>Rp {total.toLocaleString()}</strong>
                  </div>
                  <div className="info-row">
                    <span>Metode Pembayaran</span>
                    <strong>
                      {paymentMethod === "cash" && "Cash on Delivery"}
                      {paymentMethod === "transfer" && "Transfer Bank"}
                      {paymentMethod === "qris" && "QRIS"}
                    </strong>
                  </div>
                  <div className="info-row">
                    <span>Estimasi Pengiriman</span>
                    <strong>30-45 menit</strong>
                  </div>
                </div>

                <div className="success-actions">
                  <a href="/kurir" className="btn-secondary">
                    Lacak Pesanan
                  </a>
                  <a href="/menu" className="btn-primary">
                    Pesan Lagi
                  </a>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
