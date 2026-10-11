"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

const STEPS = [
  { n: 1, label: "Details", icon: "fa-circle-info" },
  { n: 2, label: "Response", icon: "fa-message" },
  { n: 3, label: "Test", icon: "fa-vial" },
];

const MAX_COMMANDS = 5;

const CATEGORIES = [
  { value: "main", label: "Main", icon: "fa-house" },
  { value: "download", label: "Download", icon: "fa-download" },
  { value: "logo", label: "Logo", icon: "fa-image" },
  { value: "media", label: "Media", icon: "fa-photo-film" },
  { value: "tools", label: "Tools", icon: "fa-screwdriver-wrench" },
];

function defaultCommand() {
  return {
    command: "",
    aliase: "",
    desc: "",
    react: "",
    category: "main",
    ownerOnly: false,
    type: "simple",
    textConfig: {
      contentType: "text",
      contentValue: "",
      caption: "",
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
    sendWithImage: false,
    imageUrl: "",
    imageUrlKey: "",
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
  const [existingCommands, setExistingCommands] = useState([]);

  // 🔥 category dropdown state
  const [categoryOpen, setCategoryOpen] = useState(false);
  const categoryRef = useRef(null);

  const [expandedKeys, setExpandedKeys] = useState({});
  const [expandedImageKeys, setExpandedImageKeys] = useState({});

  const templateRef = useRef(null);

  /* ---------- close category dropdown on outside click ---------- */
  useEffect(() => {
    function handleClickOutside(e) {
      if (
        categoryRef.current &&
        !categoryRef.current.contains(e.target)
      ) {
        setCategoryOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () =>
      document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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
            category: found.category || "main",
            ownerOnly: found.ownerOnly || false,
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

  useEffect(() => {
    (async () => {
      try {
        const userId = localStorage.getItem("bot_id");
        if (!userId) return;
        const res = await fetch("/api/add-cmd", {
          headers: { Authorization: `Bearer ${userId}` },
        });
        const data = await res.json();
        if (data.ok) setExistingCommands(data.commands || []);
      } catch {}
    })();
  }, []);

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

  function validateBeforeSubmit() {
    const name = cmd.command.trim().toLowerCase();
    if (!name) return "Command name එක අනිවාර්යයි";

    const duplicate = existingCommands.find(
      (c) => c.command === name && c.command !== editName
    );
    if (duplicate) {
      return `".${name}" කියන command එක දැනටමත් තියෙනවා.`;
    }

    if (!editName && existingCommands.length >= MAX_COMMANDS) {
      return `ඔයාට උපරිම commands ${MAX_COMMANDS}ක් විතරයි හදන්න පුළුවන්.`;
    }

    const aliases = cmd.aliase
      .split(",")
      .map((a) => a.trim().toLowerCase())
      .filter(Boolean);

    for (const a of aliases) {
      const conflict = existingCommands.find(
        (c) =>
          c.command !== editName &&
          (c.command === a || (c.aliase || []).includes(a))
      );
      if (conflict) {
        return `Alias ".${a}" එක ".${conflict.command}" ට අයිතියි.`;
      }
    }

    return null;
  }

  async function submit() {
    setError("");
    const validationError = validateBeforeSubmit();
    if (validationError) {
      setError(validationError);
      return;
    }

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
        category: cmd.category || "main",
        ownerOnly: !!cmd.ownerOnly,
        type: cmd.type,
        isActive: true,
      };

      if (cmd.type === "simple") {
        payload.textConfig = {
          contentType: cmd.textConfig.contentType,
          contentValue: cmd.textConfig.contentValue,
          caption: cmd.textConfig.caption || "",
          fileName: "",
        };
      } else {
        payload.apiConfig = {
          method: cmd.apiConfig.method,
          url: cmd.apiConfig.url,
          hasQuery: cmd.apiConfig.hasQuery,
          queries: cmd.apiConfig.queries.filter((q) => q.key),
          extractedValues: cmd.apiConfig.extractedValues,
        };
        payload.responseTemplate = cmd.responseTemplate;
        payload.sendWithImage = !!cmd.sendWithImage;
        payload.imageUrl = cmd.imageUrl || "";
        payload.imageUrlKey = cmd.imageUrlKey || "";
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

    const el = templateRef.current;
    if (el) {
      const start = el.selectionStart ?? cmd.responseTemplate.length;
      const end = el.selectionEnd ?? start;
      const before = cmd.responseTemplate.slice(0, start);
      const after = cmd.responseTemplate.slice(end);

      const prefix = before && !/\s$/.test(before) ? " " : "";
      const suffix = after && !/^\s/.test(after) ? " " : "";

      const newValue = `${before}${prefix}${token}${suffix}${after}`;
      upd({ responseTemplate: newValue });

      setTimeout(() => {
        const newPos = start + prefix.length + token.length;
        el.focus();
        el.setSelectionRange(newPos, newPos);
      }, 0);
    } else {
      upd({ responseTemplate: (cmd.responseTemplate || "") + token });
    }

    navigator.clipboard.writeText(token).catch(() => {});
  }

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

  const resolvedImageUrl = (() => {
    if (!cmd.sendWithImage) return "";
    if (cmd.imageUrlKey && apiResult?.ok) {
      const parts = String(cmd.imageUrlKey).split(".");
      let cur = apiResult.data;
      for (const p of parts) {
        if (cur == null) return "";
        if (Array.isArray(cur) && /^\d+$/.test(p)) {
          cur = cur[parseInt(p, 10)];
        } else {
          cur = cur[p];
        }
      }
      if (cur && typeof cur === "string") return cur;
    }
    if (cmd.imageUrl) return cmd.imageUrl;
    return "";
  })();

  function groupTemplateKeys(keys) {
    const groups = [];
    const seen = new Set();

    for (const key of keys) {
      const arrayMatch = key.match(/^(.+?)\.(\d+)\.(.+)$/);
      if (arrayMatch) {
        const base = `${arrayMatch[1]}.${arrayMatch[3]}`;
        if (!seen.has(base)) {
          seen.add(base);
          const expansions = keys.filter((k) => {
            const m = k.match(/^(.+?)\.(\d+)\.(.+)$/);
            return m && `${m[1]}.${m[3]}` === base;
          });
          groups.push({
            key: base,
            base,
            isArray: true,
            count: expansions.length,
            expandedKeys: expansions,
            items: expansions,
            sample: "",
          });
        }
      } else {
        if (!seen.has(key)) {
          seen.add(key);
          groups.push({
            key,
            base: key,
            isArray: false,
            count: 0,
            expandedKeys: [key],
            items: [key],
            sample: "",
          });
        }
      }
    }

    return groups;
  }

  const templateGroups = (() => {
    if (apiResult?.templateGroups?.length) {
      return apiResult.templateGroups;
    }
    return groupTemplateKeys(cmd.apiConfig.extractedValues || []);
  })();

  const imageGroups = (() => {
    const allGroups = apiResult?.templateGroups?.length
      ? apiResult.templateGroups
      : groupTemplateKeys(cmd.apiConfig.extractedValues || []);

    return allGroups.filter((g) => {
      const key = g.key || g.base || "";
      return /image|img|photo|poster|thumbnail|picture|cover|icon|banner|thumb/i.test(
        key
      );
    });
  })();

  function renderWhatsAppPreview(text) {
    if (!text) return [];

    const lines = text.split("\n");
    const elements = [];

    lines.forEach((line, i) => {
      if (line === "") {
        elements.push({ type: "br", key: `br-${i}` });
        return;
      }

      if (line.startsWith("> ")) {
        elements.push({
          type: "quote",
          content: line.slice(2),
          key: `q-${i}`,
        });
        return;
      }

      const monoMatch = line.match(/^```(.+)```$/) || line.match(/^`(.+)$/);
      if (monoMatch) {
        elements.push({
          type: "mono",
          content: monoMatch[1],
          key: `m-${i}`,
        });
        return;
      }

      elements.push({
        type: "text",
        content: parseInlineFormat(line),
        key: `t-${i}`,
        isLast: i === lines.length - 1,
      });
    });

    return elements;
  }

  function parseInlineFormat(text) {
    if (!text) return text;

    let out = text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");

    out = out.replace(/\*([^*\n]+?)\*/g, "<b>$1</b>");
    out = out.replace(/_([^_\n]+?)_/g, "<i>$1</i>");
    out = out.replace(/~([^~\n]+?)~/g, "<s>$1</s>");
    out = out.replace(/`([^`\n]+?)`/g, "<code>$1</code>");

    return out;
  }

  function renderPreviewElements(elements) {
    return elements.map((el, idx) => {
      if (el.type === "br") {
        return <br key={el.key || idx} />;
      }
      if (el.type === "quote") {
        return (
          <span key={el.key || idx} className="line-quote">
            {el.content}
          </span>
        );
      }
      if (el.type === "mono") {
        return (
          <span key={el.key || idx} className="line-mono">
            {el.content}
          </span>
        );
      }
      return (
        <span
          key={el.key || idx}
          dangerouslySetInnerHTML={{ __html: el.content }}
        />
      );
    });
  }

  function lookupSampleValue(path) {
    if (!apiResult?.ok) return "";
    const parts = String(path).split(".");
    let cur = apiResult.data;
    for (const p of parts) {
      if (cur == null) return "";
      if (Array.isArray(cur) && /^\d+$/.test(p)) {
        cur = cur[parseInt(p, 10)];
      } else {
        cur = cur[p];
      }
    }
    if (cur === undefined || cur === null || typeof cur === "object")
      return "";
    return String(cur);
  }

  /* ---------- selected category object ---------- */
  const selectedCategory =
    CATEGORIES.find((c) => c.value === cmd.category) || CATEGORIES[0];

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

        /* HEADER */
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

        /* STEPS */
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
        .step-item { display: flex; align-items: center; gap: 10px; flex-shrink: 0; }
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
        .step-pill.done .step-num { background: #22c55e; color: #000; }
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

        /* PANEL */
        .wiz-panel {
          background: rgba(8, 15, 30, 0.65);
          backdrop-filter: blur(22px);
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

        /* FIELDS */
        .field { margin-bottom: 20px; }
        .field-row { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
        @media (max-width: 600px) { .field-row { grid-template-columns: 1fr; } }
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
        .textarea::placeholder { color: rgba(255, 255, 255, 0.2); }
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

        /* ======================================================
           🔥 CATEGORY DROPDOWN — FIXED & REFINED
           ====================================================== */
        .category-dropdown {
          position: relative;
          z-index: 30;
        }
        .category-dropdown.open {
          z-index: 100;
        }

        .category-trigger {
          width: 100%;
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 14px 18px;
          background: rgba(0, 0, 0, 0.3);
          border: 1.5px solid rgba(255, 255, 255, 0.06);
          border-radius: 14px;
          color: #fff;
          font-family: inherit;
          font-size: 0.88rem;
          cursor: pointer;
          transition: all 0.25s ease;
          text-align: left;
        }
        .category-trigger:hover {
          border-color: rgba(59, 130, 246, 0.4);
          background: rgba(0, 0, 0, 0.4);
        }
        .category-trigger.open {
          border-color: #3b82f6;
          background: rgba(0, 0, 0, 0.45);
          box-shadow: 0 0 25px rgba(59, 130, 246, 0.15);
        }

        .category-trigger .cat-current-icon {
          width: 36px;
          height: 36px;
          border-radius: 10px;
          background: linear-gradient(135deg, #3b82f6, #06b6d4);
          display: grid;
          place-items: center;
          color: #000;
          font-size: 0.9rem;
          flex-shrink: 0;
          box-shadow: 0 0 15px rgba(59, 130, 246, 0.35);
        }

        .category-trigger .cat-current-label {
          flex: 1;
          min-width: 0;
          display: flex;
          flex-direction: column;
          gap: 2px;
        }
        .category-trigger .cat-current-label .main {
          font-size: 0.9rem;
          font-weight: 700;
          color: #fff;
        }
        .category-trigger .cat-current-label .sub {
          font-size: 0.65rem;
          color: rgba(255, 255, 255, 0.4);
          text-transform: uppercase;
          letter-spacing: 1px;
          font-weight: 600;
        }

        .category-trigger .cat-chevron {
          font-size: 0.75rem;
          color: rgba(255, 255, 255, 0.4);
          transition: transform 0.3s ease;
          flex-shrink: 0;
        }
        .category-trigger.open .cat-chevron {
          transform: rotate(180deg);
          color: #60a5fa;
        }

        /* menu — lighter glass, proper layering */
        .category-menu {
          position: absolute;
          top: calc(100% + 8px);
          left: 0;
          right: 0;
          background: rgba(10, 15, 30, 0.82);
          backdrop-filter: blur(18px);
          -webkit-backdrop-filter: blur(18px);
          border: 1px solid rgba(0, 150, 255, 0.22);
          border-radius: 14px;
          padding: 8px;
          z-index: 100;
          box-shadow: 0 25px 50px rgba(0, 0, 0, 0.55),
                      0 0 40px rgba(59, 130, 246, 0.06);
          animation: dropdownIn 0.2s ease;
          max-height: 320px;
          overflow-y: auto;
        }
        .category-menu::-webkit-scrollbar { width: 5px; }
        .category-menu::-webkit-scrollbar-thumb {
          background: rgba(59, 130, 246, 0.3);
          border-radius: 3px;
        }

        @keyframes dropdownIn {
          from { opacity: 0; transform: translateY(-6px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .category-option {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 11px 14px;
          border-radius: 10px;
          cursor: pointer;
          transition: all 0.15s ease;
          border: 1px solid transparent;
        }
        .category-option:hover {
          background: rgba(59, 130, 246, 0.08);
          border-color: rgba(59, 130, 246, 0.2);
        }
        .category-option.selected {
          background: linear-gradient(135deg, rgba(59, 130, 246, 0.15), rgba(6, 182, 212, 0.08));
          border-color: rgba(59, 130, 246, 0.35);
        }

        .category-option .opt-icon {
          width: 32px;
          height: 32px;
          border-radius: 9px;
          background: rgba(59, 130, 246, 0.12);
          border: 1px solid rgba(59, 130, 246, 0.25);
          display: grid;
          place-items: center;
          color: #60a5fa;
          font-size: 0.8rem;
          flex-shrink: 0;
          transition: all 0.2s ease;
        }
        .category-option:hover .opt-icon {
          transform: scale(1.08);
        }
        .category-option.selected .opt-icon {
          background: linear-gradient(135deg, #3b82f6, #06b6d4);
          color: #000;
          border-color: transparent;
          box-shadow: 0 0 15px rgba(59, 130, 246, 0.4);
        }

        .category-option .opt-label {
          flex: 1;
          font-size: 0.88rem;
          font-weight: 600;
          color: rgba(255, 255, 255, 0.85);
        }
        .category-option.selected .opt-label {
          color: #fff;
        }
        .category-option .opt-check {
          color: #4ade80;
          font-size: 0.85rem;
          opacity: 0;
          transition: opacity 0.2s ease;
        }
        .category-option.selected .opt-check {
          opacity: 1;
        }

        /* ======================================================
           🔥 OWNER-ONLY — same theme as the rest
           ====================================================== */
        .owner-panel {
          position: relative;
          padding: 18px;
          border-radius: 16px;
          background: rgba(0, 0, 0, 0.25);
          border: 1.5px solid rgba(255, 255, 255, 0.08);
          transition: all 0.3s ease;
          cursor: pointer;
          overflow: hidden;
        }
        .owner-panel::before {
          content: "";
          position: absolute;
          top: -50%;
          right: -50%;
          width: 200%;
          height: 200%;
          background: radial-gradient(circle, rgba(59, 130, 246, 0.08), transparent 60%);
          opacity: 0;
          transition: opacity 0.3s ease;
          pointer-events: none;
        }
        .owner-panel:hover {
          border-color: rgba(59, 130, 246, 0.4);
          background: rgba(0, 0, 0, 0.35);
        }
        .owner-panel:hover::before {
          opacity: 1;
        }
        .owner-panel.active {
          border-color: rgba(59, 130, 246, 0.55);
          background: linear-gradient(135deg, rgba(59, 130, 246, 0.12), rgba(6, 182, 212, 0.06));
          box-shadow: 0 0 40px rgba(59, 130, 246, 0.18),
                      inset 0 1px 0 rgba(255, 255, 255, 0.05);
        }

        .owner-panel-inner {
          position: relative;
          z-index: 1;
          display: flex;
          align-items: center;
          gap: 14px;
        }

        .owner-icon-box {
          width: 48px;
          height: 48px;
          border-radius: 14px;
          background: rgba(59, 130, 246, 0.12);
          border: 1px solid rgba(59, 130, 246, 0.3);
          display: grid;
          place-items: center;
          color: #60a5fa;
          font-size: 1.15rem;
          flex-shrink: 0;
          transition: all 0.3s ease;
        }
        .owner-panel:hover .owner-icon-box {
          transform: scale(1.05) rotate(-5deg);
        }
        .owner-panel.active .owner-icon-box {
          background: linear-gradient(135deg, #3b82f6, #06b6d4);
          color: #000;
          border-color: transparent;
          box-shadow: 0 0 25px rgba(59, 130, 246, 0.5);
        }

        .owner-info {
          flex: 1;
          min-width: 0;
        }
        .owner-title-row {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 3px;
        }
        .owner-title {
          font-size: 0.9rem;
          font-weight: 800;
          color: #fff;
          letter-spacing: -0.2px;
        }
        .owner-badge {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          padding: 2px 8px;
          border-radius: 20px;
          background: linear-gradient(135deg, #3b82f6, #06b6d4);
          color: #000;
          font-size: 0.58rem;
          font-weight: 800;
          letter-spacing: 0.5px;
          text-transform: uppercase;
        }
        .owner-sub {
          font-size: 0.72rem;
          color: rgba(255, 255, 255, 0.45);
          line-height: 1.4;
        }
        .owner-panel.active .owner-sub {
          color: rgba(255, 255, 255, 0.65);
        }

        /* BLUE SWITCH (same as other toggles) */
        .switch-blue {
          position: relative;
          width: 48px;
          height: 28px;
          border-radius: 30px;
          background: rgba(255, 255, 255, 0.08);
          border: 1px solid rgba(255, 255, 255, 0.12);
          transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
          flex-shrink: 0;
        }
        .switch-blue::after {
          content: "";
          position: absolute;
          top: 2px;
          left: 2px;
          width: 22px;
          height: 22px;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.7);
          transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.25);
        }
        .switch-blue.on {
          background: linear-gradient(135deg, #3b82f6, #06b6d4);
          border-color: transparent;
          box-shadow: 0 0 20px rgba(59, 130, 246, 0.55);
        }
        .switch-blue.on::after {
          left: calc(100% - 24px);
          background: #fff;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.35);
        }

        /* TYPE SELECTOR */
        .type-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
        @media (max-width: 500px) { .type-grid { grid-template-columns: 1fr; } }
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
        .type-card:hover {
          border-color: rgba(59, 130, 246, 0.4);
          transform: translateY(-2px);
        }
        .type-card.active {
          border-color: #3b82f6;
          background: linear-gradient(135deg, rgba(59, 130, 246, 0.12), rgba(6, 182, 212, 0.08));
          box-shadow: 0 0 40px rgba(59, 130, 246, 0.2);
        }
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
        .type-card:hover .type-icon { transform: scale(1.1) rotate(-5deg); }
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
        }
        .type-desc {
          font-size: 0.75rem;
          color: rgba(255, 255, 255, 0.45);
        }

        /* TOGGLE ROW */
        .toggle-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          padding: 14px 18px;
          border-radius: 14px;
          background: linear-gradient(135deg, rgba(59, 130, 246, 0.06), rgba(6, 182, 212, 0.04));
          border: 1px solid rgba(59, 130, 246, 0.2);
          cursor: pointer;
          transition: all 0.25s ease;
          min-height: 46px;
        }
        .toggle-row:hover {
          border-color: rgba(59, 130, 246, 0.45);
          background: linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(6, 182, 212, 0.06));
        }
        .toggle-row .toggle-info {
          display: flex;
          align-items: center;
          gap: 10px;
          min-width: 0;
          flex: 1;
        }
        .toggle-row .toggle-info > i {
          color: #60a5fa;
          font-size: 0.9rem;
          flex-shrink: 0;
        }
        .toggle-row .toggle-info .toggle-text {
          font-size: 0.82rem;
          font-weight: 700;
          color: rgba(255, 255, 255, 0.85);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .toggle-row .toggle-info .toggle-sub {
          font-size: 0.68rem;
          color: rgba(255, 255, 255, 0.4);
          margin-top: 2px;
          display: block;
        }

        .switch {
          position: relative;
          width: 46px;
          height: 26px;
          border-radius: 30px;
          background: rgba(255, 255, 255, 0.08);
          border: 1px solid rgba(255, 255, 255, 0.12);
          transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
          flex-shrink: 0;
        }
        .switch::after {
          content: "";
          position: absolute;
          top: 2px;
          left: 2px;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.7);
          transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        }
        .switch.on {
          background: linear-gradient(135deg, #3b82f6, #06b6d4);
          border-color: transparent;
          box-shadow: 0 0 18px rgba(59, 130, 246, 0.5);
        }
        .switch.on::after {
          left: calc(100% - 22px);
          background: #fff;
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
        }

        /* QUERY SECTION */
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

        /* TEST API BUTTON */
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
        }
        .test-btn:hover:not(:disabled) {
          transform: translateY(-3px) scale(1.02);
          box-shadow: 0 12px 40px rgba(6, 182, 212, 0.5);
        }
        .test-btn:disabled { opacity: 0.5; cursor: not-allowed; }

        /* TEST RESULT */
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

        /* DROPDOWN FIELD GROUPS */
        .fields-hint {
          display: flex;
          gap: 10px;
          padding: 12px 14px;
          border-radius: 10px;
          background: rgba(59, 130, 246, 0.06);
          border: 1px solid rgba(59, 130, 246, 0.2);
          font-size: 0.75rem;
          color: rgba(255, 255, 255, 0.6);
          margin-bottom: 12px;
          line-height: 1.5;
        }
        .fields-hint i {
          color: #60a5fa;
          font-size: 0.9rem;
          flex-shrink: 0;
          margin-top: 1px;
        }
        .fields-hint code {
          background: rgba(0, 0, 0, 0.3);
          padding: 1px 5px;
          border-radius: 4px;
          color: #22d3ee;
          font-family: "SF Mono", "Consolas", monospace;
          font-size: 0.72rem;
        }

        .fields-wrap {
          display: flex;
          flex-direction: column;
          gap: 8px;
          margin-top: 10px;
        }

        .field-group {
          border-radius: 12px;
          background: rgba(0, 0, 0, 0.25);
          border: 1px solid rgba(255, 255, 255, 0.06);
          overflow: hidden;
          transition: all 0.25s ease;
        }
        .field-group:hover {
          border-color: rgba(59, 130, 246, 0.3);
        }
        .field-group.expanded {
          border-color: rgba(6, 182, 212, 0.4);
          background: rgba(6, 182, 212, 0.04);
          box-shadow: 0 0 25px rgba(6, 182, 212, 0.08);
        }

        .field-group-header {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 11px 14px;
          cursor: pointer;
          user-select: none;
          transition: background 0.2s ease;
        }
        .field-group-header:hover {
          background: rgba(59, 130, 246, 0.06);
        }

        .field-group-icon {
          width: 26px;
          height: 26px;
          border-radius: 8px;
          background: rgba(6, 182, 212, 0.12);
          border: 1px solid rgba(6, 182, 212, 0.25);
          display: grid;
          place-items: center;
          color: #22d3ee;
          font-size: 0.7rem;
          flex-shrink: 0;
          transition: transform 0.3s ease;
        }
        .field-group.expanded .field-group-icon {
          background: linear-gradient(135deg, #06b6d4, #3b82f6);
          color: #000;
          transform: rotate(90deg);
        }

        .field-group-info {
          flex: 1;
          min-width: 0;
        }
        .field-group-name {
          color: #60a5fa;
          font-family: "SF Mono", "Consolas", monospace;
          font-weight: 700;
          font-size: 0.82rem;
          display: flex;
          align-items: center;
          gap: 5px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .field-group-name .count {
          background: rgba(34, 197, 94, 0.2);
          color: #4ade80;
          font-size: 0.62rem;
          padding: 1px 7px;
          border-radius: 20px;
          font-weight: 800;
          margin-left: 4px;
        }
        .field-group-sample {
          color: rgba(255, 255, 255, 0.4);
          font-size: 0.68rem;
          margin-top: 3px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .field-group-insert {
          padding: 5px 10px;
          border-radius: 20px;
          background: rgba(59, 130, 246, 0.12);
          border: 1px solid rgba(59, 130, 246, 0.3);
          color: #60a5fa;
          font-size: 0.65rem;
          font-weight: 700;
          font-family: inherit;
          cursor: pointer;
          transition: all 0.2s ease;
          display: inline-flex;
          align-items: center;
          gap: 4px;
          flex-shrink: 0;
        }
        .field-group-insert:hover {
          background: linear-gradient(135deg, #3b82f6, #06b6d4);
          color: #000;
          border-color: transparent;
        }

        .field-group-children {
          border-top: 1px solid rgba(255, 255, 255, 0.06);
          padding: 8px;
          display: flex;
          flex-direction: column;
          gap: 5px;
          animation: expandDown 0.25s ease;
          max-height: 280px;
          overflow-y: auto;
        }
        .field-group-children::-webkit-scrollbar { width: 5px; }
        .field-group-children::-webkit-scrollbar-thumb {
          background: rgba(6, 182, 212, 0.3);
          border-radius: 3px;
        }
        @keyframes expandDown {
          from { opacity: 0; transform: translateY(-4px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .field-child {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          padding: 8px 12px;
          background: rgba(0, 0, 0, 0.25);
          border-radius: 8px;
          border: 1px solid rgba(255, 255, 255, 0.04);
          cursor: pointer;
          transition: all 0.15s ease;
        }
        .field-child:hover {
          background: rgba(6, 182, 212, 0.1);
          border-color: rgba(6, 182, 212, 0.3);
          transform: translateX(2px);
        }
        .field-child.selected {
          background: rgba(34, 197, 94, 0.08);
          border-color: rgba(34, 197, 94, 0.5);
        }
        .field-child .field-child-name {
          color: #22d3ee;
          font-family: "SF Mono", "Consolas", monospace;
          font-weight: 700;
          font-size: 0.72rem;
          display: flex;
          align-items: center;
          gap: 6px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          min-width: 0;
        }
        .field-child .field-child-name i {
          color: rgba(255, 255, 255, 0.3);
          font-size: 0.6rem;
          flex-shrink: 0;
        }
        .field-child.selected .field-child-name i {
          color: #4ade80;
        }
        .field-child .field-child-sample {
          color: rgba(255, 255, 255, 0.45);
          font-size: 0.68rem;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          max-width: 45%;
          text-align: right;
          flex-shrink: 0;
        }

        /* CONTENT TYPE SELECTOR */
        .content-type-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 10px;
          margin-bottom: 20px;
        }
        @media (max-width: 500px) {
          .content-type-grid { grid-template-columns: repeat(2, 1fr); }
        }
        .content-type-card {
          padding: 16px 10px;
          border-radius: 14px;
          border: 1.5px solid rgba(255, 255, 255, 0.08);
          background: rgba(0, 0, 0, 0.25);
          cursor: pointer;
          transition: all 0.25s ease;
          text-align: center;
        }
        .content-type-card:hover {
          border-color: rgba(59, 130, 246, 0.4);
          transform: translateY(-2px);
        }
        .content-type-card.active {
          border-color: #3b82f6;
          background: linear-gradient(135deg, rgba(59, 130, 246, 0.15), rgba(6, 182, 212, 0.08));
          box-shadow: 0 0 25px rgba(59, 130, 246, 0.2);
        }
        .content-type-card .ct-icon {
          font-size: 1.2rem;
          margin-bottom: 6px;
          color: #60a5fa;
        }
        .content-type-card.active .ct-icon { color: #fff; }
        .content-type-card .ct-label {
          font-size: 0.72rem;
          font-weight: 700;
          color: rgba(255, 255, 255, 0.7);
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .content-type-card.active .ct-label { color: #fff; }

        /* FAKE CHAT */
        .chat-window {
          background: linear-gradient(180deg, #0b141a 0%, #0a1218 100%);
          border-radius: 18px;
          padding: 22px;
          min-height: 200px;
          max-height: 500px;
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
          line-height: 1.55;
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
          white-space: pre-wrap;
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

        /* WhatsApp-style line elements */
        .chat-bubble.bot .line-mono {
          display: block;
          background: rgba(0, 0, 0, 0.4);
          padding: 6px 10px;
          border-radius: 8px;
          font-family: "SF Mono", "Consolas", monospace;
          font-size: 0.78rem;
          color: #a5f3fc;
          margin: 3px 0;
          white-space: pre-wrap;
          word-break: break-word;
        }
        .chat-bubble.bot .line-quote {
          display: block;
          border-left: 3px solid #22d3ee;
          padding-left: 10px;
          color: rgba(255, 255, 255, 0.7);
          font-style: italic;
          margin: 3px 0;
          white-space: pre-wrap;
        }
        .chat-bubble.bot code {
          background: rgba(0, 0, 0, 0.35);
          padding: 1px 6px;
          border-radius: 5px;
          font-family: "SF Mono", "Consolas", monospace;
          font-size: 0.85em;
          color: #a5f3fc;
        }
        .chat-bubble.bot b { font-weight: 900; color: #fff; }
        .chat-bubble.bot i { font-style: italic; }
        .chat-bubble.bot s { text-decoration: line-through; opacity: 0.7; }
        .chat-bubble.bot br {
          display: block;
          content: "";
          margin-top: 4px;
        }

        /* Image wrap */
        .chat-image-wrap {
          border-radius: 14px;
          overflow: hidden;
          max-width: 280px;
          background: rgba(0, 0, 0, 0.3);
          border: 1px solid rgba(255, 255, 255, 0.08);
        }
        .chat-image-wrap img {
          width: 100%;
          display: block;
          max-height: 280px;
          object-fit: cover;
        }
        .chat-image-caption {
          padding: 10px 12px;
          font-size: 0.82rem;
          line-height: 1.55;
          color: #e8e8e8;
          white-space: pre-wrap;
          word-break: break-word;
        }
        .chat-image-caption code {
          background: rgba(0, 0, 0, 0.35);
          padding: 1px 6px;
          border-radius: 5px;
          font-family: "SF Mono", "Consolas", monospace;
          font-size: 0.85em;
          color: #a5f3fc;
        }
        .chat-image-caption b { font-weight: 900; color: #fff; }
        .chat-image-caption br {
          display: block;
          content: "";
          margin-top: 4px;
        }
        .chat-image-caption .line-mono {
          display: block;
          background: rgba(0, 0, 0, 0.4);
          padding: 6px 10px;
          border-radius: 8px;
          font-family: "SF Mono", "Consolas", monospace;
          font-size: 0.78rem;
          color: #a5f3fc;
          margin: 3px 0;
          white-space: pre-wrap;
        }
        .chat-image-caption .line-quote {
          display: block;
          border-left: 3px solid #22d3ee;
          padding-left: 10px;
          color: rgba(255, 255, 255, 0.7);
          font-style: italic;
          margin: 3px 0;
        }

        .chat-time {
          font-size: 0.62rem;
          color: rgba(255, 255, 255, 0.35);
          align-self: flex-end;
          padding-right: 8px;
        }

        /* NAV */
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

        /* ERROR BANNER */
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

        /* INFO CARD */
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

        /* SYNTAX FEEDBACK */
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

        /* PREVIEW BADGE */
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

        /* IMAGE SECTION */
        .image-config {
          padding: 18px;
          border-radius: 14px;
          background: rgba(6, 182, 212, 0.05);
          border: 1px dashed rgba(6, 182, 212, 0.3);
          margin-top: 6px;
          animation: slideDown 0.25s ease;
        }

        .image-mode {
          display: flex;
          gap: 6px;
          margin-bottom: 14px;
          padding: 4px;
          border-radius: 30px;
          background: rgba(0, 0, 0, 0.3);
          border: 1px solid rgba(255, 255, 255, 0.05);
        }
        .image-mode-btn {
          flex: 1;
          padding: 9px 14px;
          border-radius: 30px;
          border: none;
          background: transparent;
          color: rgba(255, 255, 255, 0.5);
          font-size: 0.78rem;
          font-weight: 700;
          font-family: inherit;
          cursor: pointer;
          transition: all 0.2s ease;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
        }
        .image-mode-btn:hover { color: #fff; }
        .image-mode-btn.active {
          background: linear-gradient(135deg, #06b6d4, #3b82f6);
          color: #000;
          box-shadow: 0 4px 15px rgba(6, 182, 212, 0.3);
        }

        .image-key-hint {
          font-size: 0.7rem;
          color: rgba(255, 255, 255, 0.4);
          margin-top: 8px;
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .image-key-hint i { color: #22d3ee; font-size: 0.65rem; }

        .image-preview {
          margin-top: 14px;
          padding: 12px;
          border-radius: 12px;
          background: rgba(0, 0, 0, 0.35);
          border: 1px solid rgba(6, 182, 212, 0.2);
        }
        .image-preview-label {
          font-size: 0.62rem;
          color: rgba(255, 255, 255, 0.45);
          text-transform: uppercase;
          letter-spacing: 1.2px;
          font-weight: 700;
          margin-bottom: 10px;
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .image-preview-label i { color: #22d3ee; }
        .image-preview-body {
          display: flex;
          gap: 14px;
          align-items: center;
        }
        .image-preview-thumb {
          width: 90px;
          height: 90px;
          object-fit: cover;
          border-radius: 12px;
          border: 2px solid rgba(6, 182, 212, 0.3);
          background: rgba(0, 0, 0, 0.5);
          flex-shrink: 0;
        }
        .image-preview-info {
          min-width: 0;
          flex: 1;
        }
        .image-preview-status {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          font-size: 0.7rem;
          font-weight: 700;
          padding: 3px 10px;
          border-radius: 20px;
          margin-bottom: 6px;
        }
        .image-preview-status.ok {
          background: rgba(34, 197, 94, 0.15);
          color: #4ade80;
          border: 1px solid rgba(34, 197, 94, 0.3);
        }
        .image-preview-status.warn {
          background: rgba(234, 179, 8, 0.15);
          color: #facc15;
          border: 1px solid rgba(234, 179, 8, 0.3);
        }
        .image-preview-url {
          font-size: 0.68rem;
          color: rgba(255, 255, 255, 0.5);
          font-family: "SF Mono", "Consolas", monospace;
          word-break: break-all;
          line-height: 1.5;
        }
      `}</style>

      {/* HEADER */}
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
            : `Set up a new command — ${existingCommands.length}/${MAX_COMMANDS} used`}
        </p>
      </div>

      {/* STEPS */}
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

      {/* PANEL */}
      <div className="wiz-panel">
        {error && (
          <div className="error-banner">
            <i className="fas fa-exclamation-circle" />
            <span>{error}</span>
          </div>
        )}

        {/* STEP 1 */}
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
                Bot එකට trigger කරන්න පාවිච්චි කරන keyword එක
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

            {/* 🔥 CATEGORY DROPDOWN */}
            <div className="field">
              <label>
                <i className="fas fa-folder-tree" />
                Category <span className="req">*</span>
              </label>

              <div
                className={`category-dropdown ${
                  categoryOpen ? "open" : ""
                }`}
                ref={categoryRef}
              >
                <button
                  type="button"
                  className={`category-trigger ${
                    categoryOpen ? "open" : ""
                  }`}
                  onClick={() => setCategoryOpen((v) => !v)}
                >
                  <div className="cat-current-icon">
                    <i className={`fas ${selectedCategory.icon}`} />
                  </div>
                  <div className="cat-current-label">
                    <span className="main">{selectedCategory.label}</span>
                    <span className="sub">Selected Category</span>
                  </div>
                  <i className="fas fa-chevron-down cat-chevron" />
                </button>

                {categoryOpen && (
                  <div className="category-menu">
                    {CATEGORIES.map((cat) => {
                      const isSelected = cmd.category === cat.value;
                      return (
                        <div
                          key={cat.value}
                          className={`category-option ${
                            isSelected ? "selected" : ""
                          }`}
                          onClick={() => {
                            upd({ category: cat.value });
                            setCategoryOpen(false);
                          }}
                        >
                          <div className="opt-icon">
                            <i className={`fas ${cat.icon}`} />
                          </div>
                          <div className="opt-label">{cat.label}</div>
                          <i className="fas fa-check opt-check" />
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* 🔥 OWNER-ONLY — unified theme */}
            <div className="field">
              <div
                className={`owner-panel ${
                  cmd.ownerOnly ? "active" : ""
                }`}
                onClick={() => upd({ ownerOnly: !cmd.ownerOnly })}
              >
                <div className="owner-panel-inner">
                  <div className="owner-icon-box">
                    <i className="fas fa-user-shield" />
                  </div>
                  <div className="owner-info">
                    <div className="owner-title-row">
                      <span className="owner-title">Owner Only</span>
                      {cmd.ownerOnly && (
                        <span className="owner-badge">
                          <i
                            className="fas fa-lock"
                            style={{ fontSize: "0.5rem" }}
                          />
                          ON
                        </span>
                      )}
                    </div>
                    <div className="owner-sub">
                      {cmd.ownerOnly
                        ? "🔒 මේ command එක bot owner ට විතරයි"
                        : "හැමෝටම use කරන්න පුළුවන්"}
                    </div>
                  </div>
                  <div
                    className={`switch-blue ${
                      cmd.ownerOnly ? "on" : ""
                    }`}
                  />
                </div>
              </div>
            </div>

            {/* 🔥 COMMAND TYPE */}
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
                  <div className="type-desc">Text, image, audio, video</div>
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
          </>
        )}

        {/* STEP 2A */}
        {step === 2 && cmd.type === "simple" && (
          <>
            <div className="field">
              <label>
                <i className="fas fa-photo-film" />
                Content Type <span className="req">*</span>
              </label>
              <div className="content-type-grid">
                {[
                  { v: "text", icon: "fa-message", label: "Text" },
                  { v: "image", icon: "fa-image", label: "Image" },
                  { v: "audio", icon: "fa-music", label: "Audio" },
                  { v: "video", icon: "fa-video", label: "Video" },
                ].map((t) => (
                  <div
                    key={t.v}
                    className={`content-type-card ${
                      cmd.textConfig.contentType === t.v ? "active" : ""
                    }`}
                    onClick={() => updText({ contentType: t.v })}
                  >
                    <div className="ct-icon">
                      <i className={`fas ${t.icon}`} />
                    </div>
                    <div className="ct-label">{t.label}</div>
                  </div>
                ))}
              </div>
            </div>

            {cmd.textConfig.contentType === "text" && (
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
                  WhatsApp formatting support: <code>*bold*</code>{" "}
                  <code>_italic_</code> <code>`mono`</code>
                </div>
              </div>
            )}

            {cmd.textConfig.contentType === "image" && (
              <>
                <div className="field">
                  <label>
                    <i className="fas fa-image" />
                    Image URL <span className="req">*</span>
                  </label>
                  <div className="input-icon-wrap">
                    <i className="fas fa-link" />
                    <input
                      className="input"
                      placeholder="https://example.com/image.jpg"
                      value={cmd.textConfig.contentValue}
                      onChange={(e) =>
                        updText({ contentValue: e.target.value })
                      }
                    />
                  </div>
                </div>
                <div className="field">
                  <label>
                    <i className="fas fa-align-left" />
                    Caption (optional)
                  </label>
                  <textarea
                    className="textarea"
                    placeholder="Image එකට යටින් යන message එක..."
                    value={cmd.textConfig.caption}
                    onChange={(e) => updText({ caption: e.target.value })}
                    rows={3}
                  />
                </div>
              </>
            )}

            {cmd.textConfig.contentType === "audio" && (
              <div className="field">
                <label>
                  <i className="fas fa-music" />
                  Audio URL <span className="req">*</span>
                </label>
                <div className="input-icon-wrap">
                  <i className="fas fa-link" />
                  <input
                    className="input"
                    placeholder="https://example.com/song.mp3"
                    value={cmd.textConfig.contentValue}
                    onChange={(e) =>
                      updText({ contentValue: e.target.value })
                    }
                  />
                </div>
                <div className="hint">
                  <i className="fas fa-info-circle" />
                  MP3 හෝ M4A URL එකක් දාන්න
                </div>
              </div>
            )}

            {cmd.textConfig.contentType === "video" && (
              <>
                <div className="field">
                  <label>
                    <i className="fas fa-video" />
                    Video URL <span className="req">*</span>
                  </label>
                  <div className="input-icon-wrap">
                    <i className="fas fa-link" />
                    <input
                      className="input"
                      placeholder="https://example.com/video.mp4"
                      value={cmd.textConfig.contentValue}
                      onChange={(e) =>
                        updText({ contentValue: e.target.value })
                      }
                    />
                  </div>
                </div>
                <div className="field">
                  <label>
                    <i className="fas fa-align-left" />
                    Caption (optional)
                  </label>
                  <textarea
                    className="textarea"
                    placeholder="Video එකට යටින් යන message එක..."
                    value={cmd.textConfig.caption}
                    onChange={(e) => updText({ caption: e.target.value })}
                    rows={3}
                  />
                </div>
              </>
            )}
          </>
        )}

        {/* STEP 2B */}
        {step === 2 && cmd.type === "API" && (
          <>
            <div className="info-card">
              <i className="fas fa-circle-info" />
              <div>
                API එකේ test කරලා response එක check කරන්න. Next step එකේ
                response message එක හදන්න පුළුවන්.
              </div>
            </div>

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
                <i className="fas fa-sliders" />
                Query Parameters
              </label>
              <div
                className={`toggle-row ${
                  cmd.apiConfig.hasQuery ? "on" : ""
                }`}
                onClick={() =>
                  updApi({ hasQuery: !cmd.apiConfig.hasQuery })
                }
              >
                <div className="toggle-info">
                  <i className="fas fa-sliders" />
                  <div>
                    <div className="toggle-text">
                      {cmd.apiConfig.hasQuery
                        ? "Query parameters enabled"
                        : "No query parameters"}
                    </div>
                    <div className="toggle-sub">
                      {cmd.apiConfig.hasQuery
                        ? "User input API එකට pass වෙනවා"
                        : "Static API එකක්"}
                    </div>
                  </div>
                </div>
                <div
                  className={`switch ${
                    cmd.apiConfig.hasQuery ? "on" : ""
                  }`}
                />
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

                {apiResult.ok && apiResult.arrays?.length > 0 && (
                  <div style={{ marginBottom: 14 }}>
                    {apiResult.arrays.map((a, i) => (
                      <span key={i} className="array-badge">
                        <i className="fas fa-list-ul" />
                        {a.path} ({a.count} items)
                      </span>
                    ))}
                  </div>
                )}

                {apiResult.ok && (
                  <div className="info-card" style={{ marginBottom: 0 }}>
                    <i className="fas fa-circle-check" />
                    <div>
                      API එක හරි! Next click කරලා response message එක
                      හදන්න.
                    </div>
                  </div>
                )}
              </div>
            )}
          </>
        )}

        {/* STEP 3 */}
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

                {cmd.type === "simple" ? (
                  cmd.textConfig.contentType === "image" ? (
                    <div className="chat-bubble bot" style={{ padding: 6 }}>
                      <div className="chat-image-wrap">
                        {cmd.textConfig.contentValue ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={cmd.textConfig.contentValue}
                            alt="preview"
                            onError={(e) => {
                              e.target.style.display = "none";
                            }}
                          />
                        ) : (
                          <div
                            style={{
                              padding: 40,
                              textAlign: "center",
                              color: "rgba(255,255,255,0.3)",
                              fontSize: "0.8rem",
                            }}
                          >
                            No image URL
                          </div>
                        )}
                        {cmd.textConfig.caption && (
                          <div className="chat-image-caption">
                            <span
                              dangerouslySetInnerHTML={{
                                __html: parseInlineFormat(
                                  cmd.textConfig.caption
                                ),
                              }}
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  ) : cmd.textConfig.contentType === "audio" ? (
                    <div className="chat-bubble bot">
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 10,
                          padding: "6px 4px",
                        }}
                      >
                        <div
                          style={{
                            width: 36,
                            height: 36,
                            borderRadius: "50%",
                            background: "linear-gradient(135deg, #06b6d4, #3b82f6)",
                            display: "grid",
                            placeItems: "center",
                            color: "#000",
                            fontSize: "0.9rem",
                          }}
                        >
                          <i className="fas fa-play" />
                        </div>
                        <div style={{ minWidth: 0 }}>
                          <div
                            style={{
                              fontSize: "0.78rem",
                              fontWeight: 700,
                              color: "#fff",
                            }}
                          >
                            🎵 Audio Message
                          </div>
                          <div
                            style={{
                              fontSize: "0.65rem",
                              color: "rgba(255,255,255,0.5)",
                              wordBreak: "break-all",
                              fontFamily: "monospace",
                            }}
                          >
                            {cmd.textConfig.contentValue
                              ? cmd.textConfig.contentValue.slice(0, 60) +
                                "..."
                              : "(no url)"}
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : cmd.textConfig.contentType === "video" ? (
                    <div className="chat-bubble bot" style={{ padding: 6 }}>
                      <div className="chat-image-wrap">
                        <div
                          style={{
                            padding: 30,
                            textAlign: "center",
                            background: "rgba(0,0,0,0.5)",
                          }}
                        >
                          <i
                            className="fas fa-video"
                            style={{ fontSize: "2rem", color: "#60a5fa" }}
                          />
                          <div
                            style={{
                              fontSize: "0.75rem",
                              color: "rgba(255,255,255,0.6)",
                              marginTop: 8,
                              fontFamily: "monospace",
                              wordBreak: "break-all",
                            }}
                          >
                            {cmd.textConfig.contentValue
                              ? cmd.textConfig.contentValue.slice(0, 60)
                              : "(no url)"}
                          </div>
                        </div>
                        {cmd.textConfig.caption && (
                          <div className="chat-image-caption">
                            <span
                              dangerouslySetInnerHTML={{
                                __html: parseInlineFormat(
                                  cmd.textConfig.caption
                                ),
                              }}
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="chat-bubble bot">
                      {renderPreviewElements(
                        renderWhatsAppPreview(
                          cmd.textConfig.contentValue || "(empty message)"
                        )
                      )}
                    </div>
                  )
                ) : (
                  <>
                    {cmd.sendWithImage && resolvedImageUrl ? (
                      <div className="chat-bubble bot" style={{ padding: 6 }}>
                        <div className="chat-image-wrap">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={resolvedImageUrl}
                            alt="preview"
                            onError={(e) => {
                              e.target.style.display = "none";
                            }}
                          />
                          {renderedPreview && (
                            <div className="chat-image-caption">
                              {renderPreviewElements(
                                renderWhatsAppPreview(renderedPreview)
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="chat-bubble bot">
                        {renderedPreview ? (
                          renderPreviewElements(
                            renderWhatsAppPreview(renderedPreview)
                          )
                        ) : (
                          <span
                            style={{ color: "rgba(255,255,255,0.4)" }}
                          >
                            (response message පෙන්නන්න fields එකක් insert
                            කරන්න)
                          </span>
                        )}
                      </div>
                    )}
                  </>
                )}

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
                {/* RESPONSE TEMPLATE */}
                <div className="field">
                  <label>
                    <i className="fas fa-code" />
                    Response Template <span className="req">*</span>
                  </label>
                  <textarea
                    ref={templateRef}
                    className={`textarea ${
                      templateValidation.errors.length > 0 ? "has-error" : ""
                    }`}
                    placeholder={`Example:\n🎬 *{{results.0.title}}*\n⭐ {{results.0.rating}} | {{results.0.year}}\n🔗 {{results.0.link}}`}
                    value={cmd.responseTemplate}
                    onChange={(e) =>
                      upd({ responseTemplate: e.target.value })
                    }
                    rows={7}
                  />

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

                  {templateValidation.errors.length === 0 &&
                    templateValidation.warnings.length === 0 &&
                    cmd.responseTemplate && (
                      <div className="syntax-success">
                        <i className="fas fa-circle-check" />
                        Template syntax හරි
                      </div>
                    )}
                </div>

                {/* AVAILABLE FIELDS */}
                {cmd.apiConfig.extractedValues?.length > 0 && (
                  <div className="field">
                    <label>
                      <i className="fas fa-key" />
                      Available Fields — click to insert
                    </label>

                    <div className="fields-hint">
                      <i className="fas fa-circle-info" />
                      <div>
                        Array field එකක් (උදා: <code>{"{{results.title}}"}</code>) click කරාම expand වෙනවා. එකෙන් එකක් click කරාම template එකට insert වෙනවා.
                      </div>
                    </div>

                    <div className="fields-wrap">
                      {templateGroups.map((g, gi) => {
                        const isArray =
                          g.isArray !== undefined
                            ? g.isArray
                            : (g.items || []).length > 1;
                        const groupKey = g.key || g.base;
                        const isExpanded = !!expandedKeys[groupKey];
                        const children =
                          g.expandedKeys || g.items || [groupKey];
                        const count =
                          g.count !== undefined
                            ? g.count
                            : children.length;

                        return (
                          <div
                            key={gi}
                            className={`field-group ${
                              isExpanded ? "expanded" : ""
                            }`}
                          >
                            <div
                              className="field-group-header"
                              onClick={() => {
                                if (!isArray) {
                                  insertAtTemplate(groupKey);
                                  return;
                                }
                                setExpandedKeys((prev) => ({
                                  ...prev,
                                  [groupKey]: !prev[groupKey],
                                }));
                              }}
                            >
                              <div className="field-group-icon">
                                <i
                                  className={`fas ${
                                    isArray
                                      ? "fa-chevron-right"
                                      : "fa-copy"
                                  }`}
                                />
                              </div>
                              <div className="field-group-info">
                                <div className="field-group-name">
                                  {`{{${groupKey}}}`}
                                  {isArray && (
                                    <span className="count">{count}</span>
                                  )}
                                </div>
                                {isArray && !isExpanded && (
                                  <div className="field-group-sample">
                                    {count} variants — click to expand
                                  </div>
                                )}
                                {!isArray && g.sample && (
                                  <div className="field-group-sample">
                                    {String(g.sample).slice(0, 50)}
                                  </div>
                                )}
                              </div>
                              {!isArray && (
                                <button
                                  type="button"
                                  className="field-group-insert"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    insertAtTemplate(groupKey);
                                  }}
                                >
                                  <i className="fas fa-plus" />
                                  Insert
                                </button>
                              )}
                            </div>

                            {isArray && isExpanded && (
                              <div className="field-group-children">
                                {children.map((child, ci) => {
                                  const sampleVal =
                                    lookupSampleValue(child);

                                  return (
                                    <div
                                      key={ci}
                                      className="field-child"
                                      onClick={() =>
                                        insertAtTemplate(child)
                                      }
                                    >
                                      <div className="field-child-name">
                                        <i className="fas fa-plus" />
                                        {`{{${child}}}`}
                                      </div>
                                      {sampleVal && (
                                        <div className="field-child-sample">
                                          {sampleVal.slice(0, 40)}
                                        </div>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* SEND WITH IMAGE */}
                <div className="field">
                  <div
                    className={`toggle-row ${
                      cmd.sendWithImage ? "on" : ""
                    }`}
                    onClick={() =>
                      upd({ sendWithImage: !cmd.sendWithImage })
                    }
                  >
                    <div className="toggle-info">
                      <i className="fas fa-image" />
                      <div>
                        <div className="toggle-text">Send with Image</div>
                        <div className="toggle-sub">
                          {cmd.sendWithImage
                            ? "Image + caption එකට යවනවා"
                            : "Text only"}
                        </div>
                      </div>
                    </div>
                    <div
                      className={`switch ${
                        cmd.sendWithImage ? "on" : ""
                      }`}
                    />
                  </div>

                  {cmd.sendWithImage && (
                    <div className="image-config">
                      <div className="image-mode">
                        <button
                          type="button"
                          className={`image-mode-btn ${
                            !cmd.imageUrlKey ? "active" : ""
                          }`}
                          onClick={() =>
                            upd({ imageUrlKey: "", imageUrl: cmd.imageUrl })
                          }
                        >
                          <i className="fas fa-link" />
                          Static URL
                        </button>
                        <button
                          type="button"
                          className={`image-mode-btn ${
                            cmd.imageUrlKey ? "active" : ""
                          }`}
                          onClick={() => {
                            const firstImageGroup =
                              imageGroups[0]?.key ||
                              imageGroups[0]?.base ||
                              "";
                            if (firstImageGroup) {
                              upd({
                                imageUrlKey: firstImageGroup,
                                imageUrl: "",
                              });
                            }
                          }}
                        >
                          <i className="fas fa-code" />
                          From API Response
                        </button>
                      </div>

                      {!cmd.imageUrlKey && (
                        <div className="field" style={{ marginBottom: 10 }}>
                          <label
                            style={{
                              fontSize: "0.7rem",
                              color: "rgba(255,255,255,0.5)",
                            }}
                          >
                            <i className="fas fa-image" /> Image URL
                          </label>
                          <div className="input-icon-wrap">
                            <i className="fas fa-link" />
                            <input
                              className="input"
                              placeholder="https://example.com/image.jpg"
                              value={cmd.imageUrl}
                              onChange={(e) =>
                                upd({ imageUrl: e.target.value })
                              }
                            />
                          </div>
                        </div>
                      )}

                      {cmd.imageUrlKey !== "" && (
                        <div className="field" style={{ marginBottom: 10 }}>
                          <label
                            style={{
                              fontSize: "0.7rem",
                              color: "rgba(255,255,255,0.5)",
                            }}
                          >
                            <i className="fas fa-code" /> Image Key — click to
                            select
                          </label>

                          {imageGroups.length > 0 && (
                            <div className="fields-wrap">
                              {imageGroups.map((g, gi) => {
                                const isArray =
                                  g.isArray !== undefined
                                    ? g.isArray
                                    : (g.items || []).length > 1;
                                const groupKey = g.key || g.base;
                                const isExpanded =
                                  !!expandedImageKeys[groupKey];
                                const isSelected =
                                  cmd.imageUrlKey === groupKey;
                                const children =
                                  g.expandedKeys ||
                                  g.items ||
                                  [groupKey];
                                const count =
                                  g.count !== undefined
                                    ? g.count
                                    : children.length;

                                return (
                                  <div
                                    key={gi}
                                    className={`field-group ${
                                      isExpanded ? "expanded" : ""
                                    }`}
                                  >
                                    <div
                                      className="field-group-header"
                                      onClick={() => {
                                        if (!isArray) {
                                          upd({ imageUrlKey: groupKey });
                                          return;
                                        }
                                        setExpandedImageKeys((prev) => ({
                                          ...prev,
                                          [groupKey]: !prev[groupKey],
                                        }));
                                      }}
                                    >
                                      <div className="field-group-icon">
                                        <i
                                          className={`fas ${
                                            isArray
                                              ? "fa-chevron-right"
                                              : isSelected
                                              ? "fa-check"
                                              : "fa-image"
                                          }`}
                                        />
                                      </div>
                                      <div className="field-group-info">
                                        <div className="field-group-name">
                                          {`{{${groupKey}}}`}
                                          {isArray && (
                                            <span className="count">
                                              {count}
                                            </span>
                                          )}
                                        </div>
                                        {isArray && !isExpanded && (
                                          <div className="field-group-sample">
                                            {count} variants — click to
                                            expand
                                          </div>
                                        )}
                                        {!isArray && isSelected && (
                                          <div className="field-group-sample">
                                            ✓ Selected
                                          </div>
                                        )}
                                      </div>
                                      {!isArray && (
                                        <button
                                          type="button"
                                          className="field-group-insert"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            upd({ imageUrlKey: groupKey });
                                          }}
                                        >
                                          <i
                                            className={`fas ${
                                              isSelected
                                                ? "fa-check"
                                                : "fa-plus"
                                            }`}
                                          />
                                          {isSelected
                                            ? "Selected"
                                            : "Select"}
                                        </button>
                                      )}
                                    </div>

                                    {isArray && isExpanded && (
                                      <div className="field-group-children">
                                        {children.map((child, ci) => {
                                          const isChildSelected =
                                            cmd.imageUrlKey === child;
                                          const sampleVal =
                                            lookupSampleValue(child);

                                          return (
                                            <div
                                              key={ci}
                                              className={`field-child ${
                                                isChildSelected
                                                  ? "selected"
                                                  : ""
                                              }`}
                                              onClick={() =>
                                                upd({
                                                  imageUrlKey: child,
                                                })
                                              }
                                            >
                                              <div className="field-child-name">
                                                <i
                                                  className={`fas ${
                                                    isChildSelected
                                                      ? "fa-check"
                                                      : "fa-plus"
                                                  }`}
                                                />
                                                {`{{${child}}}`}
                                              </div>
                                              {sampleVal && (
                                                <div className="field-child-sample">
                                                  {sampleVal
                                                    .replace(
                                                      /^https?:\/\//,
                                                      ""
                                                    )
                                                    .slice(0, 30)}
                                                </div>
                                              )}
                                            </div>
                                          );
                                        })}
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          )}

                          {imageGroups.length === 0 && (
                            <div className="image-key-hint">
                              <i className="fas fa-info-circle" />
                              API test එකේ image field එකක් නෑ — Static URL
                              use කරන්න
                            </div>
                          )}
                        </div>
                      )}

                      {cmd.sendWithImage && (
                        <div className="image-preview">
                          <div className="image-preview-label">
                            <i className="fas fa-eye" /> Image Preview
                          </div>

                          {resolvedImageUrl ? (
                            <div className="image-preview-body">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={resolvedImageUrl}
                                alt="preview"
                                className="image-preview-thumb"
                                onError={(e) => {
                                  e.target.style.borderColor =
                                    "rgba(239, 68, 68, 0.5)";
                                  e.target.style.opacity = 0.5;
                                }}
                              />
                              <div className="image-preview-info">
                                <div className="image-preview-status ok">
                                  <i className="fas fa-circle-check" />
                                  Ready to send
                                </div>
                                <div className="image-preview-url">
                                  {String(resolvedImageUrl).slice(0, 100)}
                                </div>
                              </div>
                            </div>
                          ) : (
                            <div className="image-preview-status warn">
                              <i className="fas fa-triangle-exclamation" />
                              {cmd.imageUrlKey
                                ? "Key හම්බුනේ නෑ — API test කරන්න"
                                : "Image URL එකක් දාන්න"}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
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

        {/* NAV */}
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
