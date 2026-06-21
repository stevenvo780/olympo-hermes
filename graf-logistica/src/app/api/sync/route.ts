import { NextResponse } from "next/server";
import { syncAll } from "@/lib/sync";

export const dynamic = "force-dynamic";

// POST /api/sync — pull routed/dispatched orders from Hermes into the logistics DB.
export async function POST() {
  const results = await syncAll();
  const ok = results.every((r) => !r.error);
  return NextResponse.json({ ok, results }, { status: ok ? 200 : 502 });
}
