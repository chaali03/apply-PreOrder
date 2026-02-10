"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Spinner } from "../../../components/ui/ios-spinner";
import "../dashboard-new.css";
import "./menu.css";

interface Product {
  id: string;
  name: string;
  short_description: string;
  description: string;
  price: number;
  category: string;
  tag: string;
  tag_color: string;
  image_url_1: string;
  image_url_2: string;
  image_url_3: string;
  stock: number;
  is_available: boolean;
}

export default function DashboardMenuPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState<"add" | "edit">("add");
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [uploading, setUploading] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [notification, setNotification] = useState<{show: boolean, message: string, type: 'success' | 'error'}>({
    show: false,
    message: '',
    type: 'success'
  });

  const [formData, setFormData] = useState({
    name: "",
    short_description: "",
    description: "",
    price: 0,
    category: "Snack",
    tag: "",
    tag_color: "#FF6B35",
    image_url_1: "",
    image_url_2: "",
    image_url_3: "",
    is_available: true
  });

  // Fetch products
  const fetchProducts = (showLoading = true) => {
    if (showLoading) {
      setLoading(true);
    }
    fetch('http://localhost:8080/api/admin/products')
      .then(res => res.json())
      .then(data => {
        console.log('Fetched products:', data);
        if (data.success) {
          setProducts(data.data);
        }
        if (showLoading) {
          setLoading(false);
        }
      })
      .catch(error => {
        console.error('Error fetching products:', error);
        if (showLoading) {
          setLoading(false);
        }
      });
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const showNotification = (message: string, type: 'success' | 'error' = 'success') => {
    setNotification({ show: true, message, type });
    setTimeout(() => {
      setNotification({ show: false, message: '', type: 'success' });
    }, 3000);
  };

  const handleCategoryChange = (category: string) => {
    const currentCategories = formData.category ? formData.category.split(', ') : [];
    
    if (currentCategories.includes(category)) {
      // Remove category
      const newCategories = currentCategories.filter(c => c !== category);
      setFormData({...formData, category: newCategories.join(', ')});
    } else {
      // Add category
      const newCategories = [...currentCategories, category];
      setFormData({...formData, category: newCategories.join(', ')});
    }
  };

  const isCategorySelected = (category: string) => {
    const currentCategories = formData.category ? formData.category.split(', ') : [];
    return currentCategories.includes(category);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, imageNumber: 1 | 2 | 3) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      showNotification('File harus berupa gambar', 'error');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      showNotification('Ukuran file maksimal 5MB', 'error');
      return;
    }

    setUploading(true);

    try {
      const formData = new FormData();
      formData.append('image', file);

      const response = await fetch('http://localhost:8080/api/upload', {
        method: 'POST',
        body: formData
      });

      const data = await response.json();

      if (data.success) {
        // Update form data with uploaded image URL
        const imageKey = `image_url_${imageNumber}` as 'image_url_1' | 'image_url_2' | 'image_url_3';
        setFormData(prev => ({
          ...prev,
          [imageKey]: data.url
        }));
        showNotification('Gambar berhasil diupload', 'success');
      } else {
        showNotification(data.message || 'Gagal upload gambar', 'error');
      }
    } catch (error) {
      console.error('Upload error:', error);
      showNotification('Gagal upload gambar', 'error');
    } finally {
      setUploading(false);
    }
  };

  const handleAddProduct = () => {
    setModalMode("add");
    setFormData({
      name: "",
      short_description: "",
      description: "",
      price: 0,
      category: "Snack",
      tag: "",
      tag_color: "#FF6B35",
      image_url_1: "",
      image_url_2: "",
      image_url_3: "",
      is_available: true
    });
    setShowModal(true);
  };

  const handleEditProduct = (product: Product) => {
    setModalMode("edit");
    setSelectedProduct(product);
    setFormData({
      name: product.name,
      short_description: product.short_description,
      description: product.description,
      price: product.price,
      category: product.category,
      tag: product.tag,
      tag_color: product.tag_color,
      image_url_1: product.image_url_1,
      image_url_2: product.image_url_2,
      image_url_3: product.image_url_3,
      is_available: product.is_available
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate at least one category is selected
    if (!formData.category || formData.category.trim() === '') {
      showNotification('Pilih minimal 1 kategori', 'error');
      return;
    }
    
    const url = modalMode === "add" 
      ? 'http://localhost:8080/api/admin/products'
      : `http://localhost:8080/api/admin/products/${selectedProduct?.id}`;
    
    const method = modalMode === "add" ? 'POST' : 'PUT';

    try {
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await response.json();
      
      if (data.success) {
        showNotification(data.message, 'success');
        setShowModal(false);
        fetchProducts();
      } else {
        showNotification(data.message || 'Gagal menyimpan produk', 'error');
      }
    } catch (error) {
      showNotification('Gagal terhubung ke server', 'error');
    }
  };

  const handleDelete = async (product: Product) => {
    // Show confirmation modal
    setProductToDelete(product);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    if (!productToDelete) return;

    try {
      const response = await fetch(`http://localhost:8080/api/admin/products/${productToDelete.id}`, {
        method: 'DELETE'
      });

      const data = await response.json();
      
      if (data.success) {
        showNotification(`Produk "${productToDelete.name}" berhasil dihapus`, 'success');
        fetchProducts();
      } else {
        showNotification(data.message || 'Gagal menghapus produk', 'error');
      }
    } catch (error) {
      showNotification('Gagal terhubung ke server', 'error');
    } finally {
      setShowDeleteConfirm(false);
      setProductToDelete(null);
    }
  };

  const cancelDelete = () => {
    setShowDeleteConfirm(false);
    setProductToDelete(null);
  };

  const handleToggleAvailability = async (product: Product) => {
    try {
      console.log('Toggling product:', product.id, 'Current availability:', product.is_available);
      
      const response = await fetch(`http://localhost:8080/api/admin/products/${product.id}/toggle`, {
        method: 'PATCH'
      });

      const data = await response.json();
      
      console.log('Toggle response:', data);
      
      if (data.success) {
        showNotification(
          product.is_available ? 'Produk ditandai HABIS' : 'Produk ditandai TERSEDIA',
          'success'
        );
        
        // Update local state immediately with the returned data
        setProducts(prevProducts => 
          prevProducts.map(p => 
            p.id === product.id ? data.data : p
          )
        );
        
        console.log('Updated product:', data.data);
        console.log('New is_available:', data.data.is_available);
      } else {
        showNotification(data.message || 'Gagal mengubah status', 'error');
      }
    } catch (error) {
      console.error('Toggle error:', error);
      showNotification('Gagal terhubung ke server', 'error');
    }
  };

  return (
    <div className="dash-container">
      {/* Notification */}
      <AnimatePresence>
        {notification.show && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className={`notification ${notification.type}`}
          >
            <div className="notification-icon">
              {notification.type === 'success' ? (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
              ) : (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <circle cx="12" cy="12" r="10"></circle>
                  <line x1="12" y1="8" x2="12" y2="12"></line>
                  <line x1="12" y1="16" x2="12.01" y2="16"></line>
                </svg>
              )}
            </div>
            <p className="notification-message">{notification.message}</p>
            <button 
              className="notification-close"
              onClick={() => setNotification({ show: false, message: '', type: 'success' })}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

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

          <a href="/dashboard/orders" className="dash-nav-item">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="9" cy="21" r="1"></circle>
              <circle cx="20" cy="21" r="1"></circle>
              <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
            </svg>
            <span>Pesanan</span>
          </a>

          <a href="/dashboard/menu" className="dash-nav-item dash-nav-item-active">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="3" y1="12" x2="21" y2="12"></line>
              <line x1="3" y1="6" x2="21" y2="6"></line>
              <line x1="3" y1="18" x2="21" y2="18"></line>
            </svg>
            <span>Menu</span>
          </a>

          <a href="/dashboard/reports" className="dash-nav-item">
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
            <h1 className="dash-title">Kelola Menu</h1>
          </div>
          <button className="btn-add-product" onClick={handleAddProduct}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
            Tambah Produk
          </button>
        </header>

        <div className="dash-content">
          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px', flexDirection: 'column', gap: '20px' }}>
              <Spinner size="lg" />
              <p style={{ color: '#666' }}>Memuat produk...</p>
            </div>
          ) : products.length === 0 ? (
            <div className="empty-state">
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="3" y1="12" x2="21" y2="12"></line>
                <line x1="3" y1="6" x2="21" y2="6"></line>
                <line x1="3" y1="18" x2="21" y2="18"></line>
              </svg>
              <h3>Belum Ada Produk</h3>
              <p>Klik tombol "Tambah Produk" untuk menambahkan menu baru</p>
            </div>
          ) : (
            <div className="products-grid-admin">
              {products.map((product) => {
                console.log(`Rendering ${product.name}: is_available=${product.is_available}, button should be: ${product.is_available ? 'Tandai Habis (red)' : 'Restock (green)'}`);
                return (
                  <motion.div
                    key={product.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`product-card-admin ${!product.is_available ? 'product-unavailable' : ''}`}
                  >
                  {!product.is_available && (
                    <div className="sold-out-badge">HABIS</div>
                  )}
                  <div className="product-image-wrapper">
                    <img 
                      src={product.image_url_1 || '/produk/placeholder.svg'} 
                      alt={product.name}
                      className="product-image-admin"
                    />
                    <span className="product-tag-admin" style={{ background: product.tag_color }}>
                      {product.tag}
                    </span>
                  </div>
                  <div className="product-info-admin">
                    <div className="product-header-admin">
                      <h3 className="product-name-admin">{product.name}</h3>
                      <span className="product-category-admin">{product.category}</span>
                    </div>
                    <p className="product-desc-admin">{product.short_description}</p>
                    <div className="product-meta-admin">
                      <span className="product-price-admin">Rp {product.price.toLocaleString()}</span>
                      <span className={`product-status-admin ${product.is_available ? 'status-available' : 'status-unavailable'}`}>
                        {product.is_available ? 'Tersedia' : 'Habis'}
                      </span>
                    </div>
                    <div className="product-actions-admin">
                      <button 
                        className={`btn-stock-admin ${!product.is_available ? 'btn-restock' : 'btn-mark-sold'}`}
                        onClick={() => handleToggleAvailability(product)}
                      >
                        {product.is_available ? (
                          <>
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <line x1="18" y1="6" x2="6" y2="18"></line>
                              <line x1="6" y1="6" x2="18" y2="18"></line>
                            </svg>
                            Tandai Habis
                          </>
                        ) : (
                          <>
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
                              <polyline points="7.5 4.21 12 6.81 16.5 4.21"></polyline>
                              <polyline points="7.5 19.79 7.5 14.6 3 12"></polyline>
                              <polyline points="21 12 16.5 14.6 16.5 19.79"></polyline>
                              <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
                              <line x1="12" y1="22.08" x2="12" y2="12"></line>
                            </svg>
                            Restock
                          </>
                        )}
                      </button>
                      <button 
                        className="btn-edit-admin"
                        onClick={() => handleEditProduct(product)}
                      >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                        </svg>
                      </button>
                      <button 
                        className="btn-delete-admin"
                        onClick={() => handleDelete(product)}
                      >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <polyline points="3 6 5 6 21 6"></polyline>
                          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                        </svg>
                      </button>
                    </div>
                  </div>
                </motion.div>
              );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Modal Add/Edit Product */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="modal-overlay"
            onClick={() => setShowModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="modal-content"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="modal-header">
                <h2>{modalMode === "add" ? "Tambah Produk Baru" : "Edit Produk"}</h2>
                <button className="modal-close" onClick={() => setShowModal(false)}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                  </svg>
                </button>
              </div>

              <form onSubmit={handleSubmit} className="modal-form">
                <div className="form-row">
                  <div className="form-group">
                    <label>Nama Produk *</label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      placeholder="Contoh: Cookies Original"
                    />
                  </div>

                  <div className="form-group">
                    <label>Harga (Rp) *</label>
                    <input
                      type="number"
                      required
                      min="0"
                      value={formData.price}
                      onChange={(e) => setFormData({...formData, price: Number(e.target.value)})}
                      placeholder="5000"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Kategori * (Pilih minimal 1)</label>
                  <div className="checkbox-group">
                    <label className="checkbox-label">
                      <input
                        type="checkbox"
                        checked={isCategorySelected('Snack')}
                        onChange={() => handleCategoryChange('Snack')}
                      />
                      <span className="checkbox-text">Snack</span>
                    </label>
                    <label className="checkbox-label">
                      <input
                        type="checkbox"
                        checked={isCategorySelected('Main Course')}
                        onChange={() => handleCategoryChange('Main Course')}
                      />
                      <span className="checkbox-text">Main Course</span>
                    </label>
                    <label className="checkbox-label">
                      <input
                        type="checkbox"
                        checked={isCategorySelected('Beverage')}
                        onChange={() => handleCategoryChange('Beverage')}
                      />
                      <span className="checkbox-text">Beverage</span>
                    </label>
                    <label className="checkbox-label">
                      <input
                        type="checkbox"
                        checked={isCategorySelected('Dessert')}
                        onChange={() => handleCategoryChange('Dessert')}
                      />
                      <span className="checkbox-text">Dessert</span>
                    </label>
                  </div>
                  {formData.category && (
                    <small style={{ fontSize: '12px', color: '#666', marginTop: '8px', display: 'block' }}>
                      Terpilih: <strong>{formData.category}</strong>
                    </small>
                  )}
                </div>

                <div className="form-group">
                  <label>Deskripsi Singkat *</label>
                  <input
                    type="text"
                    required
                    value={formData.short_description}
                    onChange={(e) => setFormData({...formData, short_description: e.target.value})}
                    placeholder="Deskripsi singkat untuk card produk"
                  />
                </div>

                <div className="form-group">
                  <label>Deskripsi Lengkap *</label>
                  <textarea
                    required
                    rows={4}
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    placeholder="Deskripsi detail produk"
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Tag *</label>
                    <input
                      type="text"
                      required
                      value={formData.tag}
                      onChange={(e) => setFormData({...formData, tag: e.target.value})}
                      placeholder="Mantul"
                    />
                  </div>

                  <div className="form-group">
                    <label>Warna Tag *</label>
                    <input
                      type="color"
                      value={formData.tag_color}
                      onChange={(e) => setFormData({...formData, tag_color: e.target.value})}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Gambar 1 *</label>
                  <div className="image-upload-group">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleImageUpload(e, 1)}
                      className="file-input"
                    />
                    <input
                      type="text"
                      value={formData.image_url_1}
                      onChange={(e) => setFormData({...formData, image_url_1: e.target.value})}
                      placeholder="/produk/nama-file.jpeg atau pilih file"
                      className="url-input"
                    />
                    {formData.image_url_1 && (
                      <div className="image-preview">
                        <img src={formData.image_url_1} alt="Preview 1" />
                      </div>
                    )}
                  </div>
                </div>

                <div className="form-group">
                  <label>Gambar 2 *</label>
                  <div className="image-upload-group">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleImageUpload(e, 2)}
                      className="file-input"
                    />
                    <input
                      type="text"
                      value={formData.image_url_2}
                      onChange={(e) => setFormData({...formData, image_url_2: e.target.value})}
                      placeholder="/produk/nama-file-2.jpeg atau pilih file"
                      className="url-input"
                    />
                    {formData.image_url_2 && (
                      <div className="image-preview">
                        <img src={formData.image_url_2} alt="Preview 2" />
                      </div>
                    )}
                  </div>
                </div>

                <div className="form-group">
                  <label>Gambar 3 *</label>
                  <div className="image-upload-group">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleImageUpload(e, 3)}
                      className="file-input"
                    />
                    <input
                      type="text"
                      value={formData.image_url_3}
                      onChange={(e) => setFormData({...formData, image_url_3: e.target.value})}
                      placeholder="/produk/nama-file-3.jpeg atau pilih file"
                      className="url-input"
                    />
                    {formData.image_url_3 && (
                      <div className="image-preview">
                        <img src={formData.image_url_3} alt="Preview 3" />
                      </div>
                    )}
                  </div>
                </div>

                <div className="form-group-checkbox">
                  <label>
                    <input
                      type="checkbox"
                      checked={formData.is_available}
                      onChange={(e) => setFormData({...formData, is_available: e.target.checked})}
                    />
                    <span>Produk Tersedia</span>
                  </label>
                </div>

                <div className="modal-actions">
                  <button type="button" className="btn-cancel" onClick={() => setShowModal(false)}>
                    Batal
                  </button>
                  <button type="submit" className="btn-submit">
                    {modalMode === "add" ? "Tambah Produk" : "Simpan Perubahan"}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {showDeleteConfirm && productToDelete && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="modal-overlay"
            onClick={cancelDelete}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="modal-content delete-modal"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="modal-header delete-header">
                <div className="delete-icon">
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="12" y1="8" x2="12" y2="12"></line>
                    <line x1="12" y1="16" x2="12.01" y2="16"></line>
                  </svg>
                </div>
                <h2>Hapus Produk?</h2>
                <button className="modal-close" onClick={cancelDelete}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                  </svg>
                </button>
              </div>

              <div className="delete-modal-body">
                <p className="delete-warning">
                  Apakah Anda yakin ingin menghapus produk ini?
                </p>
                <div className="delete-product-info">
                  <img 
                    src={productToDelete.image_url_1 || '/produk/placeholder.svg'} 
                    alt={productToDelete.name}
                    className="delete-product-image"
                  />
                  <div className="delete-product-details">
                    <h3>{productToDelete.name}</h3>
                    <p className="delete-product-price">Rp {productToDelete.price.toLocaleString()}</p>
                    <span className="delete-product-category">{productToDelete.category}</span>
                  </div>
                </div>
                <p className="delete-note">
                  ⚠️ Tindakan ini tidak dapat dibatalkan. Produk akan dihapus secara permanen dari database.
                </p>
              </div>

              <div className="modal-actions">
                <button type="button" className="btn-cancel" onClick={cancelDelete}>
                  Batal
                </button>
                <button type="button" className="btn-delete-confirm" onClick={confirmDelete}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="3 6 5 6 21 6"></polyline>
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                  </svg>
                  Ya, Hapus Produk
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
