"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Spinner } from "../../components/ui/ios-spinner";
import './dashboard-new.css';

interface DashboardStats {
  total_customers: number;
  total_orders: number;
  total_revenue: number;
  active_orders: number;
  customer_growth: number;
  order_growth: number;
  revenue_growth: number;
  active_orders_list: Order[];
}

interface Order {
  id: string;
  order_number: string;
  customer_name: string;
  customer_phone: string;
  total: number;
  order_status: string;
  created_at: string;
}

export default function DashboardPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch dashboard stats
  useEffect(() => {
    fetch('http://localhost:8080/api/dashboard/stats')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setStats(data.data);
        }
        setLoading(false);
      })
      .catch(error => {
        console.error('Error fetching dashboard stats:', error);
        setLoading(false);
      });
  }, []);

  // Format currency
  const formatCurrency = (amount: number) => {
    if (amount >= 1000000) {
      return `${(amount / 1000000).toFixed(1)}M`;
    } else if (amount >= 1000) {
      return `${(amount / 1000).toFixed(1)}K`;
    }
    return amount.toLocaleString();
  };

  // Format growth percentage
  const formatGrowth = (growth: number) => {
    const sign = growth >= 0 ? '+' : '';
    return `${sign}${growth.toFixed(1)}%`;
  };

  // Get status info
  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'pending':
        return { label: 'Menunggu', color: '#999', bgColor: '#f3f4f6' };
      case 'processing':
        return { label: 'Diproses', color: '#f59e0b', bgColor: '#fef3c7' };
      case 'on_delivery':
        return { label: 'Diantar', color: '#8b5cf6', bgColor: '#ede9fe' };
      case 'completed':
        return { label: 'Selesai', color: '#34C759', bgColor: '#d1fae5' };
      case 'cancelled':
        return { label: 'Dibatalkan', color: '#FF3B30', bgColor: '#fee2e2' };
      default:
        return { label: status, color: '#999', bgColor: '#f3f4f6' };
    }
  };

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('id-ID', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="dash-container">
      {/* Sidebar Overlay */}
      {sidebarOpen && (
        <div 
          className="dash-sidebar-overlay" 
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`dash-sidebar ${sidebarOpen ? 'dash-sidebar-open' : ''}`}>
        <div className="dash-sidebar-header">
          <div className="dash-logo-text">SCAFF*FOOD</div>
          <button 
            className="dash-sidebar-close"
            onClick={() => setSidebarOpen(false)}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        <nav className="dash-sidebar-nav">
          <a href="/dashboard" className="dash-nav-item dash-nav-item-active">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="7" height="7"></rect>
              <rect x="14" y="3" width="7" height="7"></rect>
              <rect x="14" y="14" width="7" height="7"></rect>
              <rect x="3" y="14" width="7" height="7"></rect>
            </svg>
            <span>Dashboard</span>
          </a>

          <a href="/dashboard/orders" className="dash-nav-item">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="9" cy="21" r="1"></circle>
              <circle cx="20" cy="21" r="1"></circle>
              <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
            </svg>
            <span>Pesanan</span>
          </a>

          <a href="/dashboard/menu" className="dash-nav-item">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="3" y1="12" x2="21" y2="12"></line>
              <line x1="3" y1="6" x2="21" y2="6"></line>
              <line x1="3" y1="18" x2="21" y2="18"></line>
            </svg>
            <span>Menu</span>
          </a>

          <a href="/dashboard/laporan" className="dash-nav-item">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="20" x2="18" y2="10"></line>
              <line x1="12" y1="20" x2="12" y2="4"></line>
              <line x1="6" y1="20" x2="6" y2="14"></line>
            </svg>
            <span>Laporan</span>
          </a>

          <a href="/dashboard/qris" className="dash-nav-item">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="7" height="7"></rect>
              <rect x="14" y="3" width="7" height="7"></rect>
              <rect x="14" y="14" width="7" height="7"></rect>
              <rect x="3" y="14" width="7" height="7"></rect>
            </svg>
            <span>QRIS</span>
          </a>
        </nav>

        <div className="dash-sidebar-footer">
          <a href="/" className="dash-nav-item">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
              <polyline points="9 22 9 12 15 12 15 22"></polyline>
            </svg>
            <span>Ke Home</span>
          </a>
        </div>
      </aside>

      {/* Main Content */}
      <div className="dash-main">
        <header className="dash-header">
          <div className="dash-header-left">
            <button 
              className="dash-menu-toggle"
              onClick={() => setSidebarOpen(true)}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="3" y1="12" x2="21" y2="12"></line>
                <line x1="3" y1="6" x2="21" y2="6"></line>
                <line x1="3" y1="18" x2="21" y2="18"></line>
              </svg>
            </button>
            <h1 className="dash-title">Dashboard</h1>
          </div>
        </header>

        <div className="dash-content">
          {/* Stats Grid */}
          <div className="dash-stats-grid">
            {loading ? (
              <div style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '60px', flexDirection: 'column', gap: '20px' }}>
                <Spinner size="lg" />
                <p style={{ color: '#666', fontSize: '14px' }}>Memuat statistik...</p>
              </div>
            ) : stats ? (
              <>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="dash-stat-card"
                >
                  <div className="dash-stat-icon" style={{ background: '#bff000' }}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                      <circle cx="9" cy="7" r="4"></circle>
                      <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                      <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                    </svg>
                  </div>
                  <div className="dash-stat-content">
                    <p className="dash-stat-label">Total Pelanggan</p>
                    <h3 className="dash-stat-value">{stats.total_customers.toLocaleString()}</h3>
                    {stats.total_customers > 0 && stats.customer_growth !== 0 && (
                      <p className={`dash-stat-change ${stats.customer_growth >= 0 ? 'positive' : 'negative'}`}>
                        {formatGrowth(stats.customer_growth)}
                      </p>
                    )}
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="dash-stat-card"
                >
                  <div className="dash-stat-icon" style={{ background: '#FA5209' }}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="9" cy="21" r="1"></circle>
                      <circle cx="20" cy="21" r="1"></circle>
                      <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
                    </svg>
                  </div>
                  <div className="dash-stat-content">
                    <p className="dash-stat-label">Total Pesanan</p>
                    <h3 className="dash-stat-value">{stats.total_orders.toLocaleString()}</h3>
                    {stats.total_orders > 0 && stats.order_growth !== 0 && (
                      <p className={`dash-stat-change ${stats.order_growth >= 0 ? 'positive' : 'negative'}`}>
                        {formatGrowth(stats.order_growth)}
                      </p>
                    )}
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="dash-stat-card"
                >
                  <div className="dash-stat-icon" style={{ background: '#3b82f6' }}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <line x1="12" y1="1" x2="12" y2="23"></line>
                      <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
                    </svg>
                  </div>
                  <div className="dash-stat-content">
                    <p className="dash-stat-label">Pendapatan</p>
                    <h3 className="dash-stat-value">Rp {formatCurrency(stats.total_revenue)}</h3>
                    {stats.total_revenue > 0 && stats.revenue_growth !== 0 && (
                      <p className={`dash-stat-change ${stats.revenue_growth >= 0 ? 'positive' : 'negative'}`}>
                        {formatGrowth(stats.revenue_growth)}
                      </p>
                    )}
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="dash-stat-card"
                >
                  <div className="dash-stat-icon" style={{ background: '#10b981' }}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
                    </svg>
                  </div>
                  <div className="dash-stat-content">
                    <p className="dash-stat-label">Pesanan Aktif</p>
                    <h3 className="dash-stat-value">{stats.active_orders}</h3>
                    <p className="dash-stat-change neutral">Diproses</p>
                  </div>
                </motion.div>
              </>
            ) : (
              <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '60px', color: '#666' }}>
                <p>Gagal memuat data. Pastikan backend API running.</p>
              </div>
            )}
          </div>

          {/* Recent Orders */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="dash-section"
          >
            <div className="dash-section-header">
              <h2 className="dash-section-title">Pesanan Terbaru</h2>
              <a href="/dashboard/orders" className="dash-view-all">Lihat Semua →</a>
            </div>
            
            <div className="dash-table-wrapper">
              {loading ? (
                <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
                  <Spinner size="lg" />
                </div>
              ) : stats && stats.active_orders_list && stats.active_orders_list.length > 0 ? (
                <table className="dash-table">
                  <thead>
                    <tr>
                      <th>No. Pesanan</th>
                      <th>Pelanggan</th>
                      <th className="dash-hide-mobile">Telepon</th>
                      <th>Total</th>
                      <th>Status</th>
                      <th className="dash-hide-mobile">Waktu</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.active_orders_list.slice(0, 5).map((order) => {
                      const statusInfo = getStatusInfo(order.order_status);
                      return (
                        <tr key={order.id}>
                          <td>
                            <a href={`/dashboard/orders`} style={{ color: '#ff4d00', fontWeight: 700, textDecoration: 'none' }}>
                              {order.order_number}
                            </a>
                          </td>
                          <td>{order.customer_name}</td>
                          <td className="dash-hide-mobile">{order.customer_phone}</td>
                          <td style={{ fontWeight: 700 }}>Rp {order.total.toLocaleString()}</td>
                          <td>
                            <span 
                              className="status-badge"
                              style={{ 
                                backgroundColor: statusInfo.bgColor,
                                color: statusInfo.color,
                                padding: '4px 12px',
                                borderRadius: '4px',
                                fontSize: '12px',
                                fontWeight: 700,
                                border: `2px solid ${statusInfo.color}`
                              }}
                            >
                              {statusInfo.label}
                            </span>
                          </td>
                          <td className="dash-hide-mobile" style={{ fontSize: '13px', color: '#666' }}>
                            {formatDate(order.created_at)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              ) : (
                <div style={{ textAlign: 'center', padding: '40px', color: '#666', background: '#f9f9f9', border: '3px solid #000' }}>
                  <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ margin: '0 auto 20px', opacity: 0.3 }}>
                    <circle cx="9" cy="21" r="1"></circle>
                    <circle cx="20" cy="21" r="1"></circle>
                    <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
                  </svg>
                  <p style={{ fontSize: '16px', fontWeight: 700, marginBottom: '8px' }}>Belum Ada Pesanan</p>
                  <p style={{ fontSize: '14px' }}>Data pesanan akan muncul setelah ada transaksi dari customer.</p>
                </div>
              )}
            </div>
          </motion.div>

          {/* Quick Actions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="dash-section"
          >
            <h2 className="dash-section-title">Aksi Cepat</h2>
            <div className="dash-quick-actions">
              <Link href="/dashboard/menu" className="dash-quick-card">
                <div className="dash-quick-icon" style={{ background: '#bff000' }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="12" y1="5" x2="12" y2="19"></line>
                    <line x1="5" y1="12" x2="19" y2="12"></line>
                  </svg>
                </div>
                <span>Tambah Menu</span>
              </Link>

              <Link href="/dashboard/menu" className="dash-quick-card">
                <div className="dash-quick-icon" style={{ background: '#FA5209' }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect>
                    <line x1="1" y1="10" x2="23" y2="10"></line>
                  </svg>
                </div>
                <span>Lihat Stock</span>
              </Link>

              <Link href="/dashboard/orders" className="dash-quick-card">
                <div className="dash-quick-icon" style={{ background: '#3b82f6' }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path>
                    <line x1="3" y1="6" x2="21" y2="6"></line>
                    <path d="M16 10a4 4 0 0 1-8 0"></path>
                  </svg>
                </div>
                <span>Lihat Pesanan</span>
              </Link>

              <Link href="/dashboard/laporan" className="dash-quick-card">
                <div className="dash-quick-icon" style={{ background: '#10b981' }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="18" y1="20" x2="18" y2="10"></line>
                    <line x1="12" y1="20" x2="12" y2="4"></line>
                    <line x1="6" y1="20" x2="6" y2="14"></line>
                  </svg>
                </div>
                <span>Lihat Laporan</span>
              </Link>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
