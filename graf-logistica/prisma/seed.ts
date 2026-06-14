import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Demo fleet so the dispatch board is usable out of the box.
const TRUCKS = [
  { plate: "WGT123", name: "Camión 1 — Medellín", capacityKg: 3500, capacityUnits: 600, driverName: "José Gómez", driverPhone: "+57 300 111 2233" },
  { plate: "KLM456", name: "Camión 2 — Oriente/Norte", capacityKg: 2500, capacityUnits: 400, driverName: "Marta Ríos", driverPhone: "+57 301 444 5566" },
  { plate: "NPR789", name: "Furgón 3 — Centro", capacityKg: 1800, capacityUnits: 300, driverName: "Andrés Loaiza", driverPhone: "+57 302 777 8899" },
];

async function main() {
  for (const t of TRUCKS) {
    await prisma.truck.upsert({
      where: { plate: t.plate },
      update: t,
      create: t,
    });
  }
  const count = await prisma.truck.count();
  console.log(`Seed OK — ${count} camiones en la flota.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
