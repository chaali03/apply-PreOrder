"use client";

import Link from 'next/link';
import MobileMenu from '../../components/ui/mobile-menu';
import CurvedMenu from '../../components/ui/curved-menu';
import './locations.css';

export default function LocationsPage() {
  const location = {
    name: "SMK Taruna Bhakti",
    address: "Jl. Raya Bogor KM 28, Cimanggis, Depok, Jawa Barat 16953",
    phone: "+62 819-1620-3644",
    hours: "Buka Setiap Hari Operasional TB",
    googleMapsUrl: "https://www.google.com/maps/place/SMK+Taruna+Bhakti/@-6.3644444,106.8644444,17z",
    embedUrl: "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3964.8!2d106.8644444!3d-6.3644444!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x2e69ed0b0b0b0b0b%3A0x0!2sSMK%20Taruna%20Bhakti!5e0!3m2!1sen!2sid!4v1234567890"
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
          <Link href="/locations">Locations</Link>
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
        <section className="location-hero">
          <div className="location-hero-content">
            <h1 className="location-hero-title">
              LOKASI
              <br />
              <span>KAMI</span>
            </h1>
            <p className="location-hero-subtitle">
              Temukan kami dan nikmati menu favorit Anda
            </p>
          </div>
        </section>

        {/* Map Section */}
        <section className="map-section">
          <div className="map-container">
            <iframe
              src="https://maps.google.com/maps?q=SMK+Taruna+Bhakti+Depok&t=&z=15&ie=UTF8&iwloc=&output=embed"
              width="100%"
              height="100%"
              style={{ border: 0 }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              title="SMK Taruna Bhakti Location"
            ></iframe>
          </div>
        </section>

        {/* Location Info */}
        <section className="location-info-section">
          <div className="location-info-container">
            <div className="location-card">
              <div className="location-card-header">
                <h2>{location.name}</h2>
                <div className="location-badge">Lokasi Utama</div>
              </div>

              <div className="location-details">
                <div className="location-detail-item">
                  <div className="location-icon">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                      <circle cx="12" cy="10" r="3"></circle>
                    </svg>
                  </div>
                  <div className="location-detail-content">
                    <h3>Alamat</h3>
                    <p>{location.address}</p>
                  </div>
                </div>

                <div className="location-detail-item">
                  <div className="location-icon">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
                    </svg>
                  </div>
                  <div className="location-detail-content">
                    <h3>Telepon</h3>
                    <p>{location.phone}</p>
                  </div>
                </div>

                <div className="location-detail-item">
                  <div className="location-icon">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10"></circle>
                      <polyline points="12 6 12 12 16 14"></polyline>
                    </svg>
                  </div>
                  <div className="location-detail-content">
                    <h3>Jam Operasional</h3>
                    <p>{location.hours}</p>
                  </div>
                </div>
              </div>

              <div className="location-actions">
                <a 
                  href={location.googleMapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="location-btn primary"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                    <circle cx="12" cy="10" r="3"></circle>
                  </svg>
                  Buka di Google Maps
                </a>
                <a 
                  href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(location.address)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="location-btn secondary"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="9 18 15 12 9 6"></polyline>
                  </svg>
                  Dapatkan Arah
                </a>
              </div>
            </div>

            {/* Additional Info */}
            <div className="additional-info">
              <div className="info-card">
                <div className="info-icon">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                    <polyline points="9 22 9 12 15 12 15 22"></polyline>
                  </svg>
                </div>
                <h3>Lokasi Strategis</h3>
                <p>Mudah diakses dari berbagai area di Depok dan sekitarnya</p>
              </div>

              <div className="info-card">
                <div className="info-icon">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="1" y="3" width="15" height="13"></rect>
                    <polygon points="16 8 20 8 23 11 23 16 16 16 16 8"></polygon>
                    <circle cx="5.5" cy="18.5" r="2.5"></circle>
                    <circle cx="18.5" cy="18.5" r="2.5"></circle>
                  </svg>
                </div>
                <h3>Delivery Available</h3>
                <p>Kami siap mengantar pesanan Anda ke lokasi Anda</p>
              </div>

              <div className="info-card">
                <div className="info-icon">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                    <circle cx="9" cy="7" r="4"></circle>
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                    <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                  </svg>
                </div>
                <h3>Pelayanan Ramah</h3>
                <p>Tim kami siap melayani dengan senyuman</p>
              </div>
            </div>
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
            <li><Link href="/locations">Location</Link></li>
          </ul>
        </div>
        <div className="footer-links">
          <h4>BUKA</h4>
          <ul>
            <li>Buka Setiap Hari Operasional TB</li>
          </ul>
        </div>
        <div className="footer-bottom">
          <span>© 2025 SCAFF.FOOD GROUP</span>
          <span>DESIGNED BY MAMAD RPL4</span>

        </div>
      </footer>

      <CurvedMenu />
    </>
  );
}
