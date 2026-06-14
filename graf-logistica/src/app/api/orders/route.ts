import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// GET /api/orders — list dispatch orders with optional filters.
//   ?carrier=true|false  ?status=pending|loaded|dispatched|delivered
//   ?truckId=#  ?routeDate=YYYY-MM-DD  ?storeId=...
export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const where: Record<string, unknown> = {};
  if (sp.has("carrier")) where.isCarrier = sp.get("carrier") === "true";
  if (sp.has("status")) where.status = sp.get("status");
  if (sp.has("truckId")) where.truckId = Number(sp.get("truckId"));
  if (sp.has("routeDate")) where.routeDate = sp.get("routeDate");
  if (sp.has("storeId")) where.storeId = sp.get("storeId");

  const orders = await prisma.dispatchOrder.findMany({
    where,
    orderBy: [{ routeDate: "asc" }, { zone: "asc" }, { sequence: "asc" }, { id: "asc" }],
    include: { truck: { select: { id: true, plate: true, name: true } } },
  });
  return NextResponse.json(orders);
}
