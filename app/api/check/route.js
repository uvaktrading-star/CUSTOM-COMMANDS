import { NextResponse } from "next/server";
import mongoose from "mongoose";

/* ======================================================
   🔌 MongoDB Connection (cached for serverless)
   ====================================================== */
const MONGODB_URI =
  process.env.MAIN_MONGODB_URI ||
  "mongodb+srv://zanta-user-settings:Akashkavindu12345@zanta-user-settings.gl5fqgn.mongodb.net/zanta-user-settings?retryWrites=true&w=majority&appName=zanta-user-settings";

let cached = global._mongooseCache;
if (!cached) {
  cached = global._mongooseCache = { conn: null, promise: null };
}

async function connectDB() {
  if (cached.conn) return cached.conn;

  if (!cached.promise) {
    cached.promise = mongoose
      .connect(MONGODB_URI, {
        bufferCommands: false,
        serverSelectionTimeoutMS: 8000,
      })
      .then((m) => m);
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    throw e;
  }

  return cached.conn;
}

/* ======================================================
   📄 Settings Schema
   ====================================================== */
const SettingsSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true },
    password: { type: String, default: "not_set" },
    botName: { type: String, default: null },
    ownerName: { type: String, default: null },
    prefix: { type: String, default: "." },
    workType: { type: String, default: "public" },
    botImage: { type: String, default: "null" },
    paymentStatus: { type: String, default: "free" },
  },
  { strict: false, timestamps: true, collection: "settings" }
);

const Settings =
  mongoose.models.Settings || mongoose.model("Settings", SettingsSchema);

function cleanNumber(n) {
  return String(n || "").replace(/\D/g, "");
}

export async function POST(req) {
  try {
    /* ---------- Parse body ---------- */
    let body;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { success: false, paid: false, error: "Invalid JSON body" },
        { status: 400 }
      );
    }

    const id = cleanNumber(body?.id);
    const password = String(body?.password || "").trim();

    if (!id || !password) {
      return NextResponse.json(
        { success: false, paid: false, error: "ID and password required" },
        { status: 400 }
      );
    }

    /* ---------- Connect DB ---------- */
    await connectDB();

    /* ---------- Find user ---------- */
    const user = await Settings.findOne({ id }).lean();

    if (!user) {
      return NextResponse.json(
        { success: false, paid: false, error: "User not found" },
        { status: 404 }
      );
    }

    /* ---------- Check password ---------- */
    if (String(user.password || "") !== password) {
      return NextResponse.json(
        { success: false, paid: false, error: "Invalid password" },
        { status: 401 }
      );
    }
    const status = String(user.paymentStatus || "free").toLowerCase();

    const PAID_STATUSES = ["paid", "premium", "pro", "active"];

    const isPaid = PAID_STATUSES.includes(status);

    if (!isPaid) {
      return NextResponse.json(
        {
          success: false,
          paid: false,
          error:
            "🚫 Access Denied — මේ dashboard එක paid users ලට විතරයි. Please upgrade your plan.",
          paymentStatus: status,
        },
        { status: 403 }
      );
    }

    /* ---------- Success ---------- */
    // password එක client එකට යවන්නේ නෑ
    const { password: _pw, __v, _id, ...safeSettings } = user;

    return NextResponse.json({
      success: true,
      paid: true,
      paymentStatus: status,
      settings: safeSettings,
    });
  } catch (err) {
    console.error("[/api/check] error:", err);
    return NextResponse.json(
      {
        success: false,
        paid: false,
        error: "Server error. Please try again.",
      },
      { status: 500 }
    );
  }
}

/* ======================================================
   🧪 GET /api/check — health check
   ====================================================== */
export async function GET() {
  return NextResponse.json({
    ok: true,
    endpoint: "/api/check",
    method: "POST",
    body: { id: "947xxxxxxxx", password: "your_password" },
  });
}
