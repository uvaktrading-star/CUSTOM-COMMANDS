import { NextResponse } from "next/server";
import { getSettingsModel } from "@/lib/db";

function cleanNumber(n) {
  return String(n || "").replace(/\D/g, "");
}

export async function POST(req) {
  try {
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

    /* 🔥 Settings Model — Cluster 1 එකෙන් */
    const Settings = await getSettingsModel();

    const user = await Settings.findOne({ id }).lean();

    if (!user) {
      return NextResponse.json(
        { success: false, paid: false, error: "User not found" },
        { status: 404 }
      );
    }

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

export async function GET() {
  return NextResponse.json({
    ok: true,
    endpoint: "/api/check",
    method: "POST",
    body: { id: "947xxxxxxxx", password: "your_password" },
  });
}
