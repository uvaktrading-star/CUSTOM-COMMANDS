import { NextResponse } from "next/server";
import { connectDB, Command } from "@/lib/db";

const MAX_COMMANDS = 5;

/* ======================================================
   Auth helper — login API එකෙන් එවන token/number එක verify
   ====================================================== */
function getUserIdFromRequest(req) {
  // 1) Authorization: Bearer <number> — simplest
  const auth = req.headers.get("authorization") || "";
  if (auth.startsWith("Bearer ")) {
    const id = auth.slice(7).trim();
    if (/^\d{8,15}$/.test(id)) return id;
  }

  // 2) x-user-id header
  const headerId = req.headers.get("x-user-id");
  if (headerId && /^\d{8,15}$/.test(headerId)) return headerId;

  return null;
}

/* ======================================================
   Validation
   ====================================================== */
function validateCommand(body) {
  const errors = [];

  if (!body?.command || typeof body.command !== "string") {
    errors.push("command is required");
  }

  if (!["simple", "API"].includes(body?.type)) {
    errors.push('type must be "simple" or "API"');
  }

  if (body?.type === "simple") {
    const ct = body?.textConfig?.contentType;
    if (!["text", "audio", "video"].includes(ct)) {
      errors.push("textConfig.contentType must be text/audio/video");
    }
    if (!body?.textConfig?.contentValue) {
      errors.push("textConfig.contentValue is required");
    }
  }

  if (body?.type === "API") {
    const ac = body?.apiConfig || {};
    if (!["GET", "POST"].includes(ac.method)) {
      errors.push("apiConfig.method must be GET or POST");
    }
    if (!ac.url) {
      errors.push("apiConfig.url is required");
    }
    try {
      new URL(ac.url);
    } catch {
      errors.push("apiConfig.url is not a valid URL");
    }
    if (!body?.responseTemplate) {
      errors.push("responseTemplate is required for API commands");
    }

    // 🔥 Image validation
    if (body?.sendWithImage) {
      const hasKey = !!(body?.imageUrlKey && body.imageUrlKey.trim());
      const hasUrl = !!(body?.imageUrl && body.imageUrl.trim());
      if (!hasKey && !hasUrl) {
        errors.push(
          "sendWithImage is on — imageUrl හෝ imageUrlKey එකක් අවශ්‍යයි"
        );
      }
    }
  }

  return errors;
}

/* ======================================================
   Normalize incoming payload → DB shape
   ====================================================== */
function normalizePayload(body, userId) {
  const command = String(body.command).trim().toLowerCase();

  const aliases = Array.isArray(body.aliase)
    ? body.aliase.map((a) => String(a).trim().toLowerCase()).filter(Boolean)
    : typeof body.aliase === "string"
    ? body.aliase
        .split(",")
        .map((a) => a.trim().toLowerCase())
        .filter(Boolean)
    : [];

  const base = {
    _id: userId,
    command,
    aliase: aliases,
    desc: body.desc || "",
    react: body.react || "",
    type: body.type,
    isActive: body.isActive !== false,
  };

  if (body.type === "simple") {
    base.textConfig = {
      contentType: body.textConfig?.contentType || "text",
      contentValue: body.textConfig?.contentValue || "",
      fileName: body.textConfig?.fileName || "",
    };
    base.apiConfig = {
      method: "GET",
      url: "",
      hasQuery: false,
      queries: [],
      extractedValues: [],
    };
    base.responseTemplate = "";

    // 🔥 Reset image fields for simple
    base.sendWithImage = false;
    base.imageUrl = "";
    base.imageUrlKey = "";
  } else {
    base.textConfig = {
      contentType: "text",
      contentValue: "",
      fileName: "",
    };
    base.apiConfig = {
      method: body.apiConfig?.method || "GET",
      url: body.apiConfig?.url || "",
      hasQuery: !!body.apiConfig?.hasQuery,
      queries: Array.isArray(body.apiConfig?.queries)
        ? body.apiConfig.queries
            .filter((q) => q && q.key)
            .map((q) => ({
              key: String(q.key).trim(),
              defaultValue: String(q.defaultValue ?? q.value ?? "").trim(),
            }))
        : [],
      extractedValues: Array.isArray(body.apiConfig?.extractedValues)
        ? body.apiConfig.extractedValues.map((v) => String(v))
        : [],
    };
    base.responseTemplate = body.responseTemplate || "";

    // 🔥 NEW: Image fields
    base.sendWithImage = !!body.sendWithImage;
    base.imageUrl = body.imageUrl ? String(body.imageUrl).trim() : "";
    base.imageUrlKey = body.imageUrlKey
      ? String(body.imageUrlKey).trim()
      : "";
  }

  return base;
}

/* ======================================================
   GET — list all commands for logged-in user
   ====================================================== */
export async function GET(req) {
  try {
    const userId = getUserIdFromRequest(req);
    if (!userId) {
      return NextResponse.json(
        { ok: false, error: "Unauthorized — missing user id" },
        { status: 401 }
      );
    }

    await connectDB();

    const commands = await Command.find({ _id: userId })
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({
      ok: true,
      userId,
      count: commands.length,
      maxCommands: MAX_COMMANDS,
      commands,
    });
  } catch (err) {
    console.error("add-cmd GET error:", err);
    return NextResponse.json(
      { ok: false, error: err.message || "Server error" },
      { status: 500 }
    );
  }
}

/* ======================================================
   POST — create or update a command
   ====================================================== */
export async function POST(req) {
  try {
    const userId = getUserIdFromRequest(req);
    if (!userId) {
      return NextResponse.json(
        { ok: false, error: "Unauthorized — missing user id" },
        { status: 401 }
      );
    }

    let body;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { ok: false, error: "Invalid JSON body" },
        { status: 400 }
      );
    }

    /* ---------- validate ---------- */
    const errors = validateCommand(body);
    if (errors.length > 0) {
      return NextResponse.json(
        { ok: false, error: errors.join(", ") },
        { status: 400 }
      );
    }

    await connectDB();

    /* ---------- normalize ---------- */
    const payload = normalizePayload(body, userId);

    /* ---------- check if update or create ---------- */
    const existing = await Command.findOne({
      _id: userId,
      command: payload.command,
    });

    if (existing) {
      /* ---------- UPDATE ---------- */
      Object.assign(existing, payload);
      await existing.save();

      return NextResponse.json({
        ok: true,
        action: "updated",
        command: existing,
      });
    }

    /* ---------- CREATE — 1. Max limit check ---------- */
    const existingCount = await Command.countDocuments({ _id: userId });
    if (existingCount >= MAX_COMMANDS) {
      return NextResponse.json(
        {
          ok: false,
          error: `ඔයාට උපරිම commands ${MAX_COMMANDS}ක් විතරයි හදන්න පුළුවන්. දැනටමත් ${existingCount}ක් තියෙනවා.`,
        },
        { status: 400 }
      );
    }

    /* ---------- CREATE — 2. Alias conflict check ---------- */
    const aliases = payload.aliase || [];
    if (aliases.length > 0) {
      const aliasConflict = await Command.findOne({
        _id: userId,
        $or: [
          { command: { $in: aliases } },
          { aliase: { $in: aliases } },
        ],
      });

      if (aliasConflict) {
        return NextResponse.json(
          {
            ok: false,
            error: `Alias conflict — ".${aliasConflict.command}" command එකට අයිතියි`,
          },
          { status: 409 }
        );
      }
    }

    /* ---------- CREATE — 3. Create ---------- */
    const created = await Command.create(payload);

    return NextResponse.json({
      ok: true,
      action: "created",
      command: created,
    });
  } catch (err) {
    console.error("add-cmd POST error:", err);

    // duplicate key (race condition)
    if (err.code === 11000) {
      return NextResponse.json(
        { ok: false, error: "Command already exists" },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { ok: false, error: err.message || "Server error" },
      { status: 500 }
    );
  }
}

/* ======================================================
   DELETE — delete one command
   query: /api/add-cmd?command=hello
   ====================================================== */
export async function DELETE(req) {
  try {
    const userId = getUserIdFromRequest(req);
    if (!userId) {
      return NextResponse.json(
        { ok: false, error: "Unauthorized — missing user id" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const command = (searchParams.get("command") || "").trim().toLowerCase();

    if (!command) {
      return NextResponse.json(
        { ok: false, error: "command query param is required" },
        { status: 400 }
      );
    }

    await connectDB();

    const deleted = await Command.findOneAndDelete({
      _id: userId,
      command,
    });

    if (!deleted) {
      return NextResponse.json(
        { ok: false, error: "Command not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ ok: true, deleted });
  } catch (err) {
    console.error("add-cmd DELETE error:", err);
    return NextResponse.json(
      { ok: false, error: err.message || "Server error" },
      { status: 500 }
    );
  }
}
