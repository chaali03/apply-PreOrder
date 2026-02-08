import CurvedMenu from '../components/ui/curved-menu'
import MobileMenu from '../components/ui/mobile-menu'
import Link from 'next/link'

export default function Home() {
  return (
    <>
      <div className="grain-overlay" />

      <header className="header">
        <div className="logo">SCAFF*FOOD</div>
        <nav>
          <a href="#">Home</a>
          <a href="#">Menu</a>
          <a href="#">Kurir</a>
          <a href="#">Locations</a>
        </nav>
        
        <button className="btn-cta hidden md:block" style={{ padding: "8px 16px", fontSize: "12px", marginLeft: "20px" }}>
          <Link href="/login" style={{ textDecoration: "none", color: "inherit" }}>
            Login Admin
          </Link>
        </button>
        <MobileMenu />
      </header>

      <main>
        <section className="hero">
          <div className="hero-content" style={{ justifyContent: "flex-start", paddingTop: "60px", display: "flex", flexDirection: "column" }}>
            <h1 className="hero-title">
              FOKUS RASA,
              <br />
              ENAK,
              <br className="md:hidden" />
              <span>TITIK</span>
            </h1>
            <p className="text-base md:text-lg lg:text-xl mb-8 md:mb-12 leading-relaxed text-[#555]">
            Setiap menu disiapkan dengan bahan berkualitas dan perhatian pada detail, untuk menghadirkan rasa yang bisa dinikmati kapan saja.
            </p>
            <div className="flex flex-row gap-6 sm:gap-5" style={{ marginTop: "auto" }}>
              <button className="btn-cta" style={{ background: "var(--primary)", color: "white" }}>
                Order Sekarang
              </button>
              <button className="btn-cta" style={{ background: "white" }}>
                Lihat Menu
              </button>
            </div>
          </div>
          <div className="hero-img">
            <div className="sticker">
              DIJAMIN
              <br />
              NAGIH!!
            </div>
            <div className="floating-tag hidden md:block" style={{ top: "20%", left: "10%" }}>
              #ENAK POKONYA
            </div>
            <div className="floating-tag hidden md:block" style={{ bottom: "30%", right: "20%" }}>
              ADALAH POKONYA
            </div>
          </div>
        </section>

        <div className="marquee">
          <div className="marquee-content">
            &nbsp; ★ BIKIN NAGIH ★ ADALAH POKONYA ★ RASANYA MASUK ★ JANGAN LUPA PO ★ TERBAIK DI TB ★
           BIKIN NAGIH ★ ADALAH POKONYA ★ RASANYA MASUK ★ JANGAN LUPA PO ★ TERBAIK DI TB
          </div>
        </div>

        <section className="section-padding">
          <div className="section-header">
            <h2 className="section-title">SCAFF MENU</h2>
            <a
              href="#"
              className="text-sm md:text-base"
              style={{ color: "var(--dark)", fontWeight: 800, textTransform: "uppercase" }}
            >
              Lihat Semua Menu →
            </a>
          </div>

          <div className="menu-grid">
            {/* Item 1 */}
            <div className="menu-card">
              <span className="menu-tag">Mantul</span>
              <img
                src="/produk/Cookies.jpeg"
                alt="Cookies"
              />
              <div className="menu-card-body">
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: "10px",
                  }}
                >
                  <h3>Cookies</h3>
                  <span className="price">Rp 5.000</span>
                </div>
                <p style={{ fontSize: "14px", color: "#666" }}>
                 Cookies panggang maksimal, cokelat lumer, resep rahasia khas kami, empuk dan wangi.
                </p>
              </div>
            </div>

            {/* Item 2 */}
            <div className="menu-card">
              <span className="menu-tag" style={{ background: "var(--secondary)" }}>
                Wenak
              </span>
              <img
                src="/produk/UdangKeju.jpeg"
                alt="Udang Keju"
              />
              <div className="menu-card-body">
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: "10px",
                  }}
                >
                  <h3>Udang Keju 3pcs</h3>
                  <span className="price">Rp 10.000</span>
                </div>
                <p style={{ fontSize: "14px", color: "#666" }}>Udang keju dengan isian daging ayam dan udang, dibalut adonan renyah dan keju lumer yang meleleh di setiap gigitan.</p>
              </div>
            </div>
          </div>
        </section>

        <section className="retro-vibe">
          <div>
            <h2 className="vibe-title">PAS DI LIDAH.</h2>
            <p className="vibe-text">
              Kami percaya rasa yang baik adalah rasa yang terasa pas. Karena itu, setiap menu disiapkan dengan perhatian pada detail, pemilihan bahan yang tepat, dan proses yang konsisten, agar setiap sajian menghadirkan pengalaman makan yang nyaman dan berkesan.
            </p>
          </div>
          <div className="vibe-img"></div>
        </section>

        <section className="section-padding">
          <h2 className="section-title text-base md:text-5xl lg:text-6xl text-left md:text-center pl-5 md:pl-0" style={{ marginBottom: "40px" }}>
            @MY.KELOMPOK.
          </h2>
          <div className="social-grid">
            <div className="social-item">
              <div className="w-full h-full bg-gray-200 flex items-center justify-center text-gray-400 font-bold">
                FAIHA
              </div>
            </div>
            <div className="social-item">
              <div className="w-full h-full bg-gray-200 flex items-center justify-center text-gray-400 font-bold">
                FIRAS
              </div>
            </div>
            <div className="social-item">
              <div className="w-full h-full bg-gray-200 flex items-center justify-center text-gray-400 font-bold">
                MAMAD
              </div>
            </div>
            <div className="social-item">
              <div className="w-full h-full bg-gray-200 flex items-center justify-center text-gray-400 font-bold">
                CHIKA
              </div>
            </div>
            <div className="social-item">
              <div className="w-full h-full bg-gray-200 flex items-center justify-center text-gray-400 font-bold">
                SATRIO
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer>
        <div>
          <div className="footer-logo">SCAFF*FOOD</div>
          <p style={{ color: "#666", lineHeight: 1.6 }}>
            Dari dapur , kami menghadirkan menu dengan rasa yang konsisten dan nuansa yang hangat.
          </p>
        </div>
        <div className="footer-links">
          <h4>Nav</h4>
          <ul>
            <li>
              <a href="#" style={{ color: "inherit", textDecoration: "none" }}>
                Home
              </a>
            </li>
            <li>
              <a href="#" style={{ color: "inherit", textDecoration: "none" }}>
                Menu
              </a>
            </li>
            <li>
              <a href="#" style={{ color: "inherit", textDecoration: "none" }}>
                Kurir
              </a>
            </li>
            <li>
              <a href="#" style={{ color: "inherit", textDecoration: "none" }}>
                Location
              </a>
            </li>
          </ul>
        </div>
        <div className="footer-links">
          <h4>BUKA</h4>
          <ul>
            <li>Buka Setiap Hari Operasional TB</li>
          </ul>
        </div>
        <div className="footer-bottom">
          <span>© 2025 VSCAFF.FOOD GROUP</span>
          <span>DESIGNED BY MAMAD RPL4</span>
          <span>IG / TW / TK</span>
        </div>
      </footer>

      {/* Mobile Curved Menu */}
      <CurvedMenu />
    </>
  )
}
