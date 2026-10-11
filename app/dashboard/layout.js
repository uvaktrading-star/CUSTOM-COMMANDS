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

  /* ---------- auth guard + load botName ---------- */
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

    // 🔥 botName priority: settings.botName → settings.name → "ᴢᴀɴᴛᴀ-ᴍɪɴɪ"
    const botName =
      settings?.botName ||
      settings?.name ||
      "ᴢᴀɴᴛᴀ-ᴍɪɴɪ";

    setUser({
      id: token,
      name: botName,
      ownerName: settings?.ownerName || "",
      botImage: settings?.botImage || "https://www.zanta-mini.store/src/zanta.png",
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

        /* ======================================================
           🎨 NEW NAVBAR — floating, rounded, glass
           ====================================================== */
        .dash-navbar-wrap {
          position: sticky;
          top: 0;
          z-index: 100;
          padding: 14px 20px 0 20px;
        }

        .dash-navbar {
          max-width: 1300px;
          margin: 0 auto;
          background: rgba(8, 15, 30, 0.72);
          backdrop-filter: blur(24px);
          -webkit-backdrop-filter: blur(24px);
          border: 1px solid rgba(0, 150, 255, 0.15);
          border-radius: 22px;
          box-shadow:
            0 10px 40px rgba(0, 0, 0, 0.5),
            0 0 40px rgba(59, 130, 246, 0.06),
            inset 0 1px 0 rgba(255, 255, 255, 0.04);
          transition: all 0.3s ease;
        }
        .dash-navbar:hover {
          border-color: rgba(0, 180, 255, 0.25);
          box-shadow:
            0 12px 50px rgba(0, 0, 0, 0.6),
            0 0 50px rgba(59, 130, 246, 0.1),
            inset 0 1px 0 rgba(255, 255, 255, 0.05);
        }

        .dash-nav-inner {
          padding: 12px 18px;
          display: flex;
          align-items: center;
          gap: 16px;
        }

        /* ---------- Brand ---------- */
        .dash-brand {
          display: flex;
          align-items: center;
          gap: 12px;
          text-decoration: none;
          flex-shrink: 0;
          padding: 4px 8px 4px 4px;
          border-radius: 16px;
          transition: all 0.25s ease;
        }
        .dash-brand:hover {
          background: rgba(59, 130, 246, 0.06);
        }

        .dash-brand-logo {
          width: 42px;
          height: 42px;
          border-radius: 14px;
          overflow: hidden;
          border: 1.5px solid rgba(0, 150, 255, 0.35);
          box-shadow: 0 0 20px rgba(0, 150, 255, 0.15);
          flex-shrink: 0;
          position: relative;
          background: linear-gradient(135deg, rgba(59, 130, 246, 0.15), rgba(6, 182, 212, 0.1));
        }
        .dash-brand-logo img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }

        .dash-brand-text {
          display: flex;
          flex-direction: column;
          line-height: 1;
          min-width: 0;
          max-width: 220px;
        }
        .dash-brand-name {
          font-size: 1rem;
          font-weight: 900;
          letter-spacing: -0.2px;
          color: #fff;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .dash-brand-sub {
          font-size: 0.55rem;
          font-weight: 500;
          color: rgba(255, 255, 255, 0.35);
          letter-spacing: 2.5px;
          text-transform: uppercase;
          margin-top: 3px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        /* ---------- Nav links ---------- */
        .dash-nav-links {
          display: flex;
          align-items: center;
          gap: 4px;
          margin-left: 12px;
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
          background: linear-gradient(135deg, rgba(59, 130, 246, 0.22), rgba(6, 182, 212, 0.15));
          border-color: rgba(59, 130, 246, 0.35);
          box-shadow: 0 4px 20px rgba(59, 130, 246, 0.2);
        }

        /* ---------- Right side ---------- */
        .dash-nav-right {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-left: auto;
        }

        /* ---------- 3-dot Menu Button ---------- */
        .menu-btn-wrap {
          position: relative;
        }
        .menu-btn {
          width: 42px;
          height: 42px;
          border-radius: 14px;
          background: rgba(0, 0, 0, 0.35);
          border: 1px solid rgba(255, 255, 255, 0.08);
          color: #fff;
          font-size: 1rem;
          cursor: pointer;
          display: grid;
          place-items: center;
          transition: all 0.25s cubic-bezier(0.175, 0.885, 0.32, 1.275);
          position: relative;
          overflow: hidden;
        }
        .menu-btn::before {
          content: "";
          position: absolute;
          inset: 0;
          background: linear-gradient(135deg, rgba(59, 130, 246, 0.2), rgba(6, 182, 212, 0.15));
          opacity: 0;
          transition: opacity 0.25s ease;
        }
        .menu-btn:hover {
          border-color: rgba(59, 130, 246, 0.45);
          transform: translateY(-1px);
          box-shadow: 0 8px 20px rgba(59, 130, 246, 0.2);
        }
        .menu-btn:hover::before {
          opacity: 1;
        }
        .menu-btn.open {
          border-color: rgba(59, 130, 246, 0.6);
          background: linear-gradient(135deg, rgba(59, 130, 246, 0.2), rgba(6, 182, 212, 0.15));
          box-shadow: 0 0 25px rgba(59, 130, 246, 0.35);
        }
        .menu-btn i {
          position: relative;
          z-index: 1;
          transition: transform 0.3s ease;
        }
        .menu-btn.open i {
          transform: rotate(90deg);
        }

        /* Dot pulse indicator */
        .menu-btn::after {
          content: "";
          position: absolute;
          top: 8px;
          right: 8px;
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: #22c55e;
          box-shadow: 0 0 10px #22c55e;
          animation: menuDotPulse 2s ease-in-out infinite;
        }
        @keyframes menuDotPulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(0.85); }
        }

        /* ---------- User dropdown ---------- */
        .user-dropdown {
          position: absolute;
          top: calc(100% + 12px);
          right: 0;
          min-width: 260px;
          background: rgba(12, 18, 32, 0.96);
          backdrop-filter: blur(24px);
          -webkit-backdrop-filter: blur(24px);
          border: 1px solid rgba(0, 150, 255, 0.18);
          border-radius: 18px;
          padding: 10px;
          box-shadow:
            0 25px 60px rgba(0, 0, 0, 0.7),
            0 0 40px rgba(59, 130, 246, 0.08);
          opacity: 0;
          visibility: hidden;
          transform: translateY(-8px) scale(0.97);
          transform-origin: top right;
          transition: all 0.25s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        }
        .user-dropdown.open {
          opacity: 1;
          visibility: visible;
          transform: translateY(0) scale(1);
        }

        /* Dropdown user card */
        .dropdown-user-card {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 14px;
          border-radius: 14px;
          background: linear-gradient(135deg, rgba(59, 130, 246, 0.12), rgba(6, 182, 212, 0.08));
          border: 1px solid rgba(59, 130, 246, 0.2);
          margin-bottom: 8px;
        }
        .dropdown-avatar {
          width: 44px;
          height: 44px;
          border-radius: 14px;
          background: linear-gradient(135deg, #3b82f6, #06b6d4);
          display: grid;
          place-items: center;
          color: #000;
          font-weight: 900;
          font-size: 1.1rem;
          flex-shrink: 0;
          box-shadow: 0 0 20px rgba(59, 130, 246, 0.4);
        }
        .dropdown-user-info {
          min-width: 0;
          flex: 1;
        }
        .dropdown-user-name {
          font-size: 0.9rem;
          font-weight: 800;
          color: #fff;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .dropdown-user-id {
          font-size: 0.7rem;
          color: rgba(255, 255, 255, 0.45);
          margin-top: 3px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          font-family: "SF Mono", "Consolas", monospace;
        }

        /* Premium badge */
        .dropdown-premium-badge {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          padding: 3px 8px;
          border-radius: 20px;
          background: linear-gradient(135deg, #fbbf24, #f59e0b);
          color: #000;
          font-size: 0.55rem;
          font-weight: 900;
          letter-spacing: 0.5px;
          text-transform: uppercase;
          margin-top: 4px;
          width: fit-content;
        }

        /* Section label */
        .dropdown-section-label {
          font-size: 0.6rem;
          font-weight: 700;
          color: rgba(255, 255, 255, 0.3);
          letter-spacing: 1.5px;
          text-transform: uppercase;
          padding: 8px 14px 6px;
        }

        /* Items */
        .dropdown-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 11px 14px;
          border-radius: 12px;
          font-size: 0.85rem;
          font-weight: 600;
          color: rgba(255, 255, 255, 0.75);
          text-decoration: none;
          background: none;
          border: none;
          width: 100%;
          text-align: left;
          cursor: pointer;
          transition: all 0.18s ease;
          font-family: inherit;
        }
        .dropdown-item:hover {
          background: rgba(59, 130, 246, 0.1);
          color: #fff;
          transform: translateX(2px);
        }
        .dropdown-item i {
          width: 18px;
          text-align: center;
          font-size: 0.85rem;
          color: rgba(255, 255, 255, 0.5);
          transition: color 0.18s ease;
        }
        .dropdown-item:hover i {
          color: #60a5fa;
        }

        /* Logout — special styling */
        .dropdown-logout {
          margin-top: 6px;
          padding-top: 6px;
          border-top: 1px solid rgba(255, 255, 255, 0.06);
        }
        .dropdown-item.danger {
          color: #f87171;
          background: linear-gradient(135deg, rgba(239, 68, 68, 0.08), rgba(239, 68, 68, 0.03));
          border: 1px solid rgba(239, 68, 68, 0.15);
          margin-top: 4px;
        }
        .dropdown-item.danger:hover {
          background: linear-gradient(135deg, rgba(239, 68, 68, 0.2), rgba(239, 68, 68, 0.1));
          color: #fca5a5;
          border-color: rgba(239, 68, 68, 0.3);
          box-shadow: 0 4px 20px rgba(239, 68, 68, 0.15);
        }
        .dropdown-item.danger i {
          color: #f87171;
        }
        .dropdown-item.danger:hover i {
          color: #fca5a5;
        }

        /* Mobile menu toggle (for nav links only) */
        .mobile-toggle {
          display: none;
          width: 42px;
          height: 42px;
          border-radius: 14px;
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
          .dash-navbar-wrap {
            padding: 12px 12px 0 12px;
          }
          .dash-nav-inner {
            padding: 10px 14px;
            gap: 10px;
          }
          .dash-brand-name { max-width: 140px; font-size: 0.9rem; }
          .dash-brand-sub { display: none; }
          .dash-brand-logo { width: 38px; height: 38px; border-radius: 12px; }

          .mobile-toggle { display: flex; }

          .dash-nav-links {
            position: absolute;
            top: calc(100% + 8px);
            left: 12px;
            right: 12px;
            flex-direction: column;
            align-items: stretch;
            margin: 0;
            padding: 10px;
            gap: 4px;
            background: rgba(8, 15, 30, 0.98);
            backdrop-filter: blur(22px);
            border: 1px solid rgba(0, 150, 255, 0.18);
            border-radius: 18px;
            transform: translateY(-10px);
            opacity: 0;
            visibility: hidden;
            transition: all 0.25s ease;
            box-shadow: 0 20px 50px rgba(0, 0, 0, 0.6);
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

          .dash-main {
            padding: 20px 16px 60px 16px;
          }

          .user-dropdown {
            min-width: 240px;
            right: -4px;
          }
        }

        @media (max-width: 400px) {
          .dash-brand-name { max-width: 100px; font-size: 0.82rem; }
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

        {/* ========== NAVBAR (floating, rounded) ========== */}
        <div className="dash-navbar-wrap">
          <nav className="dash-navbar">
            <div className="dash-nav-inner">
              {/* Brand — botName from settings */}
              <Link href="/dashboard" className="dash-brand">
                <div className="dash-brand-logo">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={user.botImage}
                    alt="Bot"
                    onError={(e) => {
                      e.target.src =
                        "https://www.zanta-mini.store/src/zanta.png";
                    }}
                  />
                </div>
                <div className="dash-brand-text">
                  <div className="dash-brand-name">{user.name}</div>
                  <div className="dash-brand-sub">Bot Manager</div>
                </div>
              </Link>

              {/* Nav links */}
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
                  aria-label="Toggle navigation"
                >
                  <i
                    className={`fas ${
                      mobileMenuOpen ? "fa-times" : "fa-bars"
                    }`}
                  />
                </button>

                {/* 3-dot Menu */}
                <div className="user-menu-wrap menu-btn-wrap">
                  <button
                    className={`menu-btn ${
                      userMenuOpen ? "open" : ""
                    }`}
                    onClick={(e) => {
                      e.stopPropagation();
                      setUserMenuOpen((v) => !v);
                    }}
                    aria-label="Menu"
                  >
                    <i className="fas fa-ellipsis-v" />
                  </button>

                  <div
                    className={`user-dropdown ${
                      userMenuOpen ? "open" : ""
                    }`}
                  >
                    {/* User card */}
                    <div className="dropdown-user-card">
                      <div className="dropdown-avatar">
                        {(user.name || "U")[0].toUpperCase()}
                      </div>
                      <div className="dropdown-user-info">
                        <div className="dropdown-user-name">
                          {user.name}
                        </div>
                        <div className="dropdown-user-id">
                          {user.id}
                        </div>
                        <div className="dropdown-premium-badge">
                          <i
                            className="fas fa-crown"
                            style={{ fontSize: "0.5rem" }}
                          />
                          Premium
                        </div>
                      </div>
                    </div>

                    {/* Nav section */}
                    <div className="dropdown-section-label">
                      Navigation
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

                    {/* Logout section */}
                    <div className="dropdown-logout">
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
            </div>
          </nav>
        </div>

        {/* ========== MAIN ========== */}
        <main className="dash-main">{children}</main>
      </div>
    </>
  );
}
