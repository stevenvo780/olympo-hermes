import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { AUTH_COOKIE, appPassword, sessionToken } from "@/lib/auth";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const MAX_AGE = 60 * 60 * 12; // 12h

// --- Simple in-memory brute-force throttle (per IP). Enough for a single
// internal office tool; for multi-instance use a shared store (Upstash, etc.). ---
const WINDOW_MS = 5 * 60 * 1000;
const MAX_FAILS = 8;
const attempts = new Map<string, { fails: number; resetAt: number }>();

function clientIp(req: NextRequest): string {
  const fwd = req.headers.get("x-forwarded-for");
  return (fwd ? fwd.split(",")[0].trim() : null) || "unknown";
}

function throttled(ip: string): boolean {
  const now = Date.now();
  const rec = attempts.get(ip);
  if (rec && now < rec.resetAt) return rec.fails >= MAX_FAILS;
  return false;
}

function recordFail(ip: string): void {
  const now = Date.now();
  const rec = attempts.get(ip);
  if (!rec || now >= rec.resetAt) {
    attempts.set(ip, { fails: 1, resetAt: now + WINDOW_MS });
  } else {
    rec.fails += 1;
  }
}

function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ab.length !== bb.length) return false;
  return crypto.timingSafeEqual(ab, bb);
}

// POST /api/auth — exchange the office password for a session cookie.
export async function POST(req: NextRequest) {
  const expected = appPassword();
  const token = sessionToken();
  if (!expected || !token) {
    // Fail closed: secrets not configured -> nobody can authenticate.
    return NextResponse.json(
      { error: "Login no configurado (faltan LOGISTICA_APP_PASSWORD / LOGISTICA_AUTH_TOKEN)" },
      { status: 503 },
    );
  }

  const ip = clientIp(req);
  if (throttled(ip)) {
    return NextResponse.json(
      { error: "Demasiados intentos. Espera unos minutos." },
      { status: 429 },
    );
  }

  const body = await req.json().catch(() => ({}));
  const password = String(body.password ?? "");
  if (!password || !safeEqual(password, expected)) {
    recordFail(ip);
    return NextResponse.json({ error: "Contraseña incorrecta" }, { status: 401 });
  }

  attempts.delete(ip);
  const res = NextResponse.json({ ok: true });
  res.cookies.set(AUTH_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: MAX_AGE,
  });
  return res;
}

// DELETE /api/auth — logout.
export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(AUTH_COOKIE, "", { httpOnly: true, path: "/", maxAge: 0 });
  return res;
}
