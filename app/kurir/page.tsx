"use client";

import { useState } from 'react';
import Link from 'next/link';
import MobileMenu from '../../components/ui/mobile-menu';
import CurvedMenu from '../../components/ui/curved-menu';
import './kurir.css';

interface Order {
  id: string;
  customerName: string;
  items: string[];
  status: 'pending' | 'preparing' | 'delivering' | 'delivered';
  address: string;
  phone: string;
  orderTime: string;
  estimatedTime?: string;
}

const mockOrders: Order[] = [
  {
    id: "ORD-001",
    customerName: "Ahmad Faisal",
    items: ["Cookies x2", "Udang Keju 3pcs x1"],
    status: "delivering",
    address: "Jl. Raya TB No. 123, Tangerang",
    phone: "0812-3456-7890",
    orderTime: "10:30",
    estimatedTime: "11:00"
  },
  {
    id: "ORD-002",
    customerName: "Siti Nurhaliza",
    items: ["Cookies x3"],
    status: "preparing",
    address: "Jl. Merdeka No. 45, Tangerang",
    phone: "0813-4567-8901",
    orderTime: "10:45",
    estimatedTime: "11:15"
  },
  {
    id: "ORD-003",
    customerName: "Budi Santoso",
    items: ["Udang Keju 3pcs x2", "Cookies x1"],
    status: "pending",
    address: "Jl. Sudirman No. 78, Tangerang",
    phone: "0814-5678-9012",
    orderTime: "11:00",
    estimatedTime: "11:30"
  },
  {
    id: "ORD-004",
    customerName: "Dewi Lestari",
    items: ["Cookies x1"],
    status: "delivered",
    address: "Jl. Gatot Subroto No. 90, Tangerang",
    phone: "0815-6789-0123",
    orderTime: "09:30",
    estimatedTime: "10:00"
  },
];

export default function KurirPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [orders] = useState<Order[]>(mockOrders);

  const filteredOrders = orders.filter(order => {
    const matchesSearch = 
      order.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.address.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = selectedStatus === "all" || order.status === selectedStatus;
    
    return matchesSearch && matchesStatus;
  });

  const getStatusInfo = (status: Order['status']) => {
    switch (status) {
      case 'pending':
        return { label: 'Menunggu', color: '#6b7280', icon: 'clock' };
      case 'preparing':
        return { label: 'Disiapkan', color: '#f59e0b', icon: 'chef' };
      case 'delivering':
        return { label: 'Diantar', color: '#3b82f6', icon: 'truck' };
      case 'delivered':
        return { label: 'Selesai', color: '#10b981', icon: 'check' };
    }
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
          <a href="#">Locations</a>
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
              onClick={() => setSelectedStatus("preparing")}
              className={`status-filter-btn ${selectedStatus === "preparing" ? 'active' : ''}`}
            >
              Disiapkan
            </button>
            <button
              onClick={() => setSelectedStatus("delivering")}
              className={`status-filter-btn ${selectedStatus === "delivering" ? 'active' : ''}`}
            >
              Diantar
            </button>
            <button
              onClick={() => setSelectedStatus("delivered")}
              className={`status-filter-btn ${selectedStatus === "delivered" ? 'active' : ''}`}
            >
              Selesai
            </button>
          </div>
        </section>

        {/* Orders List */}
        <section className="orders-section">
          <div className="orders-container">
            {filteredOrders.map((order) => {
              const statusInfo = getStatusInfo(order.status);
              return (
                <div key={order.id} className="order-card">
                  <div className="order-header">
                    <div className="order-id-section">
                      <span className="order-id">{order.id}</span>
                      <span className="order-time">{order.orderTime}</span>
                    </div>
                    <div className="order-status" style={{ backgroundColor: statusInfo.color }}>
                      <div className={`status-icon ${order.status}`}>
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
                      </div>
                      <span>{statusInfo.label}</span>
                    </div>
                  </div>

                  <div className="order-body">
                    <div className="order-customer">
                      <h3>{order.customerName}</h3>
                      <p className="order-phone">{order.phone}</p>
                    </div>

                    <div className="order-items">
                      <strong>Items:</strong>
                      <ul>
                        {order.items.map((item, idx) => (
                          <li key={idx}>{item}</li>
                        ))}
                      </ul>
                    </div>

                    <div className="order-address">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                        <circle cx="12" cy="10" r="3"></circle>
                      </svg>
                      <span>{order.address}</span>
                    </div>

                    {order.estimatedTime && order.status !== 'delivered' && (
                      <div className="order-eta">
                        <span>Estimasi: {order.estimatedTime}</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {filteredOrders.length === 0 && (
              <div className="no-orders">
                <p>Tidak ada pesanan ditemukan</p>
              </div>
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
          <span>© 2025 VSCAFF.FOOD GROUP</span>
          <span>DESIGNED BY MAMAD RPL4</span>
          <span>IG / TW / TK</span>
        </div>
      </footer>

      <CurvedMenu />
    </>
  );
}
