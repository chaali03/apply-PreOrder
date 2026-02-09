"use client";

import './login.css';
import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function LoginPage() {
  const [step, setStep] = useState<"email" | "code" | "success">("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const codeInputRefs = useRef<(HTMLInputElement | null)[]>([]);

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
          alert(data.message || 'Email atau kode verifikasi salah. Silakan coba lagi.');
        }
      } catch (error) {
        alert('Gagal terhubung ke server. Silakan coba lagi nanti.');
      }
    }
  };

  // Focus first input when code screen appears
  useEffect(() => {
    if (step === "code") {
      setTimeout(() => {
        codeInputRefs.current[0]?.focus();
      }, 500);
    }
  }, [step]);

  const handleCodeChange = (index: number, value: string) => {
    if (value.length <= 1) {
      const newCode = [...code];
      newCode[index] = value;
      setCode(newCode);
      
      // Focus next input if value is entered
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
          // Store token in localStorage
          localStorage.setItem('authToken', data.token);
          setStep("success");
        } else {
          alert(data.message || 'Email atau kode verifikasi salah.');
        }
      } catch (error) {
        alert('Gagal terhubung ke server. Silakan coba lagi nanti.');
      }
    }
  };

  return (
    <div className="login-container">
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
                onClick={() => window.history.back()}
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
                <button type="button" className="resend-button">
                  Kirim Ulang
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
                  onClick={() => window.location.href = '/dashboard'}
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
