"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";

export default function DashboardLayout({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const starsRef = useRef(null);

  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  /* ---------- auth guard ---------- */
  useEffect(() => {
    const token = localStorage.getItem("bot_id");
    const raw = localStorage.getItem("bot_settings");

    if (!token) {
      router.replace("/");
      return;
    }

    let settings = {};
    try {
      settings = raw ? JSON.parse(raw) : {};
    } catch {
      settings = {};
    }

    setUser({
      id: token,
      name: settings?.name || settings?.botName || "Bot User",
    });
    setReady(true);
  }, [router]);

  /* ---------- stars background ---------- */
  useEffect(() => {
    const container = starsRef.current;
    if (!container) return;
    container.innerHTML = "";
    for (let i = 0; i < 60; i++) {
      const star = document.createElement("div");
      star.className = "dash-star";
      const size = Math.random() * 2 + 1;
      star.style.width = size + "px";
      star.style.height = size + "px";
      star.style.left = Math.random() * 100 + "%";
      star.style.top = Math.random() * 100 + "%";
      star.style.animationDuration = Math.random() * 5 + 3 + "s";
      star.style.animationDelay = Math.random() * 8 + "s";
      container.appendChild(star);
    }
  }, []);

  /* ---------- close menus on route change ---------- */
  useEffect(() => {
    setMobileMenuOpen(false);
    setUserMenuOpen(false);
  }, [pathname]);

  /* ---------- close user menu on outside click ---------- */
  useEffect(() => {
    function onClick(e) {
      if (!e.target.closest(".user-menu-wrap")) {
        setUserMenuOpen(false);
      }
    }
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, []);

  function logout() {
    localStorage.removeItem("bot_id");
    localStorage.removeItem("bot_pass");
    localStorage.removeItem("bot_settings");
    router.replace("/");
  }

  if (!ready || !user) {
    return (
      <div className="dash-loader">
        <div className="dash-loader-spinner" />
        <p>Loading your dashboard...</p>
      </div>
    );
  }

  const navItems = [
    { href: "/dashboard", label: "Commands", icon: "fa-layer-group" },
    { href: "/dashboard/create", label: "Create", icon: "fa-plus" },
  ];

  return (
    <>
      <style jsx global>{`
        /* ---------- RESET ---------- */
        * { margin: 0; padding: 0; box-sizing: border-box; }

        body {
          font-family: var(--font-inter), "Inter", sans-serif;
          background: #0a0a0f;
          color: #fff;
          min-height: 100vh;
          overflow-x: hidden;
        }

        /* ---------- LOADER ---------- */
        .dash-loader {
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 16px;
          color: rgba(255, 255, 255, 0.5);
          font-size: 0.85rem;
          background: radial-gradient(circle at center, #0a1a2d 0%, #000 100%);
        }
        .dash-loader-spinner {
          width: 44px;
          height: 44px;
          border: 3px solid rgba(59, 130, 246, 0.15);
          border-top-color: #3b82f6;
          border-radius: 50%;
          animation: dashSpin 0.9s linear infinite;
        }
        @keyframes dashSpin { to { transform: rotate(360deg); } }

        /* ---------- ROOT ---------- */
        .dash-root {
          position: relative;
          min-height: 100vh;
          background: radial-gradient(circle at center, #0a1a2d 0%, #000 100%);
        }

        /* ---------- BACKGROUNDS ---------- */
        .dash-stars {
          position: fixed;
          inset: 0;
          z-index: 0;
          pointer-events: none;
        }
        .dash-star {
          position: absolute;
          background: #b6e3ff;
          border-radius: 50%;
          opacity: 0.5;
          animation: dashMove linear infinite;
        }
        @keyframes dashMove {
          0% { transform: translateY(100vh) scale(0); opacity: 0; }
          10% { opacity: 0.8; }
          90% { opacity: 0.8; }
          100% { transform: translateY(-10vh) scale(1); opacity: 0; }
        }

        .dash-grid {
          position: fixed;
          inset: 0;
          z-index: 0;
          pointer-events: none;
          background-image:
            linear-gradient(rgba(0, 100, 255, 0.04) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0, 100, 255, 0.04) 1px, transparent 1px);
          background-size: 55px 55px;
        }

        .dash-blob {
          position: fixed;
          width: 500px;
          height: 500px;
          background: radial-gradient(circle, #3b82f6, #06b6d4);
          filter: blur(120px);
          border-radius: 50%;
          opacity: 0.05;
          top: -150px;
          right: -150px;
          animation: dashFloat 20s infinite alternate;
          z-index: 0;
          pointer-events: none;
        }
        .dash-blob-2 {
          position: fixed;
          width: 400px;
          height: 400px;
          background: radial-gradient(circle, #06b6d4, #3b82f6);
          filter: blur(140px);
          border-radius: 50%;
          opacity: 0.04;
          bottom: -150px;
          left: -150px;
          animation: dashFloat 25s infinite alternate-reverse;
          z-index: 0;
          pointer-events: none;
        }
        @keyframes dashFloat {
          0% { transform: translate(0, 0) scale(1); }
          100% { transform: translate(-80px, 80px) scale(1.3); }
        }

        /* ---------- NAVBAR ---------- */
        .dash-navbar {
          position: sticky;
          top: 0;
          z-index: 100;
          background: rgba(8, 15, 30, 0.7);
          backdrop-filter: blur(22px);
          -webkit-backdrop-filter: blur(22px);
          border-bottom: 1px solid rgba(0, 150, 255, 0.12);
        }

        .dash-nav-inner {
          max-width: 1300px;
          margin: 0 auto;
          padding: 14px 24px;
          display: flex;
          align-items: center;
          gap: 20px;
        }

        /* Brand */
        .dash-brand {
          display: flex;
          align-items: center;
          gap: 12px;
          text-decoration: none;
          flex-shrink: 0;
        }
        .dash-brand-logo {
          width: 38px;
          height: 38px;
          border-radius: 50%;
          overflow: hidden;
          border: 2px solid rgba(0, 150, 255, 0.4);
          box-shadow: 0 0 20px rgba(0, 150, 255, 0.2);
          flex-shrink: 0;
          position: relative;
        }
        .dash-brand-logo img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }
        .dash-brand-logo::before {
          content: "";
          position: absolute;
          inset: -3px;
          border-radius: 50%;
          background: conic-gradient(from 0deg, transparent, #3b82f6, transparent, #06b6d4, transparent);
          z-index: -1;
          animation: dashSpinRing 4s linear infinite;
          opacity: 0.6;
        }
        @keyframes dashSpinRing {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        .dash-brand-text {
          display: flex;
          flex-direction: column;
          line-height: 1;
        }
        .dash-brand-name {
          font-size: 1.05rem;
          font-weight: 900;
          letter-spacing: -0.3px;
        }
        .dash-brand-name .blue {
          background: linear-gradient(135deg, #3b82f6, #06b6d4);
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
        }
        .dash-brand-name .white { color: #fff; }
        .dash-brand-sub {
          font-size: 0.55rem;
          font-weight: 500;
          color: rgba(255, 255, 255, 0.3);
          letter-spacing: 2px;
          text-transform: uppercase;
          margin-top: 2px;
        }

        /* Nav links */
        .dash-nav-links {
          display: flex;
          align-items: center;
          gap: 6px;
          margin-left: 20px;
          flex: 1;
        }
        .dash-nav-link {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 9px 16px;
          border-radius: 30px;
          font-size: 0.82rem;
          font-weight: 600;
          color: rgba(255, 255, 255, 0.5);
          text-decoration: none;
          transition: all 0.25s ease;
          border: 1px solid transparent;
        }
        .dash-nav-link i {
          font-size: 0.85rem;
        }
        .dash-nav-link:hover {
          color: #fff;
          background: rgba(59, 130, 246, 0.08);
        }
        .dash-nav-link.active {
          color: #fff;
          background: linear-gradient(135deg, rgba(59, 130, 246, 0.2), rgba(6, 182, 212, 0.15));
          border-color: rgba(59, 130, 246, 0.3);
          box-shadow: 0 4px 15px rgba(59, 130, 246, 0.15);
        }

        /* Right side */
        .dash-nav-right {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-left: auto;
        }

        .user-menu-wrap {
          position: relative;
        }
        .user-chip {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 6px 14px 6px 6px;
          border-radius: 30px;
          background: rgba(0, 0, 0, 0.3);
          border: 1px solid rgba(255, 255, 255, 0.06);
          cursor: pointer;
          transition: all 0.2s ease;
          font-family: inherit;
          color: #fff;
        }
        .user-chip:hover {
          border-color: rgba(59, 130, 246, 0.3);
          background: rgba(59, 130, 246, 0.08);
        }

        .user-avatar {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: linear-gradient(135deg, #3b82f6, #06b6d4);
          display: grid;
          place-items: center;
          color: #000;
          font-weight: 900;
          font-size: 0.85rem;
          flex-shrink: 0;
        }
        .user-chip-info {
          display: flex;
          flex-direction: column;
          line-height: 1;
          text-align: left;
        }
        .user-chip-name {
          font-size: 0.78rem;
          font-weight: 700;
          color: #fff;
        }
        .user-chip-id {
          font-size: 0.62rem;
          color: rgba(255, 255, 255, 0.4);
          margin-top: 2px;
        }
        .user-chip > i {
          font-size: 0.65rem;
          color: rgba(255, 255, 255, 0.3);
          margin-left: 4px;
          transition: transform 0.2s ease;
        }
        .user-chip.open > i {
          transform: rotate(180deg);
        }

        /* User dropdown */
        .user-dropdown {
          position: absolute;
          top: calc(100% + 10px);
          right: 0;
          min-width: 220px;
          background: rgba(12, 18, 32, 0.95);
          backdrop-filter: blur(22px);
          -webkit-backdrop-filter: blur(22px);
          border: 1px solid rgba(0, 150, 255, 0.15);
          border-radius: 16px;
          padding: 8px;
          box-shadow: 0 20px 50px rgba(0, 0, 0, 0.6);
          opacity: 0;
          visibility: hidden;
          transform: translateY(-6px);
          transition: all 0.2s ease;
        }
        .user-dropdown.open {
          opacity: 1;
          visibility: visible;
          transform: translateY(0);
        }

        .dropdown-header {
          padding: 12px 14px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.06);
          margin-bottom: 6px;
        }
        .dropdown-header .name {
          font-size: 0.85rem;
          font-weight: 700;
          color: #fff;
        }
        .dropdown-header .id {
          font-size: 0.7rem;
          color: rgba(255, 255, 255, 0.4);
          margin-top: 2px;
        }

        .dropdown-item {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 10px 14px;
          border-radius: 10px;
          font-size: 0.82rem;
          font-weight: 500;
          color: rgba(255, 255, 255, 0.7);
          text-decoration: none;
          background: none;
          border: none;
          width: 100%;
          text-align: left;
          cursor: pointer;
          transition: all 0.15s ease;
          font-family: inherit;
        }
        .dropdown-item:hover {
          background: rgba(59, 130, 246, 0.1);
          color: #fff;
        }
        .dropdown-item.danger {
          color: #f87171;
        }
        .dropdown-item.danger:hover {
          background: rgba(239, 68, 68, 0.1);
          color: #fca5a5;
        }
        .dropdown-item i {
          width: 16px;
          text-align: center;
        }

        /* Mobile toggle */
        .mobile-toggle {
          display: none;
          width: 40px;
          height: 40px;
          border-radius: 12px;
          background: rgba(0, 0, 0, 0.3);
          border: 1px solid rgba(255, 255, 255, 0.06);
          color: #fff;
          font-size: 1rem;
          cursor: pointer;
          align-items: center;
          justify-content: center;
        }

        /* ---------- MAIN CONTENT ---------- */
        .dash-main {
          position: relative;
          z-index: 10;
          max-width: 1300px;
          margin: 0 auto;
          padding: 32px 24px 80px 24px;
        }

        /* ---------- MOBILE ---------- */
        @media (max-width: 768px) {
          .dash-nav-inner {
            padding: 12px 16px;
            gap: 12px;
          }
          .dash-brand-sub { display: none; }

          .mobile-toggle { display: flex; }

          .dash-nav-links {
            position: absolute;
            top: 100%;
            left: 0;
            right: 0;
            flex-direction: column;
            align-items: stretch;
            margin: 0;
            padding: 12px 16px 16px 16px;
            gap: 4px;
            background: rgba(8, 15, 30, 0.98);
            backdrop-filter: blur(22px);
            border-bottom: 1px solid rgba(0, 150, 255, 0.15);
            transform: translateY(-10px);
            opacity: 0;
            visibility: hidden;
            transition: all 0.25s ease;
          }
          .dash-nav-links.open {
            transform: translateY(0);
            opacity: 1;
            visibility: visible;
          }
          .dash-nav-link {
            padding: 12px 16px;
            border-radius: 12px;
          }

          .user-chip-info { display: none; }
          .user-chip { padding: 6px; }
          .user-chip > i { display: none; }

          .dash-main {
            padding: 20px 16px 60px 16px;
          }
        }

        /* ---------- BUTTONS (shared) ---------- */
        .btn {
          padding: 11px 20px;
          border-radius: 30px;
          border: 1px solid rgba(255, 255, 255, 0.08);
          background: rgba(255, 255, 255, 0.03);
          color: #fff;
          cursor: pointer;
          font-size: 0.85rem;
          font-weight: 600;
          font-family: inherit;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          transition: all 0.2s ease;
          text-decoration: none;
        }
        .btn:hover:not(:disabled) {
          background: rgba(255, 255, 255, 0.06);
        }
        .btn:disabled { opacity: 0.4; cursor: not-allowed; }
        .btn-primary {
          background: linear-gradient(135deg, #3b82f6, #06b6d4);
          border-color: transparent;
          color: #000;
          box-shadow: 0 4px 25px rgba(59, 130, 246, 0.2);
        }
        .btn-primary:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 12px 40px rgba(59, 130, 246, 0.4);
        }
        .btn-danger {
          background: rgba(239, 68, 68, 0.1);
          border-color: rgba(239, 68, 68, 0.2);
          color: #f87171;
        }
        .btn-danger:hover:not(:disabled) {
          background: rgba(239, 68, 68, 0.2);
        }
      `}</style>

      <div className="dash-root">
        {/* Backgrounds */}
        <div className="dash-stars" ref={starsRef} />
        <div className="dash-grid" />
        <div className="dash-blob" />
        <div className="dash-blob-2" />

        {/* ========== NAVBAR ========== */}
        <nav className="dash-navbar">
          <div className="dash-nav-inner">
            {/* Brand */}
            <Link href="/dashboard" className="dash-brand">
              <div className="dash-brand-logo">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="https://www.zanta-mini.store/src/zanta.png"
                  alt="ZANTA"
                />
              </div>
              <div className="dash-brand-text">
                <div className="dash-brand-name">
                  <span className="blue">ZANTA</span>
                  <span className="white">-MD</span>
                </div>
                <div className="dash-brand-sub">Bot Manager</div>
              </div>
            </Link>

            {/* Desktop links + mobile dropdown */}
            <div
              className={`dash-nav-links ${
                mobileMenuOpen ? "open" : ""
              }`}
            >
              {navItems.map((item) => {
                const active = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`dash-nav-link ${active ? "active" : ""}`}
                  >
                    <i className={`fas ${item.icon}`} />
                    {item.label}
                  </Link>
                );
              })}
            </div>

            {/* Right */}
            <div className="dash-nav-right">
              {/* Mobile menu button */}
              <button
                className="mobile-toggle"
                onClick={() => setMobileMenuOpen((v) => !v)}
                aria-label="Toggle menu"
              >
                <i
                  className={`fas ${
                    mobileMenuOpen ? "fa-times" : "fa-bars"
                  }`}
                />
              </button>

              {/* User menu */}
              <div className="user-menu-wrap">
                <button
                  className={`user-chip ${
                    userMenuOpen ? "open" : ""
                  }`}
                  onClick={(e) => {
                    e.stopPropagation();
                    setUserMenuOpen((v) => !v);
                  }}
                >
                  <div className="user-avatar">
                    {(user.name || "U")[0].toUpperCase()}
                  </div>
                  <div className="user-chip-info">
                    <div className="user-chip-name">{user.name}</div>
                    <div className="user-chip-id">{user.id}</div>
                  </div>
                  <i className="fas fa-chevron-down" />
                </button>

                <div
                  className={`user-dropdown ${
                    userMenuOpen ? "open" : ""
                  }`}
                >
                  <div className="dropdown-header">
                    <div className="name">{user.name}</div>
                    <div className="id">{user.id}</div>
                  </div>

                  <Link
                    href="/dashboard"
                    className="dropdown-item"
                    onClick={() => setUserMenuOpen(false)}
                  >
                    <i className="fas fa-layer-group" />
                    My Commands
                  </Link>

                  <Link
                    href="/dashboard/create"
                    className="dropdown-item"
                    onClick={() => setUserMenuOpen(false)}
                  >
                    <i className="fas fa-plus" />
                    Create Command
                  </Link>

                  <div
                    style={{
                      height: 1,
                      background: "rgba(255,255,255,0.06)",
                      margin: "6px 4px",
                    }}
                  />

                  <button
                    className="dropdown-item danger"
                    onClick={logout}
                  >
                    <i className="fas fa-sign-out-alt" />
                    Logout
                  </button>
                </div>
              </div>
            </div>
          </div>
        </nav>

        {/* ========== MAIN ========== */}
        <main className="dash-main">{children}</main>
      </div>
    </>
  );
}
