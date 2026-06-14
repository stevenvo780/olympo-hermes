import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const STATUSES = ["pending", "loaded", "dispatched", "delivered"];

// PATCH /api/orders/:id — assign truck, change status, set sequence, carrier info.
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const data: Record<string, unknown> = {};

  if (body.truckId !== undefined) {
    data.truckId = body.truckId === null ? null : Number(body.truckId);
  }
  if (body.sequence !== undefined) data.sequence = Number(body.sequence) || 0;
  if (body.carrierName !== undefined) data.carrierName = body.carrierName?.trim() || null;
  if (body.trackingNumber !== undefined)
    data.trackingNumber = body.trackingNumber?.trim() || null;

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
    if (status === "pending") {
      // reset logistics state
      data.loadedAt = null;
      data.dispatchedAt = null;
      data.deliveredAt = null;
    }
  }

  try {
    const order = await prisma.dispatchOrder.update({
      where: { id: Number(id) },
      data,
      include: { truck: { select: { id: true, plate: true, name: true } } },
    });
    return NextResponse.json(order);
  } catch {
    return NextResponse.json({ error: "No se pudo actualizar" }, { status: 400 });
  }
}
