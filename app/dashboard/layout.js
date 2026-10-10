"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";

export default function DashboardLayout({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false);

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
      avatar: settings?.avatar || null,
    });
    setReady(true);
  }, [router]);

  function logout() {
    localStorage.removeItem("bot_id");
    localStorage.removeItem("bot_pass");
    localStorage.removeItem("bot_settings");
    router.replace("/");
  }

  if (!ready || !user) {
    return (
      <div className="dash-loading">
        <div className="spinner" />
        <p>Loading dashboard...</p>
      </div>
    );
  }

  const navItems = [
    { href: "/dashboard", label: "Commands", icon: "fa-list" },
    { href: "/dashboard/create", label: "Create Command", icon: "fa-plus" },
  ];

  return (
    <div className="dash-root">
      {/* ========== STYLES ========== */}
      <style jsx global>{`
        * { margin: 0; padding: 0; box-sizing: border-box; }

        body {
          font-family: var(--font-inter), "Inter", sans-serif;
          background: #08080c;
          color: #fff;
          min-height: 100vh;
          overflow-x: hidden;
        }

        .dash-loading {
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 16px;
          color: rgba(255, 255, 255, 0.5);
          font-size: 0.85rem;
        }
        .spinner {
          width: 40px;
          height: 40px;
          border: 3px solid rgba(59, 130, 246, 0.15);
          border-top-color: #3b82f6;
          border-radius: 50%;
          animation: spin 0.9s linear infinite;
        }
        @keyframes spin { to { transform: rotate(360deg); } }

        /* ---------- ROOT ---------- */
        .dash-root {
          min-height: 100vh;
          display: grid;
          grid-template-columns: 260px 1fr;
          background:
            radial-gradient(circle at 100% 0%, rgba(59, 130, 246, 0.06), transparent 50%),
            radial-gradient(circle at 0% 100%, rgba(6, 182, 212, 0.05), transparent 50%),
            #08080c;
        }

        /* ---------- SIDEBAR ---------- */
        .dash-sidebar {
          border-right: 1px solid rgba(255, 255, 255, 0.05);
          background: rgba(8, 15, 30, 0.4);
          backdrop-filter: blur(12px);
          padding: 24px 16px;
          display: flex;
          flex-direction: column;
          position: sticky;
          top: 0;
          height: 100vh;
        }

        .brand-box {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 8px 8px 20px 8px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.05);
          margin-bottom: 16px;
        }

        .brand-logo {
          width: 38px;
          height: 38px;
          border-radius: 10px;
          background: linear-gradient(135deg, #3b82f6, #06b6d4);
          display: grid;
          place-items: center;
          font-weight: 900;
          color: #000;
          font-size: 1.1rem;
        }

        .brand-name {
          font-weight: 800;
          font-size: 1.05rem;
          background: linear-gradient(135deg, #3b82f6, #06b6d4);
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
          line-height: 1.1;
        }
        .brand-sub {
          font-size: 0.6rem;
          color: rgba(255, 255, 255, 0.3);
          letter-spacing: 2px;
          text-transform: uppercase;
          margin-top: 2px;
        }

        .nav-list {
          list-style: none;
          display: flex;
          flex-direction: column;
          gap: 4px;
          flex: 1;
        }

        .nav-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 14px;
          border-radius: 12px;
          color: rgba(255, 255, 255, 0.55);
          text-decoration: none;
          font-size: 0.88rem;
          font-weight: 500;
          transition: all 0.2s ease;
          border: 1px solid transparent;
        }
        .nav-item:hover {
          background: rgba(59, 130, 246, 0.06);
          color: #fff;
        }
        .nav-item.active {
          background: linear-gradient(135deg, rgba(59, 130, 246, 0.15), rgba(6, 182, 212, 0.1));
          color: #fff;
          border-color: rgba(59, 130, 246, 0.25);
        }
        .nav-item i {
          width: 18px;
          text-align: center;
          font-size: 0.95rem;
        }

        .user-box {
          margin-top: auto;
          padding-top: 16px;
          border-top: 1px solid rgba(255, 255, 255, 0.05);
        }

        .user-info {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 10px 12px;
          border-radius: 12px;
          background: rgba(0, 0, 0, 0.25);
          border: 1px solid rgba(255, 255, 255, 0.04);
          margin-bottom: 10px;
        }

        .user-avatar {
          width: 34px;
          height: 34px;
          border-radius: 50%;
          background: linear-gradient(135deg, #3b82f6, #06b6d4);
          display: grid;
          place-items: center;
          color: #000;
          font-weight: 700;
          font-size: 0.85rem;
        }

        .user-meta {
          overflow: hidden;
          flex: 1;
        }
        .user-name {
          font-size: 0.8rem;
          font-weight: 600;
          color: #fff;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .user-id {
          font-size: 0.68rem;
          color: rgba(255, 255, 255, 0.35);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .logout-btn {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 10px 14px;
          border-radius: 10px;
          background: rgba(239, 68, 68, 0.08);
          border: 1px solid rgba(239, 68, 68, 0.15);
          color: #f87171;
          font-size: 0.8rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
          font-family: inherit;
        }
        .logout-btn:hover {
          background: rgba(239, 68, 68, 0.15);
          color: #fca5a5;
        }

        /* ---------- MAIN ---------- */
        .dash-main {
          padding: 32px 40px 60px 40px;
          max-width: 1200px;
          width: 100%;
          overflow-x: hidden;
        }

        .page-header {
          margin-bottom: 28px;
        }
        .page-title {
          font-size: 1.7rem;
          font-weight: 800;
          letter-spacing: -0.5px;
        }
        .page-sub {
          color: rgba(255, 255, 255, 0.4);
          font-size: 0.85rem;
          margin-top: 4px;
        }

        /* ---------- RESPONSIVE ---------- */
        @media (max-width: 768px) {
          .dash-root { grid-template-columns: 1fr; }
          .dash-sidebar {
            position: relative;
            height: auto;
            flex-direction: row;
            align-items: center;
            gap: 12px;
            padding: 12px 16px;
            border-right: none;
            border-bottom: 1px solid rgba(255, 255, 255, 0.05);
            overflow-x: auto;
          }
          .brand-box {
            padding: 0;
            margin: 0;
            border: none;
            flex-shrink: 0;
          }
          .nav-list {
            flex-direction: row;
            flex: 1;
            gap: 4px;
          }
          .nav-item {
            padding: 10px 14px;
            white-space: nowrap;
          }
          .nav-item span { display: none; }
          .nav-item i { font-size: 1.1rem; }
          .user-box {
            margin: 0;
            padding: 0;
            border: none;
            flex-shrink: 0;
          }
          .user-info { display: none; }
          .logout-btn { padding: 10px; }
          .logout-btn span { display: none; }
          .dash-main { padding: 20px 16px 40px 16px; }
          .page-title { font-size: 1.35rem; }
        }

        /* ---------- SHARED BUTTONS ---------- */
        .btn {
          padding: 11px 20px;
          border-radius: 10px;
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
        }
        .btn-primary:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 8px 24px rgba(59, 130, 246, 0.3);
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

      {/* ========== SIDEBAR ========== */}
      <aside className="dash-sidebar">
        <div className="brand-box">
          <div className="brand-logo">Z</div>
          <div>
            <div className="brand-name">ZANTA-MD</div>
            <div className="brand-sub">Bot Manager</div>
          </div>
        </div>

        <ul className="nav-list">
          {navItems.map((item) => {
            const active = pathname === item.href;
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`nav-item ${active ? "active" : ""}`}
                >
                  <i className={`fas ${item.icon}`} />
                  <span>{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>

        <div className="user-box">
          <div className="user-info">
            <div className="user-avatar">
              {(user.name || "U")[0].toUpperCase()}
            </div>
            <div className="user-meta">
              <div className="user-name">{user.name}</div>
              <div className="user-id">{user.id}</div>
            </div>
          </div>
          <button className="logout-btn" onClick={logout}>
            <i className="fas fa-sign-out-alt" />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* ========== MAIN ========== */}
      <main className="dash-main">{children}</main>
    </div>
  );
}