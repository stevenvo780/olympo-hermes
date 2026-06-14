import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const STATUSES = ["pending", "loaded", "dispatched", "delivered"];

// POST /api/orders/bulk — assign many orders to a truck and/or move their status.
// body: { ids: number[], truckId?: number|null, status?: string }
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const ids: number[] = Array.isArray(body.ids) ? body.ids.map(Number) : [];
  if (!ids.length) {
    return NextResponse.json({ error: "ids requerido" }, { status: 400 });
  }
  if (ids.length > 500) {
    return NextResponse.json(
      { error: "Demasiados pedidos en una sola operación (máx. 500)" },
      { status: 400 },
    );
  }
  const data: Record<string, unknown> = {};
  if (body.truckId !== undefined) {
    data.truckId = body.truckId === null ? null : Number(body.truckId);
  }
  if (body.status !== undefined) {
    const status = String(body.status);
    if (!STATUSES.includes(status)) {
      return NextResponse.json({ error: "Estado inválido" }, { status: 400 });
    }
    data.status = status;
    const now = new Date();
    if (status === "loaded") data.loadedAt = now;
    if (status === "dispatched") data.dispatchedAt = now;
    if (status === "delivered") data.deliveredAt = now;
  }
  // Assigning a truck implies the order is at least "loaded".
  if (data.truckId && body.status === undefined) {
    data.status = "loaded";
    data.loadedAt = new Date();
  }

  const res = await prisma.dispatchOrder.updateMany({
    where: { id: { in: ids } },
    data,
  });
  return NextResponse.json({ updated: res.count });
}
