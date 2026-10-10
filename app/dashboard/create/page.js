"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

const STEPS = ["Details", "Response", "Test"];

function defaultCommand() {
  return {
    command: "",
    aliase: "",
    desc: "",
    react: "",
    type: "simple", // "simple" | "API"
    textConfig: {
      contentType: "text",
      contentValue: "",
      fileName: "",
    },
    apiConfig: {
      method: "GET",
      url: "",
      hasQuery: false,
      queries: [],
      extractedValues: [],
    },
    responseTemplate: "",
    isActive: true,
  };
}

export default function CreateCommand() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editName = searchParams.get("edit");

  const [step, setStep] = useState(1);
  const [cmd, setCmd] = useState(defaultCommand());
  const [testing, setTesting] = useState(false);
  const [apiResult, setApiResult] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [loadingExisting, setLoadingExisting] = useState(!!editName);

  /* ---------- edit mode: load existing ---------- */
  useEffect(() => {
    if (!editName) return;
    (async () => {
      try {
        const userId = localStorage.getItem("bot_id");
        const res = await fetch("/api/add-cmd", {
          headers: { Authorization: `Bearer ${userId}` },
        });
        const data = await res.json();
        if (!data.ok) throw new Error(data.error);
        const found = (data.commands || []).find(
          (c) => c.command === editName
        );
        if (found) {
          setCmd({
            ...defaultCommand(),
            ...found,
            aliase: (found.aliase || []).join(", "),
            apiConfig: {
              ...defaultCommand().apiConfig,
              ...(found.apiConfig || {}),
            },
            textConfig: {
              ...defaultCommand().textConfig,
              ...(found.textConfig || {}),
            },
          });
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoadingExisting(false);
      }
    })();
  }, [editName]);

  /* ---------- helpers ---------- */
  const upd = (patch) => setCmd((p) => ({ ...p, ...patch }));
  const updText = (patch) =>
    setCmd((p) => ({ ...p, textConfig: { ...p.textConfig, ...patch } }));
  const updApi = (patch) =>
    setCmd((p) => ({ ...p, apiConfig: { ...p.apiConfig, ...patch } }));

  /* ---------- API test ---------- */
  async function testAPI() {
    setTesting(true);
    setApiResult(null);
    try {
      const res = await fetch("/api/api-validator", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          method: cmd.apiConfig.method,
          url: cmd.apiConfig.url,
          queries: cmd.apiConfig.queries,
        }),
      });
      const data = await res.json();
      setApiResult(data);

      if (data.ok) {
        updApi({ extractedValues: data.extractedValues || [] });
      }
    } catch (err) {
      setApiResult({ ok: false, error: err.message });
    } finally {
      setTesting(false);
    }
  }

  /* ---------- submit ---------- */
  async function submit() {
    setError("");
    setSaving(true);
    try {
      const userId = localStorage.getItem("bot_id");

      const payload = {
        command: cmd.command.trim().toLowerCase(),
        aliase: cmd.aliase
          .split(",")
          .map((a) => a.trim())
          .filter(Boolean),
        desc: cmd.desc,
        react: cmd.react,
        type: cmd.type,
        isActive: cmd.isActive,
      };

      if (cmd.type === "simple") {
        payload.textConfig = cmd.textConfig;
      } else {
        payload.apiConfig = {
          method: cmd.apiConfig.method,
          url: cmd.apiConfig.url,
          hasQuery: cmd.apiConfig.hasQuery,
          queries: cmd.apiConfig.queries.filter((q) => q.key),
          extractedValues: cmd.apiConfig.extractedValues,
        };
        payload.responseTemplate = cmd.responseTemplate;
      }

      const res = await fetch("/api/add-cmd", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${userId}`,
        },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error || "Save failed");

      router.push("/dashboard");
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  /* ---------- validation per step ---------- */
  function canGoNext() {
    if (step === 1) return cmd.command.trim().length > 0;
    if (step === 2) {
      if (cmd.type === "simple") {
        return cmd.textConfig.contentValue.trim().length > 0;
      }
      return cmd.apiConfig.url.trim().length > 0;
    }
    return true;
  }

  if (loadingExisting) {
    return (
      <div style={{ padding: 40, textAlign: "center", color: "#888" }}>
        Loading command...
      </div>
    );
  }

  return (
    <>
      <style jsx>{`
        .wiz-header {
          margin-bottom: 24px;
        }
        .wiz-title {
          font-size: 1.7rem;
          font-weight: 800;
          letter-spacing: -0.5px;
        }
        .wiz-sub {
          color: rgba(255, 255, 255, 0.4);
          font-size: 0.85rem;
          margin-top: 4px;
        }

        /* steps */
        .steps {
          display: flex;
          gap: 8px;
          margin-bottom: 24px;
          overflow-x: auto;
          padding-bottom: 4px;
        }
        .step-pill {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 16px;
          border-radius: 30px;
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.06);
          font-size: 0.82rem;
          color: rgba(255, 255, 255, 0.45);
          font-weight: 600;
          white-space: nowrap;
          transition: all 0.2s ease;
        }
        .step-pill.active {
          background: linear-gradient(135deg, rgba(59, 130, 246, 0.2), rgba(6, 182, 212, 0.15));
          border-color: rgba(59, 130, 246, 0.4);
          color: #fff;
        }
        .step-pill.done {
          color: #4ade80;
          border-color: rgba(34, 197, 94, 0.3);
          background: rgba(34, 197, 94, 0.08);
        }
        .step-num {
          width: 22px;
          height: 22px;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.08);
          display: grid;
          place-items: center;
          font-size: 0.72rem;
          font-weight: 800;
        }
        .step-pill.active .step-num {
          background: #3b82f6;
          color: #fff;
        }
        .step-pill.done .step-num {
          background: #22c55e;
          color: #000;
        }

        /* panel */
        .wiz-panel {
          background: rgba(15, 20, 35, 0.5);
          border: 1px solid rgba(255, 255, 255, 0.05);
          border-radius: 18px;
          padding: 28px;
        }
        @media (max-width: 600px) {
          .wiz-panel { padding: 20px 16px; }
        }

        /* form */
        .field {
          margin-bottom: 18px;
        }
        .field-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 14px;
        }
        @media (max-width: 600px) {
          .field-row { grid-template-columns: 1fr; }
        }

        .field label {
          display: block;
          font-size: 0.75rem;
          font-weight: 600;
          color: rgba(255, 255, 255, 0.5);
          margin-bottom: 7px;
          letter-spacing: 0.5px;
          text-transform: uppercase;
        }
        .field label .req {
          color: #f87171;
          margin-left: 2px;
        }
        .field .hint {
          font-size: 0.7rem;
          color: rgba(255, 255, 255, 0.3);
          margin-top: 6px;
        }

        .input,
        .textarea,
        .select {
          width: 100%;
          padding: 12px 14px;
          background: rgba(0, 0, 0, 0.3);
          border: 1px solid rgba(255, 255, 255, 0.06);
          border-radius: 10px;
          color: #fff;
          font-size: 0.88rem;
          font-family: inherit;
          outline: none;
          transition: all 0.15s ease;
        }
        .input:focus,
        .textarea:focus,
        .select:focus {
          border-color: #3b82f6;
          background: rgba(0, 0, 0, 0.4);
        }
        .textarea {
          resize: vertical;
          min-height: 100px;
          line-height: 1.5;
          font-family: "SF Mono", "Consolas", monospace;
          font-size: 0.85rem;
        }
        .select {
          cursor: pointer;
          appearance: none;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23888' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E");
          background-repeat: no-repeat;
          background-position: right 14px center;
          padding-right: 36px;
        }

        /* type toggle */
        .type-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
        }
        .type-card {
          padding: 18px 16px;
          border-radius: 14px;
          border: 1.5px solid rgba(255, 255, 255, 0.06);
          background: rgba(0, 0, 0, 0.25);
          cursor: pointer;
          transition: all 0.2s ease;
          text-align: center;
        }
        .type-card:hover {
          border-color: rgba(59, 130, 246, 0.3);
        }
        .type-card.active {
          border-color: #3b82f6;
          background: rgba(59, 130, 246, 0.08);
          box-shadow: 0 0 30px rgba(59, 130, 246, 0.15);
        }
        .type-icon {
          font-size: 1.6rem;
          margin-bottom: 8px;
        }
        .type-name {
          font-size: 0.9rem;
          font-weight: 700;
          margin-bottom: 4px;
        }
        .type-desc {
          font-size: 0.72rem;
          color: rgba(255, 255, 255, 0.4);
        }

        /* queries */
        .query-row {
          display: grid;
          grid-template-columns: 1fr 1fr auto;
          gap: 8px;
          margin-bottom: 8px;
        }
        .query-remove {
          width: 42px;
          border-radius: 10px;
          background: rgba(239, 68, 68, 0.1);
          border: 1px solid rgba(239, 68, 68, 0.2);
          color: #f87171;
          cursor: pointer;
          font-size: 1rem;
          transition: all 0.15s ease;
        }
        .query-remove:hover {
          background: rgba(239, 68, 68, 0.2);
        }

        .add-query {
          padding: 9px 14px;
          border-radius: 10px;
          background: rgba(59, 130, 246, 0.08);
          border: 1px dashed rgba(59, 130, 246, 0.3);
          color: #60a5fa;
          font-size: 0.8rem;
          font-weight: 600;
          font-family: inherit;
          cursor: pointer;
          transition: all 0.15s ease;
          margin-top: 4px;
        }
        .add-query:hover {
          background: rgba(59, 130, 246, 0.15);
        }

        /* test result */
        .test-result {
          margin-top: 16px;
          padding: 16px;
          border-radius: 12px;
          background: rgba(0, 0, 0, 0.3);
          border: 1px solid rgba(255, 255, 255, 0.05);
        }
        .test-result.success {
          border-color: rgba(34, 197, 94, 0.3);
          background: rgba(34, 197, 94, 0.05);
        }
        .test-result.error {
          border-color: rgba(239, 68, 68, 0.3);
          background: rgba(239, 68, 68, 0.05);
        }

        .result-head {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;
          font-size: 0.82rem;
          font-weight: 700;
        }
        .result-head.success { color: #4ade80; }
        .result-head.error { color: #f87171; }

        .result-badge {
          padding: 3px 9px;
          border-radius: 20px;
          font-size: 0.68rem;
          background: rgba(34, 197, 94, 0.15);
          color: #4ade80;
          font-weight: 700;
        }

        .array-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 4px 10px;
          border-radius: 20px;
          background: rgba(6, 182, 212, 0.1);
          border: 1px solid rgba(6, 182, 212, 0.2);
          color: #22d3ee;
          font-size: 0.7rem;
          font-weight: 600;
          margin: 4px 4px 0 0;
        }

        .keys-label {
          font-size: 0.7rem;
          color: rgba(255, 255, 255, 0.4);
          text-transform: uppercase;
          letter-spacing: 1px;
          margin: 14px 0 8px;
        }

        .key-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 12px;
          padding: 9px 12px;
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.05);
          border-radius: 9px;
          margin-bottom: 6px;
          cursor: pointer;
          transition: all 0.15s ease;
          font-size: 0.8rem;
        }
        .key-item:hover {
          background: rgba(59, 130, 246, 0.08);
          border-color: rgba(59, 130, 246, 0.25);
        }
        .key-item code {
          color: #60a5fa;
          font-family: "SF Mono", "Consolas", monospace;
          font-weight: 600;
          font-size: 0.78rem;
        }
        .key-item .sample {
          color: rgba(255, 255, 255, 0.5);
          font-size: 0.75rem;
          max-width: 50%;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          text-align: right;
        }

        .loading-keys {
          text-align: center;
          padding: 20px;
          color: rgba(255, 255, 255, 0.4);
          font-size: 0.85rem;
        }

        /* fake chat */
        .chat-window {
          background: #0b141a;
          border-radius: 14px;
          padding: 20px;
          max-height: 380px;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          gap: 10px;
          margin-bottom: 20px;
        }
        .chat-bubble {
          max-width: 78%;
          padding: 10px 14px;
          border-radius: 14px;
          font-size: 0.85rem;
          line-height: 1.5;
          white-space: pre-wrap;
          word-break: break-word;
        }
        .chat-bubble.user {
          align-self: flex-end;
          background: #005c4b;
          color: #e8ffe8;
          border-bottom-right-radius: 4px;
        }
        .chat-bubble.bot {
          align-self: flex-start;
          background: #202c33;
          color: #e8e8e8;
          border-bottom-left-radius: 4px;
        }
        .chat-time {
          font-size: 0.65rem;
          color: rgba(255, 255, 255, 0.4);
          align-self: flex-end;
          margin-top: -6px;
        }

        /* nav */
        .wiz-nav {
          display: flex;
          justify-content: space-between;
          gap: 12px;
          margin-top: 24px;
          padding-top: 20px;
          border-top: 1px solid rgba(255, 255, 255, 0.05);
        }

        .error-banner {
          padding: 12px 16px;
          border-radius: 10px;
          background: rgba(239, 68, 68, 0.1);
          border: 1px solid rgba(239, 68, 68, 0.25);
          color: #f87171;
          font-size: 0.82rem;
          margin-bottom: 16px;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .checkbox-row {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 12px 14px;
          border-radius: 10px;
          background: rgba(0, 0, 0, 0.25);
          border: 1px solid rgba(255, 255, 255, 0.05);
          cursor: pointer;
          font-size: 0.85rem;
        }
        .checkbox-row input[type="checkbox"] {
          accent-color: #3b82f6;
          width: 16px;
          height: 16px;
          cursor: pointer;
        }
      `}</style>

      <div className="wiz-header">
        <h1 className="wiz-title">
          {editName ? "Edit Command" : "Create Command"}
        </h1>
        <p className="wiz-sub">
          {editName
            ? `Editing: .${editName}`
            : "Set up a new command for your WhatsApp bot"}
        </p>
      </div>

      {/* Steps */}
      <div className="steps">
        {STEPS.map((label, i) => {
          const n = i + 1;
          const active = step === n;
          const done = step > n;
          return (
            <div
              key={label}
              className={`step-pill ${active ? "active" : ""} ${
                done ? "done" : ""
              }`}
            >
              <div className="step-num">
                {done ? <i className="fas fa-check" /> : n}
              </div>
              {label}
            </div>
          );
        })}
      </div>

      {/* Panel */}
      <div className="wiz-panel">
        {error && (
          <div className="error-banner">
            <i className="fas fa-exclamation-circle" />
            {error}
          </div>
        )}

        {/* ================= STEP 1 ================= */}
        {step === 1 && (
          <>
            <div className="field">
              <label>
                Command Name <span className="req">*</span>
              </label>
              <input
                className="input"
                placeholder="e.g. movie, hello, weather"
                value={cmd.command}
                onChange={(e) => upd({ command: e.target.value })}
              />
              <div className="hint">
                Bot එකට trigger කරන්න පාවිච්චි කරන keyword එක
              </div>
            </div>

            <div className="field">
              <label>Aliases</label>
              <input
                className="input"
                placeholder="film, mv, search (comma separated)"
                value={cmd.aliase}
                onChange={(e) => upd({ aliase: e.target.value })}
              />
              <div className="hint">
                වෙනත් නම් වලින් command එක run කරන්න පුළුවන්
              </div>
            </div>

            <div className="field-row">
              <div className="field">
                <label>Description</label>
                <input
                  className="input"
                  placeholder="Short description"
                  value={cmd.desc}
                  onChange={(e) => upd({ desc: e.target.value })}
                />
              </div>
              <div className="field">
                <label>React Emoji</label>
                <input
                  className="input"
                  placeholder="🎬"
                  value={cmd.react}
                  onChange={(e) => upd({ react: e.target.value })}
                />
              </div>
            </div>

            <div className="field">
              <label>
                Command Type <span className="req">*</span>
              </label>
              <div className="type-grid">
                <div
                  className={`type-card ${
                    cmd.type === "simple" ? "active" : ""
                  }`}
                  onClick={() => upd({ type: "simple" })}
                >
                  <div className="type-icon">💬</div>
                  <div className="type-name">Simple</div>
                  <div className="type-desc">Text, audio, video reply</div>
                </div>
                <div
                  className={`type-card ${
                    cmd.type === "API" ? "active" : ""
                  }`}
                  onClick={() => upd({ type: "API" })}
                >
                  <div className="type-icon">🔗</div>
                  <div className="type-name">API</div>
                  <div className="type-desc">Dynamic from external API</div>
                </div>
              </div>
            </div>

            <div className="field">
              <label
                className="checkbox-row"
                style={{ textTransform: "none", letterSpacing: 0, marginBottom: 0 }}
              >
                <input
                  type="checkbox"
                  checked={cmd.isActive}
                  onChange={(e) => upd({ isActive: e.target.checked })}
                />
                Active (bot respond කරයි)
              </label>
            </div>
          </>
        )}

        {/* ================= STEP 2 ================= */}
        {step === 2 && cmd.type === "simple" && (
          <>
            <div className="field">
              <label>
                Content Type <span className="req">*</span>
              </label>
              <select
                className="select"
                value={cmd.textConfig.contentType}
                onChange={(e) => updText({ contentType: e.target.value })}
              >
                <option value="text">📝 Text</option>
                <option value="audio">🎵 Audio</option>
                <option value="video">🎬 Video</option>
              </select>
            </div>

            {cmd.textConfig.contentType === "text" ? (
              <div className="field">
                <label>
                  Message Content <span className="req">*</span>
                </label>
                <textarea
                  className="textarea"
                  placeholder="Hello! How can I help you? 👋"
                  value={cmd.textConfig.contentValue}
                  onChange={(e) => updText({ contentValue: e.target.value })}
                />
              </div>
            ) : (
              <>
                <div className="field">
                  <label>
                    {cmd.textConfig.contentType === "audio"
                      ? "Audio URL"
                      : "Video URL"}{" "}
                    <span className="req">*</span>
                  </label>
                  <input
                    className="input"
                    placeholder="https://example.com/file.mp3"
                    value={cmd.textConfig.contentValue}
                    onChange={(e) =>
                      updText({ contentValue: e.target.value })
                    }
                  />
                </div>
                {cmd.textConfig.contentType === "audio" && (
                  <div className="field">
                    <label>File Name (optional)</label>
                    <input
                      className="input"
                      placeholder="song.mp3"
                      value={cmd.textConfig.fileName}
                      onChange={(e) => updText({ fileName: e.target.value })}
                    />
                  </div>
                )}
              </>
            )}
          </>
        )}

        {step === 2 && cmd.type === "API" && (
          <>
            <div className="field-row">
              <div className="field">
                <label>HTTP Method</label>
                <select
                  className="select"
                  value={cmd.apiConfig.method}
                  onChange={(e) => updApi({ method: e.target.value })}
                >
                  <option value="GET">GET</option>
                  <option value="POST">POST</option>
                </select>
              </div>
              <div className="field">
                <label>Has Query?</label>
                <label
                  className="checkbox-row"
                  style={{ height: 44, padding: "0 14px" }}
                >
                  <input
                    type="checkbox"
                    checked={cmd.apiConfig.hasQuery}
                    onChange={(e) =>
                      updApi({ hasQuery: e.target.checked })
                    }
                  />
                  <span style={{ fontSize: "0.82rem" }}>
                    {cmd.apiConfig.hasQuery ? "Yes" : "No"}
                  </span>
                </label>
              </div>
            </div>

            <div className="field">
              <label>
                API URL <span className="req">*</span>
              </label>
              <input
                className="input"
                placeholder="https://api.example.com/search"
                value={cmd.apiConfig.url}
                onChange={(e) => updApi({ url: e.target.value })}
              />
            </div>

            {cmd.apiConfig.hasQuery && (
              <div className="field">
                <label>Query Parameters</label>
                {cmd.apiConfig.queries.map((q, i) => (
                  <div key={i} className="query-row">
                    <input
                      className="input"
                      placeholder="key (e.g. text)"
                      value={q.key}
                      onChange={(e) => {
                        const arr = [...cmd.apiConfig.queries];
                        arr[i] = { ...arr[i], key: e.target.value };
                        updApi({ queries: arr });
                      }}
                    />
                    <input
                      className="input"
                      placeholder="default value"
                      value={q.defaultValue}
                      onChange={(e) => {
                        const arr = [...cmd.apiConfig.queries];
                        arr[i] = { ...arr[i], defaultValue: e.target.value };
                        updApi({ queries: arr });
                      }}
                    />
                    <button
                      className="query-remove"
                      onClick={() => {
                        const arr = cmd.apiConfig.queries.filter(
                          (_, idx) => idx !== i
                        );
                        updApi({ queries: arr });
                      }}
                    >
                      ✕
                    </button>
                  </div>
                ))}
                <button
                  className="add-query"
                  onClick={() =>
                    updApi({
                      queries: [
                        ...cmd.apiConfig.queries,
                        { key: "", defaultValue: "" },
                      ],
                    })
                  }
                >
                  <i className="fas fa-plus" /> Add Query
                </button>
              </div>
            )}

            <button
              className="btn btn-primary"
              onClick={testAPI}
              disabled={
                testing || !cmd.apiConfig.url.trim()
              }
              style={{ marginTop: 4 }}
            >
              {testing ? (
                <>
                  <i className="fas fa-spinner fa-spin" /> Testing...
                </>
              ) : (
                <>
                  <i className="fas fa-vial" /> Test API
                </>
              )}
            </button>

            {apiResult && (
              <div
                className={`test-result ${
                  apiResult.ok ? "success" : "error"
                }`}
              >
                <div
                  className={`result-head ${
                    apiResult.ok ? "success" : "error"
                  }`}
                >
                  <span>
                    {apiResult.ok
                      ? `✅ Success — HTTP ${apiResult.status}`
                      : `❌ ${apiResult.error || "Failed"}`}
                  </span>
                  {apiResult.ok && (
                    <span className="result-badge">
                      {apiResult.templateKeys?.length || 0} keys
                    </span>
                  )}
                </div>

                {/* Arrays */}
                {apiResult.arrays?.length > 0 && (
                  <div style={{ marginBottom: 12 }}>
                    {apiResult.arrays.map((a, i) => (
                      <span key={i} className="array-badge">
                        <i className="fas fa-list" /> {a.path} ({a.count} items)
                      </span>
                    ))}
                  </div>
                )}

                {/* Keys */}
                {apiResult.templateKeys?.length > 0 && (
                  <>
                    <div className="keys-label">
                      Available Fields — click to copy
                    </div>
                    {apiResult.templateKeys.map((t, i) => (
                      <div
                        key={i}
                        className="key-item"
                        onClick={() => {
                          navigator.clipboard.writeText(`{{${t.key}}}`);
                        }}
                      >
                        <code>{`{{${t.key}}}`}</code>
                        <span className="sample">
                          {String(t.sample).slice(0, 60)}
                        </span>
                      </div>
                    ))}
                  </>
                )}
              </div>
            )}
          </>
        )}

        {/* ================= STEP 3 ================= */}
        {step === 3 && (
          <>
            <div className="field">
              <label>Live Preview</label>
              <div className="chat-window">
                <div className="chat-bubble user">
                  .{cmd.command || "(no name)"}
                </div>
                <div className="chat-bubble bot">
                  {cmd.type === "simple"
                    ? cmd.textConfig.contentType === "text"
                      ? cmd.textConfig.contentValue || "(empty message)"
                      : `[${cmd.textConfig.contentType}] ${
                          cmd.textConfig.contentValue || "(no url)"
                        }`
                    : cmd.responseTemplate ||
                      "🎬 *{{results.title}}*\n⭐ {{results.rating}} | {{results.year}}\n🔗 {{results.link}}"}
                </div>
                <div className="chat-time">just now</div>
              </div>
            </div>

            {cmd.type === "API" && (
              <>
                <div className="field">
                  <label>
                    Response Template <span className="req">*</span>
                  </label>
                  <textarea
                    className="textarea"
                    placeholder={`🎬 *{{results.title}}*\n⭐ {{results.rating}} | {{results.year}}\n🔗 {{results.link}}`}
                    value={cmd.responseTemplate}
                    onChange={(e) =>
                      upd({ responseTemplate: e.target.value })
                    }
                  />
                  <div className="hint">
                    Use <code>{"{{key}}"}</code> from the API test — array
                    fields වලට <code>{"{{results.title}}"}</code> වගේ use
                    කරන්න (bot එකේ loop වෙනවා)
                  </div>
                </div>

                {cmd.apiConfig.extractedValues?.length > 0 && (
                  <div className="field">
                    <label>Saved Extracted Values</label>
                    <div
                      style={{
                        display: "flex",
                        flexWrap: "wrap",
                        gap: 6,
                      }}
                    >
                      {cmd.apiConfig.extractedValues.map((k, i) => (
                        <span key={i} className="array-badge">
                          {`{{${k}}}`}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </>
        )}

        {/* Nav */}
        <div className="wiz-nav">
          {step > 1 ? (
            <button
              className="btn"
              onClick={() => setStep((s) => s - 1)}
              disabled={saving}
            >
              <i className="fas fa-arrow-left" /> Back
            </button>
          ) : (
            <div />
          )}

          {step < 3 ? (
            <button
              className="btn btn-primary"
              onClick={() => setStep((s) => s + 1)}
              disabled={!canGoNext()}
            >
              Next <i className="fas fa-arrow-right" />
            </button>
          ) : (
            <button
              className="btn btn-primary"
              onClick={submit}
              disabled={saving}
            >
              {saving ? (
                <>
                  <i className="fas fa-spinner fa-spin" /> Saving...
                </>
              ) : (
                <>
                  <i className="fas fa-check" />{" "}
                  {editName ? "Update Command" : "Save Command"}
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </>
  );
}