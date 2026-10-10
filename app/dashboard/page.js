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

  return (
    <>
      <style jsx>{`
        .header-row {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 16px;
          margin-bottom: 28px;
          flex-wrap: wrap;
        }

        .create-btn {
          padding: 12px 20px;
          border-radius: 12px;
          background: linear-gradient(135deg, #3b82f6, #06b6d4);
          border: none;
          color: #000;
          font-weight: 700;
          font-size: 0.85rem;
          font-family: inherit;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          cursor: pointer;
          transition: all 0.2s ease;
          text-decoration: none;
        }
        .create-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 12px 30px rgba(59, 130, 246, 0.35);
        }

        .stats-row {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
          gap: 12px;
          margin-bottom: 24px;
        }
        .stat-card {
          padding: 18px 20px;
          border-radius: 14px;
          background: rgba(15, 20, 35, 0.5);
          border: 1px solid rgba(255, 255, 255, 0.05);
        }
        .stat-label {
          font-size: 0.7rem;
          color: rgba(255, 255, 255, 0.35);
          text-transform: uppercase;
          letter-spacing: 1px;
          margin-bottom: 6px;
        }
        .stat-value {
          font-size: 1.5rem;
          font-weight: 800;
          color: #fff;
        }
        .stat-value.blue {
          background: linear-gradient(135deg, #3b82f6, #06b6d4);
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
        }

        .state-box {
          padding: 60px 20px;
          text-align: center;
          border-radius: 16px;
          background: rgba(15, 20, 35, 0.4);
          border: 1px dashed rgba(255, 255, 255, 0.08);
        }
        .state-icon {
          font-size: 2.5rem;
          margin-bottom: 12px;
          opacity: 0.4;
        }
        .state-title {
          font-size: 1.05rem;
          font-weight: 700;
          margin-bottom: 6px;
        }
        .state-sub {
          font-size: 0.85rem;
          color: rgba(255, 255, 255, 0.4);
          margin-bottom: 20px;
        }

        .cmd-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          gap: 14px;
        }

        .cmd-card {
          padding: 18px;
          border-radius: 14px;
          background: rgba(15, 20, 35, 0.6);
          border: 1px solid rgba(255, 255, 255, 0.05);
          transition: all 0.2s ease;
          position: relative;
          overflow: hidden;
        }
        .cmd-card:hover {
          border-color: rgba(59, 130, 246, 0.3);
          transform: translateY(-2px);
          box-shadow: 0 12px 30px rgba(0, 0, 0, 0.4);
        }

        .cmd-head {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 10px;
          margin-bottom: 10px;
        }

        .cmd-name {
          font-size: 1.05rem;
          font-weight: 700;
          color: #fff;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .cmd-name .prefix {
          color: #3b82f6;
          font-weight: 800;
        }

        .cmd-reacts {
          font-size: 1.1rem;
          flex-shrink: 0;
        }

        .cmd-desc {
          font-size: 0.8rem;
          color: rgba(255, 255, 255, 0.5);
          margin-bottom: 12px;
          line-height: 1.5;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        .cmd-tags {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
          margin-bottom: 14px;
        }
        .tag {
          font-size: 0.68rem;
          padding: 3px 9px;
          border-radius: 20px;
          background: rgba(59, 130, 246, 0.1);
          color: #60a5fa;
          border: 1px solid rgba(59, 130, 246, 0.15);
          font-weight: 600;
        }
        .tag.api {
          background: rgba(6, 182, 212, 0.1);
          color: #22d3ee;
          border-color: rgba(6, 182, 212, 0.2);
        }
        .tag.simple {
          background: rgba(34, 197, 94, 0.1);
          color: #4ade80;
          border-color: rgba(34, 197, 94, 0.2);
        }
        .tag.alias {
          background: rgba(255, 255, 255, 0.05);
          color: rgba(255, 255, 255, 0.5);
          border-color: rgba(255, 255, 255, 0.08);
        }
        .tag.inactive {
          background: rgba(239, 68, 68, 0.1);
          color: #f87171;
          border-color: rgba(239, 68, 68, 0.2);
        }

        .cmd-actions {
          display: flex;
          gap: 8px;
          padding-top: 12px;
          border-top: 1px solid rgba(255, 255, 255, 0.04);
        }

        .icon-btn {
          flex: 1;
          padding: 8px 12px;
          border-radius: 8px;
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.06);
          color: rgba(255, 255, 255, 0.6);
          font-size: 0.75rem;
          font-weight: 600;
          font-family: inherit;
          cursor: pointer;
          transition: all 0.15s ease;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
        }
        .icon-btn:hover {
          background: rgba(59, 130, 246, 0.1);
          color: #60a5fa;
          border-color: rgba(59, 130, 246, 0.2);
        }
        .icon-btn.danger:hover {
          background: rgba(239, 68, 68, 0.1);
          color: #f87171;
          border-color: rgba(239, 68, 68, 0.2);
        }
        .icon-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .loading-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          gap: 14px;
        }
        .skeleton {
          height: 180px;
          border-radius: 14px;
          background: linear-gradient(90deg,
            rgba(255, 255, 255, 0.03) 0%,
            rgba(255, 255, 255, 0.06) 50%,
            rgba(255, 255, 255, 0.03) 100%);
          background-size: 200% 100%;
          animation: shimmer 1.4s infinite;
        }
        @keyframes shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>

      <div className="header-row">
        <div className="page-header">
          <h1 className="page-title">Your Commands</h1>
          <p className="page-sub">
            Manage your WhatsApp bot commands
          </p>
        </div>

        <Link href="/dashboard/create" className="create-btn">
          <i className="fas fa-plus" />
          Create Command
        </Link>
      </div>

      {/* Stats */}
      <div className="stats-row">
        <div className="stat-card">
          <div className="stat-label">Total Commands</div>
          <div className="stat-value blue">{commands.length}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">API Commands</div>
          <div className="stat-value">
            {commands.filter((c) => c.type === "API").length}
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Simple Commands</div>
          <div className="stat-value">
            {commands.filter((c) => c.type === "simple").length}
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Active</div>
          <div className="stat-value">
            {commands.filter((c) => c.isActive).length}
          </div>
        </div>
      </div>

      {/* Content */}
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
      ) : (
        <div className="cmd-grid">
          {commands.map((cmd) => (
            <div key={cmd.command} className="cmd-card">
              <div className="cmd-head">
                <div className="cmd-name">
                  <span className="prefix">.</span>
                  {cmd.command}
                </div>
                {cmd.react && <div className="cmd-reacts">{cmd.react}</div>}
              </div>

              {cmd.desc && <div className="cmd-desc">{cmd.desc}</div>}

              <div className="cmd-tags">
                <span className={`tag ${cmd.type.toLowerCase()}`}>
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
                {!cmd.isActive && <span className="tag inactive">inactive</span>}
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
                  {deleting === cmd.command ? "Deleting..." : "Delete"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}