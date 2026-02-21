"use client";

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { Spinner } from '../../components/ui/ios-spinner';
import MobileMenu from '../../components/ui/mobile-menu';
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

export default function EventPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [replies, setReplies] = useState<{[key: string]: Comment[]}>({});
  const [showCommentModal, setShowCommentModal] = useState(false);
  const [commentName, setCommentName] = useState('');
  const [commentText, setCommentText] = useState('');
  const [replyTo, setReplyTo] = useState<Comment | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [notification, setNotification] = useState({ show: false, message: '', type: 'success' as 'success' | 'error' });

  useEffect(() => {
    fetchEvents();
    
    // Load saved name from localStorage
    const savedName = localStorage.getItem('eventCommenterName');
    if (savedName) {
      setCommentName(savedName);
    }
  }, []);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/events`);
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
        
        // Fetch replies for each comment
        const repliesData: {[key: string]: Comment[]} = {};
        for (const comment of data.data.comments || []) {
          const repliesResponse = await fetch(
            `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/events/${eventId}/comments/${comment.id}/replies`
          );
          const repliesJson = await repliesResponse.json();
          if (repliesJson.success) {
            repliesData[comment.id] = repliesJson.data || [];
          }
        }
        setReplies(repliesData);
      }
    } catch (error) {
      console.error('Error fetching comments:', error);
    }
  };

  const handleEventClick = (event: Event) => {
    setSelectedEvent(event);
    fetchComments(event.id);
  };

  const handleComment = () => {
    if (!selectedEvent) return;
    setShowCommentModal(true);
  };

  const handleReply = (comment: Comment) => {
    setReplyTo(comment);
    setShowCommentModal(true);
  };

  const submitComment = async () => {
    if (!selectedEvent || !commentName.trim() || !commentText.trim()) {
      showNotification('Nama dan komentar harus diisi', 'error');
      return;
    }

    setSubmitting(true);
    
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/events/${selectedEvent.id}/comments`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            commenter_name: commentName,
            comment_text: commentText,
            parent_id: replyTo?.id || null
          })
        }
      );

      const data = await response.json();
      
      if (data.success) {
        // Save name to localStorage
        localStorage.setItem('eventCommenterName', commentName);
        
        showNotification('Komentar berhasil ditambahkan!', 'success');
        setCommentText('');
        setShowCommentModal(false);
        setReplyTo(null);
        
        // Refresh comments
        fetchComments(selectedEvent.id);
        
        // Update comment count
        setEvents(events.map(e => 
          e.id === selectedEvent.id 
            ? { ...e, comment_count: e.comment_count + 1 }
            : e
        ));
      } else {
        showNotification(data.message || 'Gagal menambahkan komentar', 'error');
      }
    } catch (error) {
      console.error('Error submitting comment:', error);
      showNotification('Gagal terhubung ke server', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleShare = async (event: Event) => {
    const shareUrl = `${window.location.origin}/event#${event.id}`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: event.title,
          text: event.description,
          url: shareUrl
        });
      } catch (error) {
        // User cancelled or error
        copyToClipboard(shareUrl);
      }
    } else {
      copyToClipboard(shareUrl);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    showNotification('Link berhasil disalin!', 'success');
  };

  const showNotification = (message: string, type: 'success' | 'error') => {
    setNotification({ show: true, message, type });
    setTimeout(() => {
      setNotification({ show: false, message: '', type: 'success' });
    }, 3000);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 7) {
      return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
    } else if (days > 0) {
      return `${days} hari yang lalu`;
    } else if (hours > 0) {
      return `${hours} jam yang lalu`;
    } else if (minutes > 0) {
      return `${minutes} menit yang lalu`;
    } else {
      return 'Baru saja';
    }
  };

  return (
    <div className="event-page">
      <div className="grain-overlay" />

      {/* Header */}
      <header className="header">
        <div className="logo">SCAFF*FOOD</div>
        <nav>
          <Link href="/">Home</Link>
          <Link href="/menu">Menu</Link>
          <Link href="/event">Event</Link>
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

      {/* Notification */}
      <AnimatePresence>
        {notification.show && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className={`event-notification ${notification.type}`}
          >
            {notification.message}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Events Grid */}
      <div className="event-container">
        {loading ? (
          <div className="event-loading">
            <Spinner size="lg" />
            <p>Memuat event...</p>
          </div>
        ) : events.length === 0 ? (
          <div className="event-empty">
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
              <line x1="16" y1="2" x2="16" y2="6"></line>
              <line x1="8" y1="2" x2="8" y2="6"></line>
              <line x1="3" y1="10" x2="21" y2="10"></line>
            </svg>
            <h3>Belum Ada Event</h3>
            <p>Event akan muncul di sini</p>
          </div>
        ) : (
          <div className="event-grid">
            {events.map((event, index) => (
              <motion.div
                key={event.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="event-card"
                onClick={() => handleEventClick(event)}
              >
                <div className="event-card-image">
                  <img src={event.image_url} alt={event.title} />
                  {event.music_url && (
                    <div className="event-music-badge">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M9 18V5l12-2v13"></path>
                        <circle cx="6" cy="18" r="3"></circle>
                        <circle cx="18" cy="16" r="3"></circle>
                      </svg>
                      {event.music_title}
                    </div>
                  )}
                </div>
                <div className="event-card-content">
                  <h3>{event.title}</h3>
                  <p>{event.description}</p>
                  <div className="event-card-meta">
                    <span>{formatDate(event.created_at)}</span>
                    <span>{event.comment_count} komentar</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Event Detail Modal */}
      <AnimatePresence>
        {selectedEvent && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="event-modal-overlay"
            onClick={() => setSelectedEvent(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 50 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 50 }}
              className="event-modal"
              onClick={(e) => e.stopPropagation()}
            >
              <button className="event-modal-close" onClick={() => setSelectedEvent(null)}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>

              <div className="event-modal-image">
                <img src={selectedEvent.image_url} alt={selectedEvent.title} />
              </div>

              <div className="event-modal-content">
                <h2>{selectedEvent.title}</h2>
                <p className="event-modal-date">{formatDate(selectedEvent.created_at)}</p>
                <p className="event-modal-description">{selectedEvent.description}</p>

                {selectedEvent.music_url && (
                  <div className="event-modal-music">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M9 18V5l12-2v13"></path>
                      <circle cx="6" cy="18" r="3"></circle>
                      <circle cx="18" cy="16" r="3"></circle>
                    </svg>
                    
                    {/* Check if it's a link or uploaded file */}
                    {selectedEvent.music_url.startsWith('http') ? (
                      <div style={{ marginTop: '12px' }}>
                        {/* Spotify Embed */}
                        {selectedEvent.music_url.includes('spotify.com') && (
                          <iframe
                            style={{ borderRadius: '12px', width: '100%', height: '152px' }}
                            src={selectedEvent.music_url.replace('/track/', '/embed/track/')}
                            frameBorder="0"
                            allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                            loading="lazy"
                          ></iframe>
                        )}
                        
                        {/* YouTube Embed */}
                        {(selectedEvent.music_url.includes('youtube.com') || selectedEvent.music_url.includes('youtu.be')) && (
                          <iframe
                            style={{ borderRadius: '12px', width: '100%', height: '200px' }}
                            src={selectedEvent.music_url.replace('watch?v=', 'embed/').replace('youtu.be/', 'youtube.com/embed/')}
                            frameBorder="0"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                          ></iframe>
                        )}
                        
                        {/* SoundCloud or other links */}
                        {!selectedEvent.music_url.includes('spotify.com') && !selectedEvent.music_url.includes('youtube.com') && !selectedEvent.music_url.includes('youtu.be') && (
                          <a 
                            href={selectedEvent.music_url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            style={{
                              display: 'block',
                              padding: '12px 16px',
                              background: '#f0f9ff',
                              border: '2px solid #3b82f6',
                              borderRadius: '10px',
                              color: '#3b82f6',
                              textDecoration: 'none',
                              fontWeight: '600',
                              textAlign: 'center',
                              marginTop: '8px'
                            }}
                          >
                            Dengarkan Musik
                          </a>
                        )}
                      </div>
                    ) : (
                      <audio controls src={selectedEvent.music_url} style={{ width: '100%', marginTop: '8px' }}>
                        Your browser does not support the audio element.
                      </audio>
                    )}
                    
                    {selectedEvent.music_title && (
                      <p style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
                        {selectedEvent.music_title}
                      </p>
                    )}
                  </div>
                )}

                <div className="event-modal-actions">
                  <button className="event-action-btn" onClick={handleComment}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                    </svg>
                    Komentar ({selectedEvent.comment_count})
                  </button>
                  <button className="event-action-btn" onClick={() => handleShare(selectedEvent)}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="18" cy="5" r="3"></circle>
                      <circle cx="6" cy="12" r="3"></circle>
                      <circle cx="18" cy="19" r="3"></circle>
                      <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line>
                      <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line>
                    </svg>
                    Bagikan
                  </button>
                </div>

                {/* Comments Section */}
                <div className="event-comments-section">
                  <h3>Komentar</h3>
                  {comments.length === 0 ? (
                    <p className="event-no-comments">Belum ada komentar. Jadilah yang pertama!</p>
                  ) : (
                    <div className="event-comments-list">
                      {comments.map((comment) => (
                        <div key={comment.id} className="event-comment">
                          <div className="event-comment-header">
                            {comment.is_admin ? (
                              <div className="event-comment-avatar admin">
                                <img src="/favicon.ico" alt="SCAFF*FOOD" />
                              </div>
                            ) : (
                              <div className="event-comment-avatar">
                                {comment.commenter_name.charAt(0).toUpperCase()}
                              </div>
                            )}
                            <div className="event-comment-info">
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <span className="event-comment-name">{comment.commenter_name}</span>
                                {comment.is_admin && (
                                  <svg width="14" height="14" viewBox="0 0 24 24" fill="#3b82f6" stroke="white" strokeWidth="2">
                                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                                    <polyline points="22 4 12 14.01 9 11.01"></polyline>
                                  </svg>
                                )}
                              </div>
                              <span className="event-comment-date">{formatDate(comment.created_at)}</span>
                            </div>
                          </div>
                          <p className="event-comment-text">{comment.comment_text}</p>
                          <button className="event-comment-reply-btn" onClick={() => handleReply(comment)}>
                            Balas
                          </button>

                          {/* Replies */}
                          {replies[comment.id] && replies[comment.id].length > 0 && (
                            <div className="event-comment-replies">
                              {replies[comment.id].map((reply) => (
                                <div key={reply.id} className="event-comment reply">
                                  <div className="event-comment-header">
                                    {reply.is_admin ? (
                                      <div className="event-comment-avatar admin">
                                        <img src="/favicon.ico" alt="SCAFF*FOOD" />
                                      </div>
                                    ) : (
                                      <div className="event-comment-avatar">
                                        {reply.commenter_name.charAt(0).toUpperCase()}
                                      </div>
                                    )}
                                    <div className="event-comment-info">
                                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        <span className="event-comment-name">{reply.commenter_name}</span>
                                        {reply.is_admin && (
                                          <svg width="14" height="14" viewBox="0 0 24 24" fill="#3b82f6" stroke="white" strokeWidth="2">
                                            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                                            <polyline points="22 4 12 14.01 9 11.01"></polyline>
                                          </svg>
                                        )}
                                      </div>
                                      <span className="event-comment-date">{formatDate(reply.created_at)}</span>
                                    </div>
                                  </div>
                                  <p className="event-comment-text">{reply.comment_text}</p>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Comment Modal */}
      <AnimatePresence>
        {showCommentModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="comment-modal-overlay"
            onClick={() => {
              setShowCommentModal(false);
              setReplyTo(null);
            }}
          >
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 50 }}
              className="comment-modal"
              onClick={(e) => e.stopPropagation()}
            >
              <h3>{replyTo ? `Balas komentar ${replyTo.commenter_name}` : 'Tambah Komentar'}</h3>
              
              {replyTo && (
                <div className="reply-to-preview">
                  <p><strong>{replyTo.commenter_name}:</strong> {replyTo.comment_text}</p>
                </div>
              )}

              <div className="comment-form">
                <input
                  type="text"
                  placeholder="Nama Anda"
                  value={commentName}
                  onChange={(e) => setCommentName(e.target.value)}
                  className="comment-input"
                />
                <textarea
                  placeholder="Tulis komentar..."
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  className="comment-textarea"
                  rows={4}
                />
                <p className="comment-hint">Komentar bersifat publik dan anonymous</p>
                <div className="comment-actions">
                  <button
                    className="comment-btn cancel"
                    onClick={() => {
                      setShowCommentModal(false);
                      setReplyTo(null);
                      setCommentText('');
                    }}
                  >
                    Batal
                  </button>
                  <button
                    className="comment-btn submit"
                    onClick={submitComment}
                    disabled={submitting || !commentName.trim() || !commentText.trim()}
                  >
                    {submitting ? 'Mengirim...' : 'Kirim'}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
