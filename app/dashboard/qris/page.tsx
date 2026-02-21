"use client";

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Spinner } from '../../../components/ui/ios-spinner';
import '../dashboard-new.css';
import './qris.css';

interface QRISCode {
  id: string;
  name: string;
  image_url: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export default function QRISSettingsPage() {
  const [qrisCodes, setQrisCodes] = useState<QRISCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState<"add" | "edit">("add");
  const [selectedQRIS, setSelectedQRIS] = useState<QRISCode | null>(null);
  const [uploading, setUploading] = useState(false);
  const [showNotification, setShowNotification] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [qrisToDelete, setQrisToDelete] = useState<QRISCode | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    image_url: ""
  });

  useEffect(() => {
    fetchQRISCodes();
  }, []);

  const fetchQRISCodes = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/admin/qris`);
      const data = await response.json();
      
      if (data.success) {
        setQrisCodes(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching QRIS codes:', error);
    } finally {
      setLoading(false);
    }
  };

  const showNotif = (message: string) => {
    setNotificationMessage(message);
    setShowNotification(true);
    setTimeout(() => setShowNotification(false), 3000);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showNotif('File harus berupa gambar');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      showNotif('Ukuran file maksimal 5MB');
      return;
    }

    setUploading(true);

    try {
      const formDataUpload = new FormData();
      formDataUpload.append('image', file);

      const uploadResponse = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/upload`, {
        method: 'POST',
        body: formDataUpload
      });

      const uploadData = await uploadResponse.json();

      if (uploadData.success) {
        const baseUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "";
        const absoluteUrl = uploadData.url.startsWith('http')
          ? uploadData.url
          : `${baseUrl}${uploadData.url}`;

        setFormData(prev => ({ ...prev, image_url: absoluteUrl }));
        showNotif('Gambar berhasil diupload');
      } else {
        showNotif('Gagal upload gambar');
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      showNotif('Gagal upload gambar');
    } finally {
      setUploading(false);
    }
  };

  const handleAddQRIS = () => {
    setModalMode("add");
    setFormData({ name: "", image_url: "" });
    setShowModal(true);
  };

  const handleEditQRIS = (qris: QRISCode) => {
    setModalMode("edit");
    setSelectedQRIS(qris);
    setFormData({
      name: qris.name,
      image_url: qris.image_url
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.image_url) {
      showNotif('Nama dan gambar QRIS harus diisi');
      return;
    }

    const url = modalMode === "add"
      ? `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/admin/qris`
      : `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/admin/qris/${selectedQRIS?.id}`;

    const method = modalMode === "add" ? 'POST' : 'PUT';

    try {
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (data.success) {
        showNotif(data.message);
        setShowModal(false);
        fetchQRISCodes();
      } else {
        showNotif(data.message || 'Gagal menyimpan QRIS');
      }
    } catch (error) {
      console.error('Error saving QRIS:', error);
      showNotif('Gagal terhubung ke server');
    }
  };

  const handleDeleteClick = (qris: QRISCode) => {
    setQrisToDelete(qris);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!qrisToDelete) return;

    // Close modal first
    setShowDeleteModal(false);

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/admin/qris/${qrisToDelete.id}`, {
        method: 'DELETE'
      });

      const data = await response.json();

      if (data.success) {
        showNotif('QRIS berhasil dihapus');
        fetchQRISCodes();
      } else {
        // Show error message as toast
        showNotif(data.message || 'Gagal menghapus QRIS');
      }
    } catch (error) {
      console.error('Error deleting QRIS:', error);
      showNotif('Gagal terhubung ke server');
    } finally {
      setQrisToDelete(null);
    }
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

          <a href="/dashboard/event" className="dash-nav-item">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
              <line x1="16" y1="2" x2="16" y2="6"></line>
              <line x1="8" y1="2" x2="8" y2="6"></line>
              <line x1="3" y1="10" x2="21" y2="10"></line>
            </svg>
            <span>Event</span>
          </a>

          <a href="/dashboard/qris" className="dash-nav-item dash-nav-item-active">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="7" height="7"></rect>
              <rect x="14" y="3" width="7" height="7"></rect>
              <rect x="14" y="14" width="7" height="7"></rect>
              <rect x="3" y="14" width="7" height="7"></rect>
            </svg>
            <span>QRIS</span>
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
            <h1 className="dash-title">Kelola QRIS</h1>
          </div>
        </header>

        {/* Content */}
        <div className="dash-content">
          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 20px', gap: '20px' }}>
              <Spinner size="lg" />
              <p style={{ color: '#666', fontSize: '16px' }}>Memuat QRIS...</p>
            </div>
          ) : qrisCodes.length === 0 ? (
            <div className="qris-empty-state">
              <div className="empty-icon">
                <svg width="120" height="120" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <rect x="3" y="3" width="7" height="7"></rect>
                  <rect x="14" y="3" width="7" height="7"></rect>
                  <rect x="14" y="14" width="7" height="7"></rect>
                  <rect x="3" y="14" width="7" height="7"></rect>
                </svg>
              </div>
              <h2>Belum Ada QRIS</h2>
              <p>Mulai dengan menambahkan QRIS pertama Anda untuk menerima pembayaran dari customer</p>
              <button className="btn-add-first" onClick={handleAddQRIS}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="12" y1="5" x2="12" y2="19"></line>
                  <line x1="5" y1="12" x2="19" y2="12"></line>
                </svg>
                Tambah QRIS Pertama
              </button>
            </div>
          ) : (
            <>
              <div className="qris-header-actions">
                <div className="qris-count">
                  <span className="count-number">{qrisCodes.length}</span>
                  <span className="count-label">QRIS Terdaftar</span>
                </div>
                <button className="btn-add-qris" onClick={handleAddQRIS}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <line x1="12" y1="5" x2="12" y2="19"></line>
                    <line x1="5" y1="12" x2="19" y2="12"></line>
                  </svg>
                  Tambah QRIS Baru
                </button>
              </div>

              <div className="qris-grid">
                {qrisCodes.map((qris) => (
                  <motion.div
                    key={qris.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    whileHover={{ y: -4 }}
                    className="qris-card-modern"
                  >
                    <div className="qris-card-header">
                      <h3>{qris.name}</h3>
                      <div className="qris-card-actions">
                        <button 
                          className="btn-icon btn-edit"
                          onClick={() => handleEditQRIS(qris)}
                          title="Edit QRIS"
                        >
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                          </svg>
                        </button>
                        <button 
                          className="btn-icon btn-delete"
                          onClick={() => handleDeleteClick(qris)}
                          title="Hapus QRIS"
                        >
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polyline points="3 6 5 6 21 6"></polyline>
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                          </svg>
                        </button>
                      </div>
                    </div>
                    <div className="qris-image-container">
                      <img src={qris.image_url} alt={qris.name} />
                    </div>
                    <div className="qris-card-footer">
                      <span className="qris-date">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <circle cx="12" cy="12" r="10"></circle>
                          <polyline points="12 6 12 12 16 14"></polyline>
                        </svg>
                        {new Date(qris.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </span>
                    </div>
                  </motion.div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Modal Add/Edit QRIS */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="qris-modal-overlay"
            onClick={() => setShowModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: "spring", duration: 0.3 }}
              className="qris-modal"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="qris-modal-header">
                <div className="modal-title-section">
                  <div className="modal-icon">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="3" y="3" width="7" height="7"></rect>
                      <rect x="14" y="3" width="7" height="7"></rect>
                      <rect x="14" y="14" width="7" height="7"></rect>
                      <rect x="3" y="14" width="7" height="7"></rect>
                    </svg>
                  </div>
                  <div>
                    <h2>{modalMode === "add" ? "Tambah QRIS Baru" : "Edit QRIS"}</h2>
                    <p>Isi informasi QRIS untuk pembayaran customer</p>
                  </div>
                </div>
                <button className="modal-close-btn" onClick={() => setShowModal(false)}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                  </svg>
                </button>
              </div>

              <form onSubmit={handleSubmit} className="qris-modal-form">
                <div className="form-section">
                  <label className="form-label-modern">
                    <span className="label-text">Nama QRIS</span>
                    <span className="label-required">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    placeholder="Contoh: QRIS Utama, QRIS Promo"
                    className="input-modern"
                  />
                  <span className="input-hint">Nama untuk mengidentifikasi QRIS ini</span>
                </div>

                <div className="form-section">
                  <label className="form-label-modern">
                    <span className="label-text">Gambar QRIS</span>
                    <span className="label-required">*</span>
                  </label>
                  
                  {formData.image_url ? (
                    <div className="qris-preview-section">
                      <div className="preview-image-wrapper">
                        <img src={formData.image_url} alt="QRIS Preview" />
                      </div>
                      <label htmlFor="qris-upload" className="btn-change-qris">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                          <polyline points="17 8 12 3 7 8"></polyline>
                          <line x1="12" y1="3" x2="12" y2="15"></line>
                        </svg>
                        Ganti Gambar
                      </label>
                    </div>
                  ) : (
                    <label htmlFor="qris-upload" className="upload-area-modern">
                      <div className="upload-icon">
                        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                          <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                          <circle cx="8.5" cy="8.5" r="1.5"></circle>
                          <polyline points="21 15 16 10 5 21"></polyline>
                        </svg>
                      </div>
                      <div className="upload-text">
                        <p className="upload-title">Klik atau drag & drop</p>
                        <p className="upload-subtitle">PNG, JPG, JPEG (Max 5MB)</p>
                      </div>
                    </label>
                  )}
                  
                  <input
                    type="file"
                    id="qris-upload"
                    accept="image/*"
                    onChange={handleImageUpload}
                    style={{ display: 'none' }}
                    disabled={uploading}
                  />
                  
                  {uploading && (
                    <div className="upload-progress">
                      <div className="spinner-small"></div>
                      <span>Mengupload gambar...</span>
                    </div>
                  )}
                </div>

                <div className="modal-footer">
                  <button 
                    type="button" 
                    className="btn-secondary-modern" 
                    onClick={() => setShowModal(false)}
                  >
                    Batal
                  </button>
                  <button 
                    type="submit" 
                    className="btn-primary-modern" 
                    disabled={uploading || !formData.name || !formData.image_url}
                  >
                    {uploading ? (
                      <>
                        <div className="spinner-small"></div>
                        Mengupload...
                      </>
                    ) : (
                      <>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <polyline points="20 6 9 17 4 12"></polyline>
                        </svg>
                        {modalMode === "add" ? "Tambah QRIS" : "Simpan Perubahan"}
                      </>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {showDeleteModal && qrisToDelete && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="qris-modal-overlay"
            onClick={() => setShowDeleteModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: "spring", duration: 0.3 }}
              className="qris-modal qris-modal-small"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="delete-modal-content">
                <div className="delete-icon-wrapper">
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="15" y1="9" x2="9" y2="15"></line>
                    <line x1="9" y1="9" x2="15" y2="15"></line>
                  </svg>
                </div>
                <h3>Hapus QRIS?</h3>
                <p className="delete-message">
                  Apakah Anda yakin ingin menghapus <strong>{qrisToDelete.name}</strong>? Tindakan ini tidak dapat dibatalkan.
                </p>
              </div>

              <div className="modal-footer">
                <button 
                  type="button" 
                  className="btn-secondary-modern" 
                  onClick={() => setShowDeleteModal(false)}
                >
                  Batal
                </button>
                <button 
                  type="button" 
                  className="btn-danger-modern" 
                  onClick={confirmDelete}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="3 6 5 6 21 6"></polyline>
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                  </svg>
                  Ya, Hapus QRIS
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Notification */}
      <AnimatePresence>
        {showNotification && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className="notification"
          >
            {notificationMessage}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
