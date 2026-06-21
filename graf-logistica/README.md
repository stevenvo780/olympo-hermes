# Hermes Logística — software de despacho & cargue (cliente Palomino)

Capa de **logística** que el cliente hoy hace a mano en Excel (asignar pedidos a camiones,
tablero de despacho, tracking de transportadora). Es un **software nuevo y desacoplado** con
su **propia base de datos**, que se **integra a Hermes por API** (solo lectura de los pedidos
ya **enrutados/despachados** por el módulo de distribución).

> Fuera de alcance de Hermes por decisión del dueño (REQUIREMENTS I2): "la asignación final de
> pedidos a camiones específicos = capa de logística del NUEVO software, NO Hermes". Esto es
> ese software.

## Arquitectura

```
   Hermes (NestJS + su DB)                 prizma-hermes-logistica (Next.js + DB propia)
   ───────────────────────                 ────────────────────────────────────────────
   distribution/orders   ──GET (x-api-key)──►  /api/sync  ─► DispatchOrder (snapshot)
   (status=routed|dispatched)                               + Truck (flota)
                                                             + cargue / despacho / tracking
```

- **DB propia** (`hermes_logistica`, Postgres) vía **Prisma**. Nunca escribe en Hermes.
- **Sincronización idempotente**: refresca el snapshot de Hermes sin pisar el estado de
  logística (camión asignado, secuencia, cargado/despachado/entregado).
- Cada pedido queda **scopeado por `storeId`** (multi-tenant: solo las tiendas con la feature
  de distribución activa).

## Módulos / vistas

| Ruta | Qué hace |
|------|----------|
| `/` (Tablero) | KPIs del despacho + botón **Sincronizar con Hermes**. |
| `/plan` (Cargue / Despacho) | Asigna pedidos enrutados a camiones (cargue), panel de capacidad por camión, avanza el estado: pendiente → cargado → despachado → entregado. Reemplaza el Excel de cargue. |
| `/trucks` (Camiones) | CRUD de la flota (placa, capacidad kg/unidades, conductor). |
| `/carrier` (Transportadora) | Bucket aparte: registra transportadora + N° de guía y hace tracking hasta la entrega. |

## API interna (route handlers)

- `POST /api/sync` — trae `routed` + `dispatched` de Hermes y hace upsert.
- `GET/POST /api/trucks`, `PATCH/DELETE /api/trucks/:id`
- `GET /api/orders` (filtros: `carrier`, `status`, `truckId`, `routeDate`, `storeId`)
- `PATCH /api/orders/:id`, `POST /api/orders/bulk`
- `GET /api/stats`

## Correr localmente

```bash
cd prizma-hermes-logistica
cp .env.example .env        # ajusta HERMES_API_URL / HERMES_API_KEY / HERMES_STORE_IDS
npm install
npm run db:push             # crea el esquema en hermes_logistica
npm run db:seed             # flota demo (3 camiones)
npm run dev                 # http://localhost:3005
```

Requiere el backend de Hermes corriendo (con la feature de distribución activa en la tienda) y
pedidos en estado `routed`. En el Tablero, **Sincronizar con Hermes** los baja a la logística.

## Variables de entorno

Ver `.env.example`. `DATABASE_URL` (DB propia), `HERMES_API_URL`, `HERMES_API_KEY`,
`HERMES_STORE_IDS`, `DEFAULT_UNIT_WEIGHT_KG` (estimación de peso para el cargue).

> **Seguridad:** `HERMES_API_KEY` es una credencial de **servidor** — solo se usa en los route
> handlers, nunca se expone al cliente.
