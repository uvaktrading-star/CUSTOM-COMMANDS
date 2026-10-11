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

  // 🔥 Create button පෙන්නන්නේ commands 1+ තියෙන විට විතරයි
  const showBottomCreateBtn = commands.length > 0;

  return (
    <>
      <style jsx>{`
        /* ==================== PAGE HEADER ==================== */
        .page-head {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 20px;
          margin-bottom: 26px;
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

        /* ==================== STATS — 2 side by side always ==================== */
        .stats-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 14px;
          margin-bottom: 22px;
        }

        .stat-card {
          padding: 20px;
          border-radius: 20px;
          background: rgba(8, 15, 30, 0.65);
          backdrop-filter: blur(22px);
          -webkit-backdrop-filter: blur(22px);
          border: 1px solid rgba(0, 150, 255, 0.12);
          transition: all 0.35s cubic-bezier(0.175, 0.885, 0.32, 1.275);
          position: relative;
          overflow: hidden;
          display: flex;
          align-items: center;
          gap: 16px;
          min-width: 0;
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
          width: 54px;
          height: 54px;
          border-radius: 16px;
          display: grid;
          place-items: center;
          font-size: 1.3rem;
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
          margin-bottom: 4px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .stat-value {
          font-size: 2rem;
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
          font-size: 0.65rem;
          color: rgba(255, 255, 255, 0.35);
          margin-top: 4px;
          display: flex;
          align-items: center;
          gap: 5px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .stat-sub i {
          color: #60a5fa;
          font-size: 0.55rem;
        }

        .stat-progress {
          margin-top: 8px;
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

        /* ==================== TOOLBAR / SEARCH ==================== */
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
          grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
          gap: 16px;
        }

        .cmd-card {
          padding: 20px;
          border-radius: 20px;
          background: rgba(8, 15, 30, 0.7);
          backdrop-filter: blur(22px);
          -webkit-backdrop-filter: blur(22px);
          border: 1px solid rgba(0, 150, 255, 0.12);
          transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
          position: relative;
          overflow: hidden;
          display: flex;
          flex-direction: column;
          gap: 14px;
          min-height: 260px;
        }
        .cmd-card.inactive {
          opacity: 0.6;
        }
        .cmd-card.inactive:hover {
          opacity: 0.9;
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

        /* Card header row */
        .cmd-head {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 12px;
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
          margin-bottom: 5px;
        }
        .cmd-name .prefix {
          background: linear-gradient(135deg, #3b82f6, #06b6d4);
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
          font-weight: 900;
        }

        /* Badge row — type + owner-only */
        .badge-row {
          display: flex;
          flex-wrap: wrap;
          gap: 5px;
        }

        .cmd-type-badge {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          font-size: 0.58rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.8px;
          padding: 3px 8px;
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

        .cmd-owner-badge {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          font-size: 0.58rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.8px;
          padding: 3px 8px;
          border-radius: 20px;
        }
        .cmd-owner-badge.owner {
          background: rgba(168, 85, 247, 0.12);
          color: #c084fc;
          border: 1px solid rgba(168, 85, 247, 0.3);
        }
        .cmd-owner-badge.public {
          background: rgba(59, 130, 246, 0.1);
          color: #60a5fa;
          border: 1px solid rgba(59, 130, 246, 0.25);
        }

        /* Toggle */
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

        /* Description */
        .cmd-desc {
          font-size: 0.8rem;
          color: rgba(255, 255, 255, 0.5);
          line-height: 1.55;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
          min-height: 2.5em;
          position: relative;
          z-index: 1;
        }
        .cmd-desc.empty {
          opacity: 0.35;
          font-style: italic;
        }

        /* Tags row */
        .cmd-tags {
          display: flex;
          flex-wrap: wrap;
          gap: 5px;
          position: relative;
          z-index: 1;
        }
        .tag {
          font-size: 0.63rem;
          padding: 4px 9px;
          border-radius: 30px;
          font-weight: 700;
          display: inline-flex;
          align-items: center;
          gap: 4px;
        }
        .tag i { font-size: 0.55rem; }
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
          padding: 3px 8px;
          font-size: 0.85rem;
        }

        /* ==================== ACTIONS ==================== */
        .cmd-actions {
          display: flex;
          gap: 8px;
          padding-top: 14px;
          border-top: 1px solid rgba(255, 255, 255, 0.05);
          position: relative;
          z-index: 1;
          margin-top: auto;
        }

        .delete-btn {
          flex: 1;
          padding: 10px 14px;
          border-radius: 30px;
          background: rgba(239, 68, 68, 0.08);
          border: 1px solid rgba(239, 68, 68, 0.25);
          color: #f87171;
          font-size: 0.75rem;
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

        /* Confirm buttons */
        .confirm-btn {
          flex: 1;
          padding: 10px 14px;
          border-radius: 30px;
          background: linear-gradient(135deg, #ef4444, #dc2626);
          border: 1px solid transparent;
          color: #fff;
          font-size: 0.75rem;
          font-weight: 800;
          font-family: inherit;
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          text-transform: uppercase;
          letter-spacing: 0.8px;
          box-shadow: 0 4px 20px rgba(239, 68, 68, 0.4);
          animation: confirmPulse 1.2s ease-in-out infinite;
        }
        @keyframes confirmPulse {
          0%, 100% { box-shadow: 0 4px 20px rgba(239, 68, 68, 0.4); }
          50% { box-shadow: 0 4px 30px rgba(239, 68, 68, 0.7); }
        }
        .confirm-btn:hover:not(:disabled) {
          transform: translateY(-2px) scale(1.02);
          box-shadow: 0 12px 40px rgba(239, 68, 68, 0.7);
        }
        .confirm-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .cancel-btn {
          width: 46px;
          flex-shrink: 0;
          padding: 10px;
          border-radius: 30px;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.12);
          color: rgba(255, 255, 255, 0.6);
          font-size: 0.85rem;
          cursor: pointer;
          transition: all 0.25s ease;
          display: grid;
          place-items: center;
        }
        .cancel-btn:hover {
          background: rgba(255, 255, 255, 0.1);
          color: #fff;
          border-color: rgba(255, 255, 255, 0.25);
        }

        /* Confirm banner */
        .confirm-banner {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 12px;
          border-radius: 10px;
          background: rgba(239, 68, 68, 0.08);
          border: 1px solid rgba(239, 68, 68, 0.25);
          color: #f87171;
          font-size: 0.68rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.6px;
          margin-bottom: 10px;
          animation: slideDown 0.25s ease;
        }
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-6px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .confirm-banner i {
          font-size: 0.75rem;
        }

        /* ==================== LOADING ==================== */
        .loading-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
          gap: 16px;
        }
        .skeleton {
          height: 240px;
          border-radius: 20px;
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

        /* ==================== BOTTOM CREATE BUTTON ==================== */
        .bottom-create-wrap {
          display: flex;
          justify-content: center;
          margin-top: 32px;
          padding-top: 8px;
          animation: fadeInUp 0.4s ease;
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .bottom-create-btn {
          display: inline-flex;
          align-items: center;
          gap: 12px;
          padding: 16px 32px;
          border-radius: 40px;
          background: linear-gradient(135deg, #3b82f6, #06b6d4);
          color: #000;
          font-weight: 800;
          font-size: 0.85rem;
          font-family: inherit;
          text-transform: uppercase;
          letter-spacing: 1.5px;
          border: none;
          cursor: pointer;
          position: relative;
          overflow: hidden;
          box-shadow:
            0 10px 40px rgba(59, 130, 246, 0.4),
            0 0 60px rgba(59, 130, 246, 0.2),
            inset 0 1px 0 rgba(255, 255, 255, 0.3);
          transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        }
        .bottom-create-btn::before {
          content: "";
          position: absolute;
          inset: 0;
          background: linear-gradient(135deg, #06b6d4, #3b82f6);
          opacity: 0;
          transition: opacity 0.3s ease;
          z-index: 0;
        }
        .bottom-create-btn::after {
          content: "";
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(
            90deg,
            transparent,
            rgba(255, 255, 255, 0.35),
            transparent
          );
          transition: left 0.6s ease;
          z-index: 1;
        }
        .bottom-create-btn:hover::before {
          opacity: 1;
        }
        .bottom-create-btn:hover::after {
          left: 100%;
        }
        .bottom-create-btn:hover:not(:disabled) {
          transform: translateY(-4px) scale(1.03);
          box-shadow:
            0 20px 60px rgba(59, 130, 246, 0.6),
            0 0 80px rgba(59, 130, 246, 0.3),
            inset 0 1px 0 rgba(255, 255, 255, 0.3);
        }
        .bottom-create-btn:active:not(:disabled) {
          transform: translateY(-2px) scale(1.01);
        }
        .bottom-create-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
          transform: none !important;
        }
        .bottom-create-btn > * {
          position: relative;
          z-index: 2;
        }

        .bottom-create-btn .pulse-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #000;
          box-shadow: 0 0 10px rgba(0, 0, 0, 0.5);
          animation: pulseDot 1.5s ease-in-out infinite;
        }
        @keyframes pulseDot {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(0.8); }
        }

        .bottom-create-btn .btn-icon {
          width: 28px;
          height: 28px;
          border-radius: 50%;
          background: rgba(0, 0, 0, 0.2);
          display: grid;
          place-items: center;
          font-size: 0.75rem;
          transition: transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        }
        .bottom-create-btn:hover .btn-icon {
          transform: rotate(90deg) scale(1.15);
          background: rgba(0, 0, 0, 0.3);
        }

        .bottom-create-btn .arrow {
          font-size: 0.75rem;
          transition: transform 0.3s ease;
        }
        .bottom-create-btn:hover .arrow {
          transform: translateX(5px);
        }

        /* ==================== MOBILE ==================== */
        @media (max-width: 640px) {
          .page-head {
            flex-direction: column;
            align-items: stretch;
            gap: 14px;
            margin-bottom: 22px;
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

          /* Stats — still side by side on mobile */
          .stats-row {
            gap: 10px;
            margin-bottom: 18px;
          }
          .stat-card {
            padding: 14px 12px;
            border-radius: 16px;
            gap: 10px;
            flex-direction: column;
            align-items: flex-start;
          }
          .stat-icon {
            width: 42px;
            height: 42px;
            font-size: 1rem;
            border-radius: 12px;
          }
          .stat-value { font-size: 1.5rem; }
          .stat-label { font-size: 0.55rem; letter-spacing: 1px; }
          .stat-sub { font-size: 0.6rem; }

          .cmd-card { padding: 16px; border-radius: 18px; gap: 12px; min-height: 240px; }
          .cmd-avatar { width: 40px; height: 40px; font-size: 0.95rem; border-radius: 12px; }
          .cmd-name { font-size: 0.98rem; }
          .cmd-desc { font-size: 0.78rem; }
          .cmd-grid, .loading-grid { grid-template-columns: 1fr; gap: 12px; }
          .toolbar { flex-direction: column; align-items: stretch; margin-bottom: 18px; }
          .search-box { min-width: auto; }
          .search-box input { padding: 12px 16px 12px 42px; font-size: 0.82rem; }
          .state-box { padding: 60px 20px; border-radius: 22px; }
          .state-icon-wrap { width: 80px; height: 80px; font-size: 2rem; border-radius: 22px; }
          .state-title { font-size: 1.1rem; }
          .state-sub { font-size: 0.8rem; }

          .bottom-create-wrap {
            margin-top: 24px;
          }
          .bottom-create-btn {
            width: 100%;
            justify-content: center;
            padding: 15px 24px;
            font-size: 0.78rem;
            letter-spacing: 1.2px;
          }
        }

        @media (max-width: 400px) {
          .page-title-block h1 { font-size: 1.25rem; }
          .stat-value { font-size: 1.35rem; }
          .stat-label { font-size: 0.5rem; }
          .cmd-card { padding: 14px; }
          .bottom-create-btn { font-size: 0.72rem; padding: 14px 18px; }
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
        {/* 🔥 Create button එක header එකෙන් අයින් කරා */}
      </div>

      {/* ==================== STATS — 2 side by side ==================== */}
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

      {/* ==================== SEARCH ==================== */}
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
        <>
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
                  {/* Confirm banner (shows only when confirming) */}
                  {isConfirming && (
                    <div className="confirm-banner">
                      <i className="fas fa-triangle-exclamation" />
                      Are you sure? This cannot be undone
                    </div>
                  )}

                  <div className="cmd-head">
                    <div className="cmd-title">
                      <div
                        className={`cmd-avatar ${
                          !cmd.isActive ? "gray" : cmd.type.toLowerCase()
                        }`}
                      >
                        <i
                          className={`fas ${
                            cmd.type === "API"
                              ? "fa-bolt"
                              : "fa-comment-dots"
                          }`}
                        />
                      </div>
                      <div className="cmd-name-block">
                        <div className="cmd-name">
                          <span className="prefix">.</span>
                          {cmd.command}
                        </div>
                        <div className="badge-row">
                          <span
                            className={`cmd-type-badge ${cmd.type.toLowerCase()}`}
                          >
                            <i
                              className={`fas ${
                                cmd.type === "API"
                                  ? "fa-bolt"
                                  : "fa-comment-dots"
                              }`}
                            />
                            {cmd.type}
                          </span>
                          {cmd.ownerOnly ? (
                            <span className="cmd-owner-badge owner">
                              <i className="fas fa-lock" />
                              Owner
                            </span>
                          ) : (
                            <span className="cmd-owner-badge public">
                              <i className="fas fa-users" />
                              Public
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

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

                  {/* ==================== ACTIONS ==================== */}
                  <div className="cmd-actions">
                    {isConfirming ? (
                      <>
                        <button
                          className="confirm-btn"
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
                          className="cancel-btn"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setConfirmDelete(null);
                          }}
                          disabled={isDeleting}
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

          {/* 🔥 Bottom Create Button — only when user has commands */}
          {showBottomCreateBtn && (
            <div className="bottom-create-wrap">
              <button
                type="button"
                onClick={() => router.push("/dashboard/create")}
                className="bottom-create-btn"
                disabled={commands.length >= MAX_COMMANDS}
                title={
                  commands.length >= MAX_COMMANDS
                    ? `Max ${MAX_COMMANDS} commands reached`
                    : "Create a new command"
                }
              >
                <span className="pulse-dot" />
                <span className="btn-icon">
                  <i className="fas fa-plus" />
                </span>
                <span>Create New Command</span>
                <i className="fas fa-arrow-right arrow" />
              </button>
            </div>
          )}
        </>
      )}
    </>
  );
}
