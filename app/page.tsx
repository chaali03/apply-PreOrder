export default function Home() {
  return (
    <>
      <div className="grain-overlay" />

      <header className="header">
        <div className="logo">VIBE*BISTRO</div>
        <nav>
          <a href="#">Menu</a>
          <a href="#">Vibe Check</a>
          <a href="#">Events</a>
          <a href="#">Locations</a>
        </nav>
        <button className="btn-cta">Book a Table</button>
      </header>

      <main>
        <section className="hero">
          <div className="hero-content">
            <h1 className="hero-title">
              NO CAP,
              <br />
              JUST <span>FLAVOR</span>
            </h1>
            <p className="text-base md:text-lg lg:text-xl mb-8 md:mb-10 leading-relaxed text-[#555]">
              Serving 70s aesthetics with a modern twist. Locally sourced, highkey delicious, and strictly for the
              vibers.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 sm:gap-5">
              <button className="btn-cta" style={{ background: "var(--primary)", color: "white" }}>
                Order Now
              </button>
              <button className="btn-cta" style={{ background: "white" }}>
                View Menu
              </button>
            </div>
          </div>
          <div className="hero-img">
            <div className="sticker">
              FRESH AF
              <br />
              EVERY DAY
            </div>
            <div className="floating-tag hidden md:block" style={{ top: "20%", left: "10%" }}>
              #AESTHETIC
            </div>
            <div className="floating-tag hidden md:block" style={{ bottom: "30%", right: "20%" }}>
              LOWKEY FIRE
            </div>
          </div>
        </section>

        <div className="marquee">
          <div className="marquee-content">
            &nbsp; ★ BURGERS THAT SLAP ★ CRAFT COCKTAILS ★ RETRO VIBES ONLY ★ OPEN UNTIL 2AM ★ BEST IN THE CITY ★
            BURGERS THAT SLAP ★ CRAFT COCKTAILS ★ RETRO VIBES ONLY ★ OPEN UNTIL 2AM ★ BEST IN THE CITY
          </div>
        </div>

        <section className="section-padding">
          <div className="section-header">
            <h2 className="section-title">CHEF'S FAVORITES</h2>
            <a
              href="#"
              className="text-sm md:text-base"
              style={{ color: "var(--dark)", fontWeight: 800, textTransform: "uppercase" }}
            >
              See Full Menu →
            </a>
          </div>

          <div className="menu-grid">
            {/* Item 1 */}
            <div className="menu-card">
              <span className="menu-tag">Best Seller</span>
              <img
                src="https://images.unsplash.com/photo-1568901346375-23c9450c58cd?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80"
                alt="The OG Burger"
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
                  <h3>The OG Burger</h3>
                  <span className="price">$14</span>
                </div>
                <p style={{ fontSize: "14px", color: "#666" }}>
                  Triple-smashed wagyu beef, secret vibe sauce, pickles on brioche.
                </p>
              </div>
            </div>

            {/* Item 2 */}
            <div className="menu-card">
              <span className="menu-tag" style={{ background: "var(--secondary)" }}>
                Spicy
              </span>
              <img
                src="https://images.unsplash.com/photo-1513104890138-7c749659a591?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80"
                alt="Neon Pizza"
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
                  <h3>Electric Pepperoni</h3>
                  <span className="price">$18</span>
                </div>
                <p style={{ fontSize: "14px", color: "#666" }}>Double pepperoni, hot honey drizzle, fermented dough.</p>
              </div>
            </div>

            {/* Item 3 */}
            <div className="menu-card">
              <span className="menu-tag" style={{ background: "var(--accent)", color: "var(--dark)" }}>
                Popular
              </span>
              <img
                src="https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80"
                alt="Disco Sour"
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
                  <h3>Disco Sour</h3>
                  <span className="price">$12</span>
                </div>
                <p style={{ fontSize: "14px", color: "#666" }}>
                  Gin, butterfly pea, elderflower, and gold glitter edible dust.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="retro-vibe">
          <div>
            <h2 className="vibe-title">THE VIBE CHECK IS PASSED.</h2>
            <p className="vibe-text">
              We don't just do food. We do moments. From the curated 90s hip-hop playlist to the 70s diner seats, every
              corner is designed for your next dump. No reservations needed for the main room, just bring the energy.
            </p>
            <button className="btn-cta" style={{ background: "var(--dark)", color: "white", borderColor: "white" }}>
              Our Story
            </button>
          </div>
          <div className="vibe-img"></div>
        </section>

        <section className="section-padding">
          <h2 className="section-title" style={{ marginBottom: "40px", textAlign: "center" }}>
            @VIBE.BISTRO
          </h2>
          <div className="social-grid">
            <div className="social-item">
              <img
                src="https://images.unsplash.com/photo-1467003909585-2f8a72700288?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80"
                alt="Insta 1"
              />
            </div>
            <div className="social-item">
              <img
                src="https://images.unsplash.com/photo-1534353473418-4cfa6c56fd38?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80"
                alt="Insta 2"
              />
            </div>
            <div className="social-item">
              <img
                src="https://images.unsplash.com/photo-1497034825429-c343d7c6a68f?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80"
                alt="Insta 3"
              />
            </div>
            <div className="social-item">
              <img
                src="https://images.unsplash.com/photo-1559339352-11d035aa65de?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80"
                alt="Insta 4"
              />
            </div>
          </div>
        </section>
      </main>

      <footer>
        <div>
          <div className="footer-logo">VIBE*BISTRO</div>
          <p style={{ color: "#666", lineHeight: 1.6 }}>
            Your local spot for high-fidelity food and low-fidelity vibes. Since 2024 but feels like 1974.
          </p>
        </div>
        <div className="footer-links">
          <h4>Nav</h4>
          <ul>
            <li>
              <a href="#" style={{ color: "inherit", textDecoration: "none" }}>
                Menu
              </a>
            </li>
            <li>
              <a href="#" style={{ color: "inherit", textDecoration: "none" }}>
                About
              </a>
            </li>
            <li>
              <a href="#" style={{ color: "inherit", textDecoration: "none" }}>
                Privacy
              </a>
            </li>
            <li>
              <a href="#" style={{ color: "inherit", textDecoration: "none" }}>
                Terms
              </a>
            </li>
          </ul>
        </div>
        <div className="footer-links">
          <h4>Hours</h4>
          <ul>
            <li>Tue-Thu: 12pm - 11pm</li>
            <li>Fri-Sat: 12pm - 2am</li>
            <li>Sun: 11am - 9pm</li>
            <li>Mon: Closed (Mental Health Day)</li>
          </ul>
        </div>
        <div className="footer-bottom">
          <span>© 2025 VIBE BISTRO GROUP</span>
          <span>DESIGNED BY 1UI.DEV & BUILT USING v0</span>
          <span>IG / TW / TK</span>
        </div>
      </footer>
    </>
  )
}
