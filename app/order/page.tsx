"use client";

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import QRCode from 'qrcode';
import './order.css';

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
  category?: string;
  min_order?: number;
  variant?: string | null;
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
        category: orderData.product.category,
        min_order: orderData.product.min_order || 1,
        variant: orderData.product.variant || null
      }]);
    }

    // Auto-fill customer info from localStorage
    const savedPhone = localStorage.getItem('customerPhone');
    const savedName = localStorage.getItem('customerName');
    const savedAddress = localStorage.getItem('customerAddress');
    
    if (savedPhone || savedName || savedAddress) {
      setCustomerInfo({
        name: savedName || "",
        phone: savedPhone || "",
        address: savedAddress || "",
        notes: ""
      });
    }
  }, []);
  
  const [customerInfo, setCustomerInfo] = useState({
    name: "",
    phone: "",
    address: "",
    notes: ""
  });

  const [paymentMethod, setPaymentMethod] = useState<"qris">("qris");
  const [paymentProof, setPaymentProof] = useState<string>("");
  const [verifying, setVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState<{
    isValid: boolean;
    message: string;
    confidence: number;
  } | null>(null);
  const [qrCodeUrl, setQrCodeUrl] = useState<string>("");
  const qrCanvasRef = useRef<HTMLCanvasElement>(null);
  const [showPaymentDetails, setShowPaymentDetails] = useState(true);

  // Calculate totals
  const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const deliveryFee = 0;
  const total = subtotal;

  // Generate QR Code
  useEffect(() => {
    if (step === "payment") {
      fetchQRISImage();
    }
  }, [step]);

  const fetchQRISImage = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/settings?key=qris_image`);
      const data = await response.json();
      
      console.log('QRIS API response:', data);
      
      if (data.success && data.data.value) {
        const value = data.data.value as string;
        const baseUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "";
        const absoluteUrl = value.startsWith('http') ? value : `${baseUrl}${value}`;
        console.log('QRIS URL:', absoluteUrl);
        setQrCodeUrl(absoluteUrl);
      } else {
        console.log('No QRIS in database, generating fallback QR');
        // Fallback: generate QR if no image in database
        const qrisData = `00020101021226670016ID.CO.QRIS.WWW0118ID${Date.now()}0215ID10SCAFFFOOD0303UMI51440014ID.CO.QRIS.WWW02180000000000000000000303UMI5204599953033605802ID5913SCAFF*FOOD6007JAKARTA61051234062070703A0163044B3D`;
        
        QRCode.toDataURL(qrisData, {
          width: 300,
          margin: 2,
          color: {
            dark: '#000000',
            light: '#FFFFFF'
          }
        }).then(url => {
          setQrCodeUrl(url);
        }).catch(err => {
          console.error('Error generating QR code:', err);
        });
      }
    } catch (error) {
      console.error('Error fetching QRIS:', error);
    }
  };

  const downloadQR = async () => {
    if (!qrCodeUrl) return;

    try {
      // Check if it's a data URL (base64)
      if (qrCodeUrl.startsWith('data:')) {
        // Direct download for data URLs
        const link = document.createElement('a');
        link.href = qrCodeUrl;
        link.download = `QRIS-SCAFFFOOD-${Date.now()}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        return;
      }

      // Use Next.js API route as proxy to avoid CORS
      const downloadUrl = `/api/download-qr?url=${encodeURIComponent(qrCodeUrl)}`;
      
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = `QRIS-SCAFFFOOD-${Date.now()}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
    } catch (error) {
      console.error('Error downloading QR:', error);
      
      // Fallback: open in new tab
      window.open(qrCodeUrl, '_blank');
    }
  };

  const handlePaymentProofUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setNotificationMessage('File harus berupa gambar');
      setShowNotification(true);
      setTimeout(() => setShowNotification(false), 3000);
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setPaymentProof(reader.result as string);
      verifyPaymentProof(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const verifyPaymentProof = async (imageData: string) => {
    setVerifying(true);
    setVerificationResult(null);

    try {
      // Simulate AI verification (in production, call actual AI API)
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Mock AI analysis
      const mockAnalysis = {
        isValid: Math.random() > 0.3, // 70% success rate for demo
        message: Math.random() > 0.3 
          ? `Bukti pembayaran terverifikasi. Nominal sesuai: Rp ${total.toLocaleString('id-ID')}`
          : 'Bukti pembayaran tidak valid. Nominal tidak sesuai atau gambar hasil edit.',
        confidence: Math.random() * 30 + 70 // 70-100%
      };

      setVerificationResult(mockAnalysis);

      if (!mockAnalysis.isValid) {
        setNotificationMessage(mockAnalysis.message);
        setShowNotification(true);
        setTimeout(() => setShowNotification(false), 5000);
      }
    } catch (error) {
      console.error('Error verifying payment:', error);
      setVerificationResult({
        isValid: false,
        message: 'Gagal memverifikasi bukti pembayaran',
        confidence: 0
      });
    } finally {
      setVerifying(false);
    }
  };
  const [submitting, setSubmitting] = useState(false);
  const [orderNumber, setOrderNumber] = useState("");
  const [showNotification, setShowNotification] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState("");

  const updateQuantity = (id: string, change: number) => {
    setCartItems(items =>
      items.map(item => {
        if (item.id === id) {
          const minOrder = item.min_order || 1;
          const newQuantity = Math.max(minOrder, item.quantity + change);
          return { ...item, quantity: newQuantity };
        }
        return item;
      })
    );
    
    // Update localStorage
    const updatedItems = cartItems.map(item => {
      if (item.id === id) {
        const minOrder = item.min_order || 1;
        const newQuantity = Math.max(minOrder, item.quantity + change);
        return { ...item, quantity: newQuantity };
      }
      return item;
    });
    
    if (updatedItems.length > 0) {
      const orderData = {
        product: {
          id: updatedItems[0].id,
          name: updatedItems[0].name,
          price: updatedItems[0].price,
          image: updatedItems[0].image,
          category: updatedItems[0].category,
          min_order: updatedItems[0].min_order,
          variant: updatedItems[0].variant
        },
        quantity: updatedItems[0].quantity,
        total: updatedItems[0].price * updatedItems[0].quantity
      };
      localStorage.setItem('orderData', JSON.stringify(orderData));
    }
  };

  const handleCheckout = () => {
    if (customerInfo.name && customerInfo.phone && customerInfo.address) {
      setStep("payment");
    } else {
      setNotificationMessage("Mohon lengkapi semua data pengiriman");
      setShowNotification(true);
      setTimeout(() => setShowNotification(false), 3000);
    }
  };

  const handlePayment = async () => {
    if (!paymentProof) {
      setNotificationMessage("Mohon upload bukti pembayaran");
      setShowNotification(true);
      setTimeout(() => setShowNotification(false), 3000);
      return;
    }

    if (!verificationResult || !verificationResult.isValid) {
      setNotificationMessage("Bukti pembayaran tidak valid atau belum diverifikasi");
      setShowNotification(true);
      setTimeout(() => setShowNotification(false), 3000);
      return;
    }

    setSubmitting(true);
    
    try {
      // Upload payment proof first if exists
      let paymentProofUrl = "";
      if (paymentProof) {
        try {
          // Convert base64 to blob
          const base64Response = await fetch(paymentProof);
          const blob = await base64Response.blob();
          
          const formData = new FormData();
          formData.append('image', blob, 'payment-proof.jpg');

          const uploadResponse = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/upload`, {
            method: 'POST',
            body: formData
          });

          const uploadData = await uploadResponse.json();
          if (uploadData.success) {
            paymentProofUrl = uploadData.url;
            console.log('📸 Payment proof uploaded:', paymentProofUrl);
          }
        } catch (uploadError) {
          console.error('Error uploading payment proof:', uploadError);
          // Continue without payment proof
        }
      }

      // Prepare order data
      const orderData = {
        order: {
          customer_name: customerInfo.name,
          customer_email: `${customerInfo.phone}@phone.local`,
          customer_phone: customerInfo.phone,
          delivery_address: customerInfo.address,
          subtotal: subtotal,
          delivery_fee: 0,
          total: total,
          payment_method: "qris",
          payment_status: "paid",
          payment_proof: paymentProofUrl,
          order_status: "processing"
        },
        items: cartItems.map(item => ({
          product_id: item.id,
          product_name: item.variant ? `${item.name} (${item.variant})` : item.name,
          product_price: item.price,
          product_image: item.image,
          quantity: item.quantity,
          subtotal: item.price * item.quantity
        }))
      };

      console.log('📦 Submitting order:', orderData);

      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData)
      });

      const data = await response.json();
      console.log('📦 Order response:', data);

      if (data.success) {
        setOrderNumber(data.data.order.order_number);
        
        // Save customer info to localStorage for next order
        localStorage.setItem('customerPhone', customerInfo.phone);
        localStorage.setItem('customerName', customerInfo.name);
        localStorage.setItem('customerAddress', customerInfo.address);
        
        // Clear cart
        localStorage.removeItem('orderData');
        
        // Show success
        setStep("success");
      } else {
        setNotificationMessage('Gagal membuat pesanan: ' + data.message);
        setShowNotification(true);
        setTimeout(() => setShowNotification(false), 3000);
      }
    } catch (error) {
      console.error('Error creating order:', error);
      setNotificationMessage('Gagal terhubung ke server');
      setShowNotification(true);
      setTimeout(() => setShowNotification(false), 3000);
    } finally {
      setSubmitting(false);
    }
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
                        <img 
                          src={item.image || '/produk/placeholder.svg'} 
                          alt={item.name} 
                          className="cart-item-image" 
                        />
                        <div className="cart-item-info">
                          <h3 className="cart-item-name">{item.name}</h3>
                          {item.variant && (
                            <span style={{ 
                              display: 'inline-block',
                              padding: '2px 8px',
                              background: '#FFF5F2',
                              border: '1px solid #FF6B35',
                              borderRadius: '4px',
                              fontSize: '11px',
                              color: '#FF6B35',
                              fontWeight: 600,
                              marginBottom: '4px'
                            }}>
                              Varian: {item.variant}
                            </span>
                          )}
                          <p className="cart-item-price">Rp {item.price.toLocaleString()}</p>
                          {item.min_order && item.min_order > 1 && (
                            <small style={{ color: '#666', fontSize: '12px', display: 'block', marginTop: '4px' }}>
                              Min. order: {item.min_order} pcs
                            </small>
                          )}
                        </div>
                        <div className="cart-item-quantity">
                          <button 
                            onClick={() => updateQuantity(item.id, -1)} 
                            className="qty-btn"
                            disabled={item.quantity <= (item.min_order || 1)}
                            style={{ 
                              opacity: item.quantity <= (item.min_order || 1) ? 0.3 : 1,
                              cursor: item.quantity <= (item.min_order || 1) ? 'not-allowed' : 'pointer'
                            }}
                          >
                            -
                          </button>
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
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, ''); // Only allow digits
                      setCustomerInfo({...customerInfo, phone: value});
                    }}
                    maxLength={15}
                  />
                  <p className="form-hint">Hanya angka, contoh: 081234567890</p>
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
                  <div className="summary-row summary-total">
                    <span>Total</span>
                    <span>Rp {total.toLocaleString()}</span>
                  </div>
                </div>

                <div className="checkout-actions">
                  <button onClick={() => setStep("cart")} className="btn-secondary">
                    Kembali
                  </button>
                  <button 
                    onClick={handleCheckout} 
                    className="btn-primary"
                    disabled={!customerInfo.name || !customerInfo.phone || !customerInfo.address}
                  >
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
                <h2 className="section-title">Pembayaran QRIS</h2>
                
                <div className="payment-methods">
                  <div 
                    className="payment-method active"
                    onClick={() => setShowPaymentDetails(!showPaymentDetails)}
                    style={{ cursor: 'pointer' }}
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
                    <div className="payment-toggle">
                      <svg 
                        width="20" 
                        height="20" 
                        viewBox="0 0 24 24" 
                        fill="none" 
                        stroke="currentColor" 
                        strokeWidth="2"
                        style={{ 
                          transform: showPaymentDetails ? 'rotate(180deg)' : 'rotate(0deg)',
                          transition: 'transform 0.3s'
                        }}
                      >
                        <polyline points="6 9 12 15 18 9"></polyline>
                      </svg>
                    </div>
                  </div>
                </div>

                <AnimatePresence>
                  {showPaymentDetails && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.3 }}
                      className="payment-details"
                    >
                  <h3 className="details-title">Scan QR Code</h3>
                  <div className="qris-code">
                    <div className="qr-image-container">
                      {qrCodeUrl ? (
                        <>
                          <img 
                            src={qrCodeUrl} 
                            alt="QRIS Code" 
                            className="qr-image"
                          />
                          <button onClick={downloadQR} className="btn-download-qr-inline">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                              <polyline points="7 10 12 15 17 10"></polyline>
                              <line x1="12" y1="15" x2="12" y2="3"></line>
                            </svg>
                            Download QR
                          </button>
                        </>
                      ) : (
                        <div className="qr-placeholder">
                          <svg width="200" height="200" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
                            <rect x="3" y="3" width="7" height="7"></rect>
                            <rect x="14" y="3" width="7" height="7"></rect>
                            <rect x="14" y="14" width="7" height="7"></rect>
                            <rect x="3" y="14" width="7" height="7"></rect>
                          </svg>
                          <p style={{ marginTop: '1rem', fontSize: '0.875rem', color: '#6b7280' }}>
                            Generating QR Code...
                          </p>
                        </div>
                      )}
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

                  {/* Upload Bukti Pembayaran */}
                  <div className="payment-proof-upload">
                    <h3 className="details-title" style={{ marginTop: '2rem' }}>Upload Bukti Pembayaran</h3>
                    <p className="proof-instruction-inline">Setelah melakukan pembayaran, upload bukti transfer untuk verifikasi otomatis dengan AI</p>
                    
                    <div className="upload-area-inline">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handlePaymentProofUpload}
                        id="payment-proof"
                        style={{ display: 'none' }}
                      />
                      <label htmlFor="payment-proof" className="upload-label-inline">
                        {paymentProof ? (
                          <div className="proof-preview-inline">
                            <img src={paymentProof} alt="Bukti Pembayaran" />
                            <div className="proof-overlay-inline">
                              <p>Klik untuk ganti gambar</p>
                            </div>
                          </div>
                        ) : (
                          <div className="upload-placeholder-inline">
                            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                              <circle cx="8.5" cy="8.5" r="1.5"></circle>
                              <polyline points="21 15 16 10 5 21"></polyline>
                            </svg>
                            <p>Klik untuk upload bukti pembayaran</p>
                            <span>PNG, JPG, JPEG (Max 5MB)</span>
                          </div>
                        )}
                      </label>
                    </div>

                    {verifying && (
                      <div className="verification-status-inline verifying">
                        <div className="spinner-inline"></div>
                        <div className="verification-text-inline">
                          <p className="verification-message-inline">Memverifikasi bukti pembayaran dengan AI...</p>
                          <p className="verification-submessage-inline">Mohon tunggu sebentar</p>
                        </div>
                      </div>
                    )}

                    {verificationResult && (
                      <div className={`verification-status-inline ${verificationResult.isValid ? 'valid' : 'invalid'}`}>
                        <div className="verification-icon-inline">
                          {verificationResult.isValid ? (
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                              <polyline points="20 6 9 17 4 12"></polyline>
                            </svg>
                          ) : (
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                              <line x1="18" y1="6" x2="6" y2="18"></line>
                              <line x1="6" y1="6" x2="18" y2="18"></line>
                            </svg>
                          )}
                        </div>
                        <div className="verification-details-inline">
                          <p className="verification-message-inline">{verificationResult.message}</p>
                          <p className="verification-confidence-inline">
                            AI Confidence: {verificationResult.confidence.toFixed(1)}%
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </motion.div>
                  )}
                </AnimatePresence>

                <div className="order-summary">
                  <div className="summary-row summary-total">
                    <span>Total Pembayaran</span>
                    <span>Rp {total.toLocaleString()}</span>
                  </div>
                </div>

                <div className="checkout-actions">
                  <button onClick={() => setStep("checkout")} className="btn-secondary" disabled={submitting}>
                    Kembali
                  </button>
                  <button 
                    onClick={handlePayment} 
                    className="btn-primary" 
                    disabled={submitting || !verificationResult?.isValid}
                  >
                    {submitting ? "Memproses..." : "Konfirmasi Pembayaran"}
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
                    <strong>#{orderNumber}</strong>
                  </div>
                  <div className="info-row">
                    <span>Total Pembayaran</span>
                    <strong>Rp {total.toLocaleString()}</strong>
                  </div>
                  <div className="info-row">
                    <span>Metode Pembayaran</span>
                    <strong>QRIS</strong>
                  </div>
                  <div className="info-row">
                    <span>Estimasi Pengiriman</span>
                    <strong>30-45 menit</strong>
                  </div>
                </div>

                <div className="success-actions">
                  <a href={`/kurir?phone=${encodeURIComponent(customerInfo.phone)}`} className="btn-secondary">
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

      {/* Notification Toast */}
      <AnimatePresence>
        {showNotification && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className="notification-toast"
          >
            {notificationMessage}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
