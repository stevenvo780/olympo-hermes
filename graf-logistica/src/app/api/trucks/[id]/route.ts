import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// PATCH /api/trucks/:id — update a truck.
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const data: Record<string, unknown> = {};
  if (body.plate !== undefined) data.plate = String(body.plate).trim();
  if (body.name !== undefined) data.name = String(body.name).trim();
  if (body.capacityKg !== undefined) data.capacityKg = Number(body.capacityKg) || 0;
  if (body.capacityUnits !== undefined) data.capacityUnits = Number(body.capacityUnits) || 0;
  if (body.driverName !== undefined) data.driverName = body.driverName?.trim() || null;
  if (body.driverPhone !== undefined) data.driverPhone = body.driverPhone?.trim() || null;
  if (body.active !== undefined) data.active = Boolean(body.active);
  try {
    const truck = await prisma.truck.update({ where: { id: Number(id) }, data });
    return NextResponse.json(truck);
  } catch {
    return NextResponse.json({ error: "No se pudo actualizar" }, { status: 400 });
  }
}

// DELETE /api/trucks/:id — only if it has no orders loaded on it.
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const count = await prisma.dispatchOrder.count({
    where: { truckId: Number(id) },
  });
  if (count > 0) {
    return NextResponse.json(
      { error: "El camión tiene pedidos asignados; reasígnalos primero" },
      { status: 409 },
    );
  }
  await prisma.truck.delete({ where: { id: Number(id) } });
  return NextResponse.json({ ok: true });
}
