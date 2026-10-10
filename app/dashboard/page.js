"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function DashboardHome() {
  const router = useRouter();
  const [commands, setCommands] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deleting, setDeleting] = useState(null);
  const [filter, setFilter] = useState("all"); // all | simple | API
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

  async function deleteCommand(command) {
    if (!confirm(`Delete command "${command}"?`)) return;
    setDeleting(command);
    try {
      const userId = localStorage.getItem("bot_id");
      const res = await fetch(
        `/api/add-cmd?command=${encodeURIComponent(command)}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${userId}` },
        }
      );
      const data = await res.json();
      if (!data.ok) throw new Error(data.error || "Delete failed");
      setCommands((prev) => prev.filter((c) => c.command !== command));
    } catch (err) {
      alert("❌ " + err.message);
    } finally {
      setDeleting(null);
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
        /* ---------- PAGE HEADER ---------- */
        .page-head {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 16px;
          margin-bottom: 28px;
          flex-wrap: wrap;
        }

        .page-head-left h1 {
          font-size: 1.9rem;
          font-weight: 900;
          letter-spacing: -0.5px;
          line-height: 1.1;
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
          margin-top: 6px;
        }

        .create-btn {
          padding: 13px 24px;
          border-radius: 30px;
          background: linear-gradient(135deg, #3b82f6, #06b6d4);
          border: none;
          color: #000;
          font-weight: 700;
          font-size: 0.82rem;
          font-family: inherit;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
          text-decoration: none;
          box-shadow: 0 4px 25px rgba(59, 130, 246, 0.2);
          text-transform: uppercase;
          letter-spacing: 1px;
        }
        .create-btn:hover {
          transform: translateY(-3px) scale(1.02);
          box-shadow: 0 12px 40px rgba(59, 130, 246, 0.4);
        }

        /* ---------- STATS ---------- */
        .stats-row {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
          gap: 14px;
          margin-bottom: 26px;
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
        }
        .stat-card::before {
          content: "";
          position: absolute;
          top: -50%;
          right: -50%;
          width: 100%;
          height: 100%;
          background: radial-gradient(circle, rgba(59, 130, 246, 0.08), transparent 70%);
          pointer-events: none;
        }
        .stat-card:hover {
          transform: translateY(-3px);
          border-color: rgba(0, 212, 255, 0.25);
          box-shadow: 0 15px 40px rgba(0, 0, 0, 0.4);
        }

        .stat-label {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 0.62rem;
          color: rgba(255, 255, 255, 0.4);
          text-transform: uppercase;
          letter-spacing: 1.5px;
          font-weight: 700;
          margin-bottom: 10px;
        }
        .stat-label i {
          color: #3b82f6;
          font-size: 0.7rem;
        }
        .stat-value {
          font-size: 2rem;
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

        /* ---------- TOOLBAR ---------- */
        .toolbar {
          display: flex;
          gap: 12px;
          margin-bottom: 20px;
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
          left: 16px;
          top: 50%;
          transform: translateY(-50%);
          color: rgba(255, 255, 255, 0.3);
          font-size: 0.85rem;
          pointer-events: none;
        }
        .search-box input {
          width: 100%;
          padding: 12px 16px 12px 42px;
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
        }
        .search-box input::placeholder {
          color: rgba(255, 255, 255, 0.25);
        }

        .filter-pills {
          display: flex;
          gap: 6px;
          padding: 4px;
          border-radius: 30px;
          background: rgba(8, 15, 30, 0.7);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(0, 150, 255, 0.12);
        }
        .pill {
          padding: 8px 16px;
          border-radius: 30px;
          border: none;
          background: transparent;
          color: rgba(255, 255, 255, 0.5);
          font-size: 0.78rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
          font-family: inherit;
        }
        .pill:hover {
          color: #fff;
        }
        .pill.active {
          background: linear-gradient(135deg, #3b82f6, #06b6d4);
          color: #000;
          box-shadow: 0 4px 15px rgba(59, 130, 246, 0.3);
        }

        /* ---------- STATE BOX ---------- */
        .state-box {
          padding: 70px 20px;
          text-align: center;
          border-radius: 24px;
          background: rgba(8, 15, 30, 0.5);
          backdrop-filter: blur(20px);
          border: 1px dashed rgba(0, 150, 255, 0.2);
        }
        .state-icon {
          font-size: 2.8rem;
          margin-bottom: 16px;
          opacity: 0.5;
        }
        .state-title {
          font-size: 1.15rem;
          font-weight: 700;
          margin-bottom: 8px;
        }
        .state-sub {
          font-size: 0.85rem;
          color: rgba(255, 255, 255, 0.4);
          margin-bottom: 22px;
        }

        /* ---------- COMMAND GRID ---------- */
        .cmd-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
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
          background: radial-gradient(circle, rgba(59, 130, 246, 0.06), transparent 70%);
          pointer-events: none;
          opacity: 0;
          transition: opacity 0.3s ease;
        }
        .cmd-card:hover {
          transform: translateY(-4px);
          border-color: rgba(0, 212, 255, 0.3);
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.6), 0 0 40px rgba(59, 130, 246, 0.08);
        }
        .cmd-card:hover::before {
          opacity: 1;
        }

        .cmd-head {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 12px;
          margin-bottom: 12px;
          position: relative;
          z-index: 1;
        }

        .cmd-name {
          font-size: 1.2rem;
          font-weight: 800;
          color: #fff;
          letter-spacing: -0.3px;
          display: flex;
          align-items: baseline;
          gap: 2px;
        }
        .cmd-name .prefix {
          background: linear-gradient(135deg, #3b82f6, #06b6d4);
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
          font-weight: 900;
        }

        .cmd-reacts {
          font-size: 1.4rem;
          flex-shrink: 0;
          line-height: 1;
        }

        .cmd-desc {
          font-size: 0.82rem;
          color: rgba(255, 255, 255, 0.5);
          margin-bottom: 14px;
          line-height: 1.55;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
          min-height: 2.6em;
          position: relative;
          z-index: 1;
        }

        .cmd-tags {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
          margin-bottom: 16px;
          position: relative;
          z-index: 1;
        }
        .tag {
          font-size: 0.62rem;
          padding: 4px 10px;
          border-radius: 30px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          display: inline-flex;
          align-items: center;
          gap: 4px;
        }
        .tag i { font-size: 0.55rem; }
        .tag.api {
          background: rgba(6, 182, 212, 0.12);
          color: #22d3ee;
          border: 1px solid rgba(6, 182, 212, 0.25);
        }
        .tag.simple {
          background: rgba(34, 197, 94, 0.12);
          color: #4ade80;
          border: 1px solid rgba(34, 197, 94, 0.25);
        }
        .tag.alias {
          background: rgba(255, 255, 255, 0.04);
          color: rgba(255, 255, 255, 0.5);
          border: 1px solid rgba(255, 255, 255, 0.08);
          text-transform: none;
          letter-spacing: 0;
        }
        .tag.inactive {
          background: rgba(239, 68, 68, 0.12);
          color: #f87171;
          border: 1px solid rgba(239, 68, 68, 0.25);
        }

        .cmd-actions {
          display: flex;
          gap: 8px;
          padding-top: 14px;
          border-top: 1px solid rgba(255, 255, 255, 0.05);
          position: relative;
          z-index: 1;
        }

        .icon-btn {
          flex: 1;
          padding: 10px 14px;
          border-radius: 30px;
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.06);
          color: rgba(255, 255, 255, 0.7);
          font-size: 0.75rem;
          font-weight: 600;
          font-family: inherit;
          cursor: pointer;
          transition: all 0.2s ease;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          text-decoration: none;
        }
        .icon-btn:hover {
          background: rgba(59, 130, 246, 0.12);
          color: #60a5fa;
          border-color: rgba(59, 130, 246, 0.3);
        }
        .icon-btn.danger:hover {
          background: rgba(239, 68, 68, 0.12);
          color: #f87171;
          border-color: rgba(239, 68, 68, 0.3);
        }
        .icon-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        /* ---------- LOADING ---------- */
        .loading-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
          gap: 16px;
        }
        .skeleton {
          height: 200px;
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

        /* ---------- MOBILE ---------- */
        @media (max-width: 640px) {
          .page-head-left h1 { font-size: 1.5rem; }
          .create-btn { padding: 11px 18px; font-size: 0.75rem; }
          .stat-card { padding: 16px; border-radius: 16px; }
          .stat-value { font-size: 1.6rem; }
          .cmd-card { padding: 18px; border-radius: 18px; }
          .cmd-name { font-size: 1.1rem; }
          .cmd-grid { grid-template-columns: 1fr; }
          .toolbar { flex-direction: column; align-items: stretch; }
          .filter-pills { justify-content: center; }
        }
      `}</style>

      {/* ---------- HEADER ---------- */}
      <div className="page-head">
        <div className="page-head-left">
          <h1>
            Your <span className="blue">Commands</span>
          </h1>
          <p>Manage your WhatsApp bot commands</p>
        </div>

        <Link href="/dashboard/create" className="create-btn">
          <i className="fas fa-plus" />
          Create Command
        </Link>
      </div>

      {/* ---------- STATS ---------- */}
      <div className="stats-row">
        <div className="stat-card">
          <div className="stat-label">
            <i className="fas fa-layer-group" /> Total
          </div>
          <div className="stat-value blue">{commands.length}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">
            <i className="fas fa-link" /> API
          </div>
          <div className="stat-value">
            {commands.filter((c) => c.type === "API").length}
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-label">
            <i className="fas fa-comment" /> Simple
          </div>
          <div className="stat-value">
            {commands.filter((c) => c.type === "simple").length}
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-label">
            <i className="fas fa-circle-check" /> Active
          </div>
          <div className="stat-value">
            {commands.filter((c) => c.isActive).length}
          </div>
        </div>
      </div>

      {/* ---------- TOOLBAR ---------- */}
      {!loading && commands.length > 0 && (
        <div className="toolbar">
          <div className="search-box">
            <i className="fas fa-search" />
            <input
              type="text"
              placeholder="Search commands, aliases..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="filter-pills">
            {[
              { v: "all", label: "All" },
              { v: "simple", label: "Simple" },
              { v: "API", label: "API" },
            ].map((f) => (
              <button
                key={f.v}
                className={`pill ${filter === f.v ? "active" : ""}`}
                onClick={() => setFilter(f.v)}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ---------- CONTENT ---------- */}
      {loading ? (
        <div className="loading-grid">
          {[1, 2, 3].map((i) => (
            <div key={i} className="skeleton" />
          ))}
        </div>
      ) : error ? (
        <div className="state-box">
          <div className="state-icon">⚠️</div>
          <div className="state-title">Failed to load commands</div>
          <div className="state-sub">{error}</div>
          <button className="btn btn-primary" onClick={loadCommands}>
            <i className="fas fa-redo" /> Retry
          </button>
        </div>
      ) : commands.length === 0 ? (
        <div className="state-box">
          <div className="state-icon">📦</div>
          <div className="state-title">No commands yet</div>
          <div className="state-sub">
            Create your first command to get started
          </div>
          <Link href="/dashboard/create" className="create-btn">
            <i className="fas fa-plus" />
            Create First Command
          </Link>
        </div>
      ) : filtered.length === 0 ? (
        <div className="state-box">
          <div className="state-icon">🔍</div>
          <div className="state-title">No matches</div>
          <div className="state-sub">
            Try a different search or filter
          </div>
        </div>
      ) : (
        <div className="cmd-grid">
          {filtered.map((cmd) => (
            <div key={cmd.command} className="cmd-card">
              <div className="cmd-head">
                <div className="cmd-name">
                  <span className="prefix">.</span>
                  {cmd.command}
                </div>
                {cmd.react && <div className="cmd-reacts">{cmd.react}</div>}
              </div>

              {cmd.desc && <div className="cmd-desc">{cmd.desc}</div>}
              {!cmd.desc && (
                <div className="cmd-desc" style={{ opacity: 0.3 }}>
                  No description
                </div>
              )}

              <div className="cmd-tags">
                <span className={`tag ${cmd.type.toLowerCase()}`}>
                  <i
                    className={`fas ${
                      cmd.type === "API" ? "fa-link" : "fa-comment"
                    }`}
                  />
                  {cmd.type}
                </span>
                {cmd.aliase?.slice(0, 3).map((a, i) => (
                  <span key={i} className="tag alias">
                    .{a}
                  </span>
                ))}
                {cmd.aliase?.length > 3 && (
                  <span className="tag alias">+{cmd.aliase.length - 3}</span>
                )}
                {!cmd.isActive && (
                  <span className="tag inactive">Inactive</span>
                )}
              </div>

              <div className="cmd-actions">
                <Link
                  href={`/dashboard/create?edit=${cmd.command}`}
                  className="icon-btn"
                >
                  <i className="fas fa-pen" />
                  Edit
                </Link>
                <button
                  className="icon-btn danger"
                  disabled={deleting === cmd.command}
                  onClick={() => deleteCommand(cmd.command)}
                >
                  <i className="fas fa-trash" />
                  {deleting === cmd.command ? "..." : "Delete"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
