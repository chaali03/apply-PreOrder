"use client";

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import '../dashboard-new.css';
import './orders.css';

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

export default function DashboardOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [orderToDelete, setOrderToDelete] = useState<Order | null>(null);
  const [showNotification, setShowNotification] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [orderToCancel, setOrderToCancel] = useState<Order | null>(null);
  const [cancellationReason, setCancellationReason] = useState("");
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [orderToComplete, setOrderToComplete] = useState<Order | null>(null);
  const [deliveryPhoto, setDeliveryPhoto] = useState<string>("");
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const response = await fetch('http://localhost:8080/api/orders');
      const data = await response.json();
      
      if (data.success) {
        setOrders(data.data || []);
      } else {
        showNotif('Gagal memuat pesanan');
        setOrders([]);
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
      showNotif('Gagal terhubung ke server');
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const showNotif = (message: string) => {
    setNotificationMessage(message);
    setShowNotification(true);
    setTimeout(() => setShowNotification(false), 3000);
  };

  const handleStatusUpdate = async (orderId: string, newStatus: string) => {
    // If status is cancelled/dibatalkan, show cancellation reason modal
    if (newStatus === 'cancelled' || newStatus === 'dibatalkan') {
      const order = orders.find(o => o.id === orderId);
      if (order) {
        setOrderToCancel(order);
        setShowCancelModal(true);
      }
      return;
    }

    // If status is completed, show photo upload modal
    if (newStatus === 'completed') {
      const order = orders.find(o => o.id === orderId);
      if (order) {
        setOrderToComplete(order);
        setShowPhotoModal(true);
      }
      return;
    }

    try {
      const response = await fetch(`http://localhost:8080/api/orders/${orderId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });

      const data = await response.json();

      if (data.success) {
        // Update local state
        setOrders(orders.map(order => 
          order.id === orderId ? { ...order, order_status: newStatus } : order
        ));
        showNotif('Status pesanan berhasil diupdate');
      } else {
        showNotif('Gagal mengupdate status');
      }
    } catch (error) {
      console.error('Error updating status:', error);
      showNotif('Gagal terhubung ke server');
    }
  };

  const handleCancelOrder = async () => {
    if (!orderToCancel || !cancellationReason.trim()) {
      showNotif('Alasan pembatalan harus diisi');
      return;
    }

    try {
      const response = await fetch(`http://localhost:8080/api/orders/${orderToCancel.id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          status: 'cancelled',
          cancellation_reason: cancellationReason 
        })
      });

      const data = await response.json();

      if (data.success) {
        // Update local state
        setOrders(orders.map(order => 
          order.id === orderToCancel.id ? { 
            ...order, 
            order_status: 'cancelled',
            cancellation_reason: cancellationReason,
            cancelled_at: new Date().toISOString()
          } : order
        ));
        showNotif(`Pesanan ${orderToCancel.order_number} dibatalkan`);
        setShowCancelModal(false);
        setOrderToCancel(null);
        setCancellationReason('');
      } else {
        showNotif(data.message || 'Gagal membatalkan pesanan');
      }
    } catch (error) {
      console.error('Error cancelling order:', error);
      showNotif('Gagal terhubung ke server');
    }
  };

  const handlePhotoCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      showNotif('File harus berupa gambar');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      showNotif('Ukuran file maksimal 5MB');
      return;
    }

    setUploadingPhoto(true);

    const reader = new FileReader();
    reader.onloadend = () => {
      setDeliveryPhoto(reader.result as string);
      setUploadingPhoto(false);
    };
    reader.onerror = () => {
      showNotif('Gagal membaca file');
      setUploadingPhoto(false);
    };
    reader.readAsDataURL(file);
  };

  const handleCompleteOrder = async () => {
    if (!orderToComplete) return;

    if (!deliveryPhoto) {
      showNotif('Foto dokumentasi harus diupload');
      return;
    }

    try {
      const response = await fetch(`http://localhost:8080/api/orders/${orderToComplete.id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          status: 'completed',
          delivery_photo: deliveryPhoto
        })
      });

      const data = await response.json();

      if (data.success) {
        // Update local state
        setOrders(orders.map(order => 
          order.id === orderToComplete.id ? { 
            ...order, 
            order_status: 'completed',
            delivery_photo: deliveryPhoto
          } : order
        ));
        showNotif(`Pesanan ${orderToComplete.order_number} selesai`);
        setShowPhotoModal(false);
        setOrderToComplete(null);
        setDeliveryPhoto('');
      } else {
        showNotif(data.message || 'Gagal menyelesaikan pesanan');
      }
    } catch (error) {
      console.error('Error completing order:', error);
      showNotif('Gagal terhubung ke server');
    }
  };

  const handleDeleteOrder = async () => {
    if (!orderToDelete) return;

    try {
      const response = await fetch(`http://localhost:8080/api/orders/${orderToDelete.id}`, {
        method: 'DELETE'
      });

      const data = await response.json();

      if (data.success) {
        setOrders(orders.filter(order => order.id !== orderToDelete.id));
        showNotif(`Pesanan ${orderToDelete.order_number} berhasil dihapus`);
        setShowDeleteModal(false);
        setOrderToDelete(null);
      } else {
        showNotif('Gagal menghapus pesanan');
      }
    } catch (error) {
      console.error('Error deleting order:', error);
      showNotif('Gagal terhubung ke server');
    }
  };

  const filteredOrders = (orders || []).filter(order => {
    const matchesSearch = 
      order.order_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.customer_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.customer_email.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = selectedStatus === "all" || order.order_status === selectedStatus;
    
    return matchesSearch && matchesStatus;
  });

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
          <a href="/dashboard" className="dash-nav-item">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="7" height="7"></rect>
              <rect x="14" y="3" width="7" height="7"></rect>
              <rect x="14" y="14" width="7" height="7"></rect>
              <rect x="3" y="14" width="7" height="7"></rect>
            </svg>
            <span>Dashboard</span>
          </a>

          <a href="/dashboard/orders" className="dash-nav-item dash-nav-item-active">
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
            <h1 className="dash-title">Pesananku</h1>
          </div>
        </header>

        {/* Content */}
        <div className="dash-content">
          <div className="dashboard-orders-container">
            <header className="dashboard-orders-header">
              <div className="header-controls">
                <div className="search-box">
                  <svg className="search-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="11" cy="11" r="8"></circle>
                    <path d="m21 21-4.35-4.35"></path>
                  </svg>
                  <input
                    type="text"
                    placeholder="Cari nomor pesanan, nama, atau email..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="search-input"
                  />
                </div>

                <div className="status-filters">
                  <button
                    onClick={() => setSelectedStatus("all")}
                    className={`filter-btn ${selectedStatus === "all" ? 'active' : ''}`}
                  >
                    Semua ({orders.length})
                  </button>
                  <button
                    onClick={() => setSelectedStatus("pending")}
                    className={`filter-btn ${selectedStatus === "pending" ? 'active' : ''}`}
                  >
                    Menunggu
                  </button>
                  <button
                    onClick={() => setSelectedStatus("processing")}
                    className={`filter-btn ${selectedStatus === "processing" ? 'active' : ''}`}
                  >
                    Diproses
                  </button>
                  <button
                    onClick={() => setSelectedStatus("on_delivery")}
                    className={`filter-btn ${selectedStatus === "on_delivery" ? 'active' : ''}`}
                  >
                    Diantar
                  </button>
                  <button
                    onClick={() => setSelectedStatus("completed")}
                    className={`filter-btn ${selectedStatus === "completed" ? 'active' : ''}`}
                  >
                    Selesai
                  </button>
                  <button
                    onClick={() => setSelectedStatus("cancelled")}
                    className={`filter-btn ${selectedStatus === "cancelled" ? 'active' : ''}`}
                  >
                    Dibatalkan
                  </button>
                </div>
              </div>
            </header>

            <main className="dashboard-orders-content">
        {loading ? (
          <div className="loading-state">
            <p>Memuat pesanan...</p>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="empty-state">
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="9" cy="21" r="1"></circle>
              <circle cx="20" cy="21" r="1"></circle>
              <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
            </svg>
            <p>Tidak ada pesanan ditemukan</p>
          </div>
        ) : (
          <div className="orders-grid">
            {filteredOrders.map((order) => {
              const statusInfo = getStatusInfo(order.order_status);
              return (
                <div key={order.id} className="order-card">
                  <div className="order-card-header">
                    <div className="order-number-section">
                      <h3 className="order-number">{order.order_number}</h3>
                      <span className="order-date">{formatDate(order.created_at)}</span>
                    </div>
                    <div 
                      className="order-status-badge" 
                      style={{ 
                        backgroundColor: statusInfo.bgColor,
                        color: statusInfo.color,
                        border: `2px solid ${statusInfo.color}`
                      }}
                    >
                      {statusInfo.label}
                    </div>
                  </div>

                  <div className="order-card-body">
                    <div className="customer-info">
                      <div className="info-row">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                          <circle cx="12" cy="7" r="4"></circle>
                        </svg>
                        <span>{order.customer_name}</span>
                      </div>
                      <div className="info-row">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                          <polyline points="22,6 12,13 2,6"></polyline>
                        </svg>
                        <span>{order.customer_email}</span>
                      </div>
                      <div className="info-row">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
                        </svg>
                        <span>{order.customer_phone}</span>
                      </div>
                    </div>

                    <div className="order-items-section">
                      <strong>Items:</strong>
                      <ul className="items-list">
                        {order.items.map((item) => (
                          <li key={item.id}>
                            {item.product_name} x{item.quantity} - Rp {item.subtotal.toLocaleString()}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="order-total-section">
                      <div className="total-row">
                        <span>Subtotal:</span>
                        <span>Rp {order.subtotal.toLocaleString()}</span>
                      </div>
                      <div className="total-row total-final">
                        <strong>Total:</strong>
                        <strong>Rp {order.total.toLocaleString()}</strong>
                      </div>
                    </div>

                    <div className="order-address-section">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                        <circle cx="12" cy="10" r="3"></circle>
                      </svg>
                      <span>{order.delivery_address}</span>
                    </div>
                  </div>

                  <div className="order-card-footer">
                    <select
                      value={order.order_status}
                      onChange={(e) => handleStatusUpdate(order.id, e.target.value)}
                      className="status-select"
                      disabled={order.order_status === 'completed' || order.order_status === 'cancelled'}
                    >
                      <option value="pending">Menunggu</option>
                      <option value="processing">Diproses</option>
                      <option value="on_delivery">Diantar</option>
                      <option value="completed">Selesai</option>
                      <option value="cancelled">Dibatalkan</option>
                    </select>

                    <button
                      onClick={() => {
                        setOrderToDelete(order);
                        setShowDeleteModal(true);
                      }}
                      className="delete-btn"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="3 6 5 6 21 6"></polyline>
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                      </svg>
                      Hapus
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {showDeleteModal && orderToDelete && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="modal-overlay"
            onClick={() => setShowDeleteModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="delete-modal"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setShowDeleteModal(false)}
                className="modal-close-btn"
              >
                ×
              </button>

              <div className="modal-icon-warning">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                  <line x1="12" y1="9" x2="12" y2="13"></line>
                  <line x1="12" y1="17" x2="12.01" y2="17"></line>
                </svg>
              </div>

              <h2 className="modal-title">Hapus Pesanan?</h2>
              <p className="modal-message">
                Apakah Anda yakin ingin menghapus pesanan <strong>{orderToDelete.order_number}</strong>?
              </p>

              <div className="modal-order-info">
                <p><strong>Customer:</strong> {orderToDelete.customer_name}</p>
                <p><strong>Total:</strong> Rp {orderToDelete.total.toLocaleString()}</p>
                <p><strong>Items:</strong> {orderToDelete.items.length} produk</p>
              </div>

              <p className="modal-warning">
                ⚠️ Tindakan ini tidak dapat dibatalkan!
              </p>

              <div className="modal-actions">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="modal-btn-cancel"
                >
                  Batal
                </button>
                <button
                  onClick={handleDeleteOrder}
                  className="modal-btn-delete"
                >
                  Ya, Hapus Pesanan
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Cancel Order Modal */}
      <AnimatePresence>
        {showCancelModal && orderToCancel && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="modal-overlay"
            onClick={() => {
              setShowCancelModal(false);
              setCancellationReason('');
            }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="delete-modal"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => {
                  setShowCancelModal(false);
                  setCancellationReason('');
                }}
                className="modal-close-btn"
              >
                ×
              </button>

              <div className="modal-icon-warning">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"></circle>
                  <line x1="15" y1="9" x2="9" y2="15"></line>
                  <line x1="9" y1="9" x2="15" y2="15"></line>
                </svg>
              </div>

              <h2 className="modal-title">Batalkan Pesanan</h2>
              <p className="modal-message">
                Pesanan <strong>{orderToCancel.order_number}</strong> akan dibatalkan
              </p>

              <div className="modal-order-info">
                <p><strong>Customer:</strong> {orderToCancel.customer_name}</p>
                <p><strong>Total:</strong> Rp {orderToCancel.total.toLocaleString()}</p>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontWeight: 700, marginBottom: '8px', fontSize: '14px' }}>
                  Alasan Pembatalan *
                </label>
                <textarea
                  value={cancellationReason}
                  onChange={(e) => setCancellationReason(e.target.value)}
                  placeholder="Contoh: Stok habis, Customer request, dll..."
                  style={{
                    width: '100%',
                    minHeight: '100px',
                    padding: '12px',
                    border: '2px solid #1a1a1a',
                    fontSize: '14px',
                    fontFamily: 'inherit',
                    resize: 'vertical'
                  }}
                  required
                />
              </div>

              <p className="modal-warning">
                Alasan akan ditampilkan ke customer dan pesanan akan otomatis terhapus setelah 24 jam
              </p>

              <div className="modal-actions">
                <button
                  onClick={() => {
                    setShowCancelModal(false);
                    setCancellationReason('');
                  }}
                  className="modal-btn-cancel"
                >
                  Batal
                </button>
                <button
                  onClick={handleCancelOrder}
                  className="modal-btn-delete"
                  disabled={!cancellationReason.trim()}
                  style={{ opacity: cancellationReason.trim() ? 1 : 0.5 }}
                >
                  Ya, Batalkan Pesanan
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Photo Upload Modal */}
      <AnimatePresence>
        {showPhotoModal && orderToComplete && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="modal-overlay"
            onClick={() => {
              setShowPhotoModal(false);
              setDeliveryPhoto('');
            }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="delete-modal"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => {
                  setShowPhotoModal(false);
                  setDeliveryPhoto('');
                }}
                className="modal-close-btn"
              >
                ×
              </button>

              <div className="modal-icon-success">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                  <circle cx="8.5" cy="8.5" r="1.5"></circle>
                  <polyline points="21 15 16 10 5 21"></polyline>
                </svg>
              </div>

              <h2 className="modal-title">Dokumentasi Pengiriman</h2>
              <p className="modal-message">
                Upload foto bukti pengiriman untuk pesanan <strong>{orderToComplete.order_number}</strong>
              </p>

              <div className="modal-order-info">
                <p><strong>Customer:</strong> {orderToComplete.customer_name}</p>
                <p><strong>Alamat:</strong> {orderToComplete.delivery_address}</p>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label 
                  htmlFor="photo-upload"
                  style={{ 
                    display: 'block', 
                    width: '100%',
                    padding: '40px 20px',
                    border: '2px dashed #1a1a1a',
                    textAlign: 'center',
                    cursor: 'pointer',
                    backgroundColor: deliveryPhoto ? '#f0f0f0' : 'white',
                    position: 'relative',
                    overflow: 'hidden'
                  }}
                >
                  {uploadingPhoto ? (
                    <div>Memproses foto...</div>
                  ) : deliveryPhoto ? (
                    <div>
                      <img 
                        src={deliveryPhoto} 
                        alt="Preview" 
                        style={{ 
                          maxWidth: '100%', 
                          maxHeight: '200px',
                          objectFit: 'contain'
                        }} 
                      />
                      <p style={{ marginTop: '10px', fontSize: '14px', color: '#666' }}>
                        Klik untuk ganti foto
                      </p>
                    </div>
                  ) : (
                    <div>
                      <svg 
                        width="48" 
                        height="48" 
                        viewBox="0 0 24 24" 
                        fill="none" 
                        stroke="currentColor" 
                        strokeWidth="2"
                        style={{ margin: '0 auto 10px' }}
                      >
                        <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                        <circle cx="8.5" cy="8.5" r="1.5"></circle>
                        <polyline points="21 15 16 10 5 21"></polyline>
                      </svg>
                      <p style={{ fontWeight: 600, marginBottom: '5px' }}>
                        Klik untuk upload foto
                      </p>
                      <p style={{ fontSize: '12px', color: '#666' }}>
                        Atau ambil foto menggunakan kamera
                      </p>
                      <p style={{ fontSize: '12px', color: '#999', marginTop: '5px' }}>
                        Max 5MB • JPG, PNG
                      </p>
                    </div>
                  )}
                  <input
                    id="photo-upload"
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={handlePhotoCapture}
                    style={{ display: 'none' }}
                  />
                </label>
              </div>

              <p className="modal-warning">
                Foto akan disimpan sebagai bukti pengiriman dan dapat dilihat oleh customer
              </p>

              <div className="modal-actions">
                <button
                  onClick={() => {
                    setShowPhotoModal(false);
                    setDeliveryPhoto('');
                  }}
                  className="modal-btn-cancel"
                >
                  Batal
                </button>
                <button
                  onClick={handleCompleteOrder}
                  className="modal-btn-confirm"
                  disabled={!deliveryPhoto || uploadingPhoto}
                  style={{ opacity: (deliveryPhoto && !uploadingPhoto) ? 1 : 0.5 }}
                >
                  Selesaikan Pesanan
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

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
        </div>
      </div>
    </div>
  );
}
