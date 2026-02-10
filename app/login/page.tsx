"use client";

import './login.css';
import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter, useSearchParams } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectPath = searchParams.get('redirect') || '/dashboard';
  const [step, setStep] = useState<"email" | "code" | "success">("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const [resendTimer, setResendTimer] = useState(0);
  const [canResend, setCanResend] = useState(false);
  const [notification, setNotification] = useState<{show: boolean, message: string, type: 'success' | 'error'}>({
    show: false,
    message: '',
    type: 'success'
  });
  const codeInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Show notification function
  const showNotification = (message: string, type: 'success' | 'error' = 'error') => {
    setNotification({ show: true, message, type });
    setTimeout(() => {
      setNotification({ show: false, message: '', type: 'success' });
    }, 3000);
  };

  useEffect(() => {
    router.prefetch('/dashboard');
  }, [router]);

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      try {
        const response = await fetch('http://localhost:8080/api/auth/send-code', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email }),
        });

        const data = await response.json();
        
        if (data.success) {
          setStep("code");
        } else {
          showNotification(data.message || 'Email atau kode verifikasi salah. Silakan coba lagi.');
        }
      } catch (error) {
        showNotification('Gagal terhubung ke server. Silakan coba lagi nanti.');
      }
    }
  };

  useEffect(() => {
    if (step === "code") {
      setTimeout(() => {
        codeInputRefs.current[0]?.focus();
      }, 500);
      // Start countdown timer (60 seconds)
      setResendTimer(60);
      setCanResend(false);
    }
  }, [step]);

  // Countdown timer
  useEffect(() => {
    if (resendTimer > 0) {
      const timer = setTimeout(() => {
        setResendTimer(resendTimer - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (resendTimer === 0 && step === "code") {
      setCanResend(true);
    }
  }, [resendTimer, step]);

  const handleCodeChange = (index: number, value: string) => {
    if (value.length <= 1) {
      const newCode = [...code];
      newCode[index] = value;
      setCode(newCode);
      
      if (value && index < 5) {
        codeInputRefs.current[index + 1]?.focus();
      }
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !code[index] && index > 0) {
      codeInputRefs.current[index - 1]?.focus();
    }
  };

  const handleBackClick = () => {
    setStep("email");
    setCode(["", "", "", "", "", ""]);
  };

  const handleResend = async () => {
    if (!canResend) return;
    
    try {
      const response = await fetch('http://localhost:8080/api/auth/send-code', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();
      
      if (data.success) {
        // Reset timer
        setResendTimer(60);
        setCanResend(false);
        showNotification('Kode verifikasi baru telah dikirim ke email Anda.', 'success');
      } else {
        showNotification(data.message || 'Gagal mengirim kode. Silakan coba lagi.');
      }
    } catch (error) {
      showNotification('Gagal terhubung ke server. Silakan coba lagi nanti.');
    }
  };

  const handleContinue = async () => {
    if (code.every(d => d !== "")) {
      const codeString = code.join("");
      
      try {
        const response = await fetch('http://localhost:8080/api/auth/verify-code', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ 
            email,
            code: codeString 
          }),
        });

        const data = await response.json();
        
        if (data.success) {
          // Store token in cookie (expires in 7 days)
          const expiryDate = new Date();
          expiryDate.setDate(expiryDate.getDate() + 7);
          document.cookie = `auth_token=${data.token}; expires=${expiryDate.toUTCString()}; path=/; SameSite=Strict`;
          
          // Also store in localStorage as backup
          localStorage.setItem('authToken', data.token);
          setStep("success");
        } else {
          showNotification(data.message || 'Email atau kode verifikasi salah.');
        }
      } catch (error) {
        showNotification('Gagal terhubung ke server. Silakan coba lagi nanti.');
      }
    }
  };

  const handleGoToDashboard = () => {
    router.push(redirectPath);
  };

  return (
    <div className="login-container">
      {/* Notification Popup */}
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

      <div className="login-content">
        <AnimatePresence mode="wait">
          {step === "email" && (
            <motion.div
              key="email-step"
              initial={{ opacity: 0, x: -100 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -100 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
            >
              <button 
                type="button" 
                onClick={() => router.back()}
                className="back-button-top"
              >
                <svg 
                  width="24" 
                  height="24" 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="2.5" 
                  strokeLinecap="round" 
                  strokeLinejoin="round"
                >
                  <path d="M19 12H5M12 19l-7-7 7-7"/>
                </svg>
                Home
              </button>

              <div className="login-header">
                <h2 className="login-title">Selamat Datang Kelompok 7</h2>
                <p className="login-subtitle">
                  Lewati Sesi Ini Untuk Masuk Dashboard
                </p>
              </div>
              
              <form className="login-form" onSubmit={handleEmailSubmit}>
                <div className="form-field">
                  <label htmlFor="email" className="form-label">
                    Email address
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    className="form-input"
                    placeholder="your-email@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>

                <button type="submit" className="login-button">
                  Kirim Kode
                </button>
              </form>
            </motion.div>
          )}

          {step === "code" && (
            <motion.div
              key="code-step"
              initial={{ opacity: 0, x: 100 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 100 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
            >
              <div className="code-header">
                <h2 className="code-title">Bersiap Menerima Kode</h2>
                <p className="code-subtitle">Check Emailnya <strong>{email}</strong></p>
              </div>

              <div className="code-input-container">
                <div className="code-inputs">
                  {code.map((digit, i) => (
                    <div key={i} className="code-input-wrapper">
                      <input
                        ref={(el) => {
                          codeInputRefs.current[i] = el;
                        }}
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        maxLength={1}
                        value={digit}
                        onChange={e => handleCodeChange(i, e.target.value)}
                        onKeyDown={e => handleKeyDown(i, e)}
                        className="code-input"
                      />
                      {!digit && <span className="code-placeholder">0</span>}
                      {i < 5 && <span className="code-divider">|</span>}
                    </div>
                  ))}
                </div>
              </div>

              <div className="resend-container">
                <button 
                  type="button" 
                  className="resend-button"
                  onClick={handleResend}
                  disabled={!canResend}
                  style={{
                    opacity: canResend ? 1 : 0.5,
                    cursor: canResend ? 'pointer' : 'not-allowed'
                  }}
                >
                  {canResend ? 'Kirim Ulang' : `Kirim Ulang (${resendTimer}s)`}
                </button>
              </div>

              <div className="code-buttons">
                <button 
                  type="button" 
                  onClick={handleBackClick}
                  className="back-button"
                >
                  <svg 
                    width="20" 
                    height="20" 
                    viewBox="0 0 24 24" 
                    fill="none" 
                    stroke="currentColor" 
                    strokeWidth="2.5" 
                    strokeLinecap="round" 
                    strokeLinejoin="round"
                  >
                    <path d="M19 12H5M12 19l-7-7 7-7"/>
                  </svg>
                  Kembali
                </button>
                <button 
                  type="button"
                  onClick={handleContinue}
                  className={`continue-button ${code.every(d => d !== "") ? 'active' : ''}`}
                  disabled={!code.every(d => d !== "")}
                >
                  Lanjutkan
                </button>
              </div>
            </motion.div>
          )}

          {step === "success" && (
            <motion.div
              key="success-step"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              className="success-container"
            >
              <div className="success-content">
                <h2 className="success-title">Diperbolehkan Akses!</h2>
                <p className="success-subtitle">Selamat Datang</p>
                
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.3, duration: 0.5, type: "spring", stiffness: 200 }}
                  className="success-icon"
                >
                  <svg 
                    width="48" 
                    height="48" 
                    viewBox="0 0 24 24" 
                    fill="none" 
                    stroke="currentColor" 
                    strokeWidth="3" 
                    strokeLinecap="round" 
                    strokeLinejoin="round"
                  >
                    <polyline points="20 6 9 17 4 12"></polyline>
                  </svg>
                </motion.div>

                <motion.button
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6, duration: 0.4 }}
                  className="dashboard-button"
                  onClick={handleGoToDashboard}
                >
                  Lanjut Ke Dashboard
                </motion.button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
