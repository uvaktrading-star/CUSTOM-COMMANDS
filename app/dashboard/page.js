"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function DashboardHome() {
  const router = useRouter();
  const [commands, setCommands] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");

  useEffect(() => {
    loadCommands();
  }, []);

  async function loadCommands() {
    setLoading(true);
    setError("");
    try {
      const userId = localStorage.getItem("bot_id");
      const res = await fetch("/api/add-cmd", {
        headers: { Authorization: `Bearer ${userId}` },
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error || "Failed to load");
      setCommands(data.commands || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  /* ---------- filters ---------- */
  const filtered = commands.filter((c) => {
    if (filter !== "all" && c.type !== filter) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        c.command.toLowerCase().includes(q) ||
        (c.desc || "").toLowerCase().includes(q) ||
        (c.aliase || []).some((a) => a.toLowerCase().includes(q))
      );
    }
    return true;
  });

  return (
    <>
      <style jsx>{`
        /* ==================== PAGE HEADER ==================== */
        .page-head {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 16px;
          margin-bottom: 32px;
          flex-wrap: wrap;
        }

        .page-head-left h1 {
          font-size: 2rem;
          font-weight: 900;
          letter-spacing: -0.8px;
          line-height: 1.1;
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .page-head-left h1 .title-icon {
          width: 44px;
          height: 44px;
          border-radius: 14px;
          background: linear-gradient(135deg, rgba(59, 130, 246, 0.2), rgba(6, 182, 212, 0.15));
          border: 1px solid rgba(59, 130, 246, 0.3);
          display: grid;
          place-items: center;
          color: #60a5fa;
          font-size: 1.1rem;
          box-shadow: 0 0 30px rgba(59, 130, 246, 0.15);
        }
        .page-head-left h1 .blue {
          background: linear-gradient(135deg, #3b82f6, #06b6d4);
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
        }
        .page-head-left p {
          color: rgba(255, 255, 255, 0.4);
          font-size: 0.85rem;
          margin-top: 8px;
          margin-left: 56px;
        }

        /* ==================== CREATE BUTTON ==================== */
        .create-btn {
          position: relative;
          padding: 14px 26px;
          border-radius: 30px;
          background: linear-gradient(135deg, #3b82f6, #06b6d4);
          border: none;
          color: #000;
          font-weight: 800;
          font-size: 0.82rem;
          font-family: inherit;
          display: inline-flex;
          align-items: center;
          gap: 10px;
          cursor: pointer;
          transition: all 0.35s cubic-bezier(0.175, 0.885, 0.32, 1.275);
          text-decoration: none;
          text-transform: uppercase;
          letter-spacing: 1.2px;
          box-shadow: 0 4px 25px rgba(59, 130, 246, 0.3);
          overflow: hidden;
        }
        .create-btn::before {
          content: "";
          position: absolute;
          inset: 0;
          background: linear-gradient(135deg, #06b6d4, #3b82f6);
          opacity: 0;
          transition: opacity 0.3s ease;
          z-index: 0;
        }
        .create-btn:hover::before {
          opacity: 1;
        }
        .create-btn > * {
          position: relative;
          z-index: 1;
        }
        .create-btn:hover {
          transform: translateY(-3px) scale(1.03);
          box-shadow: 0 15px 45px rgba(59, 130, 246, 0.5);
        }
        .create-btn .btn-icon {
          width: 22px;
          height: 22px;
          border-radius: 50%;
          background: rgba(0, 0, 0, 0.15);
          display: grid;
          place-items: center;
          font-size: 0.7rem;
          transition: transform 0.3s ease;
        }
        .create-btn:hover .btn-icon {
          transform: rotate(90deg);
        }

        /* ==================== STATS ==================== */
        .stats-row {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
          gap: 14px;
          margin-bottom: 28px;
        }

        .stat-card {
          padding: 20px;
          border-radius: 20px;
          background: rgba(8, 15, 30, 0.6);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border: 1px solid rgba(0, 150, 255, 0.12);
          transition: all 0.3s ease;
          position: relative;
          overflow: hidden;
          display: flex;
          align-items: center;
          gap: 16px;
        }
        .stat-card:hover {
          transform: translateY(-3px);
          border-color: rgba(0, 212, 255, 0.3);
          box-shadow: 0 15px 40px rgba(0, 0, 0, 0.4);
        }
        .stat-card::after {
          content: "";
          position: absolute;
          top: -50%;
          right: -50%;
          width: 100%;
          height: 100%;
          background: radial-gradient(circle, rgba(59, 130, 246, 0.1), transparent 70%);
          pointer-events: none;
        }

        .stat-icon {
          width: 48px;
          height: 48px;
          border-radius: 14px;
          display: grid;
          place-items: center;
          font-size: 1.15rem;
          flex-shrink: 0;
          transition: transform 0.3s ease;
        }
        .stat-card:hover .stat-icon {
          transform: scale(1.1) rotate(-5deg);
        }
        .stat-icon.total {
          background: linear-gradient(135deg, rgba(59, 130, 246, 0.2), rgba(6, 182, 212, 0.15));
          color: #60a5fa;
          border: 1px solid rgba(59, 130, 246, 0.3);
        }
        .stat-icon.api {
          background: linear-gradient(135deg, rgba(6, 182, 212, 0.2), rgba(14, 165, 233, 0.15));
          color: #22d3ee;
          border: 1px solid rgba(6, 182, 212, 0.3);
        }
        .stat-icon.simple {
          background: linear-gradient(135deg, rgba(34, 197, 94, 0.2), rgba(16, 185, 129, 0.15));
          color: #4ade80;
          border: 1px solid rgba(34, 197, 94, 0.3);
        }
        .stat-icon.active {
          background: linear-gradient(135deg, rgba(168, 85, 247, 0.2), rgba(139, 92, 246, 0.15));
          color: #c084fc;
          border: 1px solid rgba(168, 85, 247, 0.3);
        }

        .stat-body {
          flex: 1;
          min-width: 0;
        }
        .stat-label {
          font-size: 0.6rem;
          color: rgba(255, 255, 255, 0.4);
          text-transform: uppercase;
          letter-spacing: 1.5px;
          font-weight: 700;
          margin-bottom: 4px;
        }
        .stat-value {
          font-size: 1.7rem;
          font-weight: 900;
          color: #fff;
          line-height: 1;
          letter-spacing: -1px;
        }
        .stat-value.blue {
          background: linear-gradient(135deg, #3b82f6, #06b6d4);
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
        }

        /* ==================== TOOLBAR ==================== */
        .toolbar {
          display: flex;
          gap: 12px;
          margin-bottom: 22px;
          flex-wrap: wrap;
          align-items: center;
        }

        .search-box {
          flex: 1;
          min-width: 220px;
          position: relative;
        }
        .search-box i {
          position: absolute;
          left: 18px;
          top: 50%;
          transform: translateY(-50%);
          color: rgba(255, 255, 255, 0.3);
          font-size: 0.85rem;
          pointer-events: none;
        }
        .search-box input {
          width: 100%;
          padding: 13px 18px 13px 46px;
          border-radius: 30px;
          background: rgba(8, 15, 30, 0.7);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(0, 150, 255, 0.12);
          color: #fff;
          font-size: 0.85rem;
          font-family: inherit;
          outline: none;
          transition: all 0.2s ease;
        }
        .search-box input:focus {
          border-color: #3b82f6;
          background: rgba(8, 15, 30, 0.9);
          box-shadow: 0 0 30px rgba(59, 130, 246, 0.1);
        }
        .search-box input::placeholder {
          color: rgba(255, 255, 255, 0.25);
        }

        .filter-pills {
          display: flex;
          gap: 4px;
          padding: 4px;
          border-radius: 30px;
          background: rgba(8, 15, 30, 0.7);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(0, 150, 255, 0.12);
        }
        .pill {
          padding: 9px 18px;
          border-radius: 30px;
          border: none;
          background: transparent;
          color: rgba(255, 255, 255, 0.5);
          font-size: 0.78rem;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s ease;
          font-family: inherit;
          display: inline-flex;
          align-items: center;
          gap: 6px;
        }
        .pill i {
          font-size: 0.7rem;
        }
        .pill:hover {
          color: #fff;
        }
        .pill.active {
          background: linear-gradient(135deg, #3b82f6, #06b6d4);
          color: #000;
          box-shadow: 0 4px 15px rgba(59, 130, 246, 0.3);
        }

        /* ==================== STATE BOX ==================== */
        .state-box {
          padding: 70px 20px;
          text-align: center;
          border-radius: 24px;
          background: rgba(8, 15, 30, 0.5);
          backdrop-filter: blur(20px);
          border: 1px dashed rgba(0, 150, 255, 0.2);
        }
        .state-icon-wrap {
          width: 80px;
          height: 80px;
          border-radius: 24px;
          background: linear-gradient(135deg, rgba(59, 130, 246, 0.15), rgba(6, 182, 212, 0.1));
          border: 1px solid rgba(59, 130, 246, 0.25);
          display: grid;
          place-items: center;
          margin: 0 auto 20px;
          font-size: 2rem;
          color: #60a5fa;
          box-shadow: 0 0 40px rgba(59, 130, 246, 0.15);
        }
        .state-title {
          font-size: 1.15rem;
          font-weight: 800;
          margin-bottom: 8px;
        }
        .state-sub {
          font-size: 0.85rem;
          color: rgba(255, 255, 255, 0.4);
          margin-bottom: 24px;
        }

        /* ==================== COMMAND GRID ==================== */
        .cmd-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(330px, 1fr));
          gap: 16px;
        }

        .cmd-card {
          padding: 22px;
          border-radius: 22px;
          background: rgba(8, 15, 30, 0.7);
          backdrop-filter: blur(22px);
          -webkit-backdrop-filter: blur(22px);
          border: 1px solid rgba(0, 150, 255, 0.12);
          transition: all 0.35s cubic-bezier(0.175, 0.885, 0.32, 1.275);
          position: relative;
          overflow: hidden;
        }
        .cmd-card::before {
          content: "";
          position: absolute;
          top: -50%;
          right: -50%;
          width: 100%;
          height: 100%;
          background: radial-gradient(circle, rgba(59, 130, 246, 0.08), transparent 70%);
          pointer-events: none;
          opacity: 0;
          transition: opacity 0.3s ease;
        }
        .cmd-card:hover {
          transform: translateY(-4px);
          border-color: rgba(0, 212, 255, 0.3);
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.6),
                      0 0 40px rgba(59, 130, 246, 0.08);
        }
        .cmd-card:hover::before {
          opacity: 1;
        }

        /* Card top strip indicator */
        .cmd-card::after {
          content: "";
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 2px;
          background: linear-gradient(90deg, transparent, #3b82f6, #06b6d4, transparent);
          opacity: 0;
          transition: opacity 0.3s ease;
        }
        .cmd-card:hover::after {
          opacity: 1;
        }

        .cmd-head {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 12px;
          margin-bottom: 14px;
          position: relative;
          z-index: 1;
        }

        .cmd-title {
          display: flex;
          align-items: center;
          gap: 10px;
          min-width: 0;
          flex: 1;
        }

        .cmd-avatar {
          width: 40px;
          height: 40px;
          border-radius: 12px;
          display: grid;
          place-items: center;
          font-size: 0.95rem;
          flex-shrink: 0;
          transition: transform 0.3s ease;
        }
        .cmd-card:hover .cmd-avatar {
          transform: rotate(-8deg) scale(1.05);
        }
        .cmd-avatar.api {
          background: linear-gradient(135deg, rgba(6, 182, 212, 0.2), rgba(14, 165, 233, 0.15));
          color: #22d3ee;
          border: 1px solid rgba(6, 182, 212, 0.3);
        }
        .cmd-avatar.simple {
          background: linear-gradient(135deg, rgba(34, 197, 94, 0.2), rgba(16, 185, 129, 0.15));
          color: #4ade80;
          border: 1px solid rgba(34, 197, 94, 0.3);
        }

        .cmd-name-block {
          min-width: 0;
          flex: 1;
        }
        .cmd-name {
          font-size: 1.05rem;
          font-weight: 800;
          color: #fff;
          letter-spacing: -0.3px;
          display: flex;
          align-items: baseline;
          gap: 1px;
          line-height: 1.2;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .cmd-name .prefix {
          background: linear-gradient(135deg, #3b82f6, #06b6d4);
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
          font-weight: 900;
        }

        .cmd-type-badge {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          font-size: 0.6rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.8px;
          margin-top: 4px;
          padding: 2px 8px;
          border-radius: 20px;
        }
        .cmd-type-badge.api {
          background: rgba(6, 182, 212, 0.12);
          color: #22d3ee;
          border: 1px solid rgba(6, 182, 212, 0.25);
        }
        .cmd-type-badge.simple {
          background: rgba(34, 197, 94, 0.12);
          color: #4ade80;
          border: 1px solid rgba(34, 197, 94, 0.25);
        }

        .cmd-status-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #22c55e;
          box-shadow: 0 0 10px rgba(34, 197, 94, 0.6);
          flex-shrink: 0;
          animation: dotPulse 2s infinite;
        }
        .cmd-status-dot.inactive {
          background: #64748b;
          box-shadow: none;
          animation: none;
        }
        @keyframes dotPulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }

        .cmd-desc {
          font-size: 0.82rem;
          color: rgba(255, 255, 255, 0.5);
          margin-bottom: 16px;
          line-height: 1.55;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
          min-height: 2.6em;
          position: relative;
          z-index: 1;
        }
        .cmd-desc.empty {
          opacity: 0.3;
          font-style: italic;
        }

        .cmd-tags {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
          margin-bottom: 18px;
          position: relative;
          z-index: 1;
        }
        .tag {
          font-size: 0.65rem;
          padding: 4px 10px;
          border-radius: 30px;
          font-weight: 700;
          display: inline-flex;
          align-items: center;
          gap: 5px;
        }
        .tag i { font-size: 0.6rem; }
        .tag.alias {
          background: rgba(255, 255, 255, 0.04);
          color: rgba(255, 255, 255, 0.55);
          border: 1px solid rgba(255, 255, 255, 0.08);
          font-family: "SF Mono", "Consolas", monospace;
          font-weight: 500;
          text-transform: none;
        }
        .tag.alias .dot {
          color: #3b82f6;
          font-weight: 900;
        }
        .tag.more {
          background: rgba(59, 130, 246, 0.1);
          color: #60a5fa;
          border: 1px solid rgba(59, 130, 246, 0.2);
        }
        .tag.react-tag {
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid rgba(255, 255, 255, 0.08);
          padding: 4px 8px;
          font-size: 0.85rem;
        }

        .cmd-actions {
          display: flex;
          gap: 8px;
          padding-top: 16px;
          border-top: 1px solid rgba(255, 255, 255, 0.05);
          position: relative;
          z-index: 1;
        }

        .icon-btn {
          flex: 1;
          padding: 11px 16px;
          border-radius: 30px;
          background: rgba(59, 130, 246, 0.08);
          border: 1px solid rgba(59, 130, 246, 0.2);
          color: #60a5fa;
          font-size: 0.78rem;
          font-weight: 700;
          font-family: inherit;
          cursor: pointer;
          transition: all 0.25s ease;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          text-decoration: none;
          text-transform: uppercase;
          letter-spacing: 0.8px;
        }
        .icon-btn:hover {
          background: linear-gradient(135deg, #3b82f6, #06b6d4);
          color: #000;
          border-color: transparent;
          transform: translateY(-2px);
          box-shadow: 0 10px 25px rgba(59, 130, 246, 0.35);
        }

        /* ==================== LOADING ==================== */
        .loading-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(330px, 1fr));
          gap: 16px;
        }
        .skeleton {
          height: 220px;
          border-radius: 22px;
          background: linear-gradient(
            90deg,
            rgba(255, 255, 255, 0.03) 0%,
            rgba(59, 130, 246, 0.06) 50%,
            rgba(255, 255, 255, 0.03) 100%
          );
          background-size: 200% 100%;
          animation: shimmer 1.5s infinite;
          border: 1px solid rgba(0, 150, 255, 0.08);
        }
        @keyframes shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }

        /* ==================== MOBILE ==================== */
        @media (max-width: 640px) {
          .page-head-left h1 { font-size: 1.5rem; }
          .page-head-left h1 .title-icon { width: 38px; height: 38px; font-size: 0.95rem; }
          .page-head-left p { margin-left: 50px; font-size: 0.78rem; }
          .create-btn { padding: 12px 20px; font-size: 0.72rem; }
          .stat-card { padding: 16px; border-radius: 16px; gap: 12px; }
          .stat-icon { width: 40px; height: 40px; font-size: 1rem; }
          .stat-value { font-size: 1.4rem; }
          .cmd-card { padding: 18px; border-radius: 18px; }
          .cmd-grid, .loading-grid { grid-template-columns: 1fr; }
          .toolbar { flex-direction: column; align-items: stretch; }
          .filter-pills { justify-content: center; }
          .search-box { min-width: auto; }
        }
      `}</style>

      {/* ==================== HEADER ==================== */}
      <div className="page-head">
        <div className="page-head-left">
          <h1>
            <div className="title-icon">
              <i className="fas fa-layer-group" />
            </div>
            Your <span className="blue">Commands</span>
          </h1>
          <p>Manage your WhatsApp bot commands</p>
        </div>

        <Link href="/dashboard/create" className="create-btn">
          <span className="btn-icon">
            <i className="fas fa-plus" />
          </span>
          Create Command
          <i className="fas fa-arrow-right" />
        </Link>
      </div>

      {/* ==================== STATS ==================== */}
      <div className="stats-row">
        <div className="stat-card">
          <div className="stat-icon total">
            <i className="fas fa-cubes" />
          </div>
          <div className="stat-body">
            <div className="stat-label">Total</div>
            <div className="stat-value blue">{commands.length}</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon api">
            <i className="fas fa-bolt" />
          </div>
          <div className="stat-body">
            <div className="stat-label">API</div>
            <div className="stat-value">
              {commands.filter((c) => c.type === "API").length}
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon simple">
            <i className="fas fa-comment-dots" />
          </div>
          <div className="stat-body">
            <div className="stat-label">Simple</div>
            <div className="stat-value">
              {commands.filter((c) => c.type === "simple").length}
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon active">
            <i className="fas fa-circle-check" />
          </div>
          <div className="stat-body">
            <div className="stat-label">Active</div>
            <div className="stat-value">
              {commands.filter((c) => c.isActive).length}
            </div>
          </div>
        </div>
      </div>

      {/* ==================== TOOLBAR ==================== */}
      {!loading && commands.length > 0 && (
        <div className="toolbar">
          <div className="search-box">
            <i className="fas fa-magnifying-glass" />
            <input
              type="text"
              placeholder="Search commands, aliases..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="filter-pills">
            {[
              { v: "all", label: "All", icon: "fa-grip" },
              { v: "simple", label: "Simple", icon: "fa-comment-dots" },
              { v: "API", label: "API", icon: "fa-bolt" },
            ].map((f) => (
              <button
                key={f.v}
                className={`pill ${filter === f.v ? "active" : ""}`}
                onClick={() => setFilter(f.v)}
              >
                <i className={`fas ${f.icon}`} />
                {f.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ==================== CONTENT ==================== */}
      {loading ? (
        <div className="loading-grid">
          {[1, 2, 3].map((i) => (
            <div key={i} className="skeleton" />
          ))}
        </div>
      ) : error ? (
        <div className="state-box">
          <div className="state-icon-wrap">
            <i className="fas fa-triangle-exclamation" />
          </div>
          <div className="state-title">Failed to load commands</div>
          <div className="state-sub">{error}</div>
          <button className="create-btn" onClick={loadCommands}>
            <span className="btn-icon">
              <i className="fas fa-rotate-right" />
            </span>
            Retry
          </button>
        </div>
      ) : commands.length === 0 ? (
        <div className="state-box">
          <div className="state-icon-wrap">
            <i className="fas fa-inbox" />
          </div>
          <div className="state-title">No commands yet</div>
          <div className="state-sub">
            Create your first command to get started
          </div>
          <Link href="/dashboard/create" className="create-btn">
            <span className="btn-icon">
              <i className="fas fa-plus" />
            </span>
            Create First Command
          </Link>
        </div>
      ) : filtered.length === 0 ? (
        <div className="state-box">
          <div className="state-icon-wrap">
            <i className="fas fa-magnifying-glass" />
          </div>
          <div className="state-title">No matches found</div>
          <div className="state-sub">Try a different search or filter</div>
        </div>
      ) : (
        <div className="cmd-grid">
          {filtered.map((cmd) => (
            <div key={cmd.command} className="cmd-card">
              <div className="cmd-head">
                <div className="cmd-title">
                  <div className={`cmd-avatar ${cmd.type.toLowerCase()}`}>
                    <i
                      className={`fas ${
                        cmd.type === "API" ? "fa-bolt" : "fa-comment-dots"
                      }`}
                    />
                  </div>
                  <div className="cmd-name-block">
                    <div className="cmd-name">
                      <span className="prefix">.</span>
                      {cmd.command}
                    </div>
                    <span
                      className={`cmd-type-badge ${cmd.type.toLowerCase()}`}
                    >
                      <i
                        className={`fas ${
                          cmd.type === "API" ? "fa-bolt" : "fa-comment-dots"
                        }`}
                      />
                      {cmd.type}
                    </span>
                  </div>
                </div>
                <div
                  className={`cmd-status-dot ${
                    cmd.isActive ? "" : "inactive"
                  }`}
                  title={cmd.isActive ? "Active" : "Inactive"}
                />
              </div>

              {cmd.desc ? (
                <div className="cmd-desc">{cmd.desc}</div>
              ) : (
                <div className="cmd-desc empty">No description</div>
              )}

              <div className="cmd-tags">
                {cmd.react && (
                  <span className="tag react-tag">{cmd.react}</span>
                )}
                {cmd.aliase?.slice(0, 2).map((a, i) => (
                  <span key={i} className="tag alias">
                    <span className="dot">.</span>
                    {a}
                  </span>
                ))}
                {cmd.aliase?.length > 2 && (
                  <span className="tag more">
                    <i className="fas fa-plus" />
                    {cmd.aliase.length - 2}
                  </span>
                )}
              </div>

              <div className="cmd-actions">
                <Link
                  href={`/dashboard/create?edit=${cmd.command}`}
                  className="icon-btn"
                >
                  <i className="fas fa-pen-to-square" />
                  Edit Command
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
