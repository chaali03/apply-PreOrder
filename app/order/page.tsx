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
  conditions?: ProductCondition[];
  available_days?: string[];
}

interface ProductCondition {
  name: string;
  price_adjustment: number;
}

export default function OrderPage() {
  const [step, setStep] = useState<"cart" | "checkout" | "payment" | "success">("cart");
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [selectedConditions, setSelectedConditions] = useState<{[key: string]: string}>({});
  
  // Load order data from localStorage
  useEffect(() => {
    const orderDataStr = localStorage.getItem('orderData');
    if (orderDataStr) {
      const orderData = JSON.parse(orderDataStr);
      
      // Parse conditions if it's a JSON string
      let parsedConditions = [];
      try {
        if (orderData.product.conditions) {
          parsedConditions = typeof orderData.product.conditions === 'string'
            ? JSON.parse(orderData.product.conditions)
            : orderData.product.conditions;
        }
      } catch (e) {
        console.error('Error parsing conditions:', e);
        parsedConditions = [];
      }
      
      setCartItems([{
        id: orderData.product.id,
        name: orderData.product.name,
        price: orderData.product.price,
        quantity: orderData.quantity,
        image: orderData.product.image,
        category: orderData.product.category,
        min_order: orderData.product.min_order || 1,
        variant: orderData.product.variant || null,
        conditions: Array.isArray(parsedConditions) ? parsedConditions : [],
        available_days: orderData.product.available_days || ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
      }]);
    }

    // Auto-fill customer info from localStorage
    const savedPhone = localStorage.getItem('customerPhone');
    const savedName = localStorage.getItem('customerName');
    const savedAddress = localStorage.getItem('customerAddress');
    const savedDeliveryLocation = localStorage.getItem('customerDeliveryLocation') as "TB" | "Luar TB" | null;
    
    if (savedPhone || savedName || savedAddress || savedDeliveryLocation) {
      setCustomerInfo({
        name: savedName || "",
        phone: savedPhone || "",
        address: savedAddress || "",
        notes: "",
        deliveryLocation: savedDeliveryLocation || "TB"
      });
    }
  }, []);
  
  const [customerInfo, setCustomerInfo] = useState({
    name: "",
    phone: "",
    address: "",
    notes: "",
    deliveryLocation: "TB" as "TB" | "Luar TB"
  });

  const [deliveryDate, setDeliveryDate] = useState<string>("");
  const [paymentMethod, setPaymentMethod] = useState<"qris" | "cod">("qris");
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
  const subtotal = cartItems.reduce((sum, item) => {
    let itemTotal = item.price * item.quantity;
    
    // Add condition price adjustment if selected
    if (selectedConditions[item.id] && item.conditions) {
      const selectedCondition = item.conditions.find(c => c.name === selectedConditions[item.id]);
      if (selectedCondition) {
        itemTotal += selectedCondition.price_adjustment * item.quantity;
      }
    }
    
    return sum + itemTotal;
  }, 0);
  const deliveryFee = 0;
  const total = subtotal;

  // Generate QR Code
  useEffect(() => {
    if (step === "payment" && cartItems.length > 0) {
      fetchQRISImage();
    }
  }, [step, cartItems]);

  const fetchQRISImage = async () => {
    try {
      // Get product ID from cart
      if (cartItems.length === 0) return;
      
      const productId = cartItems[0].id;
      
      // Fetch QRIS for this product
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/products/${productId}/qris`);
      const data = await response.json();
      
      console.log('QRIS API response:', data);
      
      if (data.success && data.data) {
        // Product has specific QRIS
        const qrisUrl = data.data.image_url;
        console.log('Product QRIS URL:', qrisUrl);
        setQrCodeUrl(qrisUrl);
      } else {
        // No specific QRIS, try to get default from settings
        console.log('No product QRIS, trying default...');
        const settingsResponse = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/settings?key=qris_image`);
        const settingsData = await settingsResponse.json();
        
        if (settingsData.success && settingsData.data.value) {
          const value = settingsData.data.value as string;
          const baseUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "";
          const absoluteUrl = value.startsWith('http') ? value : `${baseUrl}${value}`;
          console.log('Default QRIS URL:', absoluteUrl);
          setQrCodeUrl(absoluteUrl);
        } else {
          // Generate fallback QR if no QRIS at all
          console.log('No QRIS in database, generating fallback QR');
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

  // Helper function to get available days from cart items
  const getAvailableDays = (): string[] => {
    if (cartItems.length === 0) return [];
    // Use available_days from first item (since we only have one product per order)
    return cartItems[0].available_days || ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
  };

  // Helper function to check if a date is available
  const isDateAvailable = (date: Date): boolean => {
    const availableDays = getAvailableDays();
    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const dayName = dayNames[date.getDay()];
    return availableDays.includes(dayName);
  };

  // Helper function to get next available date
  const getNextAvailableDate = (startDate: Date = new Date()): Date => {
    const date = new Date(startDate);
    date.setHours(0, 0, 0, 0);
    
    // Start from tomorrow
    date.setDate(date.getDate() + 1);
    
    // Find next available day (max 30 days ahead)
    for (let i = 0; i < 30; i++) {
      if (isDateAvailable(date)) {
        return date;
      }
      date.setDate(date.getDate() + 1);
    }
    
    // If no available date found, return tomorrow
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow;
  };

  // Format date for input[type="date"]
  const formatDateForInput = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Get min date (tomorrow)
  const getMinDate = (): string => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return formatDateForInput(tomorrow);
  };

  // Get max date (30 days from now)
  const getMaxDate = (): string => {
    const maxDate = new Date();
    maxDate.setDate(maxDate.getDate() + 30);
    return formatDateForInput(maxDate);
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

      // Simple validation: check image format and size
      const isValidFormat = imageData.startsWith('data:image/');
      const imageSize = imageData.length;
      
      if (!isValidFormat || imageSize < 10000) {
        const result = {
          isValid: false,
          message: 'Format gambar tidak valid atau ukuran terlalu kecil. Upload screenshot asli dari aplikasi banking.',
          confidence: 95
        };
        setVerificationResult(result);
        setNotificationMessage(result.message);
        setShowNotification(true);
        setTimeout(() => setShowNotification(false), 5000);
      } else {
        // Accept valid images with instruction
        const result = {
          isValid: true,
          message: `✅ Format bukti pembayaran valid. PENTING: Pastikan transfer ke rekening atas nama SCAFF*FOOD dengan nominal Rp ${total.toLocaleString('id-ID')}`,
          confidence: 85
        };
        setVerificationResult(result);
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
  
  // Address validation state
  const [addressValidation, setAddressValidation] = useState<{
    isValid: boolean;
    message: string;
    confidence: number;
    detectedArea?: string;
    suggestions?: string[];
    suggestedLocation?: "TB" | "Luar TB";
    locationConfidence?: number;
  } | null>(null);
  const [validatingAddress, setValidatingAddress] = useState(false);
  const [showLocationOverride, setShowLocationOverride] = useState(false);

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

  // Validate address with AI
  const validateAddress = async (address: string) => {
    if (!address || address.trim().length < 5) {
      setAddressValidation(null);
      return;
    }

    setValidatingAddress(true);
    
    try {
      const response = await fetch('/api/validate-address', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address })
      });

      const data = await response.json();
      
      if (data.success) {
        setAddressValidation(data.data);
        
        // Auto-update delivery location based on AI suggestion if confidence is high
        if (data.data.suggestedLocation && data.data.locationConfidence >= 85 && !showLocationOverride) {
          setCustomerInfo(prev => ({
            ...prev,
            deliveryLocation: data.data.suggestedLocation
          }));
        }
      }
    } catch (error) {
      console.error('Error validating address:', error);
    } finally {
      setValidatingAddress(false);
    }
  };

  // Debounce address validation
  useEffect(() => {
    const timer = setTimeout(() => {
      if (customerInfo.address && customerInfo.address.trim().length >= 5) {
        validateAddress(customerInfo.address);
      }
    }, 800); // Wait 800ms after user stops typing

    return () => clearTimeout(timer);
  }, [customerInfo.address]);

  const handleCheckout = () => {
    if (customerInfo.name && customerInfo.phone && customerInfo.address && deliveryDate) {
      // Check address validation
      if (!addressValidation || !addressValidation.isValid) {
        setNotificationMessage("Alamat pengiriman tidak valid atau di luar area layanan");
        setShowNotification(true);
        setTimeout(() => setShowNotification(false), 3000);
        return;
      }
      
      // Validate delivery date
      const selectedDate = new Date(deliveryDate);
      if (!isDateAvailable(selectedDate)) {
        setNotificationMessage("Tanggal pengiriman tidak tersedia untuk produk ini");
        setShowNotification(true);
        setTimeout(() => setShowNotification(false), 3000);
        return;
      }
      
      setStep("payment");
    } else {
      setNotificationMessage("Mohon lengkapi semua data pengiriman termasuk tanggal pengiriman");
      setShowNotification(true);
      setTimeout(() => setShowNotification(false), 3000);
    }
  };

  const handlePayment = async () => {
    // Validate payment proof only for QRIS
    if (paymentMethod === "qris") {
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
    }

    setSubmitting(true);
    
    try {
      // Upload payment proof first if exists (only for QRIS)
      let paymentProofUrl = "";
      if (paymentMethod === "qris" && paymentProof) {
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
          delivery_location: customerInfo.deliveryLocation,
          delivery_date: deliveryDate || null,
          subtotal: subtotal,
          delivery_fee: 0,
          total: total,
          payment_method: paymentMethod,
          payment_status: paymentMethod === "cod" ? "pending" : "paid",
          payment_proof: paymentProofUrl,
          order_status: "processing"
        },
        items: cartItems.map(item => {
          let itemPrice = item.price;
          let productName = item.variant ? `${item.name} (${item.variant})` : item.name;
          
          // Add condition to product name and adjust price
          if (selectedConditions[item.id] && item.conditions) {
            const selectedCondition = item.conditions.find(c => c.name === selectedConditions[item.id]);
            if (selectedCondition) {
              productName += ` - ${selectedCondition.name}`;
              itemPrice += selectedCondition.price_adjustment;
            }
          }
          
          return {
            product_id: item.id,
            product_name: productName,
            product_price: itemPrice,
            product_image: item.image,
            quantity: item.quantity,
            subtotal: itemPrice * item.quantity
          };
        })
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
        localStorage.setItem('customerDeliveryLocation', customerInfo.deliveryLocation);
        
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
                    placeholder="Contoh: Kelas XII RPL 4, Ruang 304, SMK Taruna Bhakti"
                    rows={4}
                    value={customerInfo.address}
                    onChange={(e) => setCustomerInfo({...customerInfo, address: e.target.value})}
                  />
                  <p className="form-hint">
                    {customerInfo.deliveryLocation === "TB" 
                      ? "Untuk dalam TB: Sebutkan kelas & ruangan (contoh: Kelas XII RPL 4, Ruang 304, SMK Taruna Bhakti)"
                      : "Untuk luar TB: Alamat lengkap dengan RT/RW di area Cimangis, Pekapuran, atau Gas Alam Depok"
                    }
                  </p>
                  
                  {/* AI Address Validation Result */}
                  {validatingAddress && (
                    <div style={{
                      marginTop: '12px',
                      padding: '12px 16px',
                      background: '#f3f4f6',
                      border: '2px solid #d1d5db',
                      borderRadius: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px'
                    }}>
                      <div style={{
                        width: '20px',
                        height: '20px',
                        border: '3px solid #3b82f6',
                        borderTopColor: 'transparent',
                        borderRadius: '50%',
                        animation: 'spin 0.8s linear infinite'
                      }} />
                      <div>
                        <p style={{ 
                          margin: 0, 
                          fontSize: '14px', 
                          fontWeight: 600,
                          color: '#374151'
                        }}>
                          AI sedang memvalidasi alamat...
                        </p>
                        <p style={{ 
                          margin: '4px 0 0 0', 
                          fontSize: '12px',
                          color: '#6b7280'
                        }}>
                          Memeriksa area pengiriman
                        </p>
                      </div>
                    </div>
                  )}
                  
                  {!validatingAddress && addressValidation && (
                    <div style={{
                      marginTop: '12px',
                      padding: '16px',
                      background: addressValidation.isValid ? '#f0fdf4' : '#fef2f2',
                      border: `2px solid ${addressValidation.isValid ? '#10b981' : '#ef4444'}`,
                      borderRadius: '8px'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                        <div style={{
                          width: '24px',
                          height: '24px',
                          borderRadius: '50%',
                          background: addressValidation.isValid ? '#10b981' : '#ef4444',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0
                        }}>
                          {addressValidation.isValid ? (
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
                              <polyline points="20 6 9 17 4 12"></polyline>
                            </svg>
                          ) : (
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
                              <line x1="18" y1="6" x2="6" y2="18"></line>
                              <line x1="6" y1="6" x2="18" y2="18"></line>
                            </svg>
                          )}
                        </div>
                        <div style={{ flex: 1 }}>
                          <p style={{ 
                            margin: 0, 
                            fontSize: '14px', 
                            fontWeight: 700,
                            color: addressValidation.isValid ? '#065f46' : '#991b1b'
                          }}>
                            {addressValidation.message}
                          </p>
                          {addressValidation.detectedArea && (
                            <p style={{ 
                              margin: '6px 0 0 0', 
                              fontSize: '12px',
                              color: addressValidation.isValid ? '#047857' : '#dc2626',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '6px'
                            }}>
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                                <circle cx="12" cy="10" r="3"></circle>
                              </svg>
                              Area terdeteksi: {addressValidation.detectedArea}
                            </p>
                          )}
                          <p style={{ 
                            margin: '6px 0 0 0', 
                            fontSize: '11px',
                            color: '#6b7280',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px'
                          }}>
                            AI Confidence: {addressValidation.confidence}%
                          </p>
                          {addressValidation.suggestions && addressValidation.suggestions.length > 0 && (
                            <div style={{ 
                              marginTop: '12px',
                              paddingTop: '12px',
                              borderTop: `1px solid ${addressValidation.isValid ? '#86efac' : '#fca5a5'}`
                            }}>
                              <p style={{ 
                                margin: '0 0 8px 0', 
                                fontSize: '12px',
                                fontWeight: 600,
                                color: '#374151'
                              }}>
                                Saran:
                              </p>
                              <ul style={{ 
                                margin: 0, 
                                paddingLeft: '20px',
                                fontSize: '12px',
                                color: '#6b7280'
                              }}>
                                {addressValidation.suggestions.map((suggestion, idx) => (
                                  <li key={idx} style={{ marginBottom: '4px' }}>
                                    {suggestion}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {/* AI Location Suggestion with Override Option */}
                      {addressValidation.suggestedLocation && addressValidation.locationConfidence && (
                        <div style={{
                          marginTop: '16px',
                          paddingTop: '16px',
                          borderTop: `2px solid ${addressValidation.isValid ? '#86efac' : '#fca5a5'}`
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                            <div>
                              <p style={{ 
                                margin: 0, 
                                fontSize: '13px',
                                fontWeight: 600,
                                color: '#374151'
                              }}>
                                🤖 AI mendeteksi lokasi pengiriman:
                              </p>
                              <p style={{ 
                                margin: '4px 0 0 0', 
                                fontSize: '16px',
                                fontWeight: 700,
                                color: addressValidation.suggestedLocation === 'TB' ? '#2563eb' : '#7c3aed'
                              }}>
                                {addressValidation.suggestedLocation === 'TB' ? 'Dalam TB' : 'Luar TB'}
                              </p>
                              <p style={{ 
                                margin: '2px 0 0 0', 
                                fontSize: '11px',
                                color: '#6b7280'
                              }}>
                                Confidence: {addressValidation.locationConfidence}%
                              </p>
                            </div>
                            <button
                              type="button"
                              onClick={() => setShowLocationOverride(!showLocationOverride)}
                              style={{
                                padding: '8px 16px',
                                background: '#f3f4f6',
                                border: '2px solid #d1d5db',
                                borderRadius: '8px',
                                fontSize: '12px',
                                fontWeight: 600,
                                color: '#374151',
                                cursor: 'pointer',
                                transition: 'all 0.2s'
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.background = '#e5e7eb';
                                e.currentTarget.style.borderColor = '#9ca3af';
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.background = '#f3f4f6';
                                e.currentTarget.style.borderColor = '#d1d5db';
                              }}
                            >
                              {showLocationOverride ? 'Tutup' : 'Ganti Lokasi'}
                            </button>
                          </div>
                          
                          {/* Location Override Options */}
                          {showLocationOverride && (
                            <div style={{
                              marginTop: '12px',
                              padding: '16px',
                              background: '#fef3c7',
                              border: '2px solid #fbbf24',
                              borderRadius: '8px'
                            }}>
                              <p style={{ 
                                margin: '0 0 12px 0', 
                                fontSize: '13px',
                                fontWeight: 600,
                                color: '#92400e'
                              }}>
                                ⚠️ Pilih lokasi pengiriman yang benar:
                              </p>
                              <div style={{ display: 'flex', gap: '12px' }}>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setCustomerInfo({...customerInfo, deliveryLocation: 'TB'});
                                    setShowLocationOverride(false);
                                  }}
                                  style={{
                                    flex: 1,
                                    padding: '12px',
                                    background: customerInfo.deliveryLocation === 'TB' ? '#2563eb' : 'white',
                                    border: '2px solid #2563eb',
                                    borderRadius: '8px',
                                    fontSize: '14px',
                                    fontWeight: 700,
                                    color: customerInfo.deliveryLocation === 'TB' ? 'white' : '#2563eb',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s'
                                  }}
                                >
                                  Dalam TB
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setCustomerInfo({...customerInfo, deliveryLocation: 'Luar TB'});
                                    setShowLocationOverride(false);
                                  }}
                                  style={{
                                    flex: 1,
                                    padding: '12px',
                                    background: customerInfo.deliveryLocation === 'Luar TB' ? '#7c3aed' : 'white',
                                    border: '2px solid #7c3aed',
                                    borderRadius: '8px',
                                    fontSize: '14px',
                                    fontWeight: 700,
                                    color: customerInfo.deliveryLocation === 'Luar TB' ? 'white' : '#7c3aed',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s'
                                  }}
                                >
                                  Luar TB
                                </button>
                              </div>
                              <p style={{ 
                                margin: '12px 0 0 0', 
                                fontSize: '11px',
                                color: '#92400e',
                                textAlign: 'center'
                              }}>
                                Pastikan pilihan sesuai dengan alamat Anda
                              </p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Display selected delivery location (read-only) */}
                <div className="form-group" style={{ 
                  marginTop: '20px', 
                  padding: '16px', 
                  background: '#f0fdf4', 
                  border: '2px solid #10b981',
                  borderRadius: '8px'
                }}>
                  <label className="form-label" style={{ marginBottom: '8px', display: 'block', fontSize: '14px' }}>
                    Lokasi Pengiriman
                  </label>
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '8px',
                    fontSize: '16px',
                    fontWeight: 600,
                    color: '#10b981'
                  }}>
                    {customerInfo.deliveryLocation === "TB" ? (
                      <>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2">
                          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                          <polyline points="9 22 9 12 15 12 15 22"></polyline>
                        </svg>
                        Dalam TB
                      </>
                    ) : (
                      <>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2">
                          <circle cx="12" cy="10" r="3"></circle>
                          <path d="M12 21.7C17.3 17 20 13 20 10a8 8 0 1 0-16 0c0 3 2.7 6.9 8 11.7z"></path>
                        </svg>
                        Luar TB
                      </>
                    )}
                  </div>
                  <small style={{ color: '#6b7280', fontSize: '12px', marginTop: '4px', display: 'block' }}>
                    Lokasi dipilih dari halaman produk. Alamat harus sesuai dengan lokasi ini.
                  </small>
                </div>

                {/* Delivery Date Picker */}
                <div className="form-group">
                  <label className="form-label">Estimasi Tanggal Pengiriman *</label>
                  <input
                    type="date"
                    className="form-input"
                    required
                    value={deliveryDate}
                    min={getMinDate()}
                    max={getMaxDate()}
                    onChange={(e) => {
                      const selectedDate = new Date(e.target.value);
                      if (isDateAvailable(selectedDate)) {
                        setDeliveryDate(e.target.value);
                      } else {
                        setNotificationMessage('Hari yang dipilih tidak tersedia untuk produk ini');
                        setShowNotification(true);
                        setTimeout(() => setShowNotification(false), 3000);
                        // Set to next available date
                        const nextDate = getNextAvailableDate(selectedDate);
                        setDeliveryDate(formatDateForInput(nextDate));
                      }
                    }}
                    style={{
                      padding: '12px',
                      border: '2px solid #d1d5db',
                      borderRadius: '8px',
                      fontSize: '14px',
                      width: '100%'
                    }}
                  />
                  <small style={{ color: '#666', fontSize: '12px', marginTop: '4px', display: 'block' }}>
                    Hari tersedia: {getAvailableDays().map(day => {
                      const dayMap: {[key: string]: string} = {
                        'monday': 'Senin',
                        'tuesday': 'Selasa',
                        'wednesday': 'Rabu',
                        'thursday': 'Kamis',
                        'friday': 'Jumat',
                        'saturday': 'Sabtu',
                        'sunday': 'Minggu'
                      };
                      return dayMap[day];
                    }).join(', ')}
                  </small>
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

                {/* Conditions Selection */}
                {cartItems.some(item => item.conditions && item.conditions.length > 0) && (
                  <div className="form-group" style={{ 
                    marginTop: '24px', 
                    padding: '20px', 
                    background: '#f0f9ff', 
                    border: '2px solid #0ea5e9',
                    borderRadius: '8px'
                  }}>
                    <h3 style={{ 
                      fontSize: '16px', 
                      fontWeight: 700, 
                      marginBottom: '16px',
                      color: '#1a1a1a'
                    }}>
                      Pilih Kondisi Produk
                    </h3>
                    {cartItems.map(item => {
                      if (!item.conditions || item.conditions.length === 0) return null;
                      
                      return (
                        <div key={item.id} style={{ marginBottom: '20px' }}>
                          <label style={{ 
                            display: 'block', 
                            fontSize: '14px', 
                            fontWeight: 600, 
                            marginBottom: '8px',
                            color: '#374151'
                          }}>
                            {item.name}
                          </label>
                          <select
                            className="form-input"
                            value={selectedConditions[item.id] || ''}
                            onChange={(e) => setSelectedConditions({
                              ...selectedConditions,
                              [item.id]: e.target.value
                            })}
                            style={{
                              width: '100%',
                              padding: '12px',
                              border: '2px solid #1a1a1a',
                              borderRadius: '4px',
                              fontSize: '14px',
                              background: 'white'
                            }}
                          >
                            <option value="">Pilih kondisi...</option>
                            {item.conditions.map((condition, idx) => (
                              <option key={idx} value={condition.name}>
                                {condition.name}
                                {condition.price_adjustment > 0 
                                  ? ` (+Rp ${condition.price_adjustment.toLocaleString()})` 
                                  : ' (Gratis)'}
                              </option>
                            ))}
                          </select>
                        </div>
                      );
                    })}
                    <small style={{ color: '#666', fontSize: '12px', display: 'block', marginTop: '8px' }}>
                      * Pilih kondisi untuk setiap produk yang memiliki opsi kondisi
                    </small>
                  </div>
                )}

                <div className="order-summary">
                  <h3 className="summary-title">Ringkasan Pesanan</h3>
                  {cartItems.map(item => {
                    let itemPrice = item.price * item.quantity;
                    let conditionText = '';
                    let conditionBadge = null;
                    
                    // Add condition info if selected
                    if (selectedConditions[item.id] && item.conditions) {
                      const selectedCondition = item.conditions.find(c => c.name === selectedConditions[item.id]);
                      if (selectedCondition) {
                        itemPrice += selectedCondition.price_adjustment * item.quantity;
                        const isFree = selectedCondition.price_adjustment === 0;
                        conditionText = ` (${selectedCondition.name})`;
                        conditionBadge = (
                          <span style={{
                            fontSize: '11px',
                            padding: '2px 6px',
                            background: isFree ? '#e0f2fe' : '#fef3c7',
                            color: isFree ? '#0369a1' : '#92400e',
                            borderRadius: '4px',
                            marginLeft: '6px',
                            fontWeight: 600
                          }}>
                            {isFree ? '✓ Gratis' : `+Rp ${selectedCondition.price_adjustment.toLocaleString()}`}
                          </span>
                        );
                      }
                    }
                    
                    return (
                      <div key={item.id} className="summary-row">
                        <span>
                          {item.name} x{item.quantity}{conditionText}
                          {conditionBadge}
                        </span>
                        <span>Rp {itemPrice.toLocaleString()}</span>
                      </div>
                    );
                  })}
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
                    disabled={!customerInfo.name || !customerInfo.phone || !customerInfo.address || !deliveryDate || !addressValidation?.isValid}
                    style={{
                      opacity: (!customerInfo.name || !customerInfo.phone || !customerInfo.address || !deliveryDate || !addressValidation?.isValid) ? 0.5 : 1,
                      cursor: (!customerInfo.name || !customerInfo.phone || !customerInfo.address || !deliveryDate || !addressValidation?.isValid) ? 'not-allowed' : 'pointer'
                    }}
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
                <h2 className="section-title">Pilih Metode Pembayaran</h2>
                
                <div className="payment-methods">
                  {/* QRIS Payment */}
                  <div 
                    className={`payment-method ${paymentMethod === "qris" ? "active" : ""}`}
                    onClick={() => {
                      setPaymentMethod("qris");
                      setShowPaymentDetails(true);
                    }}
                    style={{ cursor: 'pointer', marginBottom: '12px' }}
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
                    {paymentMethod === "qris" && (
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
                          onClick={(e) => {
                            e.stopPropagation();
                            setShowPaymentDetails(!showPaymentDetails);
                          }}
                        >
                          <polyline points="6 9 12 15 18 9"></polyline>
                        </svg>
                      </div>
                    )}
                  </div>

                  {/* COD Payment */}
                  <div 
                    className={`payment-method ${paymentMethod === "cod" ? "active" : ""}`}
                    onClick={() => {
                      setPaymentMethod("cod");
                      setShowPaymentDetails(false);
                    }}
                    style={{ cursor: 'pointer' }}
                  >
                    <div className="payment-icon">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <line x1="12" y1="1" x2="12" y2="23"></line>
                        <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
                      </svg>
                    </div>
                    <div className="payment-info">
                      <h3>COD (Cash on Delivery) or (Cash or Duel)</h3>
                      <p>Bayar saat barang diterima atau barang tukar nyawa</p>
                    </div>
                  </div>
                </div>

                <AnimatePresence>
                  {showPaymentDetails && paymentMethod === "qris" && (
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

                  {/* Upload Bukti Pembayaran - Only for QRIS */}
                  {paymentMethod === "qris" && (
                    <div className="payment-proof-upload">
                      <h3 className="details-title" style={{ marginTop: '2rem' }}>Upload Bukti Pembayaran</h3>
                      <p className="proof-instruction-inline">
                        <strong style={{ color: '#ef4444' }}>PENTING:</strong> Transfer harus ke rekening atas nama <strong>SCAFF*FOOD</strong>. 
                        Upload screenshot asli dari aplikasi banking (jangan di-edit).
                      </p>
                    
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
                  )}
                </motion.div>
                  )}
                </AnimatePresence>

                {/* COD Information */}
                {paymentMethod === "cod" && (
                  <div style={{
                    marginTop: '20px',
                    padding: '20px',
                    background: '#f0fdf4',
                    border: '2px solid #10b981',
                    borderRadius: '8px'
                  }}>
                    <h3 style={{ marginBottom: '12px', color: '#10b981', fontSize: '16px', fontWeight: 600 }}>
                      Informasi COD (Cash on Delivery) or (Cash or Duel)
                    </h3>
                    <ul style={{ margin: 0, paddingLeft: '20px', color: '#374151', fontSize: '14px', lineHeight: '1.8' }}>
                      <li>Pembayaran dilakukan saat barang diterima</li>
                      <li>Siapkan uang pas sebesar <strong>Rp {total.toLocaleString()}</strong></li>
                      <li>Kurir akan menghubungi Anda sebelum pengiriman</li>
                      <li>Pastikan Anda berada di lokasi saat pengiriman</li>
                      <li>Kalau tidak mau dibayar dengan uang bertimpuk kita</li>
                    </ul>
                  </div>
                )}

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
                    disabled={submitting || (paymentMethod === "qris" && !verificationResult?.isValid)}
                  >
                    {submitting ? "Memproses..." : (paymentMethod === "cod" ? "Konfirmasi Pesanan" : "Konfirmasi Pembayaran")}
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
                    <strong>{paymentMethod === "qris" ? "QRIS" : "COD (Cash on Delivery)"}</strong>
                  </div>
                  <div className="info-row">
                    <span>Estimasi Pengiriman</span>
                    <strong>30 menit-48 jam (kecuali hari minggu)</strong>
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
