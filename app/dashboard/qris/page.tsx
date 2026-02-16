"use client";

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import '../dashboard-new.css';
import './qris.css';

export default function QRISSettingsPage() {
  const [qrisImage, setQrisImage] = useState<string>("");
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showNotification, setShowNotification] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    fetchQRISImage();
  }, []);

  const fetchQRISImage = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/settings?key=qris_image`);
      const data = await response.json();
      
      if (data.success && data.data.value) {
        const value = data.data.value as string;
        const baseUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "";
        const absoluteUrl = value.startsWith('http') ? value : `${baseUrl}${value}`;
        setQrisImage(absoluteUrl);
      }
    } catch (error) {
      console.error('Error fetching QRIS image:', error);
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
      const formData = new FormData();
      formData.append('image', file);

      const uploadResponse = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/upload`, {
        method: 'POST',
        body: formData
      });

      const uploadData = await uploadResponse.json();

      if (uploadData.success) {
        // Simpan URL absolut supaya bisa diakses dari Netlify (domain backend)
        const baseUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "";
        const absoluteUrl = uploadData.url.startsWith('http')
          ? uploadData.url
          : `${baseUrl}${uploadData.url}`;

        setQrisImage(absoluteUrl);
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

  const handleSave = async () => {
    if (!qrisImage) {
      showNotif('Mohon upload gambar QRIS terlebih dahulu');
      return;
    }

    setSaving(true);

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/settings`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          key: 'qris_image',
          value: qrisImage
        })
      });

      const data = await response.json();

      if (data.success) {
        showNotif('QRIS berhasil disimpan');
      } else {
        showNotif('Gagal menyimpan QRIS');
      }
    } catch (error) {
      console.error('Error saving QRIS:', error);
      showNotif('Gagal menyimpan QRIS');
    } finally {
      setSaving(false);
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
            <h1 className="dash-title">Pengaturan QRIS</h1>
          </div>
        </header>

        {/* Content */}
        <div className="dash-content">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="qris-settings-container"
          >
            <div className="qris-card">
              <h2>QRIS Payment Code</h2>
              <p className="qris-description">
                Upload gambar QR Code QRIS untuk pembayaran. Gambar ini akan ditampilkan kepada customer saat checkout.
              </p>

              <div className="qris-upload-section">
                {qrisImage ? (
                  <div className="qris-preview">
                    <img src={qrisImage} alt="QRIS Code" />
                    <div className="qris-preview-overlay">
                      <label htmlFor="qris-upload" className="btn-change-qris">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                        </svg>
                        Ganti Gambar
                      </label>
                    </div>
                  </div>
                ) : (
                  <label htmlFor="qris-upload" className="qris-upload-placeholder">
                    <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                      <circle cx="8.5" cy="8.5" r="1.5"></circle>
                      <polyline points="21 15 16 10 5 21"></polyline>
                    </svg>
                    <p>Klik untuk upload QRIS</p>
                    <span>PNG, JPG, JPEG (Max 5MB)</span>
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
              </div>

              {uploading && (
                <div className="qris-status uploading">
                  <div className="spinner"></div>
                  <p>Mengupload gambar...</p>
                </div>
              )}

              <div className="qris-actions">
                <button 
                  onClick={handleSave} 
                  className="btn-save-qris"
                  disabled={!qrisImage || saving}
                >
                  {saving ? 'Menyimpan...' : 'Simpan QRIS'}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Notification */}
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
    </div>
  );
}
