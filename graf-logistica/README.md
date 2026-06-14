# Graf Logística — software de despacho & cargue (cliente Palomino)

Capa de **logística** que el cliente hoy hace a mano en Excel (asignar pedidos a camiones,
tablero de despacho, tracking de transportadora). Es un **software nuevo y desacoplado** con
su **propia base de datos**, que se **integra a Graf por API** (solo lectura de los pedidos
ya **enrutados/despachados** por el módulo de distribución).

> Fuera de alcance de Graf por decisión del dueño (REQUIREMENTS I2): "la asignación final de
> pedidos a camiones específicos = capa de logística del NUEVO software, NO Graf". Esto es ese
> software.

## Arquitectura

```
   Graf (NestJS + su DB)                 graf-logistica (Next.js + DB propia)
   ─────────────────────                 ────────────────────────────────────
   distribution/orders   ──GET (x-api-key)──►  /api/sync  ─► DispatchOrder (snapshot)
   (status=routed|dispatched)                               + Truck (flota)
                                                            + cargue / despacho / tracking
```

- **DB propia** (`graf_logistica`, Postgres) vía **Prisma**. Nunca escribe en Graf.
- **Sincronización idempotente**: refresca el snapshot de Graf sin pisar el estado de
  logística (camión asignado, secuencia, cargado/despachado/entregado).
- Cada pedido queda **scopeado por `storeId`** (multi-tenant: solo las tiendas con la feature
  de distribución activa).

## Módulos / vistas

| Ruta | Qué hace |
|------|----------|
| `/` (Tablero) | KPIs del despacho + botón **Sincronizar con Graf**. |
| `/plan` (Cargue / Despacho) | Asigna pedidos enrutados a camiones (cargue), panel de capacidad por camión, avanza el estado: pendiente → cargado → despachado → entregado. Reemplaza el Excel de cargue. |
| `/trucks` (Camiones) | CRUD de la flota (placa, capacidad kg/unidades, conductor). |
| `/carrier` (Transportadora) | Bucket aparte: registra transportadora + N° de guía y hace tracking hasta la entrega. |

## API interna (route handlers)

- `POST /api/sync` — trae `routed` + `dispatched` de Graf y hace upsert.
- `GET/POST /api/trucks`, `PATCH/DELETE /api/trucks/:id`
- `GET /api/orders` (filtros: `carrier`, `status`, `truckId`, `routeDate`, `storeId`)
- `PATCH /api/orders/:id`, `POST /api/orders/bulk`
- `GET /api/stats`

## Correr localmente

```bash
cd graf-logistica
cp .env.example .env        # ajusta GRAF_API_URL / GRAF_API_KEY / GRAF_STORE_IDS
npm install
npm run db:push             # crea el esquema en graf_logistica
npm run db:seed             # flota demo (3 camiones)
npm run dev                 # http://localhost:3005
```

Requiere el backend de Graf corriendo (con la feature de distribución activa en la tienda) y
pedidos en estado `routed`. En el Tablero, **Sincronizar con Graf** los baja a la logística.

## Variables de entorno

Ver `.env.example`. `DATABASE_URL` (DB propia), `GRAF_API_URL`, `GRAF_API_KEY`,
`GRAF_STORE_IDS`, `DEFAULT_UNIT_WEIGHT_KG` (estimación de peso para el cargue).

> **Seguridad:** `GRAF_API_KEY` es una credencial de **servidor** — solo se usa en los route
> handlers, nunca se expone al cliente.
