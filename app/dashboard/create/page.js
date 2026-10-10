"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

const STEPS = [
  { n: 1, label: "Details", icon: "fa-circle-info" },
  { n: 2, label: "Response", icon: "fa-message" },
  { n: 3, label: "Test", icon: "fa-vial" },
];

function defaultCommand() {
  return {
    command: "",
    aliase: "",
    desc: "",
    react: "",
    type: "simple",
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

  const upd = (patch) => setCmd((p) => ({ ...p, ...patch }));
  const updText = (patch) =>
    setCmd((p) => ({ ...p, textConfig: { ...p.textConfig, ...patch } }));
  const updApi = (patch) =>
    setCmd((p) => ({ ...p, apiConfig: { ...p.apiConfig, ...patch } }));

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

  function insertAtTemplate(key) {
    const token = `{{${key}}}`;
    upd({ responseTemplate: (cmd.responseTemplate || "") + token });
    navigator.clipboard.writeText(token).catch(() => {});
  }

  /* ==================== TEMPLATE RENDER ==================== */
  function renderTemplate(template, testData) {
    if (!template) return "";
    if (!testData) return template;

    const lookup = (obj, path) => {
      if (!obj) return undefined;
      const parts = path.split(".");
      let cur = obj;
      for (const p of parts) {
        if (cur == null) return undefined;
        if (Array.isArray(cur) && /^\d+$/.test(p)) {
          cur = cur[parseInt(p, 10)];
        } else {
          cur = cur[p];
        }
      }
      return cur;
    };

    return template.replace(/\{\{\s*([^}]+?)\s*\}\}/g, (match, key) => {
      const trimmed = key.trim();
      const value = lookup(testData, trimmed);
      if (value === undefined || value === null) return match;
      if (typeof value === "object") return JSON.stringify(value);
      return String(value);
    });
  }

  /* ==================== TEMPLATE VALIDATE ==================== */
  function validateTemplate(template, availableKeys = []) {
    const errors = [];
    const warnings = [];
    if (!template) return { errors, warnings };

    const openCount = (template.match(/\{\{/g) || []).length;
    const closeCount = (template.match(/\}\}/g) || []).length;
    if (openCount !== closeCount) {
      errors.push({
        msg: `Unclosed braces — ${openCount} "{{" and ${closeCount} "}}"`,
        fix: 'හැම "{{" එකකටම "}}" එකක් තියෙන්න ඕන',
      });
    }

    const regex = /\{\{\s*([^}]+?)\s*\}\}/g;
    let m;
    while ((m = regex.exec(template)) !== null) {
      const key = m[1].trim();
      if (/[{}]/.test(key)) {
        errors.push({
          msg: `Invalid token: {{${key}}}`,
          fix: "Nested braces allowed නෑ",
        });
        continue;
      }
      if (availableKeys.length > 0 && !availableKeys.includes(key)) {
        const base = key.split(".")[0];
        const hasBase = availableKeys.some(
          (k) => k === key || k.split(".")[0] === base
        );
        if (!hasBase) {
          warnings.push({
            msg: `Unknown field: {{${key}}}`,
            fix: "API test එකේ නොපෙනුණු field එකක්",
          });
        }
      }
    }

    const strayOpen = template.replace(/\{\{/g, "").match(/\{/g);
    const strayClose = template.replace(/\}\}/g, "").match(/\}/g);
    if (strayOpen) {
      errors.push({
        msg: 'Stray "{" found — should be "{{"',
        fix: 'හැම variable එකක්ම "{{key}}" format එකට',
      });
    }
    if (strayClose) {
      errors.push({
        msg: 'Stray "}" found — should be "}}"',
        fix: 'හැම variable එකක්ම "{{key}}" format එකට',
      });
    }

    return { errors, warnings };
  }

  /* ==================== COMPUTED ==================== */
  const templateValidation = validateTemplate(
    cmd.responseTemplate,
    cmd.apiConfig.extractedValues || []
  );

  const renderedPreview =
    cmd.type === "API"
      ? renderTemplate(
          cmd.responseTemplate,
          apiResult?.ok ? apiResult.data : null
        )
      : "";

  const hasApiTest = !!(apiResult && apiResult.ok);

  if (loadingExisting) {
    return (
      <div className="wiz-loading">
        <div className="wiz-spinner" />
        <p>Loading command...</p>
      </div>
    );
  }

  return (
    <>
      <style jsx>{`
        .wiz-loading {
          padding: 80px 20px;
          text-align: center;
          color: rgba(255, 255, 255, 0.5);
          font-size: 0.9rem;
        }
        .wiz-spinner {
          width: 42px;
          height: 42px;
          border: 3px solid rgba(59, 130, 246, 0.15);
          border-top-color: #3b82f6;
          border-radius: 50%;
          animation: wizSpin 0.9s linear infinite;
          margin: 0 auto 16px;
        }
        @keyframes wizSpin { to { transform: rotate(360deg); } }

        /* ==================== HEADER ==================== */
        .wiz-header { margin-bottom: 28px; }
        .wiz-title {
          font-size: 1.9rem;
          font-weight: 900;
          letter-spacing: -0.7px;
          display: flex;
          align-items: center;
          gap: 14px;
          flex-wrap: wrap;
        }
        .wiz-title .title-icon {
          width: 48px;
          height: 48px;
          border-radius: 14px;
          background: linear-gradient(135deg, rgba(59, 130, 246, 0.2), rgba(6, 182, 212, 0.15));
          border: 1px solid rgba(59, 130, 246, 0.3);
          display: grid;
          place-items: center;
          color: #60a5fa;
          font-size: 1.15rem;
          box-shadow: 0 0 30px rgba(59, 130, 246, 0.15);
          flex-shrink: 0;
        }
        .wiz-title .blue {
          background: linear-gradient(135deg, #3b82f6, #06b6d4);
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
        }
        .wiz-sub {
          color: rgba(255, 255, 255, 0.4);
          font-size: 0.85rem;
          margin-top: 8px;
          margin-left: 62px;
        }
        @media (max-width: 640px) {
          .wiz-title { font-size: 1.45rem; gap: 10px; }
          .wiz-title .title-icon { width: 40px; height: 40px; font-size: 1rem; }
          .wiz-sub { margin-left: 50px; font-size: 0.78rem; }
        }

        /* ==================== STEPS ==================== */
        .steps-wrap {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 28px;
          overflow-x: auto;
          padding-bottom: 6px;
          scrollbar-width: none;
        }
        .steps-wrap::-webkit-scrollbar { display: none; }
        .step-item {
          display: flex;
          align-items: center;
          gap: 10px;
          flex-shrink: 0;
        }
        .step-pill {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 11px 18px;
          border-radius: 30px;
          background: rgba(8, 15, 30, 0.7);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(0, 150, 255, 0.12);
          font-size: 0.82rem;
          color: rgba(255, 255, 255, 0.45);
          font-weight: 700;
          white-space: nowrap;
          transition: all 0.3s ease;
          letter-spacing: 0.3px;
        }
        .step-pill.active {
          background: linear-gradient(135deg, rgba(59, 130, 246, 0.25), rgba(6, 182, 212, 0.18));
          border-color: rgba(59, 130, 246, 0.5);
          color: #fff;
          box-shadow: 0 0 30px rgba(59, 130, 246, 0.25);
          transform: scale(1.03);
        }
        .step-pill.done {
          color: #4ade80;
          border-color: rgba(34, 197, 94, 0.4);
          background: rgba(34, 197, 94, 0.1);
        }
        .step-num {
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.08);
          display: grid;
          place-items: center;
          font-size: 0.7rem;
          font-weight: 800;
          flex-shrink: 0;
        }
        .step-pill.active .step-num {
          background: linear-gradient(135deg, #3b82f6, #06b6d4);
          color: #000;
        }
        .step-pill.done .step-num {
          background: #22c55e;
          color: #000;
        }
        .step-connector {
          width: 30px;
          height: 2px;
          background: rgba(255, 255, 255, 0.08);
          border-radius: 2px;
          flex-shrink: 0;
        }
        .step-connector.done {
          background: linear-gradient(90deg, #22c55e, #4ade80);
        }
        @media (max-width: 640px) {
          .step-pill { padding: 9px 14px; font-size: 0.75rem; }
          .step-pill .step-label { display: none; }
          .step-connector { width: 16px; }
        }

        /* ==================== PANEL ==================== */
        .wiz-panel {
          background: rgba(8, 15, 30, 0.65);
          backdrop-filter: blur(22px);
          -webkit-backdrop-filter: blur(22px);
          border: 1px solid rgba(0, 150, 255, 0.12);
          border-radius: 24px;
          padding: 32px;
          position: relative;
          overflow: hidden;
        }
        .wiz-panel::before {
          content: "";
          position: absolute;
          top: -100px;
          right: -100px;
          width: 300px;
          height: 300px;
          background: radial-gradient(circle, rgba(59, 130, 246, 0.08), transparent 70%);
          pointer-events: none;
        }
        .wiz-panel > * { position: relative; z-index: 1; }
        @media (max-width: 640px) {
          .wiz-panel { padding: 22px 16px; border-radius: 20px; }
        }

        /* ==================== FIELDS ==================== */
        .field { margin-bottom: 20px; }
        .field-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 14px;
        }
        @media (max-width: 600px) {
          .field-row { grid-template-columns: 1fr; }
        }
        .field label {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 0.72rem;
          font-weight: 700;
          color: rgba(255, 255, 255, 0.5);
          margin-bottom: 8px;
          letter-spacing: 0.8px;
          text-transform: uppercase;
        }
        .field label i { color: #3b82f6; font-size: 0.7rem; }
        .field label .req { color: #f87171; margin-left: 2px; }
        .field .hint {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 0.72rem;
          color: rgba(255, 255, 255, 0.35);
          margin-top: 8px;
        }
        .field .hint i { color: #3b82f6; font-size: 0.65rem; }

        .input,
        .textarea,
        .select {
          width: 100%;
          padding: 13px 16px;
          background: rgba(0, 0, 0, 0.3);
          border: 1px solid rgba(255, 255, 255, 0.06);
          border-radius: 12px;
          color: #fff;
          font-size: 0.88rem;
          font-family: inherit;
          outline: none;
          transition: all 0.2s ease;
        }
        .input:focus,
        .textarea:focus,
        .select:focus {
          border-color: #3b82f6;
          background: rgba(0, 0, 0, 0.45);
          box-shadow: 0 0 25px rgba(59, 130, 246, 0.1);
        }
        .input::placeholder,
        .textarea::placeholder {
          color: rgba(255, 255, 255, 0.2);
        }
        .input-icon-wrap { position: relative; }
        .input-icon-wrap > i {
          position: absolute;
          left: 16px;
          top: 50%;
          transform: translateY(-50%);
          color: rgba(255, 255, 255, 0.25);
          font-size: 0.85rem;
          pointer-events: none;
        }
        .input-icon-wrap .input { padding-left: 44px; }

        .textarea {
          resize: vertical;
          min-height: 110px;
          line-height: 1.55;
          font-family: "SF Mono", "Consolas", monospace;
          font-size: 0.85rem;
        }
        .select {
          cursor: pointer;
          appearance: none;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='14' height='14' viewBox='0 0 24 24' fill='none' stroke='%23888' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E");
          background-repeat: no-repeat;
          background-position: right 16px center;
          padding-right: 42px;
        }

        /* ==================== TYPE SELECTOR ==================== */
        .type-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 14px;
        }
        @media (max-width: 500px) {
          .type-grid { grid-template-columns: 1fr; }
        }
        .type-card {
          padding: 22px 18px;
          border-radius: 18px;
          border: 1.5px solid rgba(255, 255, 255, 0.08);
          background: rgba(0, 0, 0, 0.25);
          cursor: pointer;
          transition: all 0.3s ease;
          text-align: center;
          position: relative;
          overflow: hidden;
        }
        .type-card::before {
          content: "";
          position: absolute;
          top: -50%;
          right: -50%;
          width: 100%;
          height: 100%;
          background: radial-gradient(circle, rgba(59, 130, 246, 0.1), transparent 70%);
          opacity: 0;
          transition: opacity 0.3s ease;
          pointer-events: none;
        }
        .type-card:hover {
          border-color: rgba(59, 130, 246, 0.4);
          transform: translateY(-2px);
        }
        .type-card:hover::before { opacity: 1; }
        .type-card.active {
          border-color: #3b82f6;
          background: linear-gradient(135deg, rgba(59, 130, 246, 0.12), rgba(6, 182, 212, 0.08));
          box-shadow: 0 0 40px rgba(59, 130, 246, 0.2);
        }
        .type-card.active::before { opacity: 1; }
        .type-icon {
          width: 52px;
          height: 52px;
          border-radius: 16px;
          display: grid;
          place-items: center;
          margin: 0 auto 12px;
          font-size: 1.3rem;
          transition: transform 0.3s ease;
        }
        .type-card:hover .type-icon {
          transform: scale(1.1) rotate(-5deg);
        }
        .type-card .type-icon.simple {
          background: linear-gradient(135deg, rgba(34, 197, 94, 0.2), rgba(16, 185, 129, 0.15));
          color: #4ade80;
          border: 1px solid rgba(34, 197, 94, 0.3);
        }
        .type-card .type-icon.api {
          background: linear-gradient(135deg, rgba(6, 182, 212, 0.2), rgba(14, 165, 233, 0.15));
          color: #22d3ee;
          border: 1px solid rgba(6, 182, 212, 0.3);
        }
        .type-name {
          font-size: 0.98rem;
          font-weight: 800;
          margin-bottom: 4px;
          position: relative;
          z-index: 1;
        }
        .type-desc {
          font-size: 0.75rem;
          color: rgba(255, 255, 255, 0.45);
          position: relative;
          z-index: 1;
        }

        /* ==================== CHECKBOX ROW ==================== */
        .checkbox-row {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 14px 16px;
          border-radius: 12px;
          background: rgba(0, 0, 0, 0.25);
          border: 1px solid rgba(255, 255, 255, 0.06);
          cursor: pointer;
          font-size: 0.85rem;
          transition: all 0.2s ease;
        }
        .checkbox-row:hover { border-color: rgba(59, 130, 246, 0.3); }
        .checkbox-row input[type="checkbox"] {
          accent-color: #3b82f6;
          width: 18px;
          height: 18px;
          cursor: pointer;
        }
        .checkbox-row .label-text {
          flex: 1;
          text-transform: none;
          letter-spacing: 0;
          color: rgba(255, 255, 255, 0.75);
          font-weight: 500;
          font-size: 0.85rem;
        }

        /* ==================== QUERY SECTION ==================== */
        .query-section {
          padding: 18px;
          background: rgba(0, 0, 0, 0.2);
          border: 1px dashed rgba(59, 130, 246, 0.25);
          border-radius: 14px;
          margin-bottom: 16px;
        }
        .query-row {
          display: grid;
          grid-template-columns: 1fr 1fr auto;
          gap: 8px;
          margin-bottom: 10px;
        }
        @media (max-width: 500px) {
          .query-row {
            grid-template-columns: 1fr;
            gap: 6px;
            padding: 12px;
            background: rgba(0, 0, 0, 0.2);
            border-radius: 10px;
            border: 1px solid rgba(255, 255, 255, 0.05);
          }
        }
        .query-remove {
          width: 44px;
          border-radius: 12px;
          background: rgba(239, 68, 68, 0.1);
          border: 1px solid rgba(239, 68, 68, 0.2);
          color: #f87171;
          cursor: pointer;
          font-size: 0.95rem;
          transition: all 0.2s ease;
          display: grid;
          place-items: center;
        }
        .query-remove:hover { background: rgba(239, 68, 68, 0.2); }
        @media (max-width: 500px) {
          .query-remove { width: 100%; height: 38px; }
        }
        .add-query {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 10px 16px;
          border-radius: 12px;
          background: rgba(59, 130, 246, 0.08);
          border: 1px dashed rgba(59, 130, 246, 0.35);
          color: #60a5fa;
          font-size: 0.82rem;
          font-weight: 700;
          font-family: inherit;
          cursor: pointer;
          transition: all 0.2s ease;
          margin-top: 4px;
        }
        .add-query:hover {
          background: rgba(59, 130, 246, 0.15);
          border-color: rgba(59, 130, 246, 0.6);
          transform: translateY(-1px);
        }

        /* ==================== TEST API BUTTON ==================== */
        .test-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          padding: 14px 28px;
          border-radius: 30px;
          background: linear-gradient(135deg, #06b6d4, #3b82f6);
          border: none;
          color: #000;
          font-weight: 800;
          font-size: 0.82rem;
          font-family: inherit;
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
          text-transform: uppercase;
          letter-spacing: 1.2px;
          box-shadow: 0 4px 25px rgba(6, 182, 212, 0.3);
          margin-top: 4px;
          position: relative;
          overflow: hidden;
        }
        .test-btn::before {
          content: "";
          position: absolute;
          inset: 0;
          background: linear-gradient(135deg, #3b82f6, #06b6d4);
          opacity: 0;
          transition: opacity 0.3s ease;
          z-index: 0;
        }
        .test-btn:hover::before { opacity: 1; }
        .test-btn > * { position: relative; z-index: 1; }
        .test-btn:hover:not(:disabled) {
          transform: translateY(-3px) scale(1.02);
          box-shadow: 0 12px 40px rgba(6, 182, 212, 0.5);
        }
        .test-btn:disabled { opacity: 0.5; cursor: not-allowed; }

        /* ==================== TEST RESULT ==================== */
        .test-result {
          margin-top: 20px;
          padding: 20px;
          border-radius: 16px;
          background: rgba(0, 0, 0, 0.3);
          border: 1px solid rgba(255, 255, 255, 0.06);
          animation: slideDown 0.3s ease;
        }
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .test-result.success {
          border-color: rgba(34, 197, 94, 0.35);
          background: linear-gradient(135deg, rgba(34, 197, 94, 0.06), rgba(0, 0, 0, 0.3));
        }
        .test-result.error {
          border-color: rgba(239, 68, 68, 0.35);
          background: linear-gradient(135deg, rgba(239, 68, 68, 0.06), rgba(0, 0, 0, 0.3));
        }
        .result-head {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
          font-size: 0.88rem;
          font-weight: 700;
          gap: 12px;
          flex-wrap: wrap;
        }
        .result-head.success { color: #4ade80; }
        .result-head.error { color: #f87171; }
        .result-head .status-icon {
          width: 26px;
          height: 26px;
          border-radius: 50%;
          display: inline-grid;
          place-items: center;
          margin-right: 8px;
          font-size: 0.75rem;
        }
        .result-head.success .status-icon { background: rgba(34, 197, 94, 0.15); }
        .result-head.error .status-icon { background: rgba(239, 68, 68, 0.15); }
        .result-badge {
          padding: 5px 12px;
          border-radius: 20px;
          font-size: 0.7rem;
          background: rgba(34, 197, 94, 0.15);
          color: #4ade80;
          font-weight: 700;
          display: inline-flex;
          align-items: center;
          gap: 5px;
        }
        .array-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 5px 12px;
          border-radius: 20px;
          background: rgba(6, 182, 212, 0.1);
          border: 1px solid rgba(6, 182, 212, 0.25);
          color: #22d3ee;
          font-size: 0.72rem;
          font-weight: 600;
          margin: 4px 6px 0 0;
        }
        .keys-label {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 0.7rem;
          color: rgba(255, 255, 255, 0.45);
          text-transform: uppercase;
          letter-spacing: 1.2px;
          font-weight: 700;
          margin: 18px 0 10px;
        }
        .keys-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
          gap: 8px;
          max-height: 320px;
          overflow-y: auto;
          padding-right: 4px;
        }
        .keys-grid::-webkit-scrollbar { width: 6px; }
        .keys-grid::-webkit-scrollbar-track { background: transparent; }
        .keys-grid::-webkit-scrollbar-thumb {
          background: rgba(59, 130, 246, 0.3);
          border-radius: 3px;
        }
        .key-item {
          display: flex;
          flex-direction: column;
          gap: 4px;
          padding: 10px 12px;
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.06);
          border-radius: 10px;
          cursor: pointer;
          transition: all 0.2s ease;
          overflow: hidden;
        }
        .key-item:hover {
          background: rgba(59, 130, 246, 0.1);
          border-color: rgba(59, 130, 246, 0.35);
          transform: translateY(-1px);
        }
        .key-item .key-name {
          color: #60a5fa;
          font-family: "SF Mono", "Consolas", monospace;
          font-weight: 700;
          font-size: 0.75rem;
          display: flex;
          align-items: center;
          gap: 5px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .key-item .key-name i {
          color: rgba(255, 255, 255, 0.3);
          font-size: 0.6rem;
        }
        .key-item .sample {
          color: rgba(255, 255, 255, 0.5);
          font-size: 0.7rem;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        /* ==================== FAKE CHAT ==================== */
        .chat-window {
          background: linear-gradient(180deg, #0b141a 0%, #0a1218 100%);
          border-radius: 18px;
          padding: 22px;
          min-height: 200px;
          max-height: 400px;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          gap: 10px;
          margin-bottom: 20px;
          border: 1px solid rgba(0, 150, 255, 0.08);
          position: relative;
        }
        .chat-window::before {
          content: "";
          position: absolute;
          inset: 0;
          background-image:
            radial-gradient(circle at 20% 30%, rgba(59, 130, 246, 0.03) 0%, transparent 40%),
            radial-gradient(circle at 80% 70%, rgba(6, 182, 212, 0.03) 0%, transparent 40%);
          pointer-events: none;
          border-radius: 18px;
        }
        .chat-bubble {
          max-width: 82%;
          padding: 11px 15px;
          border-radius: 16px;
          font-size: 0.85rem;
          line-height: 1.5;
          white-space: pre-wrap;
          word-break: break-word;
          position: relative;
          z-index: 1;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
        }
        .chat-bubble.user {
          align-self: flex-end;
          background: linear-gradient(135deg, #005c4b, #006654);
          color: #e8ffe8;
          border-bottom-right-radius: 4px;
        }
        .chat-bubble.user::after {
          content: "";
          position: absolute;
          right: -6px;
          bottom: 0;
          width: 0;
          height: 0;
          border-left: 8px solid #006654;
          border-top: 8px solid transparent;
        }
        .chat-bubble.bot {
          align-self: flex-start;
          background: #202c33;
          color: #e8e8e8;
          border-bottom-left-radius: 4px;
        }
        .chat-bubble.bot::after {
          content: "";
          position: absolute;
          left: -6px;
          bottom: 0;
          width: 0;
          height: 0;
          border-right: 8px solid #202c33;
          border-top: 8px solid transparent;
        }
        .chat-time {
          font-size: 0.62rem;
          color: rgba(255, 255, 255, 0.35);
          align-self: flex-end;
          padding-right: 8px;
        }

        /* ==================== NAV ==================== */
        .wiz-nav {
          display: flex;
          justify-content: space-between;
          gap: 12px;
          margin-top: 28px;
          padding-top: 24px;
          border-top: 1px solid rgba(255, 255, 255, 0.06);
        }
        .nav-btn {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 13px 24px;
          border-radius: 30px;
          border: 1px solid rgba(255, 255, 255, 0.1);
          background: rgba(255, 255, 255, 0.03);
          color: rgba(255, 255, 255, 0.75);
          font-size: 0.82rem;
          font-weight: 700;
          font-family: inherit;
          cursor: pointer;
          transition: all 0.25s ease;
          text-transform: uppercase;
          letter-spacing: 1px;
        }
        .nav-btn:hover:not(:disabled) {
          background: rgba(255, 255, 255, 0.08);
          color: #fff;
          transform: translateY(-2px);
        }
        .nav-btn:disabled { opacity: 0.35; cursor: not-allowed; }
        .nav-btn.primary {
          background: linear-gradient(135deg, #3b82f6, #06b6d4);
          border-color: transparent;
          color: #000;
          box-shadow: 0 4px 25px rgba(59, 130, 246, 0.3);
        }
        .nav-btn.primary:hover:not(:disabled) {
          transform: translateY(-3px) scale(1.02);
          box-shadow: 0 12px 40px rgba(59, 130, 246, 0.5);
        }
        .nav-btn.primary:disabled { opacity: 0.4; }
        @media (max-width: 500px) {
          .wiz-nav { flex-direction: column-reverse; }
          .nav-btn { justify-content: center; width: 100%; }
        }

        /* ==================== ERROR BANNER ==================== */
        .error-banner {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 14px 18px;
          border-radius: 12px;
          background: rgba(239, 68, 68, 0.1);
          border: 1px solid rgba(239, 68, 68, 0.25);
          color: #f87171;
          font-size: 0.85rem;
          margin-bottom: 20px;
          animation: shake 0.4s ease;
        }
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-6px); }
          75% { transform: translateX(6px); }
        }

        /* ==================== INFO CARD ==================== */
        .info-card {
          display: flex;
          gap: 12px;
          padding: 14px 16px;
          border-radius: 12px;
          background: rgba(59, 130, 246, 0.06);
          border: 1px solid rgba(59, 130, 246, 0.2);
          font-size: 0.8rem;
          color: rgba(255, 255, 255, 0.65);
          margin-bottom: 18px;
          line-height: 1.55;
        }
        .info-card i {
          color: #60a5fa;
          font-size: 1rem;
          flex-shrink: 0;
          margin-top: 2px;
        }
        .info-card code {
          background: rgba(0, 0, 0, 0.3);
          padding: 2px 6px;
          border-radius: 6px;
          color: #22d3ee;
          font-family: "SF Mono", "Consolas", monospace;
          font-size: 0.75rem;
        }

        /* ==================== SYNTAX FEEDBACK ==================== */
        .textarea.has-error {
          border-color: rgba(239, 68, 68, 0.5) !important;
          box-shadow: 0 0 25px rgba(239, 68, 68, 0.15) !important;
        }
        .syntax-errors,
        .syntax-warnings,
        .syntax-success {
          margin-top: 10px;
          padding: 12px 14px;
          border-radius: 10px;
          font-size: 0.78rem;
          display: flex;
          flex-direction: column;
          gap: 8px;
          animation: slideDown 0.25s ease;
        }
        .syntax-errors {
          background: rgba(239, 68, 68, 0.08);
          border: 1px solid rgba(239, 68, 68, 0.3);
        }
        .syntax-warnings {
          background: rgba(234, 179, 8, 0.08);
          border: 1px solid rgba(234, 179, 8, 0.3);
        }
        .syntax-success {
          flex-direction: row;
          align-items: center;
          gap: 8px;
          background: rgba(34, 197, 94, 0.08);
          border: 1px solid rgba(34, 197, 94, 0.3);
          color: #4ade80;
          font-weight: 600;
        }
        .syntax-success i { color: #4ade80; }
        .syntax-error-item,
        .syntax-warning-item {
          display: flex;
          align-items: flex-start;
          gap: 10px;
          line-height: 1.4;
        }
        .syntax-error-item i {
          color: #f87171;
          font-size: 0.9rem;
          margin-top: 2px;
          flex-shrink: 0;
        }
        .syntax-warning-item i {
          color: #facc15;
          font-size: 0.9rem;
          margin-top: 2px;
          flex-shrink: 0;
        }
        .syntax-msg {
          color: rgba(255, 255, 255, 0.9);
          font-weight: 600;
          font-family: "SF Mono", "Consolas", monospace;
          font-size: 0.75rem;
        }
        .syntax-fix {
          color: rgba(255, 255, 255, 0.5);
          font-size: 0.7rem;
          margin-top: 2px;
          font-weight: 400;
        }

        /* ==================== PREVIEW BADGE ==================== */
        .preview-badge {
          align-self: center;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 4px 12px;
          border-radius: 20px;
          font-size: 0.65rem;
          font-weight: 700;
          margin-top: 4px;
        }
        .preview-badge.live {
          background: rgba(34, 197, 94, 0.15);
          color: #4ade80;
          border: 1px solid rgba(34, 197, 94, 0.3);
        }
        .preview-badge.pending {
          background: rgba(255, 255, 255, 0.05);
          color: rgba(255, 255, 255, 0.4);
          border: 1px solid rgba(255, 255, 255, 0.08);
        }
      `}</style>

      {/* ==================== HEADER ==================== */}
      <div className="wiz-header">
        <h1 className="wiz-title">
          <div className="title-icon">
            <i className={`fas ${editName ? "fa-pen-to-square" : "fa-plus"}`} />
          </div>
          {editName ? (
            <>
              Edit <span className="blue">Command</span>
            </>
          ) : (
            <>
              Create <span className="blue">Command</span>
            </>
          )}
        </h1>
        <p className="wiz-sub">
          {editName
            ? `Editing: .${editName}`
            : "Set up a new command for your WhatsApp bot"}
        </p>
      </div>

      {/* ==================== STEPS ==================== */}
      <div className="steps-wrap">
        {STEPS.map((s, i) => (
          <div key={s.n} className="step-item">
            <div
              className={`step-pill ${
                step === s.n ? "active" : ""
              } ${step > s.n ? "done" : ""}`}
            >
              <div className="step-num">
                {step > s.n ? <i className="fas fa-check" /> : s.n}
              </div>
              <span className="step-label">{s.label}</span>
            </div>
            {i < STEPS.length - 1 && (
              <div
                className={`step-connector ${step > s.n ? "done" : ""}`}
              />
            )}
          </div>
        ))}
      </div>

      {/* ==================== PANEL ==================== */}
      <div className="wiz-panel">
        {error && (
          <div className="error-banner">
            <i className="fas fa-exclamation-circle" />
            <span>{error}</span>
          </div>
        )}

        {/* ==================== STEP 1: DETAILS ==================== */}
        {step === 1 && (
          <>
            <div className="field">
              <label>
                <i className="fas fa-terminal" />
                Command Name <span className="req">*</span>
              </label>
              <div className="input-icon-wrap">
                <i className="fas fa-slash" />
                <input
                  className="input"
                  placeholder="e.g. movie, hello, weather"
                  value={cmd.command}
                  onChange={(e) => upd({ command: e.target.value })}
                  autoFocus
                />
              </div>
              <div className="hint">
                <i className="fas fa-info-circle" />
                Bot එකට trigger කරන්න පාවිච්චි කරන keyword එක (no spaces)
              </div>
            </div>

            <div className="field">
              <label>
                <i className="fas fa-tags" />
                Aliases
              </label>
              <div className="input-icon-wrap">
                <i className="fas fa-link" />
                <input
                  className="input"
                  placeholder="film, mv, search (comma separated)"
                  value={cmd.aliase}
                  onChange={(e) => upd({ aliase: e.target.value })}
                />
              </div>
              <div className="hint">
                <i className="fas fa-info-circle" />
                වෙනත් නම් වලින් command එක run කරන්න පුළුවන්
              </div>
            </div>

            <div className="field-row">
              <div className="field">
                <label>
                  <i className="fas fa-align-left" />
                  Description
                </label>
                <input
                  className="input"
                  placeholder="Short description"
                  value={cmd.desc}
                  onChange={(e) => upd({ desc: e.target.value })}
                />
              </div>
              <div className="field">
                <label>
                  <i className="fas fa-smile" />
                  React Emoji
                </label>
                <input
                  className="input"
                  placeholder="🎬"
                  value={cmd.react}
                  onChange={(e) => upd({ react: e.target.value })}
                  maxLength={4}
                />
              </div>
            </div>

            <div className="field">
              <label>
                <i className="fas fa-layer-group" />
                Command Type <span className="req">*</span>
              </label>
              <div className="type-grid">
                <div
                  className={`type-card ${
                    cmd.type === "simple" ? "active" : ""
                  }`}
                  onClick={() => upd({ type: "simple" })}
                >
                  <div className="type-icon simple">
                    <i className="fas fa-comment-dots" />
                  </div>
                  <div className="type-name">Simple</div>
                  <div className="type-desc">Text, audio, video reply</div>
                </div>

                <div
                  className={`type-card ${
                    cmd.type === "API" ? "active" : ""
                  }`}
                  onClick={() => upd({ type: "API" })}
                >
                  <div className="type-icon api">
                    <i className="fas fa-bolt" />
                  </div>
                  <div className="type-name">API</div>
                  <div className="type-desc">Dynamic from external API</div>
                </div>
              </div>
            </div>

            <div className="field" style={{ marginBottom: 0 }}>
              <label
                className="checkbox-row"
                style={{
                  textTransform: "none",
                  letterSpacing: 0,
                  marginBottom: 0,
                }}
              >
                <input
                  type="checkbox"
                  checked={cmd.isActive}
                  onChange={(e) => upd({ isActive: e.target.checked })}
                />
                <span className="label-text">
                  <i
                    className="fas fa-circle-check"
                    style={{ color: "#4ade80", marginRight: 6 }}
                  />
                  Active — bot respond කරයි
                </span>
              </label>
            </div>
          </>
        )}

        {/* ==================== STEP 2A: SIMPLE RESPONSE ==================== */}
        {step === 2 && cmd.type === "simple" && (
          <>
            <div className="field">
              <label>
                <i className="fas fa-photo-film" />
                Content Type <span className="req">*</span>
              </label>
              <select
                className="select"
                value={cmd.textConfig.contentType}
                onChange={(e) => updText({ contentType: e.target.value })}
              >
                <option value="text">💬 Text Message</option>
                <option value="audio">🎵 Audio File</option>
                <option value="video">🎬 Video File</option>
              </select>
            </div>

            {cmd.textConfig.contentType === "text" ? (
              <div className="field">
                <label>
                  <i className="fas fa-message" />
                  Message Content <span className="req">*</span>
                </label>
                <textarea
                  className="textarea"
                  placeholder="Hello! How can I help you? 👋"
                  value={cmd.textConfig.contentValue}
                  onChange={(e) => updText({ contentValue: e.target.value })}
                  rows={6}
                />
                <div className="hint">
                  <i className="fas fa-info-circle" />
                  ඔයාට ඕන message එක type කරන්න — emoji, line breaks support
                </div>
              </div>
            ) : (
              <>
                <div className="field">
                  <label>
                    <i
                      className={`fas ${
                        cmd.textConfig.contentType === "audio"
                          ? "fa-music"
                          : "fa-video"
                      }`}
                    />
                    {cmd.textConfig.contentType === "audio"
                      ? "Audio URL"
                      : "Video URL"}{" "}
                    <span className="req">*</span>
                  </label>
                  <div className="input-icon-wrap">
                    <i className="fas fa-link" />
                    <input
                      className="input"
                      placeholder="https://example.com/file.mp3"
                      value={cmd.textConfig.contentValue}
                      onChange={(e) =>
                        updText({ contentValue: e.target.value })
                      }
                    />
                  </div>
                </div>

                {cmd.textConfig.contentType === "audio" && (
                  <div className="field">
                    <label>
                      <i className="fas fa-file-audio" />
                      File Name (optional)
                    </label>
                    <input
                      className="input"
                      placeholder="song.mp3"
                      value={cmd.textConfig.fileName}
                      onChange={(e) =>
                        updText({ fileName: e.target.value })
                      }
                    />
                    <div className="hint">
                      <i className="fas fa-info-circle" />
                      WhatsApp එකේ පෙන්නන file name එක
                    </div>
                  </div>
                )}
              </>
            )}
          </>
        )}

        {/* ==================== STEP 2B: API RESPONSE ==================== */}
        {step === 2 && cmd.type === "API" && (
          <>
            <div className="info-card">
              <i className="fas fa-circle-info" />
              <div>
                API එකේ test කරලා එන values ටික next step එකේ
                template එකට insert කරන්න පුළුවන්. Use{" "}
                <code>{"{{key}}"}</code> format.
              </div>
            </div>

            <div className="field-row">
              <div className="field">
                <label>
                  <i className="fas fa-code-branch" />
                  HTTP Method
                </label>
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
                <label>
                  <i className="fas fa-question-circle" />
                  Has Query?
                </label>
                <label
                  className="checkbox-row"
                  style={{ height: 46, padding: "0 16px" }}
                >
                  <input
                    type="checkbox"
                    checked={cmd.apiConfig.hasQuery}
                    onChange={(e) =>
                      updApi({ hasQuery: e.target.checked })
                    }
                  />
                  <span className="label-text">
                    {cmd.apiConfig.hasQuery ? "Yes — add params" : "No"}
                  </span>
                </label>
              </div>
            </div>

            <div className="field">
              <label>
                <i className="fas fa-globe" />
                API URL <span className="req">*</span>
              </label>
              <div className="input-icon-wrap">
                <i className="fas fa-link" />
                <input
                  className="input"
                  placeholder="https://api.example.com/search"
                  value={cmd.apiConfig.url}
                  onChange={(e) => updApi({ url: e.target.value })}
                />
              </div>
            </div>

            {cmd.apiConfig.hasQuery && (
              <div className="field">
                <label>
                  <i className="fas fa-sliders" />
                  Query Parameters
                </label>
                <div className="query-section">
                  {cmd.apiConfig.queries.length === 0 && (
                    <div
                      style={{
                        fontSize: "0.8rem",
                        color: "rgba(255,255,255,0.35)",
                        textAlign: "center",
                        padding: "10px 0",
                      }}
                    >
                      No queries yet — click "Add Query" below
                    </div>
                  )}

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
                          arr[i] = {
                            ...arr[i],
                            defaultValue: e.target.value,
                          };
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
                        title="Remove"
                      >
                        <i className="fas fa-trash" />
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
                    <i className="fas fa-plus" />
                    Add Query
                  </button>
                </div>
              </div>
            )}

            <button
              className="test-btn"
              onClick={testAPI}
              disabled={testing || !cmd.apiConfig.url.trim()}
            >
              {testing ? (
                <>
                  <i className="fas fa-spinner fa-spin" />
                  <span>Testing API...</span>
                </>
              ) : (
                <>
                  <i className="fas fa-vial" />
                  <span>Test API</span>
                  <i className="fas fa-arrow-right" />
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
                  <span style={{ display: "inline-flex", alignItems: "center" }}>
                    <span className="status-icon">
                      <i
                        className={`fas ${
                          apiResult.ok
                            ? "fa-check"
                            : "fa-triangle-exclamation"
                        }`}
                      />
                    </span>
                    {apiResult.ok
                      ? `Success — HTTP ${apiResult.status}`
                      : apiResult.error || "Failed"}
                  </span>
                  {apiResult.ok && (
                    <span className="result-badge">
                      <i className="fas fa-key" />
                      {apiResult.templateKeys?.length || 0} fields
                    </span>
                  )}
                </div>

                {apiResult.arrays?.length > 0 && (
                  <div style={{ marginBottom: 14 }}>
                    {apiResult.arrays.map((a, i) => (
                      <span key={i} className="array-badge">
                        <i className="fas fa-list-ul" />
                        {a.path} ({a.count} items)
                      </span>
                    ))}
                  </div>
                )}

                {apiResult.templateKeys?.length > 0 && (
                  <>
                    <div className="keys-label">
                      <i className="fas fa-key" />
                      Available Fields — click to copy
                    </div>
                    <div className="keys-grid">
                      {apiResult.templateKeys.map((t, i) => (
                        <div
                          key={i}
                          className="key-item"
                          onClick={() => {
                            navigator.clipboard
                              .writeText(`{{${t.key}}}`)
                              .catch(() => {});
                          }}
                          title="Click to copy"
                        >
                          <div className="key-name">
                            <i className="fas fa-copy" />
                            {`{{${t.key}}}`}
                          </div>
                          <div className="sample">
                            {String(t.sample).slice(0, 50)}
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}
          </>
        )}

        {/* ==================== STEP 3: TEST ==================== */}
        {step === 3 && (
          <>
            <div className="field">
              <label>
                <i className="fas fa-comments" />
                Live Preview
              </label>
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
                    : renderedPreview ||
                      cmd.responseTemplate ||
                      "🎬 *{{results.title}}*\n⭐ {{results.rating}} | {{results.year}}\n🔗 {{results.link}}"}
                </div>

                {cmd.type === "API" && (
                  <div
                    className={`preview-badge ${
                      hasApiTest ? "live" : "pending"
                    }`}
                  >
                    <i
                      className={`fas ${
                        hasApiTest ? "fa-circle-check" : "fa-circle-info"
                      }`}
                      style={{ fontSize: "0.55rem" }}
                    />
                    {hasApiTest
                      ? "Preview with real API data"
                      : "Test API in step 2 for live preview"}
                  </div>
                )}

                <div className="chat-time">
                  <i className="fas fa-check-double" style={{ marginRight: 4 }} />
                  just now
                </div>
              </div>
            </div>

            {cmd.type === "API" && (
              <>
                <div className="field">
                  <label>
                    <i className="fas fa-code" />
                    Response Template <span className="req">*</span>
                  </label>
                  <textarea
                    className={`textarea ${
                      templateValidation.errors.length > 0 ? "has-error" : ""
                    }`}
                    placeholder={`🎬 *{{results.title}}*\n⭐ {{results.rating}} | {{results.year}}\n🔗 {{results.link}}`}
                    value={cmd.responseTemplate}
                    onChange={(e) =>
                      upd({ responseTemplate: e.target.value })
                    }
                    rows={6}
                  />

                  {/* Syntax errors */}
                  {templateValidation.errors.length > 0 && (
                    <div className="syntax-errors">
                      {templateValidation.errors.map((e, i) => (
                        <div key={i} className="syntax-error-item">
                          <i className="fas fa-circle-xmark" />
                          <div>
                            <div className="syntax-msg">{e.msg}</div>
                            {e.fix && (
                              <div className="syntax-fix">{e.fix}</div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Warnings */}
                  {templateValidation.errors.length === 0 &&
                    templateValidation.warnings.length > 0 && (
                      <div className="syntax-warnings">
                        {templateValidation.warnings.slice(0, 3).map((w, i) => (
                          <div key={i} className="syntax-warning-item">
                            <i className="fas fa-triangle-exclamation" />
                            <div>
                              <div className="syntax-msg">{w.msg}</div>
                              {w.fix && (
                                <div className="syntax-fix">{w.fix}</div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                  {/* Success */}
                  {templateValidation.errors.length === 0 &&
                    templateValidation.warnings.length === 0 &&
                    cmd.responseTemplate && (
                      <div className="syntax-success">
                        <i className="fas fa-circle-check" />
                        Template syntax හරි
                      </div>
                    )}

                  <div className="hint">
                    <i className="fas fa-info-circle" />
                    Use <code>{"{{key}}"}</code> — click කරන්න පහත fields වලින්
                    insert කරන්න
                  </div>
                </div>

                {cmd.apiConfig.extractedValues?.length > 0 && (
                  <div className="field">
                    <label>
                      <i className="fas fa-key" />
                      Available Values — click to insert
                    </label>
                    <div
                      style={{
                        display: "flex",
                        flexWrap: "wrap",
                        gap: 6,
                      }}
                    >
                      {cmd.apiConfig.extractedValues.map((k, i) => (
                        <button
                          key={i}
                          type="button"
                          className="array-badge"
                          style={{
                            cursor: "pointer",
                            fontFamily: "inherit",
                          }}
                          onClick={() => insertAtTemplate(k)}
                          title="Click to insert into template"
                        >
                          <i className="fas fa-plus" />
                          {`{{${k}}}`}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}

            {cmd.type === "simple" && (
              <div className="info-card">
                <i className="fas fa-circle-check" />
                <div>
                  This command will respond with{" "}
                  <strong>{cmd.textConfig.contentType}</strong> content when
                  users type <code>.{cmd.command}</code>
                </div>
              </div>
            )}
          </>
        )}

        {/* ==================== NAV ==================== */}
        <div className="wiz-nav">
          {step > 1 ? (
            <button
              className="nav-btn"
              onClick={() => setStep((s) => s - 1)}
              disabled={saving}
            >
              <i className="fas fa-arrow-left" />
              <span>Back</span>
            </button>
          ) : (
            <div />
          )}

          {step < 3 ? (
            <button
              className="nav-btn primary"
              onClick={() => setStep((s) => s + 1)}
              disabled={!canGoNext()}
            >
              <span>Next</span>
              <i className="fas fa-arrow-right" />
            </button>
          ) : (
            <button
              className="nav-btn primary"
              onClick={submit}
              disabled={saving}
            >
              {saving ? (
                <>
                  <i className="fas fa-spinner fa-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <i className="fas fa-check" />
                  <span>{editName ? "Update Command" : "Save Command"}</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </>
  );
}
