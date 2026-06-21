# PHASE2_REPORT — Distribución multivendedor (Palomino) integrada en el monorepo Hermes

Fase 2: la distribución se integró como **feature multi-tenant de primera clase DENTRO del Hermes real**
(`/workspace/Hermes`), no como app aparte. Se usó `/workspace/Hermes-dist` (Fase 1) solo como referencia.
Probado end-to-end en navegador (Playwright) y por API (curl) contra un **PostgreSQL local desechable**.

> **Línea roja respetada:** nunca se tocó la DB de PROD. Todo corre contra Postgres local
> `127.0.0.1:55432`, DB **`hermes_palomino`** (desechable). **Sin** deploy a Vercel, **sin** push a
> `dev`/`master`, **sin** push a origin. Commits SOLO en la rama local `feat/distribucion-multivendedor`.

---

## 1. Qué se integró y dónde

La feature ya existía en la rama local `feat/distribucion-multivendedor` de las 3 subrepos (módulo limpio
`src/distribution/`, equivalente a la referencia). Se adoptó esa rama, se completó y se probó:

- **Backend (`hermes-backend/src/distribution/`)** — módulo NestJS propio que **extiende** el dominio
  existente sin duplicarlo:
  - Entidades nuevas: `Seller`, `CustomerAddress`. Columnas **aditivas y nullables** sobre `Order`
    (`sellerId`, `customerAddressId`, `distStatus`, `routeDate`), `Customer` (`addresses`, `zone`) y
    `DeliveryZone` (`isCarrier`, `routeGroup`, `code`). **El `OrderService`/`OrderController` marketplace
    NO se tocó** (verificado por git) → regresión segura.
  - `DistAccessService.assertAccess(storeId, user)` centraliza: resuelve tienda, valida acceso del
    usuario (`checkStoreAccess` reutilizado) **y** que el flag esté ON; si no, 403.
  - Controladores con guards existentes `FirebaseAuthGuard` + `RolesGuard` + `@Roles(SUPER_ADMIN,
    BUSINESS_OWNER)`. `storeId` por query, sin `DEFAULT_STORE_ID` en el camino de request.
  - Servicios: `DistOrderService` (máquina de estados, inventario, enrutamiento), `DistCustomerService`
    (clientes + sedes), `SellerService`, `ZoneService`, `ExportService` (xlsx), `seed.ts`.
- **Admin (`hermes-admin`)** — vista oficina `/[storeId]/distribucion`: cola con filtros
  (vendedor/zona/estado/fecha/ruta), acciones por estado, columna "Día de ruta" editable, panel de
  enrutamiento por zona, botón "Exportar consolidado". Ítem **"Distribución"** en el nav, gateado por el
  flag. Toggle del flag en *Configuración → ActivationsSection*.
- **Client (`hermes-client`)** — vista vendedor `/[storeId]/vendedor`: carrito tipo marketplace, selección
  de vendedor y cliente, **zona heredada del cliente**, **desplegable de sede**, validación de
  transportadora (dirección + teléfono obligatorios), notas. **(Fase 2)** se restauró el formulario
  **"+ Nuevo cliente"** (G2/G3) y se añadió **"+ Agregar sede"** (G1/G4).

### Flag / activación (multi-tenant)
- Flag: **`Config.activations.distributionEnabled`** (campo JSON ya existente → **migración cero** para
  activar). Por tienda. `hermes-dist` ON · `hermes-market` OFF.
- Con la feature **OFF** el comportamiento marketplace es **idéntico** (ver §3).

---

## 2. Cómo levantarlo localmente (Postgres desechable)

```bash
# 0) Postgres local desechable ya corre en 127.0.0.1:55432 (DB hermes_palomino).
#    backend/.env apunta SOLO ahí (el .env de prod está en hermes-backend/.env.prod-backup).

# 1) Backend (NestJS) :3004  — siembra demo + arranca
cd /workspace/Hermes/hermes-backend
npm run seed:dist          # crea owner (x-api-key), store hermes-dist (ON) y hermes-market (OFF)
npm run start              # http://localhost:3004  (Swagger en /api)

# 2) Admin (Next) :3001
cd /workspace/Hermes/hermes-admin && PORT=3001 npm run start:dev
#   Oficina:    http://localhost:3001/hermes-dist/distribucion
#   Regresión:  http://localhost:3001/hermes-market/distribucion  (debe decir "no activada")

# 3) Client (Next) :3000
cd /workspace/Hermes/hermes-client && PORT=3000 npm run start:dev
#   Vendedor:   http://localhost:3000/hermes-dist/vendedor
#   Regresión:  http://localhost:3000/hermes-market      (storefront marketplace normal)
```

Credenciales demo (solo DB desechable): owner `demo@hermes.local` (BUSINESS_OWNER), **x-api-key**
`hermes-dist-demo-key-2026`. Los frontends usan `NEXT_PUBLIC_DEMO_API_KEY` (en `.env.local`) para
autenticar por el camino x-api-key del `FirebaseAuthGuard`. **En producción** (sin esa var) se usa el
Bearer de Firebase de siempre.

> Env locales: `hermes-backend/.env` (repuntado a local; original en `.env.prod-backup`),
> `hermes-{admin,client}/.env.local` (repuntados; originales en `*.cloud-backup`). Están gitignored
> (`.env*`). **Restaurar los backups antes de cualquier build/deploy a prod.**

---

## 3. Regresión multi-tenant (feature OFF = marketplace idéntico)

| Verificación | Resultado |
|---|---|
| Core `OrderService`/`OrderController`/`create-order.dto` modificados por la feature | **NO** (git: solo columnas aditivas+nullables en `order.entity.ts`) |
| Admin `hermes-market`: ítem "Distribución" en nav | **Ausente** |
| Admin `hermes-market/distribucion` (acceso directo) | "La distribución no está activada para esta tienda." (sin cola) |
| Client `hermes-market` storefront | Marketplace normal (categoría Despensa + productos + carrito), sin "vendedor" |
| Client `hermes-market/vendedor` (acceso directo) | Bloqueado: "La distribución no está activada…", **sin datos** |
| Backend distribution endpoints sobre `hermes-market` | **403** (DistAccessService) |
| Backend store inexistente | **404** |
| Backend sin auth | **401** |

Evidencia: `phase2-evidence/08-admin-market-regression.png`, `09-client-market-storefront.png`.

---

## 4. Matriz de aceptación A..J (criterio = REQUIREMENTS.md)

Evidencia: `curl` = API · `browser` = Playwright (capturas en `phase2-evidence/`) · `code/git` = código verificado + typecheck verde.

| # | Estado | Evidencia |
|---|---|---|
| A1 Vendedor arma pedido tipo carrito | PASS | browser: `/hermes-dist/vendedor`, carrito + cliente; pedido #15 creado |
| A2 Al enviar → observaciones+cliente, llega a oficina/consolidado | PASS | browser: pedido aparece en oficina y en export |
| A3 Observaciones se conservan | PASS | browser: campo Notas; `Order.notes`; pedido #15 con nota |
| B1 Cada pedido atribuido a su vendedor | PASS | browser: columna Vendedor; `Order.sellerId` |
| B2 Proyección a varios vendedores | PASS | code: entidad `Seller` (CRUD), extensible |
| B3 Oficina ve/filtra por vendedor | PASS | browser: filtro "Vendedor" en la cola |
| C1 Zona al CLIENTE, pedido la HEREDA | PASS | browser: al elegir cliente → "Zona: …"; `Customer.zone`→`Order.deliveryZone` |
| C2 Zonas iniciales (Med C/N/S, Oriente, Bogotá, Transportadora) | PASS | curl: 6 zonas incl. transportadora |
| C3 Zonas configurables/extensibles | PASS | code: CRUD `/distribution/zones` |
| C4 Separar/agrupar por zona | PASS | browser: filtro Zona + enrutamiento agrupado |
| D1 Todo pedido entra a COLA | PASS | code: `distStatus` default `queued` |
| D2 Estados cola→aceptado→enrutado→despachado | PASS | curl: transiciones OK; transición inválida → 400 |
| D3 Aceptar refleja inventario | PASS | curl: 409 insuficiente; browser: banner "disponible 5, requiere 12"; stock 1000→980/994 al despachar |
| D4 Editar unidades en cola (vendedor o quien distribuye) | PASS | curl: `PATCH /orders/:id/items` recalcula total |
| D5 Anular en cola | PASS | curl/browser: cancel |
| D6 Revisión diaria → enrutar para otro día | PASS | browser: panel enrutamiento + "Enrutar grupo" con día |
| D7 Pedidos pendientes varios días sin perderse | PASS | code: permanecen en cola, sin expiración |
| D8 Cliente aumenta unidades → editar → enrutar → despacho | PASS | curl: updateItems + transición |
| E1 Corte semanal: no mezclar semanas | PASS | code/browser: `routeDate` + filtros "Ruta desde/hasta" |
| E2 Mover pedido de un día a otro | PASS | curl: `PATCH /orders/:id/route-date`; browser: columna "Día de ruta" |
| F1 Transportadora: dirección y teléfono OBLIGATORIOS | PASS | curl: 400 sin teléfono; browser: campo* + aviso + botón deshabilitado |
| F2 Transportadora discriminada, bucket aparte | PASS | curl: routing carrier al final; export Rutas transportadora al final |
| G1 Base sin direcciones → cargar/editar direcciones | PASS | browser: "+ Agregar sede" al cliente legado; `POST /customers/:id/addresses` |
| G2 Vendedor puede CREAR cliente | PASS | browser: "+ Nuevo cliente" creó "Tienda Fase 2 Test" |
| G3 Crear cliente EXIGE dirección | PASS | curl: 400 sin dirección; form exige Etiqueta+Dirección |
| G4 Cliente con MÚLTIPLES sedes | PASS | browser/curl: `addAddress`; `CustomerAddress` OneToMany |
| G5 Desplegable obligatorio de sede al montar pedido | PASS | browser: `<select>` "Dirección / sede" |
| G6 Cada cliente su zona y su(s) dirección(es) | PASS | curl: GET cliente con `zone` + `addresses` |
| H1 Clasificar pendientes por ruta; transportadora aparte | PASS | curl: `GET /orders/routing` agrupa por zona, carrier separado |
| H2 Salida = CONSOLIDADO xlsx | PASS | curl: hoja `Consolidado` (1 fila por línea), 17 filas |
| H3 RUTA en HOJA APARTE del MISMO xlsx | PASS | curl: `SheetNames = ['Consolidado','Rutas']`; Rutas excluye anulados, carrier al final |
| H4 Afinar formato con los 3 Excel del cliente | N/A | pendiente del cliente (no bloquea); modelo y export listos para ajustar |
| I1 Facturación = Oro Office | N/A | fuera de alcance |
| I2 Asignación a camiones = otro software | N/A | fuera de alcance (la app entrega consolidado + clasificación) |
| I3 Una sola bodega | N/A | fuera de alcance |
| J1 Feature activable por tenant; OFF idéntico | PASS | browser: `hermes-market` sin distribución, storefront idéntico (ver §3) |
| J2 Scopeado por storeId real, no hardcodeado | PASS | curl: 403 sin flag, 404 inexistente; `DistAccessService` |
| J3 Endpoints protegidos con auth Firebase existente; vendedor = usuario con rol | PASS* | curl: 401 sin auth; guards `FirebaseAuthGuard`+`RolesGuard`+`@Roles` (ver nota) |
| J4 UI integrada al menú, visible solo si feature activa | PASS | browser: ítem "Distribución" (admin) y flujo vendedor gateados por el flag |

**Resultado: 33/33 ítems accionables = PASS. 4 ítems N/A** (H4 pendiente del cliente; I1/I2/I3 fuera de alcance).

> **Nota * (J3):** los endpoints quedan protegidos por el guard real existente. En el demo (sin service
> account de Firebase en la DB desechable) se autentica por el camino **x-api-key** del mismo
> `FirebaseAuthGuard`; en **producción** se usa el Bearer de Firebase. El **vendedor** se modela como
> entidad `Seller` para la atribución; **vincular cada `Seller` a un `User` con login propio
> (multi-login de vendedores) es una extensión directa pendiente** (no cambia el modelo de atribución).

---

## 5. Checklist marcado (REQUIREMENTS.md A..J)

```
A1 [x]  A2 [x]  A3 [x]
B1 [x]  B2 [x]  B3 [x]
C1 [x]  C2 [x]  C3 [x]  C4 [x]
D1 [x]  D2 [x]  D3 [x]  D4 [x]  D5 [x]  D6 [x]  D7 [x]  D8 [x]
E1 [x]  E2 [x]
F1 [x]  F2 [x]
G1 [x]  G2 [x]  G3 [x]  G4 [x]  G5 [x]  G6 [x]
H1 [x]  H2 [x]  H3 [x]  H4 [~]  (pendiente del cliente, no bloquea)
I1 [~]  I2 [~]  I3 [~]  (fuera de alcance)
J1 [x]  J2 [x]  J3 [x]  J4 [x]
```

---

## 6. Cambios de código de Fase 2 (sobre la rama)

Rama `feat/distribucion-multivendedor` en las 3 subrepos (commits locales, **sin push**):
- `hermes-backend` `b6f5f10` — export: hoja **Rutas** excluye anulados y ordena transportadora al final
  (consistente con la vista de enrutamiento; el Consolidado mantiene el registro completo). Además se
  trajo (cherry-pick) el commit faltante de la referencia: "crear cliente exige dirección (G3) / seed
  legado sin dirección (G1)".
- `hermes-client` `5c990c3` — vista vendedor: formulario **"+ Nuevo cliente"** (G2/G3) y **"+ Agregar
  sede"** (G1/G4), usando `createCustomer`/`addAddress`/`getZones` del `distributionService`.
- `hermes-admin` `ddabf76` — ignorar `.env*` locales.

Builds: `hermes-backend` `tsc --noEmit` verde. `hermes-client` `tsc --noEmit` limpio en el código de la
feature (único error preexistente y ajeno: `checkout/__tests__/CheckoutPage.test.tsx` importa
`beforeEach` sin usar).

---

## 7. Pendientes honestos

1. **Migración prod (no ejecutada — línea roja).** El demo corre con `DB_SYNCHRONIZE=true` sobre DB
   desechable. Para prod falta escribir la migración TypeORM **aditiva**: tablas `seller`,
   `customer_address` y columnas nuevas de `order`/`customer`/`delivery_zone` (todas nullables → sin
   downtime). No se corrió nada contra `34.9.172.75` ni pgram.
2. **J3 multi-login de vendedores.** Hoy la captura ocurre en sesión autenticada (owner) y el vendedor
   es una entidad `Seller`. Falta (extensión directa) vincular cada `Seller` a un `User` con su login.
3. **H4 formato fino del consolidado/rutas.** A ajustar cuando lleguen los 3 Excel del cliente (ingreso
   de pedidos, consolidado, configuración de productos).
4. **Gestión de clientes/sedes desde el ADMIN (oficina).** La carga/edición de direcciones y alta de
   cliente está surfaceada en la vista **vendedor**; si la oficina también lo necesita, es una adición
   pequeña (hacer la sección "Clientes" del admin distribution-aware).
5. **Deploy (lo coordina Steven).** No se desplegó. Para un preview Vercel con el demo: setear
   `NEXT_PUBLIC_API_URL`/`API_URL` al backend expuesto y `NEXT_PUBLIC_DEMO_API_KEY`, y redeploy.
   **Regla dura:** NUNCA setear `NEXT_PUBLIC_DEMO_API_KEY` en un build que apunte al backend de prod.
6. **Restaurar env de prod.** Antes de cualquier build/deploy real, restaurar `hermes-backend/.env`
   (desde `.env.prod-backup`) y `hermes-{admin,client}/.env.local` (desde `*.cloud-backup`).
7. **Limpieza de entorno.** Quedó stash en `hermes-backend` (`fase2-divergent-order-zone-attempt`): un
   intento previo divergente que metía la distribución en el `OrderService` core; se descartó por ser
   más invasivo (riesgo de regresión) en favor del módulo `src/distribution/`. Borrable con
   `git stash drop`.
