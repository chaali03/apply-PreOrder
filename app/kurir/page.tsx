"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import MobileMenu from '../../components/ui/mobile-menu';
import CurvedMenu from '../../components/ui/curved-menu';
import './kurir.css';

interface OrderItem {
  id: string;
  product_name: string;
  product_price: number;
  product_image: string;
  quantity: number;
  subtotal: number;
}

interface Order {
  id: string;
  order_number: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  delivery_address: string;
  subtotal: number;
  delivery_fee: number;
  total: number;
  payment_method: string;
  payment_status: string;
  order_status: string;
  delivery_photo?: string;
  cancellation_reason?: string;
  cancelled_at?: string;
  created_at: string;
  items: OrderItem[];
}

export default function KurirPage() {
  const searchParams = useSearchParams();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [customerPhone, setCustomerPhone] = useState("");

  // Load phone from URL or localStorage
  useEffect(() => {
    const phoneFromUrl = searchParams.get('phone');
    if (phoneFromUrl) {
      setCustomerPhone(phoneFromUrl);
      localStorage.setItem('customerPhone', phoneFromUrl);
    } else {
      const savedPhone = localStorage.getItem('customerPhone');
      if (savedPhone) {
        setCustomerPhone(savedPhone);
      }
    }
  }, [searchParams]);

  // Fetch orders when phone is available
  useEffect(() => {
    if (!customerPhone) {
      setLoading(false);
      return;
    }

    const fetchOrders = async () => {
      try {
        const response = await fetch(`http://localhost:8080/api/orders/customer/${encodeURIComponent(customerPhone)}`);
        const data = await response.json();
        
        if (data.success) {
          setOrders(data.data || []);
        } else {
          console.error('Failed to fetch orders:', data.message);
          setOrders([]);
        }
      } catch (error) {
        console.error('Error fetching orders:', error);
        setOrders([]);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [customerPhone]);

  const filteredOrders = (orders || []).filter(order => {
    const matchesSearch = 
      order.order_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.customer_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.delivery_address.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = selectedStatus === "all" || order.order_status === selectedStatus;
    
    return matchesSearch && matchesStatus;
  });

  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'pending':
        return { label: 'Menunggu', color: '#999', icon: 'clock' };
      case 'processing':
        return { label: 'Diproses', color: '#f59e0b', icon: 'chef' };
      case 'on_delivery':
        return { label: 'Diantar', color: '#8b5cf6', icon: 'truck' };
      case 'completed':
        return { label: 'Selesai', color: '#34C759', icon: 'check' };
      case 'cancelled':
        return { label: 'Dibatalkan', color: '#FF3B30', icon: 'x' };
      default:
        return { label: status, color: '#999', icon: 'clock' };
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

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
        <section className="kurir-hero">
          <div className="kurir-hero-content">
            <h1 className="kurir-hero-title">
              TRACKING
              <br />
              <span>PESANAN</span>
            </h1>
            <p className="kurir-hero-subtitle">
              Pantau status pesanan Anda secara real-time
            </p>
          </div>
        </section>

        {/* Search & Filter */}
        <section className="kurir-search-section">
          <div className="search-container">
            <input
              type="text"
              placeholder="Cari order ID, nama, atau alamat..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
            />
            <svg className="search-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8"></circle>
              <path d="m21 21-4.35-4.35"></path>
            </svg>
          </div>

          <div className="status-filter">
            <button
              onClick={() => setSelectedStatus("all")}
              className={`status-filter-btn ${selectedStatus === "all" ? 'active' : ''}`}
            >
              Semua
            </button>
            <button
              onClick={() => setSelectedStatus("pending")}
              className={`status-filter-btn ${selectedStatus === "pending" ? 'active' : ''}`}
            >
              Menunggu
            </button>
            <button
              onClick={() => setSelectedStatus("processing")}
              className={`status-filter-btn ${selectedStatus === "processing" ? 'active' : ''}`}
            >
              Diproses
            </button>
            <button
              onClick={() => setSelectedStatus("on_delivery")}
              className={`status-filter-btn ${selectedStatus === "on_delivery" ? 'active' : ''}`}
            >
              Diantar
            </button>
            <button
              onClick={() => setSelectedStatus("completed")}
              className={`status-filter-btn ${selectedStatus === "completed" ? 'active' : ''}`}
            >
              Selesai
            </button>
          </div>
        </section>

        {/* Orders List */}
        <section className="orders-section">
          <div className="orders-container">
            {loading ? (
              <div className="loading-state">
                <p>Memuat pesanan...</p>
              </div>
            ) : filteredOrders.length === 0 ? (
              <div className="no-orders">
                <p>Tidak ada pesanan ditemukan</p>
              </div>
            ) : (
              filteredOrders.map((order) => {
                const statusInfo = getStatusInfo(order.order_status);
                return (
                  <div key={order.id} className="order-card">
                    <div className="order-header">
                      <div className="order-id-section">
                        <span className="order-id">{order.order_number}</span>
                        <span className="order-time">{formatDate(order.created_at)}</span>
                      </div>
                      <div className="order-status" style={{ backgroundColor: statusInfo.color }}>
                        <div className={`status-icon ${order.order_status}`}>
                          {statusInfo.icon === 'clock' && (
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <circle cx="12" cy="12" r="10"></circle>
                              <polyline points="12 6 12 12 16 14"></polyline>
                            </svg>
                          )}
                          {statusInfo.icon === 'chef' && (
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M6 13.87A4 4 0 0 1 7.41 6a5.11 5.11 0 0 1 1.05-1.54 5 5 0 0 1 7.08 0A5.11 5.11 0 0 1 16.59 6 4 4 0 0 1 18 13.87V21H6Z"></path>
                              <line x1="6" y1="17" x2="18" y2="17"></line>
                            </svg>
                          )}
                          {statusInfo.icon === 'truck' && (
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="truck-icon">
                              <rect x="1" y="3" width="15" height="13"></rect>
                              <polygon points="16 8 20 8 23 11 23 16 16 16 16 8"></polygon>
                              <circle cx="5.5" cy="18.5" r="2.5"></circle>
                              <circle cx="18.5" cy="18.5" r="2.5"></circle>
                            </svg>
                          )}
                          {statusInfo.icon === 'check' && (
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <polyline points="20 6 9 17 4 12"></polyline>
                            </svg>
                          )}
                          {statusInfo.icon === 'x' && (
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <line x1="18" y1="6" x2="6" y2="18"></line>
                              <line x1="6" y1="6" x2="18" y2="18"></line>
                            </svg>
                          )}
                        </div>
                        <span>{statusInfo.label}</span>
                      </div>
                    </div>

                    <div className="order-body">
                      <div className="order-customer">
                        <h3>{order.customer_name}</h3>
                      </div>

                      <div className="order-items">
                        <strong>Items:</strong>
                        <ul>
                          {order.items.map((item) => (
                            <li key={item.id}>
                              {item.product_name} x{item.quantity} - Rp {item.subtotal.toLocaleString()}
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div className="order-total">
                        <strong>Total: Rp {order.total.toLocaleString()}</strong>
                      </div>

                      <div className="order-address">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                          <circle cx="12" cy="10" r="3"></circle>
                        </svg>
                        <span>{order.delivery_address}</span>
                      </div>

                      <div className="order-payment">
                        <span>Pembayaran: {order.payment_method === 'cash' ? 'Cash on Delivery' : order.payment_method === 'transfer' ? 'Transfer Bank' : 'QRIS'}</span>
                      </div>

                      {order.order_status === 'completed' && order.delivery_photo && (
                        <div className="order-delivery-photo">
                          <div className="photo-header">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                              <circle cx="8.5" cy="8.5" r="1.5"></circle>
                              <polyline points="21 15 16 10 5 21"></polyline>
                            </svg>
                            <strong>Foto Bukti Pengiriman:</strong>
                          </div>
                          <div className="photo-container">
                            <img 
                              src={order.delivery_photo} 
                              alt="Bukti Pengiriman" 
                              className="delivery-photo-img"
                            />
                          </div>
                          <small className="photo-note">
                            Foto diambil saat pesanan selesai diantar
                          </small>
                        </div>
                      )}

                      {(order.order_status === 'dibatalkan' || order.order_status === 'cancelled') && order.cancellation_reason && (
                        <div className="order-cancellation">
                          <div className="cancellation-header">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <circle cx="12" cy="12" r="10"></circle>
                              <line x1="12" y1="8" x2="12" y2="12"></line>
                              <line x1="12" y1="16" x2="12.01" y2="16"></line>
                            </svg>
                            <strong>Alasan Pembatalan:</strong>
                          </div>
                          <p className="cancellation-reason">{order.cancellation_reason}</p>
                          <small className="cancellation-note">
                            Pesanan ini akan otomatis terhapus 24 jam setelah dibatalkan
                          </small>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
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
            <li><Link href="/kurir">Kurir</Link></li>
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
