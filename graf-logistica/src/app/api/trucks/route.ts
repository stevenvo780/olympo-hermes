import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// GET /api/trucks — list trucks with current load summary.
export async function GET() {
  const trucks = await prisma.truck.findMany({
    orderBy: { createdAt: "asc" },
    include: {
      dispatchOrders: {
        where: { status: { in: ["loaded", "dispatched"] } },
        select: { units: true, weightKg: true },
      },
    },
  });
  const data = trucks.map((t) => {
    const loadedUnits = t.dispatchOrders.reduce((s, o) => s + o.units, 0);
    const loadedKg = t.dispatchOrders.reduce((s, o) => s + o.weightKg, 0);
    const { dispatchOrders, ...rest } = t;
    void dispatchOrders;
    return {
      ...rest,
      loadedOrders: t.dispatchOrders.length,
      loadedUnits,
      loadedKg: Math.round(loadedKg * 100) / 100,
    };
  });
  return NextResponse.json(data);
}

// POST /api/trucks — create a truck.
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const plate = String(body.plate ?? "").trim();
  const name = String(body.name ?? "").trim();
  if (!plate || !name) {
    return NextResponse.json(
      { error: "Placa y nombre son obligatorios" },
      { status: 400 },
    );
  }
  try {
    const truck = await prisma.truck.create({
      data: {
        plate,
        name,
        capacityKg: Number(body.capacityKg ?? 0) || 0,
        capacityUnits: Number(body.capacityUnits ?? 0) || 0,
        driverName: body.driverName?.trim() || null,
        driverPhone: body.driverPhone?.trim() || null,
        active: body.active !== false,
      },
    });
    return NextResponse.json(truck, { status: 201 });
  } catch (e) {
    const msg = e instanceof Error && e.message.includes("Unique")
      ? "Ya existe un camión con esa placa"
      : "No se pudo crear el camión";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
