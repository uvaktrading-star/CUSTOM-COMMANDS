"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

const CHECK_API = "/api/check";
const AUTH_API = "https://zanta-web-auth.vercel.app/api/auth";
const WHATSAPP_BUY = "http://wa.me/+94771810698?text=*Buy+Paid*";

export default function LoginPage() {
  const router = useRouter();
  const starsRef = useRef(null);

  const [botId, setBotId] = useState("");
  const [botPass, setBotPass] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [glowing, setGlowing] = useState(false);
  const [showPaidPopup, setShowPaidPopup] = useState(false);
  const [checkingStatus, setCheckingStatus] = useState("");

  /* ---------- Stars background ---------- */
  useEffect(() => {
    const container = starsRef.current;
    if (!container) return;

    container.innerHTML = "";
    for (let i = 0; i < 80; i++) {
      const star = document.createElement("div");
      star.className = "star";
      const size = Math.random() * 2.5 + 1;
      star.style.width = size + "px";
      star.style.height = size + "px";
      star.style.left = Math.random() * 100 + "%";
      star.style.top = Math.random() * 100 + "%";
      star.style.animationDuration = Math.random() * 5 + 3 + "s";
      star.style.animationDelay = Math.random() * 8 + "s";
      container.appendChild(star);
    }
  }, []);

  /* ---------- Music on first click ---------- */
  useEffect(() => {
    const onFirstClick = () => {
      const music = document.getElementById("bgMusic");
      if (music && music.paused) music.play().catch(() => {});
    };
    window.addEventListener("click", onFirstClick, { once: true });
    return () => window.removeEventListener("click", onFirstClick);
  }, []);

  /* ---------- Auto glow button ---------- */
  useEffect(() => {
    const id = setInterval(() => setGlowing((g) => !g), 2000);
    return () => clearInterval(id);
  }, []);

  /* ---------- Enter key submit ---------- */
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Enter") handleLogin();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [botId, botPass]);

  /* ---------- Login handler ---------- */
  async function handleLogin() {
    setError("");

    const id = botId.trim().replace(/\D/g, "");
    const password = botPass.trim();

    if (!id || !password) {
      setError("Please fill all fields!");
      return;
    }

    setLoading(true);
    setCheckingStatus("Verifying account...");

    try {
      /* ==================================================
         STEP 1: Check if user is PAID via /api/check
         ================================================== */
      setCheckingStatus("Checking subscription...");

      const checkRes = await fetch(CHECK_API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, password }),
      });

      let checkData = {};
      try {
        checkData = await checkRes.json();
      } catch {
        checkData = {};
      }

      /* ---------- Not paid → show popup ---------- */
      if (!checkData.success || !checkData.paid) {
        // "user not found" / "invalid password" වගේ errors තියෙනවා නම්
        // ඒවා error message විදියට පෙන්නන්න
        const isCredentialError =
          checkRes.status === 401 ||
          checkRes.status === 404 ||
          /not found|invalid password/i.test(checkData.error || "");

        if (isCredentialError) {
          setError(checkData.error || "Invalid credentials!");
          setLoading(false);
          setCheckingStatus("");
          return;
        }

        // ඉතුරු ඒවා (free, unpaid, etc.) → paid popup එක
        setLoading(false);
        setCheckingStatus("");
        setShowPaidPopup(true);
        return;
      }

      /* ==================================================
         STEP 2: User is PAID → call AUTH API to login
         ================================================== */
      setCheckingStatus("Signing you in...");

      const authRes = await fetch(AUTH_API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, password, action: "login" }),
      });

      const authData = await authRes.json();

      if (authData.success) {
        localStorage.setItem("bot_id", id);
        localStorage.setItem("bot_pass", password);
        localStorage.setItem(
          "bot_settings",
          JSON.stringify(authData.settings || checkData.settings || {})
        );
        router.push("/dashboard");
      } else {
        setError(authData.error || "Invalid credentials!");
        setLoading(false);
        setCheckingStatus("");
      }
    } catch {
      setError("Connection Error! Please try again.");
      setLoading(false);
      setCheckingStatus("");
    }
  }

  return (
    <>
      {/* ========== STYLES ========== */}
      <style jsx global>{`
        /* RESET */
        * { margin: 0; padding: 0; box-sizing: border-box; }

        body {
          font-family: var(--font-inter), "Inter", sans-serif;
          background: #0a0a0f;
          color: #ffffff;
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 80px 16px 100px 16px;
          overflow-x: hidden;
        }

        /* SPACE BACKGROUND */
        .stars-container {
          position: fixed;
          inset: 0;
          z-index: 0;
          background: radial-gradient(circle at center, #0a1a2d 0%, #000000 100%);
          pointer-events: none;
        }
        .star {
          position: absolute;
          background: #b6e3ff;
          border-radius: 50%;
          opacity: 0.6;
          animation: move linear infinite;
        }
        @keyframes move {
          0% { transform: translateY(100vh) scale(0); opacity: 0; }
          10% { opacity: 0.8; }
          90% { opacity: 0.8; }
          100% { transform: translateY(-10vh) scale(1); opacity: 0; }
        }

        /* TECH GRID */
        .tech-grid {
          position: fixed;
          inset: 0;
          z-index: 1;
          pointer-events: none;
          background-image:
            linear-gradient(rgba(0, 100, 255, 0.04) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0, 100, 255, 0.04) 1px, transparent 1px);
          background-size: 55px 55px;
        }

        /* BLOB */
        .blob-1 {
          position: fixed;
          width: 500px;
          height: 500px;
          background: radial-gradient(circle, #3b82f6, #06b6d4);
          filter: blur(120px);
          border-radius: 50%;
          opacity: 0.06;
          top: -150px;
          right: -150px;
          animation: floatBlob 20s infinite alternate;
          z-index: 1;
          pointer-events: none;
        }
        @keyframes floatBlob {
          0% { transform: translate(0, 0) scale(1); }
          100% { transform: translate(-100px, 100px) scale(1.3); }
        }

        /* GLASS CARD */
        .glass-card {
          position: relative;
          z-index: 10;
          width: 100%;
          max-width: 440px;
          background: rgba(8, 15, 30, 0.65);
          backdrop-filter: blur(22px);
          -webkit-backdrop-filter: blur(22px);
          border: 1px solid rgba(0, 150, 255, 0.15);
          border-radius: 2.5rem;
          padding: 60px 28px 40px 28px;
          box-shadow: 0 30px 60px -15px rgba(0, 0, 0, 0.6), inset 0 1px 0 rgba(255, 255, 255, 0.05);
          text-align: center;
          transition: all 0.4s ease;
        }
        .glass-card:hover {
          border-color: rgba(0, 212, 255, 0.25);
          box-shadow: 0 30px 80px rgba(0, 0, 0, 0.7);
        }

        /* LOGO */
        .logo-wrapper {
          position: relative;
          width: 100px;
          height: 100px;
          margin: 0 auto 20px;
        }
        .logo-wrapper img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          border-radius: 50%;
          border: 2px solid rgba(0, 150, 255, 0.4);
          box-shadow: 0 0 30px rgba(0, 150, 255, 0.2);
          transition: all 0.4s ease;
        }
        .logo-wrapper img:hover {
          transform: scale(1.05);
          box-shadow: 0 0 50px rgba(0, 150, 255, 0.35);
        }
        .logo-ring {
          position: absolute;
          inset: -5px;
          border-radius: 50%;
          background: conic-gradient(from 0deg, transparent, #3b82f6, transparent, #06b6d4, transparent);
          z-index: -1;
          animation: spinRing 4s linear infinite;
          opacity: 0.5;
        }
        @keyframes spinRing {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        /* TYPOGRAPHY */
        .brand {
          font-size: 2.4rem;
          font-weight: 900;
          letter-spacing: -0.5px;
          line-height: 1.1;
        }
        .brand .blue {
          background: linear-gradient(135deg, #3b82f6, #06b6d4);
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
        }
        .brand .white { color: #ffffff; }
        .subtitle {
          font-size: 0.65rem;
          font-weight: 500;
          color: rgba(255, 255, 255, 0.3);
          letter-spacing: 4px;
          text-transform: uppercase;
          margin-top: 4px;
        }
        .divider-line {
          width: 50px;
          height: 2px;
          margin: 16px auto 24px auto;
          background: linear-gradient(90deg, transparent, #3b82f6, transparent);
          border-radius: 2px;
        }

        /* FORM */
        .input-group {
          margin-bottom: 18px;
          text-align: left;
        }
        .input-group label {
          display: block;
          font-size: 0.7rem;
          font-weight: 600;
          color: rgba(255, 255, 255, 0.4);
          margin-bottom: 6px;
          margin-left: 4px;
          letter-spacing: 1px;
          text-transform: uppercase;
        }
        .input-group label i {
          margin-right: 8px;
          color: #3b82f6;
        }
        .custom-input {
          width: 100%;
          padding: 16px 20px;
          background: rgba(0, 0, 0, 0.3);
          border: 1px solid rgba(255, 255, 255, 0.06);
          border-radius: 60px;
          color: #ffffff;
          font-size: 0.95rem;
          font-weight: 500;
          outline: none;
          transition: all 0.3s ease;
          font-family: var(--font-inter), "Inter", sans-serif;
        }
        .custom-input:focus {
          border-color: #3b82f6;
          box-shadow: 0 0 30px rgba(59, 130, 246, 0.06);
          background: rgba(0, 0, 0, 0.4);
        }
        .custom-input::placeholder {
          color: rgba(255, 255, 255, 0.15);
          font-weight: 400;
        }

        /* BUTTON */
        .btn-primary {
          width: 100%;
          padding: 18px 24px;
          border-radius: 60px;
          font-weight: 700;
          font-size: 0.8rem;
          text-align: center;
          transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
          cursor: pointer;
          border: none;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          font-family: var(--font-inter), "Inter", sans-serif;
          text-transform: uppercase;
          letter-spacing: 1.5px;
          background: linear-gradient(135deg, #3b82f6, #06b6d4);
          color: #000;
          box-shadow: 0 4px 25px rgba(59, 130, 246, 0.2);
          margin-top: 8px;
          position: relative;
          overflow: hidden;
        }
        .btn-primary:hover:not(:disabled) {
          transform: translateY(-3px) scale(1.02);
          box-shadow: 0 12px 40px rgba(59, 130, 246, 0.4);
        }
        .btn-primary:disabled {
          opacity: 0.5;
          cursor: not-allowed;
          transform: none !important;
        }
        .btn-primary.auto-glow {
          animation: glowPulse 1.5s ease-in-out infinite;
        }
        @keyframes glowPulse {
          0%, 100% { box-shadow: 0 4px 25px rgba(59, 130, 246, 0.2); }
          50% { box-shadow: 0 4px 50px rgba(59, 130, 246, 0.6), 0 0 80px rgba(59, 130, 246, 0.2); }
        }

        /* ERROR */
        #errorMsg {
          color: #ef4444;
          font-size: 0.8rem;
          margin-top: 14px;
          display: none;
          font-weight: 500;
        }
        #errorMsg.show {
          display: block;
          animation: shake 0.4s ease;
        }
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          20% { transform: translateX(-10px); }
          40% { transform: translateX(10px); }
          60% { transform: translateX(-6px); }
          80% { transform: translateX(6px); }
        }

        /* STATUS */
        .status-row {
          display: flex;
          justify-content: center;
          gap: 24px;
          margin-top: 24px;
          padding-top: 20px;
          border-top: 1px solid rgba(255, 255, 255, 0.04);
        }
        .status-item {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 0.55rem;
          color: rgba(255, 255, 255, 0.25);
          font-weight: 600;
          letter-spacing: 0.5px;
          text-transform: uppercase;
        }
        .status-dot {
          width: 8px;
          height: 8px;
          background: #22c55e;
          border-radius: 50%;
          animation: pulse 1.5s infinite;
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.4; transform: scale(0.8); }
        }
        .status-item i { color: rgba(255, 255, 255, 0.15); }

        /* MUSIC TAG */
        .music-tag {
          margin-top: 18px;
          font-size: 0.6rem;
          color: rgba(255, 255, 255, 0.15);
          letter-spacing: 1px;
          animation: pulseText 2s infinite ease-in-out;
        }
        @keyframes pulseText {
          0%, 100% { opacity: 0.2; }
          50% { opacity: 0.6; }
        }

        /* BACK LINK */
        .back-link {
          margin-top: 16px;
          color: rgba(255, 255, 255, 0.15);
          font-size: 0.7rem;
          text-decoration: none;
          transition: all 0.3s ease;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          position: relative;
          z-index: 10;
        }
        .back-link:hover { color: #3b82f6; }

        /* CHECKING STATUS */
        .checking-status {
          color: #60a5fa;
          font-size: 0.72rem;
          margin-top: 10px;
          font-weight: 600;
          letter-spacing: 1px;
          animation: pulseText 1.5s infinite ease-in-out;
          display: inline-flex;
          align-items: center;
          gap: 8px;
        }
        .checking-status i {
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        /* ==================================================
           PAID POPUP MODAL
           ================================================== */
        .modal-overlay {
          position: fixed;
          inset: 0;
          z-index: 9999;
          background: rgba(0, 0, 0, 0.75);
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
          animation: fadeIn 0.3s ease;
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        .modal-card {
          position: relative;
          width: 100%;
          max-width: 420px;
          background: linear-gradient(160deg, rgba(15, 25, 45, 0.98), rgba(8, 15, 30, 0.98));
          border: 1px solid rgba(0, 150, 255, 0.25);
          border-radius: 28px;
          padding: 40px 28px 32px 28px;
          text-align: center;
          box-shadow:
            0 30px 80px rgba(0, 0, 0, 0.8),
            0 0 60px rgba(59, 130, 246, 0.15),
            inset 0 1px 0 rgba(255, 255, 255, 0.05);
          animation: modalIn 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
          overflow: hidden;
        }
        @keyframes modalIn {
          from { opacity: 0; transform: scale(0.85) translateY(20px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }

        .modal-card::before {
          content: "";
          position: absolute;
          top: -100px;
          right: -100px;
          width: 250px;
          height: 250px;
          background: radial-gradient(circle, rgba(239, 68, 68, 0.15), transparent 70%);
          pointer-events: none;
        }

        .modal-icon {
          position: relative;
          width: 90px;
          height: 90px;
          margin: 0 auto 20px;
          border-radius: 50%;
          background: linear-gradient(135deg, rgba(239, 68, 68, 0.2), rgba(220, 38, 38, 0.1));
          border: 2px solid rgba(239, 68, 68, 0.4);
          display: grid;
          place-items: center;
          color: #f87171;
          font-size: 2.2rem;
          box-shadow: 0 0 40px rgba(239, 68, 68, 0.3);
          animation: pulseLock 2s ease-in-out infinite;
        }
        @keyframes pulseLock {
          0%, 100% { transform: scale(1); box-shadow: 0 0 40px rgba(239, 68, 68, 0.3); }
          50% { transform: scale(1.05); box-shadow: 0 0 60px rgba(239, 68, 68, 0.5); }
        }

        .modal-title {
          font-size: 1.5rem;
          font-weight: 900;
          letter-spacing: -0.5px;
          margin-bottom: 8px;
          background: linear-gradient(135deg, #f87171, #ef4444);
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
        }

        .modal-subtitle {
          font-size: 0.85rem;
          color: rgba(255, 255, 255, 0.6);
          line-height: 1.6;
          margin-bottom: 24px;
          padding: 0 8px;
        }

        .modal-divider {
          width: 60px;
          height: 2px;
          margin: 0 auto 22px;
          background: linear-gradient(90deg, transparent, #ef4444, transparent);
          border-radius: 2px;
        }

        .btn-whatsapp {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          width: 100%;
          padding: 18px 24px;
          border-radius: 60px;
          font-weight: 800;
          font-size: 0.85rem;
          font-family: var(--font-inter), "Inter", sans-serif;
          text-transform: uppercase;
          letter-spacing: 1.5px;
          background: linear-gradient(135deg, #25d366, #128c7e);
          color: #ffffff;
          text-decoration: none;
          cursor: pointer;
          border: none;
          box-shadow: 0 4px 25px rgba(37, 211, 102, 0.35);
          transition: all 0.35s cubic-bezier(0.175, 0.885, 0.32, 1.275);
          position: relative;
          overflow: hidden;
        }
        .btn-whatsapp::before {
          content: "";
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.25), transparent);
          transition: left 0.6s ease;
        }
        .btn-whatsapp:hover {
          transform: translateY(-3px) scale(1.02);
          box-shadow: 0 12px 40px rgba(37, 211, 102, 0.55);
        }
        .btn-whatsapp:hover::before {
          left: 100%;
        }
        .btn-whatsapp i {
          font-size: 1.1rem;
        }

        .btn-close {
          margin-top: 14px;
          background: transparent;
          border: none;
          color: rgba(255, 255, 255, 0.35);
          font-size: 0.75rem;
          font-family: inherit;
          cursor: pointer;
          padding: 8px 16px;
          letter-spacing: 1px;
          text-transform: uppercase;
          font-weight: 600;
          transition: color 0.3s ease;
        }
        .btn-close:hover {
          color: rgba(255, 255, 255, 0.7);
        }

        .modal-price-tag {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 6px 14px;
          border-radius: 20px;
          background: rgba(59, 130, 246, 0.1);
          border: 1px solid rgba(59, 130, 246, 0.3);
          color: #60a5fa;
          font-size: 0.7rem;
          font-weight: 700;
          letter-spacing: 0.5px;
          text-transform: uppercase;
          margin-bottom: 18px;
        }

        /* RESPONSIVE */
        @media (max-width: 480px) {
          .glass-card { padding: 40px 20px 30px 20px; border-radius: 32px; }
          .brand { font-size: 2rem; }
          .logo-wrapper { width: 85px; height: 85px; }
          .custom-input { padding: 14px 18px; font-size: 0.85rem; }
          .btn-primary { padding: 16px 20px; font-size: 0.7rem; }
          .status-row { gap: 16px; flex-wrap: wrap; }
          .modal-card { padding: 32px 20px 26px 20px; border-radius: 24px; }
          .modal-title { font-size: 1.25rem; }
          .modal-icon { width: 75px; height: 75px; font-size: 1.8rem; }
          .btn-whatsapp { padding: 16px 20px; font-size: 0.75rem; }
        }
        @media (max-width: 380px) {
          .brand { font-size: 1.6rem; }
          .glass-card { padding: 30px 16px 24px 16px; }
          .custom-input { padding: 12px 16px; font-size: 0.8rem; }
          .btn-primary { padding: 14px 16px; font-size: 0.65rem; }
        }
      `}</style>

      {/* ========== BACKGROUNDS ========== */}
      <div className="stars-container" ref={starsRef} />
      <div className="tech-grid" />
      <div className="blob-1" />

      {/* ========== GLASS CARD ========== */}
      <div className="glass-card">
        <div className="logo-wrapper">
          <div className="logo-ring" />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="https://www.zanta-mini.store/src/zanta.png" alt="ZANTA" />
        </div>

        <div className="brand">
          <span className="blue">ZANTA</span>
          <span className="white">-MD</span>
        </div>
        <div className="subtitle">Dashboard Login</div>
        <div className="divider-line" />

        <div className="input-group">
          <label>
            <i className="fas fa-phone" /> WhatsApp Number
          </label>
          <input
            type="text"
            className="custom-input"
            placeholder="94743404814"
            inputMode="numeric"
            value={botId}
            onChange={(e) => setBotId(e.target.value)}
            disabled={loading}
          />
        </div>

        <div className="input-group">
          <label>
            <i className="fas fa-lock" /> Bot Password
          </label>
          <input
            type="password"
            className="custom-input"
            placeholder="Enter your password"
            value={botPass}
            onChange={(e) => setBotPass(e.target.value)}
            disabled={loading}
          />
        </div>

        <button
          className={`btn-primary ${glowing && !loading ? "auto-glow" : ""}`}
          onClick={handleLogin}
          disabled={loading}
        >
          <i
            className={`fas ${
              loading ? "fa-spinner fa-spin" : "fa-sign-in-alt"
            }`}
          />
          <span>{loading ? "VERIFYING..." : "Login Now"}</span>
          {!loading && <i className="fas fa-arrow-right" />}
        </button>

        {loading && checkingStatus && (
          <div className="checking-status">
            <i className="fas fa-circle-notch" />
            {checkingStatus}
          </div>
        )}

        <p id="errorMsg" className={error && !loading ? "show" : ""}>
          {error}
        </p>

        <div className="music-tag">
          <i className="fas fa-music" /> Music starts on click
        </div>

        <div className="status-row">
          <div className="status-item">
            <div className="status-dot" />
            Secure
          </div>
          <div className="status-item">
            <i className="fas fa-shield-alt" />
            V3.0.0
          </div>
          <div className="status-item">
            <i className="fas fa-lock" />
            Encrypted
          </div>
        </div>
      </div>

      {/* ========== BACK LINK ========== */}
      <a href="/" className="back-link">
        <i className="fas fa-arrow-left" /> Back to Home
      </a>

      {/* ========== AUDIO ========== */}
      <audio id="bgMusic" loop>
        <source src="https://files.catbox.moe/5zx7hg.mp3" type="audio/mpeg" />
      </audio>

      {/* ========== PAID USER POPUP ========== */}
      {showPaidPopup && (
        <div
          className="modal-overlay"
          onClick={(e) => {
            if (e.target.classList.contains("modal-overlay")) {
              setShowPaidPopup(false);
            }
          }}
        >
          <div className="modal-card">
            <div className="modal-icon">
              <i className="fas fa-lock" />
            </div>

            <div className="modal-price-tag">
              <i className="fas fa-crown" />
              Premium Access Required
            </div>

            <h2 className="modal-title">Paid Users Only</h2>

            <div className="modal-divider" />

            <p className="modal-subtitle">
              මේ dashboard එක <strong>paid users</strong> ලට විතරයි.
              Only For PAID Users.
            </p>

            <a
              href={WHATSAPP_BUY}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-whatsapp"
            >
              <i className="fab fa-whatsapp" />
              <span>Get Paid</span>
              <i className="fas fa-arrow-right" />
            </a>

            <button
              className="btn-close"
              onClick={() => setShowPaidPopup(false)}
            >
              Maybe later
            </button>
          </div>
        </div>
      )}
    </>
  );
}
