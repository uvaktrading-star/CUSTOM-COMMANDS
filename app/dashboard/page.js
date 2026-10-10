"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const MAX_COMMANDS = 5;

export default function DashboardHome() {
  const router = useRouter();
  const [commands, setCommands] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [toggling, setToggling] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);

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

  async function toggleActive(cmd) {
    setToggling(cmd.command);
    try {
      const userId = localStorage.getItem("bot_id");
      const res = await fetch("/api/add-cmd", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${userId}`,
        },
        body: JSON.stringify({
          command: cmd.command,
          aliase: cmd.aliase || [],
          desc: cmd.desc || "",
          react: cmd.react || "",
          type: cmd.type,
          textConfig: cmd.textConfig,
          apiConfig: cmd.apiConfig,
          responseTemplate: cmd.responseTemplate,
          sendWithImage: cmd.sendWithImage || false,
          imageUrl: cmd.imageUrl || "",
          imageUrlKey: cmd.imageUrlKey || "",
          isActive: !cmd.isActive,
        }),
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error || "Failed to update");
      setCommands((prev) =>
        prev.map((c) =>
          c.command === cmd.command ? { ...c, isActive: !c.isActive } : c
        )
      );
    } catch (err) {
      alert("❌ " + err.message);
    } finally {
      setToggling(null);
    }
  }

  async function deleteCommand(commandName) {
    setDeleting(commandName);
    try {
      const userId = localStorage.getItem("bot_id");
      const res = await fetch(
        `/api/add-cmd?command=${encodeURIComponent(commandName)}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${userId}` },
        }
      );
      const data = await res.json();
      if (!data.ok) throw new Error(data.error || "Failed to delete");

      setCommands((prev) => prev.filter((c) => c.command !== commandName));
      setConfirmDelete(null);
    } catch (err) {
      alert("❌ " + err.message);
    } finally {
      setDeleting(null);
    }
  }

  const filtered = commands.filter((c) => {
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

  const activeCount = commands.filter((c) => c.isActive).length;
  const usagePercent = Math.min((commands.length / MAX_COMMANDS) * 100, 100);

  return (
    <>
      <style jsx>{`
        /* ==================== PAGE HEADER ==================== */
        .page-head {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 20px;
          margin-bottom: 32px;
          flex-wrap: wrap;
        }

        .page-head-left {
          display: flex;
          align-items: center;
          gap: 16px;
          min-width: 0;
        }

        .title-icon {
          width: 56px;
          height: 56px;
          border-radius: 18px;
          background: linear-gradient(135deg, rgba(59, 130, 246, 0.25), rgba(6, 182, 212, 0.15));
          border: 1px solid rgba(59, 130, 246, 0.35);
          display: grid;
          place-items: center;
          color: #60a5fa;
          font-size: 1.4rem;
          box-shadow: 0 0 40px rgba(59, 130, 246, 0.2),
                      inset 0 1px 0 rgba(255, 255, 255, 0.1);
          flex-shrink: 0;
          position: relative;
          overflow: hidden;
        }
        .title-icon::before {
          content: "";
          position: absolute;
          inset: -50%;
          background: conic-gradient(from 0deg, transparent, rgba(59, 130, 246, 0.4), transparent);
          animation: spinIcon 8s linear infinite;
          opacity: 0.5;
        }
        @keyframes spinIcon {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        .title-icon i {
          position: relative;
          z-index: 1;
        }

        .page-title-block h1 {
          font-size: 1.9rem;
          font-weight: 900;
          letter-spacing: -0.8px;
          line-height: 1.1;
          margin-bottom: 4px;
        }
        .page-title-block h1 .blue {
          background: linear-gradient(135deg, #3b82f6, #06b6d4);
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
        }
        .page-title-block p {
          color: rgba(255, 255, 255, 0.4);
          font-size: 0.85rem;
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .page-title-block p i {
          color: #60a5fa;
          font-size: 0.7rem;
        }

        /* ==================== CREATE BUTTON ==================== */
        .create-btn {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          padding: 14px 26px;
          border-radius: 30px;
          background: linear-gradient(135deg, #3b82f6, #06b6d4);
          color: #000 !important;
          font-weight: 800;
          font-size: 0.82rem;
          font-family: inherit;
          text-decoration: none !important;
          text-transform: uppercase;
          letter-spacing: 1.2px;
          transition: all 0.35s cubic-bezier(0.175, 0.885, 0.32, 1.275);
          box-shadow: 0 4px 25px rgba(59, 130, 246, 0.3),
                      inset 0 1px 0 rgba(255, 255, 255, 0.3);
          border: none;
          cursor: pointer;
          position: relative;
          overflow: hidden;
          white-space: nowrap;
          flex-shrink: 0;
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
          box-shadow: 0 18px 50px rgba(59, 130, 246, 0.6),
                      inset 0 1px 0 rgba(255, 255, 255, 0.3);
          color: #000 !important;
        }
        .create-btn:active {
          transform: translateY(-1px) scale(1.01);
        }
        .create-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
          transform: none !important;
        }

        .btn-icon {
          width: 26px;
          height: 26px;
          border-radius: 50%;
          background: rgba(0, 0, 0, 0.18);
          display: grid;
          place-items: center;
          font-size: 0.72rem;
          transition: transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        }
        .create-btn:hover .btn-icon {
          transform: rotate(90deg) scale(1.1);
          background: rgba(0, 0, 0, 0.25);
        }
        .create-btn .arrow {
          font-size: 0.72rem;
          transition: transform 0.3s ease;
        }
        .create-btn:hover .arrow {
          transform: translateX(4px);
        }

        /* ==================== STATS ==================== */
        .stats-row {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
          gap: 16px;
          margin-bottom: 28px;
        }

        .stat-card {
          padding: 22px;
          border-radius: 22px;
          background: rgba(8, 15, 30, 0.65);
          backdrop-filter: blur(22px);
          -webkit-backdrop-filter: blur(22px);
          border: 1px solid rgba(0, 150, 255, 0.12);
          transition: all 0.35s cubic-bezier(0.175, 0.885, 0.32, 1.275);
          position: relative;
          overflow: hidden;
          display: flex;
          align-items: center;
          gap: 18px;
        }
        .stat-card:hover {
          transform: translateY(-4px);
          border-color: rgba(0, 212, 255, 0.35);
          box-shadow: 0 20px 45px rgba(0, 0, 0, 0.5),
                      0 0 40px rgba(59, 130, 246, 0.1);
        }
        .stat-card::after {
          content: "";
          position: absolute;
          top: -50%;
          right: -50%;
          width: 100%;
          height: 100%;
          background: radial-gradient(circle, rgba(59, 130, 246, 0.12), transparent 70%);
          pointer-events: none;
          opacity: 0;
          transition: opacity 0.3s ease;
        }
        .stat-card:hover::after {
          opacity: 1;
        }

        .stat-icon {
          width: 58px;
          height: 58px;
          border-radius: 18px;
          display: grid;
          place-items: center;
          font-size: 1.4rem;
          flex-shrink: 0;
          transition: transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
          position: relative;
        }
        .stat-card:hover .stat-icon {
          transform: scale(1.1) rotate(-8deg);
        }
        .stat-icon.total {
          background: linear-gradient(135deg, rgba(59, 130, 246, 0.25), rgba(6, 182, 212, 0.15));
          color: #60a5fa;
          border: 1px solid rgba(59, 130, 246, 0.4);
          box-shadow: 0 0 30px rgba(59, 130, 246, 0.2),
                      inset 0 1px 0 rgba(255, 255, 255, 0.1);
        }
        .stat-icon.active {
          background: linear-gradient(135deg, rgba(34, 197, 94, 0.25), rgba(16, 185, 129, 0.15));
          color: #4ade80;
          border: 1px solid rgba(34, 197, 94, 0.4);
          box-shadow: 0 0 30px rgba(34, 197, 94, 0.2),
                      inset 0 1px 0 rgba(255, 255, 255, 0.1);
        }

        .stat-body {
          flex: 1;
          min-width: 0;
        }
        .stat-label {
          font-size: 0.65rem;
          color: rgba(255, 255, 255, 0.4);
          text-transform: uppercase;
          letter-spacing: 1.5px;
          font-weight: 700;
          margin-bottom: 6px;
        }
        .stat-value {
          font-size: 2.2rem;
          font-weight: 900;
          color: #fff;
          line-height: 1;
          letter-spacing: -1.5px;
        }
        .stat-value.blue {
          background: linear-gradient(135deg, #3b82f6, #06b6d4);
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
        }
        .stat-value.green {
          background: linear-gradient(135deg, #22c55e, #4ade80);
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
        }

        .stat-sub {
          font-size: 0.68rem;
          color: rgba(255, 255, 255, 0.35);
          margin-top: 6px;
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .stat-sub i {
          color: #60a5fa;
          font-size: 0.6rem;
        }

        .stat-progress {
          margin-top: 10px;
          height: 4px;
          border-radius: 2px;
          background: rgba(255, 255, 255, 0.06);
          overflow: hidden;
          position: relative;
        }
        .stat-progress-fill {
          height: 100%;
          border-radius: 2px;
          background: linear-gradient(90deg, #3b82f6, #06b6d4);
          box-shadow: 0 0 10px rgba(59, 130, 246, 0.5);
          transition: width 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275);
          position: relative;
        }
        .stat-progress-fill::after {
          content: "";
          position: absolute;
          inset: 0;
          background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.4), transparent);
          animation: shimmerBar 2s infinite;
        }
        @keyframes shimmerBar {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
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
          color: rgba(255, 255, 255, 0.35);
          font-size: 0.85rem;
          pointer-events: none;
          transition: color 0.2s ease;
        }
        .search-box:focus-within i {
          color: #60a5fa;
        }
        .search-box input {
          width: 100%;
          padding: 14px 18px 14px 46px;
          border-radius: 30px;
          background: rgba(8, 15, 30, 0.7);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(0, 150, 255, 0.12);
          color: #fff;
          font-size: 0.85rem;
          font-family: inherit;
          outline: none;
          transition: all 0.25s ease;
        }
        .search-box input:focus {
          border-color: #3b82f6;
          background: rgba(8, 15, 30, 0.95);
          box-shadow: 0 0 40px rgba(59, 130, 246, 0.15);
        }
        .search-box input::placeholder {
          color: rgba(255, 255, 255, 0.25);
        }

        /* ==================== STATE BOX ==================== */
        .state-box {
          padding: 80px 20px;
          text-align: center;
          border-radius: 26px;
          background: rgba(8, 15, 30, 0.5);
          backdrop-filter: blur(20px);
          border: 1px dashed rgba(0, 150, 255, 0.25);
          position: relative;
          overflow: hidden;
        }
        .state-box::before {
          content: "";
          position: absolute;
          top: -50%;
          left: 50%;
          transform: translateX(-50%);
          width: 400px;
          height: 400px;
          background: radial-gradient(circle, rgba(59, 130, 246, 0.08), transparent 70%);
          pointer-events: none;
        }
        .state-icon-wrap {
          width: 96px;
          height: 96px;
          border-radius: 28px;
          background: linear-gradient(135deg, rgba(59, 130, 246, 0.18), rgba(6, 182, 212, 0.1));
          border: 1px solid rgba(59, 130, 246, 0.3);
          display: grid;
          place-items: center;
          margin: 0 auto 24px;
          font-size: 2.4rem;
          color: #60a5fa;
          box-shadow: 0 0 50px rgba(59, 130, 246, 0.2),
                      inset 0 1px 0 rgba(255, 255, 255, 0.1);
          position: relative;
          z-index: 1;
          animation: floatIcon 3s ease-in-out infinite;
        }
        @keyframes floatIcon {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-6px); }
        }
        .state-title {
          font-size: 1.25rem;
          font-weight: 800;
          margin-bottom: 8px;
          position: relative;
          z-index: 1;
        }
        .state-sub {
          font-size: 0.85rem;
          color: rgba(255, 255, 255, 0.4);
          margin-bottom: 28px;
          position: relative;
          z-index: 1;
        }

        /* ==================== COMMAND GRID ==================== */
        .cmd-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
          gap: 18px;
        }

        .cmd-card {
          padding: 22px;
          border-radius: 22px;
          background: rgba(8, 15, 30, 0.7);
          backdrop-filter: blur(22px);
          -webkit-backdrop-filter: blur(22px);
          border: 1px solid rgba(0, 150, 255, 0.12);
          transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
          position: relative;
          overflow: hidden;
        }
        .cmd-card.inactive {
          opacity: 0.55;
        }
        .cmd-card.inactive:hover {
          opacity: 0.85;
        }
        .cmd-card::before {
          content: "";
          position: absolute;
          top: -50%;
          right: -50%;
          width: 100%;
          height: 100%;
          background: radial-gradient(circle, rgba(59, 130, 246, 0.1), transparent 70%);
          pointer-events: none;
          opacity: 0;
          transition: opacity 0.35s ease;
        }
        .cmd-card:hover {
          transform: translateY(-5px);
          border-color: rgba(0, 212, 255, 0.35);
          box-shadow: 0 28px 55px -12px rgba(0, 0, 0, 0.65),
                      0 0 45px rgba(59, 130, 246, 0.1);
        }
        .cmd-card:hover::before {
          opacity: 1;
        }

        .cmd-card::after {
          content: "";
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 3px;
          background: linear-gradient(90deg, transparent, #3b82f6, #06b6d4, transparent);
          opacity: 0;
          transition: opacity 0.35s ease;
        }
        .cmd-card:hover::after {
          opacity: 1;
        }
        .cmd-card.inactive::after {
          background: linear-gradient(90deg, transparent, #64748b, transparent);
          opacity: 0.5;
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
          gap: 12px;
          min-width: 0;
          flex: 1;
        }

        .cmd-avatar {
          width: 44px;
          height: 44px;
          border-radius: 14px;
          display: grid;
          place-items: center;
          font-size: 1.05rem;
          flex-shrink: 0;
          transition: transform 0.35s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        }
        .cmd-card:hover .cmd-avatar {
          transform: rotate(-8deg) scale(1.08);
        }
        .cmd-avatar.api {
          background: linear-gradient(135deg, rgba(6, 182, 212, 0.25), rgba(14, 165, 233, 0.15));
          color: #22d3ee;
          border: 1px solid rgba(6, 182, 212, 0.35);
          box-shadow: 0 0 20px rgba(6, 182, 212, 0.15);
        }
        .cmd-avatar.simple {
          background: linear-gradient(135deg, rgba(34, 197, 94, 0.25), rgba(16, 185, 129, 0.15));
          color: #4ade80;
          border: 1px solid rgba(34, 197, 94, 0.35);
          box-shadow: 0 0 20px rgba(34, 197, 94, 0.15);
        }
        .cmd-avatar.gray {
          background: rgba(100, 116, 139, 0.15);
          color: #94a3b8;
          border: 1px solid rgba(100, 116, 139, 0.25);
        }

        .cmd-name-block {
          min-width: 0;
          flex: 1;
        }
        .cmd-name {
          font-size: 1.1rem;
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
          margin-bottom: 4px;
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
          padding: 3px 9px;
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

        .toggle-wrap {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-shrink: 0;
        }

        .toggle {
          position: relative;
          width: 46px;
          height: 26px;
          border-radius: 30px;
          background: rgba(255, 255, 255, 0.08);
          border: 1px solid rgba(255, 255, 255, 0.12);
          cursor: pointer;
          transition: all 0.35s cubic-bezier(0.175, 0.885, 0.32, 1.275);
          flex-shrink: 0;
        }
        .toggle::after {
          content: "";
          position: absolute;
          top: 2px;
          left: 2px;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.7);
          transition: all 0.35s cubic-bezier(0.175, 0.885, 0.32, 1.275);
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
        }
        .toggle:hover {
          border-color: rgba(59, 130, 246, 0.4);
        }
        .toggle.on {
          background: linear-gradient(135deg, #22c55e, #4ade80);
          border-color: rgba(34, 197, 94, 0.5);
          box-shadow: 0 0 18px rgba(34, 197, 94, 0.5),
                      inset 0 1px 0 rgba(255, 255, 255, 0.3);
        }
        .toggle.on::after {
          left: calc(100% - 22px);
          background: #fff;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
        }
        .toggle.busy {
          opacity: 0.5;
          cursor: wait;
        }

        .cmd-desc {
          font-size: 0.82rem;
          color: rgba(255, 255, 255, 0.5);
          margin-bottom: 16px;
          line-height: 1.6;
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

        /* ==================== DELETE BUTTON ==================== */
        .delete-btn {
          flex: 1;
          padding: 11px 16px;
          border-radius: 30px;
          background: rgba(239, 68, 68, 0.08);
          border: 1px solid rgba(239, 68, 68, 0.25);
          color: #f87171;
          font-size: 0.78rem;
          font-weight: 700;
          font-family: inherit;
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          text-decoration: none;
          text-transform: uppercase;
          letter-spacing: 0.8px;
          position: relative;
          overflow: hidden;
        }
        .delete-btn::before {
          content: "";
          position: absolute;
          inset: 0;
          background: linear-gradient(135deg, #ef4444, #dc2626);
          opacity: 0;
          transition: opacity 0.3s ease;
          z-index: 0;
        }
        .delete-btn > * {
          position: relative;
          z-index: 1;
        }
        .delete-btn:hover:not(:disabled) {
          color: #fff;
          border-color: transparent;
          transform: translateY(-2px);
          box-shadow: 0 12px 30px rgba(239, 68, 68, 0.4);
        }
        .delete-btn:hover:not(:disabled)::before {
          opacity: 1;
        }
        .delete-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        .delete-btn.confirming {
          background: linear-gradient(135deg, #ef4444, #dc2626);
          color: #fff;
          border-color: transparent;
        }

        /* ==================== LOADING ==================== */
        .loading-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
          gap: 18px;
        }
        .skeleton {
          height: 220px;
          border-radius: 22px;
          background: linear-gradient(
            90deg,
            rgba(255, 255, 255, 0.03) 0%,
            rgba(59, 130, 246, 0.07) 50%,
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
          .page-head {
            flex-direction: column;
            align-items: stretch;
            gap: 14px;
            margin-bottom: 24px;
          }
          .page-head-left {
            gap: 12px;
          }
          .title-icon {
            width: 48px;
            height: 48px;
            font-size: 1.15rem;
            border-radius: 14px;
          }
          .page-title-block h1 { font-size: 1.45rem; }
          .page-title-block p { font-size: 0.78rem; }
          .create-btn {
            width: 100%;
            justify-content: center;
            padding: 13px 22px;
            font-size: 0.78rem;
          }
          .stat-card {
            padding: 18px;
            border-radius: 18px;
            gap: 14px;
          }
          .stat-icon {
            width: 48px;
            height: 48px;
            font-size: 1.15rem;
            border-radius: 14px;
          }
          .stat-value { font-size: 1.7rem; }
          .stat-label { font-size: 0.6rem; letter-spacing: 1.2px; }
          .stat-sub { font-size: 0.65rem; }
          .cmd-card { padding: 18px; border-radius: 18px; }
          .cmd-avatar { width: 40px; height: 40px; font-size: 0.95rem; }
          .cmd-name { font-size: 1rem; }
          .cmd-grid, .loading-grid { grid-template-columns: 1fr; gap: 14px; }
          .toolbar { flex-direction: column; align-items: stretch; }
          .search-box { min-width: auto; }
          .state-box { padding: 60px 20px; border-radius: 22px; }
          .state-icon-wrap { width: 80px; height: 80px; font-size: 2rem; border-radius: 22px; }
          .state-title { font-size: 1.1rem; }
          .state-sub { font-size: 0.8rem; }
        }

        @media (max-width: 400px) {
          .page-title-block h1 { font-size: 1.25rem; }
          .stat-value { font-size: 1.5rem; }
        }
      `}</style>

      {/* ==================== HEADER ==================== */}
      <div className="page-head">
        <div className="page-head-left">
          <div className="title-icon">
            <i className="fas fa-layer-group" />
          </div>
          <div className="page-title-block">
            <h1>
              Your <span className="blue">Commands</span>
            </h1>
            <p>
              <i className="fas fa-circle-info" />
              Manage your WhatsApp bot commands
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => router.push("/dashboard/create")}
          className="create-btn"
          disabled={commands.length >= MAX_COMMANDS}
          title={
            commands.length >= MAX_COMMANDS
              ? `Max ${MAX_COMMANDS} commands reached`
              : "Create a new command"
          }
        >
          <span className="btn-icon">
            <i className="fas fa-plus" />
          </span>
          <span>Create Command</span>
          <i className="fas fa-arrow-right arrow" />
        </button>
      </div>

      {/* ==================== STATS ==================== */}
      <div className="stats-row">
        <div className="stat-card">
          <div className="stat-icon total">
            <i className="fas fa-cubes" />
          </div>
          <div className="stat-body">
            <div className="stat-label">Total Commands</div>
            <div className="stat-value blue">{commands.length}</div>
            <div className="stat-sub">
              <i className="fas fa-chart-simple" />
              {commands.length}/{MAX_COMMANDS} used
            </div>
            <div className="stat-progress">
              <div
                className="stat-progress-fill"
                style={{ width: `${usagePercent}%` }}
              />
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon active">
            <i className="fas fa-circle-check" />
          </div>
          <div className="stat-body">
            <div className="stat-label">Active</div>
            <div className="stat-value green">{activeCount}</div>
            <div className="stat-sub">
              <i className="fas fa-pause-circle" />
              {commands.length - activeCount} inactive
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
            <span>Retry</span>
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
          <button
            type="button"
            onClick={() => router.push("/dashboard/create")}
            className="create-btn"
          >
            <span className="btn-icon">
              <i className="fas fa-plus" />
            </span>
            <span>Create First Command</span>
            <i className="fas fa-arrow-right arrow" />
          </button>
        </div>
      ) : filtered.length === 0 ? (
        <div className="state-box">
          <div className="state-icon-wrap">
            <i className="fas fa-magnifying-glass" />
          </div>
          <div className="state-title">No matches found</div>
          <div className="state-sub">Try a different search</div>
        </div>
      ) : (
        <div className="cmd-grid">
          {filtered.map((cmd) => {
            const busy = toggling === cmd.command;
            const isDeleting = deleting === cmd.command;
            const isConfirming = confirmDelete === cmd.command;

            return (
              <div
                key={cmd._id || cmd.command}
                className={`cmd-card ${!cmd.isActive ? "inactive" : ""}`}
              >
                <div className="cmd-head">
                  <div className="cmd-title">
                    <div
                      className={`cmd-avatar ${
                        !cmd.isActive ? "gray" : cmd.type.toLowerCase()
                      }`}
                    >
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

                  <div className="toggle-wrap">
                    <div
                      className={`toggle ${cmd.isActive ? "on" : ""} ${
                        busy ? "busy" : ""
                      }`}
                      onClick={() => !busy && toggleActive(cmd)}
                      title={
                        cmd.isActive
                          ? "Click to deactivate"
                          : "Click to activate"
                      }
                      role="switch"
                      aria-checked={cmd.isActive}
                    />
                  </div>
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

                {/* ==================== DELETE BUTTON ==================== */}
                <div className="cmd-actions">
                  {isConfirming ? (
                    <>
                      <button
                        className="delete-btn confirming"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          deleteCommand(cmd.command);
                        }}
                        disabled={isDeleting}
                      >
                        {isDeleting ? (
                          <>
                            <i className="fas fa-spinner fa-spin" />
                            Deleting...
                          </>
                        ) : (
                          <>
                            <i className="fas fa-check" />
                            Confirm Delete
                          </>
                        )}
                      </button>
                      <button
                        className="delete-btn"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setConfirmDelete(null);
                        }}
                        disabled={isDeleting}
                        style={{
                          maxWidth: 60,
                          background: "rgba(255,255,255,0.05)",
                          borderColor: "rgba(255,255,255,0.1)",
                          color: "rgba(255,255,255,0.5)",
                        }}
                        title="Cancel"
                      >
                        <i className="fas fa-times" />
                      </button>
                    </>
                  ) : (
                    <button
                      className="delete-btn"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setConfirmDelete(cmd.command);
                      }}
                      title={`Delete .${cmd.command}`}
                    >
                      <i className="fas fa-trash" />
                      Delete Command
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}
