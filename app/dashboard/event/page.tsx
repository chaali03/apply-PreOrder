"use client";

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Spinner } from '../../../components/ui/ios-spinner';
import '../dashboard-new.css';
import './event.css';

interface Event {
  id: string;
  title: string;
  description: string;
  image_url: string;
  music_url?: string;
  music_title?: string;
  is_active: boolean;
  created_at: string;
  comment_count: number;
}

interface Comment {
  id: string;
  event_id: string;
  parent_id?: string;
  commenter_name: string;
  comment_text: string;
  is_admin: boolean;
  created_at: string;
}

export default function DashboardEventPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [uploading, setUploading] = useState(false);
  const [notification, setNotification] = useState({ show: false, message: '', type: 'success' as 'success' | 'error' });
  const [musicSource, setMusicSource] = useState<'upload' | 'link'>('link');
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    image_url: '',
    music_url: '',
    music_title: ''
  });

  const [comments, setComments] = useState<Comment[]>([]);
  const [showComments, setShowComments] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [replyTo, setReplyTo] = useState<Comment | null>(null);

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/admin/events`);
      const data = await response.json();
      if (data.success) {
        setEvents(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching events:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchComments = async (eventId: string) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/events/${eventId}`);
      const data = await response.json();
      if (data.success) {
        setComments(data.data.comments || []);
        
        // Fetch replies
        for (const comment of data.data.comments || []) {
          const repliesResponse = await fetch(
            `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/events/${eventId}/comments/${comment.id}/replies`
          );
          const repliesJson = await repliesResponse.json();
          if (repliesJson.success && repliesJson.data.length > 0) {
            setComments(prev => [...prev, ...repliesJson.data]);
          }
        }
      }
    } catch (error) {
      console.error('Error fetching comments:', error);
    }
  };

  const showNotification = (message: string, type: 'success' | 'error' = 'success') => {
    setNotification({ show: true, message, type });
    setTimeout(() => setNotification({ show: false, message: '', type: 'success' }), 3000);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showNotification('File harus berupa gambar', 'error');
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('image', file);

      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/upload`, {
        method: 'POST',
        body: formData
      });

      const data = await response.json();
      if (data.success) {
        setFormData(prev => ({ ...prev, image_url: data.url }));
        showNotification('Gambar berhasil diupload');
      } else {
        showNotification(data.message || 'Gagal upload gambar', 'error');
      }
    } catch (error) {
      showNotification('Gagal upload gambar', 'error');
    } finally {
      setUploading(false);
    }
  };

  const handleMusicUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('audio/')) {
      showNotification('File harus berupa audio', 'error');
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('image', file); // API uses 'image' field for all uploads

      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/upload`, {
        method: 'POST',
        body: formData
      });

      const data = await response.json();
      if (data.success) {
        setFormData(prev => ({ ...prev, music_url: data.url }));
        showNotification('Musik berhasil diupload');
      } else {
        showNotification(data.message || 'Gagal upload musik', 'error');
      }
    } catch (error) {
      showNotification('Gagal upload musik', 'error');
    } finally {
      setUploading(false);
    }
  };

  const handleAddEvent = () => {
    setModalMode('add');
    setFormData({ title: '', description: '', image_url: '', music_url: '', music_title: '' });
    setShowModal(true);
  };

  const handleEditEvent = (event: Event) => {
    setModalMode('edit');
    setSelectedEvent(event);
    setFormData({
      title: event.title,
      description: event.description,
      image_url: event.image_url,
      music_url: event.music_url || '',
      music_title: event.music_title || ''
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title || !formData.description || !formData.image_url) {
      showNotification('Judul, deskripsi, dan gambar harus diisi', 'error');
      return;
    }

    const url = modalMode === 'add'
      ? `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/admin/events`
      : `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/admin/events/${selectedEvent?.id}`;

    const method = modalMode === 'add' ? 'POST' : 'PUT';

    try {
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await response.json();
      if (data.success) {
        showNotification(data.message);
        setShowModal(false);
        fetchEvents();
      } else {
        showNotification(data.message || 'Gagal menyimpan event', 'error');
      }
    } catch (error) {
      showNotification('Gagal terhubung ke server', 'error');
    }
  };

  const handleDelete = async (event: Event) => {
    if (!confirm(`Hapus event "${event.title}"?`)) return;

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/admin/events/${event.id}`,
        { method: 'DELETE' }
      );

      const data = await response.json();
      if (data.success) {
        showNotification('Event berhasil dihapus');
        fetchEvents();
      } else {
        showNotification(data.message || 'Gagal menghapus event', 'error');
      }
    } catch (error) {
      showNotification('Gagal terhubung ke server', 'error');
    }
  };

  const handleViewComments = (event: Event) => {
    setSelectedEvent(event);
    fetchComments(event.id);
    setShowComments(true);
  };

  const handleReply = async (comment?: Comment) => {
    if (!replyText.trim() || !selectedEvent) return;

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/admin/events/${selectedEvent.id}/comments`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            comment_text: replyText,
            parent_id: comment?.id || null
          })
        }
      );

      const data = await response.json();
      if (data.success) {
        showNotification('Komentar berhasil ditambahkan');
        setReplyText('');
        setReplyTo(null);
        fetchComments(selectedEvent.id);
      } else {
        showNotification(data.message || 'Gagal menambahkan komentar', 'error');
      }
    } catch (error) {
      showNotification('Gagal terhubung ke server', 'error');
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!confirm('Hapus komentar ini?') || !selectedEvent) return;

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/admin/events/${selectedEvent.id}/comments/${commentId}`,
        { method: 'DELETE' }
      );

      const data = await response.json();
      if (data.success) {
        showNotification('Komentar berhasil dihapus');
        fetchComments(selectedEvent.id);
      } else {
        showNotification(data.message || 'Gagal menghapus komentar', 'error');
      }
    } catch (error) {
      showNotification('Gagal terhubung ke server', 'error');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
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
            {notification.message}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Sidebar Overlay */}
      {sidebarOpen && (
        <div className="dash-sidebar-overlay" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`dash-sidebar ${sidebarOpen ? 'dash-sidebar-open' : ''}`}>
        <div className="dash-sidebar-header">
          <div className="dash-logo-text">SCAFF*FOOD</div>
          <button className="dash-sidebar-close" onClick={() => setSidebarOpen(false)}>
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

          <a href="/dashboard/event" className="dash-nav-item dash-nav-item-active">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
              <line x1="16" y1="2" x2="16" y2="6"></line>
              <line x1="8" y1="2" x2="8" y2="6"></line>
              <line x1="3" y1="10" x2="21" y2="10"></line>
            </svg>
            <span>Event</span>
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
            <button className="dash-menu-toggle" onClick={() => setSidebarOpen(true)}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="3" y1="12" x2="21" y2="12"></line>
                <line x1="3" y1="6" x2="21" y2="6"></line>
                <line x1="3" y1="18" x2="21" y2="18"></line>
              </svg>
            </button>
            <h1 className="dash-title">Kelola Event</h1>
          </div>
          <button className="btn-add-event" onClick={handleAddEvent}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
            Tambah Event
          </button>
        </header>

        <div className="dash-content">
          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px', flexDirection: 'column', gap: '20px' }}>
              <Spinner size="lg" />
              <p style={{ color: '#666' }}>Memuat event...</p>
            </div>
          ) : events.length === 0 ? (
            <div className="empty-state">
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                <line x1="16" y1="2" x2="16" y2="6"></line>
                <line x1="8" y1="2" x2="8" y2="6"></line>
                <line x1="3" y1="10" x2="21" y2="10"></line>
              </svg>
              <h3>Belum Ada Event</h3>
              <p>Klik tombol "Tambah Event" untuk membuat event baru</p>
            </div>
          ) : (
            <div className="events-grid-admin">
              {events.map((event) => (
                <motion.div
                  key={event.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="event-card-admin"
                >
                  <div className="event-image-wrapper">
                    <img src={event.image_url} alt={event.title} className="event-image-admin" />
                    {event.music_url && (
                      <div className="event-music-badge-admin">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M9 18V5l12-2v13"></path>
                          <circle cx="6" cy="18" r="3"></circle>
                          <circle cx="18" cy="16" r="3"></circle>
                        </svg>
                      </div>
                    )}
                  </div>
                  <div className="event-info-admin">
                    <h3 className="event-title-admin">{event.title}</h3>
                    <p className="event-desc-admin">{event.description}</p>
                    <div className="event-meta-admin">
                      <span className="event-date-admin">{formatDate(event.created_at)}</span>
                      <span className="event-comments-admin">{event.comment_count} komentar</span>
                    </div>
                    <div className="event-actions-admin">
                      <button className="btn-comments-admin" onClick={() => handleViewComments(event)}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                        </svg>
                      </button>
                      <button className="btn-edit-admin" onClick={() => handleEditEvent(event)}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                        </svg>
                      </button>
                      <button className="btn-delete-admin" onClick={() => handleDelete(event)}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <polyline points="3 6 5 6 21 6"></polyline>
                          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                        </svg>
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Add/Edit Event Modal */}
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
                <h2>{modalMode === 'add' ? 'Tambah Event Baru' : 'Edit Event'}</h2>
                <button className="modal-close" onClick={() => setShowModal(false)}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                  </svg>
                </button>
              </div>

              <form onSubmit={handleSubmit} className="modal-form">
                <div className="form-group">
                  <label>Judul Event *</label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                    placeholder="Contoh: Promo Spesial Ramadan"
                  />
                </div>

                <div className="form-group">
                  <label>Deskripsi *</label>
                  <textarea
                    required
                    rows={4}
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    placeholder="Tulis deskripsi event..."
                  />
                </div>

                <div className="form-group">
                  <label>Gambar Event *</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    disabled={uploading}
                  />
                  {formData.image_url && (
                    <div style={{ marginTop: '12px' }}>
                      <img src={formData.image_url} alt="Preview" style={{ maxWidth: '200px', border: '2px solid #1a1a1a', borderRadius: '8px' }} />
                    </div>
                  )}
                </div>

                <div className="form-group">
                  <label>Musik (Opsional)</label>
                  
                  {/* Music Source Toggle */}
                  <div style={{ display: 'flex', gap: '10px', marginBottom: '12px' }}>
                    <button
                      type="button"
                      onClick={() => setMusicSource('link')}
                      style={{
                        flex: 1,
                        padding: '10px',
                        border: '2px solid #1a1a1a',
                        borderRadius: '8px',
                        background: musicSource === 'link' ? '#bff000' : 'white',
                        fontWeight: musicSource === 'link' ? '700' : '600',
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                      }}
                    >
                      Link Musik
                    </button>
                    <button
                      type="button"
                      onClick={() => setMusicSource('upload')}
                      style={{
                        flex: 1,
                        padding: '10px',
                        border: '2px solid #1a1a1a',
                        borderRadius: '8px',
                        background: musicSource === 'upload' ? '#bff000' : 'white',
                        fontWeight: musicSource === 'upload' ? '700' : '600',
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                      }}
                    >
                      Upload File
                    </button>
                  </div>

                  {musicSource === 'link' ? (
                    <>
                      <input
                        type="text"
                        value={formData.music_url}
                        onChange={(e) => setFormData({...formData, music_url: e.target.value})}
                        placeholder="Paste link Spotify, YouTube, SoundCloud, dll"
                        style={{ marginBottom: '8px' }}
                      />
                      <p style={{ fontSize: '12px', color: '#666', margin: '4px 0 8px 0' }}>
                        Contoh: https://open.spotify.com/track/... atau https://youtube.com/watch?v=...
                      </p>
                    </>
                  ) : (
                    <input
                      type="file"
                      accept="audio/*"
                      onChange={handleMusicUpload}
                      disabled={uploading}
                    />
                  )}
                  
                  {formData.music_url && !formData.music_url.startsWith('http') && (
                    <audio controls src={formData.music_url} style={{ width: '100%', marginTop: '8px' }} />
                  )}
                  
                  {formData.music_url && formData.music_url.startsWith('http') && (
                    <div style={{ 
                      padding: '12px', 
                      background: '#f0f9ff', 
                      border: '2px solid #3b82f6', 
                      borderRadius: '8px',
                      marginTop: '8px',
                      fontSize: '13px'
                    }}>
                      Link musik: {formData.music_url.substring(0, 50)}...
                    </div>
                  )}
                </div>

                <div className="form-group">
                  <label>Judul Musik (Opsional)</label>
                  <input
                    type="text"
                    value={formData.music_title}
                    onChange={(e) => setFormData({...formData, music_title: e.target.value})}
                    placeholder="Contoh: Lagu Ramadan - Artis"
                  />
                </div>

                <div className="modal-actions">
                  <button type="button" className="btn-secondary" onClick={() => setShowModal(false)}>
                    Batal
                  </button>
                  <button type="submit" className="btn-primary" disabled={uploading}>
                    {uploading ? 'Uploading...' : modalMode === 'add' ? 'Tambah Event' : 'Simpan Perubahan'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Comments Modal */}
      <AnimatePresence>
        {showComments && selectedEvent && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="modal-overlay"
            onClick={() => {
              setShowComments(false);
              setReplyTo(null);
              setReplyText('');
            }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="modal-content comments-modal"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="modal-header">
                <h2>Komentar - {selectedEvent.title}</h2>
                <button className="modal-close" onClick={() => {
                  setShowComments(false);
                  setReplyTo(null);
                  setReplyText('');
                }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                  </svg>
                </button>
              </div>

              <div className="comments-content">
                {/* Add Comment Form */}
                <div className="add-comment-form">
                  {replyTo && (
                    <div className="reply-to-preview">
                      <p>Membalas: <strong>{replyTo.commenter_name}</strong></p>
                      <button onClick={() => setReplyTo(null)}>×</button>
                    </div>
                  )}
                  <textarea
                    placeholder={replyTo ? "Tulis balasan..." : "Tulis komentar sebagai SCAFF*FOOD..."}
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    rows={3}
                  />
                  <button
                    className="btn-primary"
                    onClick={() => handleReply(replyTo || undefined)}
                    disabled={!replyText.trim()}
                  >
                    {replyTo ? 'Balas' : 'Kirim Komentar'}
                  </button>
                </div>

                {/* Comments List */}
                <div className="comments-list">
                  {comments.length === 0 ? (
                    <p style={{ textAlign: 'center', color: '#999', padding: '40px 20px' }}>
                      Belum ada komentar
                    </p>
                  ) : (
                    comments.filter(c => !c.parent_id).map((comment) => (
                      <div key={comment.id} className="comment-item">
                        <div className="comment-header">
                          {comment.is_admin ? (
                            <div className="comment-avatar admin">
                              <img src="/favicon.ico" alt="SCAFF*FOOD" />
                            </div>
                          ) : (
                            <div className="comment-avatar">
                              {comment.commenter_name.charAt(0).toUpperCase()}
                            </div>
                          )}
                          <div className="comment-info">
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <span className="comment-name">{comment.commenter_name}</span>
                              {comment.is_admin && (
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="#3b82f6" stroke="white" strokeWidth="2">
                                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                                  <polyline points="22 4 12 14.01 9 11.01"></polyline>
                                </svg>
                              )}
                            </div>
                            <span className="comment-date">{formatDate(comment.created_at)}</span>
                          </div>
                        </div>
                        <p className="comment-text">{comment.comment_text}</p>
                        <div className="comment-actions">
                          <button onClick={() => setReplyTo(comment)}>Balas</button>
                          <button onClick={() => handleDeleteComment(comment.id)} style={{ color: '#ef4444' }}>
                            Hapus
                          </button>
                        </div>

                        {/* Replies */}
                        {comments.filter(r => r.parent_id === comment.id).length > 0 && (
                          <div className="comment-replies">
                            {comments.filter(r => r.parent_id === comment.id).map((reply) => (
                              <div key={reply.id} className="comment-item reply">
                                <div className="comment-header">
                                  {reply.is_admin ? (
                                    <div className="comment-avatar admin">
                                      <img src="/favicon.ico" alt="SCAFF*FOOD" />
                                    </div>
                                  ) : (
                                    <div className="comment-avatar">
                                      {reply.commenter_name.charAt(0).toUpperCase()}
                                    </div>
                                  )}
                                  <div className="comment-info">
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                      <span className="comment-name">{reply.commenter_name}</span>
                                      {reply.is_admin && (
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="#3b82f6" stroke="white" strokeWidth="2">
                                          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                                          <polyline points="22 4 12 14.01 9 11.01"></polyline>
                                        </svg>
                                      )}
                                    </div>
                                    <span className="comment-date">{formatDate(reply.created_at)}</span>
                                  </div>
                                </div>
                                <p className="comment-text">{reply.comment_text}</p>
                                <div className="comment-actions">
                                  <button onClick={() => handleDeleteComment(reply.id)} style={{ color: '#ef4444' }}>
                                    Hapus
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
