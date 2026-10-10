import { NextResponse } from "next/server";

/* ======================================================
   1. FLATTEN — nested → dotted keys (for preview/debug)
   ====================================================== */
function flatten(obj, prefix = "", out = []) {
  if (obj === null || obj === undefined) {
    out.push({ key: prefix || "value", value: null, type: "null" });
    return out;
  }

  if (typeof obj !== "object") {
    out.push({ key: prefix || "value", value: obj, type: typeof obj });
    return out;
  }

  if (Array.isArray(obj)) {
    if (obj.length === 0) {
      out.push({ key: prefix || "value", value: [], type: "array" });
      return out;
    }
    obj.forEach((item, i) => {
      flatten(item, prefix ? `${prefix}.${i}` : String(i), out);
    });
    return out;
  }

  const entries = Object.entries(obj);
  if (entries.length === 0) {
    out.push({ key: prefix || "value", value: {}, type: "object" });
    return out;
  }

  for (const [k, v] of entries) {
    flatten(v, prefix ? `${prefix}.${k}` : k, out);
  }
  return out;
}

/* ======================================================
   2. TEMPLATE KEYS — dedupe array indexes + expand info
   
   Returns:
   [
     { key: "status", sample: true, type: "boolean", isArray: false },
     { key: "count", sample: 10, type: "number", isArray: false },
     {
       key: "results.title",
       sample: "Spider-Man...",
       type: "string",
       isArray: true,
       arrayPath: "results",
       count: 10,
       expandedKeys: ["results.0.title", ..., "results.9.title"]
     },
     ...
   ]
   ====================================================== */
function toTemplateKeys(values) {
  const map = new Map();

  for (const v of values) {
    if (!["string", "number", "boolean"].includes(v.type)) continue;

    const templateKey = v.key.replace(/\.\d+(?=\.|$)/g, "");
    const hasIndex = /\.\d+(?=\.|$)/.test(v.key);

    if (!map.has(templateKey)) {
      let arrayPath = null;
      if (hasIndex) {
        const arrayMatch = v.key.match(/^(.+?)\.\d+(?=\.|$)/);
        arrayPath = arrayMatch ? arrayMatch[1] : null;
      }

      map.set(templateKey, {
        key: templateKey,
        sample: v.value,
        type: v.type,
        isArray: hasIndex,
        arrayPath: arrayPath || "",
        count: hasIndex ? 1 : 0,
        expandedKeys: hasIndex ? [v.key] : [],
      });
    } else {
      const entry = map.get(templateKey);
      if (hasIndex) {
        entry.count = (entry.count || 0) + 1;
        entry.expandedKeys.push(v.key);
      }
    }
  }

  return Array.from(map.values());
}

/* ======================================================
   3. SUMMARIZE ARRAYS
   ====================================================== */
function summarizeArrays(data) {
  const summary = [];

  function walk(obj, path = "") {
    if (!obj || typeof obj !== "object") return;

    if (Array.isArray(obj)) {
      if (obj.length > 0 && typeof obj[0] === "object" && obj[0] !== null) {
        summary.push({
          path: path || "root",
          count: obj.length,
          fields: Object.keys(obj[0]),
        });
      }
      obj.forEach((item, i) => walk(item, path ? `${path}.${i}` : String(i)));
      return;
    }

    for (const [k, v] of Object.entries(obj)) {
      walk(v, path ? `${path}.${k}` : k);
    }
  }

  walk(data);
  return summary;
}

/* ======================================================
   4. NORMALIZE QUERY
   ====================================================== */
function normalizeQueries(queries = []) {
  if (!Array.isArray(queries)) return [];

  return queries
    .map((q) => {
      if (!q) return null;

      const key = q.key ?? q.name ?? q.param ?? "";
      const value =
        q.defaultValue ??
        q.value ??
        q.default ??
        q.val ??
        "";

      if (!key) return null;

      return {
        key: String(key).trim(),
        defaultValue: value === null || value === undefined ? "" : String(value),
      };
    })
    .filter(Boolean);
}

/* ======================================================
   5. BUILD REQUEST
   ====================================================== */
function buildRequest(method, url, queries = []) {
  const target = new URL(url);
  const bodyObj = {};

  for (const q of queries) {
    if (!q.key) continue;

    if (method === "GET") {
      target.searchParams.set(q.key, q.defaultValue);
    } else {
      bodyObj[q.key] = q.defaultValue;
    }
  }

  const opts = {
    method,
    headers: {
      Accept: "application/json, text/plain, */*",
      "User-Agent": "WhatsAppBot-CommandManager/1.0",
    },
    signal: AbortSignal.timeout(20000),
  };

  if (method === "POST") {
    opts.headers["Content-Type"] = "application/json";
    opts.body = JSON.stringify(bodyObj);
  }

  return { url: target.toString(), opts, bodyObj };
}

/* ======================================================
   6. POST /api/api-validator
   ====================================================== */
export async function POST(req) {
  try {
    let body;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { ok: false, error: "Invalid JSON body" },
        { status: 400 }
      );
    }

    const { method = "GET", url } = body || {};
    const queries = normalizeQueries(body?.queries);

    if (!url) {
      return NextResponse.json(
        { ok: false, error: "url is required" },
        { status: 400 }
      );
    }

    const upperMethod = String(method).toUpperCase();
    if (!["GET", "POST"].includes(upperMethod)) {
      return NextResponse.json(
        { ok: false, error: "method must be GET or POST" },
        { status: 400 }
      );
    }

    try {
      const u = new URL(url);
      if (!["http:", "https:"].includes(u.protocol)) {
        throw new Error("Only http/https allowed");
      }
    } catch (e) {
      return NextResponse.json(
        { ok: false, error: `Invalid URL: ${e.message}` },
        { status: 400 }
      );
    }

    /* ---------- send request ---------- */
    const { url: finalUrl, opts, bodyObj } = buildRequest(
      upperMethod,
      url,
      queries
    );

    let apiRes;
    try {
      apiRes = await fetch(finalUrl, opts);
    } catch (e) {
      const msg =
        e.name === "TimeoutError" || e.name === "AbortError"
          ? "Request timed out after 20s"
          : e.message;
      return NextResponse.json(
        {
          ok: false,
          error: `Request failed: ${msg}`,
          requestInfo: {
            method: upperMethod,
            finalUrl,
            body: upperMethod === "POST" ? bodyObj : undefined,
          },
        },
        { status: 200 }
      );
    }

    /* ---------- parse ---------- */
    const contentType = apiRes.headers.get("content-type") || "";
    const raw = await apiRes.text();

    let data;
    let isJSON = false;

    try {
      data = JSON.parse(raw);
      isJSON = true;
    } catch {
      data = raw;
    }

    /* ---------- non-2xx ---------- */
    if (!apiRes.ok) {
      return NextResponse.json({
        ok: false,
        status: apiRes.status,
        statusText: apiRes.statusText,
        error: `API returned HTTP ${apiRes.status}`,
        contentType,
        isJSON,
        data,
        values: isJSON ? flatten(data) : [],
        requestInfo: {
          method: upperMethod,
          finalUrl,
          body: upperMethod === "POST" ? bodyObj : undefined,
        },
      });
    }

    /* ---------- flatten + dedupe ---------- */
    const values = isJSON ? flatten(data) : [];

    const usableValues = values.filter((v) =>
      ["string", "number", "boolean"].includes(v.type)
    );

    const templateKeys = toTemplateKeys(values);
    const arrays = isJSON ? summarizeArrays(data) : [];

    // 🔥 extractedValues — base keys විතරයි (DB එකට save කරන්න)
    const extractedValues = templateKeys.map((t) => t.key);

    // 🔥 templateGroups — frontend එකට ready-made groups (expand info සමඟ)
    const templateGroups = templateKeys.map((t) => ({
      key: t.key,
      sample: t.sample,
      type: t.type,
      isArray: !!t.isArray,
      arrayPath: t.arrayPath || "",
      count: t.count || 0,
      expandedKeys: t.expandedKeys || [],
    }));

    return NextResponse.json({
      ok: true,
      status: apiRes.status,
      statusText: apiRes.statusText,
      contentType,
      isJSON,

      requestInfo: {
        method: upperMethod,
        finalUrl,
        body: upperMethod === "POST" ? bodyObj : undefined,
      },

      data,
      values,
      usableValues,
      templateKeys,
      templateGroups, // 🔥 NEW
      arrays,
      extractedValues,
    });
  } catch (err) {
    console.error("api-validator error:", err);
    return NextResponse.json(
      { ok: false, error: err.message || "Server error" },
      { status: 500 }
    );
  }
}

/* ======================================================
   7. GET — health check
   ====================================================== */
export async function GET() {
  return NextResponse.json({
    ok: true,
    message: "api-validator is running. Use POST with { method, url, queries }.",
  });
}
