import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// GET /api/stats — dashboard counters.
export async function GET() {
  const [byStatus, carriers, trucks, totals] = await Promise.all([
    prisma.dispatchOrder.groupBy({
      by: ["status"],
      _count: { _all: true },
      _sum: { units: true, weightKg: true },
    }),
    prisma.dispatchOrder.count({ where: { isCarrier: true } }),
    prisma.truck.count({ where: { active: true } }),
    prisma.dispatchOrder.aggregate({
      _count: { _all: true },
      _sum: { units: true, weightKg: true, totalAmount: true },
    }),
  ]);

  const status: Record<string, { count: number; units: number; kg: number }> = {};
  for (const row of byStatus) {
    status[row.status] = {
      count: row._count._all,
      units: row._sum.units ?? 0,
      kg: Math.round((row._sum.weightKg ?? 0) * 100) / 100,
    };
  }

  return NextResponse.json({
    totalOrders: totals._count._all,
    totalUnits: totals._sum.units ?? 0,
    totalKg: Math.round((totals._sum.weightKg ?? 0) * 100) / 100,
    totalAmount: totals._sum.totalAmount ?? 0,
    carriers,
    activeTrucks: trucks,
    status,
  });
}
