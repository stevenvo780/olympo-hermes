"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import Link from "next/link";
import { api, fmtKg } from "@/lib/api";

interface Truck {
  id: number;
  plate: string;
  name: string;
  capacityKg: number;
  capacityUnits: number;
  active: boolean;
  loadedOrders: number;
  loadedUnits: number;
  loadedKg: number;
}
interface Order {
  id: number;
  grafOrderId: number;
  storeId: string;
  zone: string | null;
  routeGroup: string | null;
  isCarrier: boolean;
  customerName: string | null;
  sellerName: string | null;
  address: string | null;
  city: string | null;
  phone: string | null;
  routeDate: string | null;
  units: number;
  weightKg: number;
  status: string;
  truckId: number | null;
  truck: { id: number; plate: string; name: string } | null;
}

const NEXT_STATUS: Record<string, { to: string; label: string; cls: string } | null> = {
  pending: { to: "loaded", label: "Marcar cargado", cls: "btn-primary" },
  loaded: { to: "dispatched", label: "Despachar", cls: "btn-amber" },
  dispatched: { to: "delivered", label: "Entregado", cls: "btn-green" },
  delivered: null,
};
const STATUS_BADGE: Record<string, string> = {
  pending: "badge-gray", loaded: "badge-blue", dispatched: "badge-amber", delivered: "badge-green",
};
const STATUS_LABEL: Record<string, string> = {
  pending: "Pendiente", loaded: "Cargado", dispatched: "Despachado", delivered: "Entregado",
};

export default function PlanPage() {
  const [trucks, setTrucks] = useState<Truck[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [routeDate, setRouteDate] = useState<string>("");
  const [sel, setSel] = useState<Set<number>>(new Set());
  const [bulkTruck, setBulkTruck] = useState<string>("");

  const load = useCallback(async () => {
    setErr(null);
    try {
      const [t, o] = await Promise.all([
        api<Truck[]>("/api/trucks"),
        api<Order[]>("/api/orders?carrier=false"),
      ]);
      setTrucks(t);
      setOrders(o);
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const routeDates = useMemo(
    () => Array.from(new Set(orders.map((o) => o.routeDate).filter(Boolean))).sort() as string[],
    [orders],
  );

  const visible = useMemo(
    () => orders.filter((o) => !routeDate || o.routeDate === routeDate),
    [orders, routeDate],
  );

  // group by zone
  const groups = useMemo(() => {
    const m = new Map<string, Order[]>();
    for (const o of visible) {
      const k = o.zone ?? "Sin zona";
      if (!m.has(k)) m.set(k, []);
      m.get(k)!.push(o);
    }
    return Array.from(m.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  }, [visible]);

  const assignTruck = async (orderId: number, truckId: string) => {
    await api(`/api/orders/${orderId}`, {
      method: "PATCH",
      body: JSON.stringify({
        truckId: truckId ? Number(truckId) : null,
        ...(truckId ? { status: "loaded" } : { status: "pending" }),
      }),
    });
    await load();
  };

  const setStatus = async (orderId: number, status: string) => {
    await api(`/api/orders/${orderId}`, { method: "PATCH", body: JSON.stringify({ status }) });
    await load();
  };

  const toggleSel = (id: number) => {
    const next = new Set(sel);
    next.has(id) ? next.delete(id) : next.add(id);
    setSel(next);
  };

  const bulkAssign = async () => {
    if (!sel.size || !bulkTruck) return;
    await api("/api/orders/bulk", {
      method: "POST",
      body: JSON.stringify({ ids: [...sel], truckId: Number(bulkTruck) }),
    });
    setSel(new Set());
    setBulkTruck("");
    await load();
  };

  const activeTrucks = trucks.filter((t) => t.active);

  return (
    <>
      <div className="page-head">
        <div>
          <h1 className="page-title">Cargue / Despacho</h1>
          <p className="page-sub">
            Asigna los pedidos enrutados a camiones (cargue), y avanza el despacho hasta la entrega.
            Esto reemplaza el Excel manual de cargue.
          </p>
        </div>
      </div>

      {err && <div className="banner banner-err">{err}</div>}

      {/* Truck capacity panel */}
      <div className="cards" style={{ marginBottom: 20 }}>
        {activeTrucks.length === 0 && (
          <div className="card">
            <b>No hay camiones activos.</b>
            <p className="muted" style={{ margin: "6px 0 0" }}>
              <Link className="btn-ghost" href="/trucks">Agregar camión →</Link>
            </p>
          </div>
        )}
        {activeTrucks.map((t) => {
          const pct = t.capacityKg ? Math.min(100, (t.loadedKg / t.capacityKg) * 100) : 0;
          const over = t.capacityKg > 0 && t.loadedKg > t.capacityKg;
          return (
            <div className="card" key={t.id}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <b>{t.name}</b><span className="muted">{t.plate}</span>
              </div>
              <div className="muted" style={{ fontSize: 12, marginTop: 4 }}>
                {t.loadedOrders} ped · {t.loadedUnits} u · {fmtKg(t.loadedKg)}
                {t.capacityKg ? ` / ${fmtKg(t.capacityKg)}` : ""}
              </div>
              {t.capacityKg > 0 && (
                <div className={`capbar ${over ? "over" : ""}`}><span style={{ width: `${pct}%` }} /></div>
              )}
              {over && <div className="muted" style={{ color: "var(--red)", fontSize: 11, marginTop: 4 }}>Sobre capacidad</div>}
            </div>
          );
        })}
      </div>

      {/* Toolbar */}
      <div className="toolbar">
        <div className="field" style={{ minWidth: 200 }}>
          <label>Día de ruta</label>
          <select value={routeDate} onChange={(e) => setRouteDate(e.target.value)}>
            <option value="">Todos los días</option>
            {routeDates.map((d) => <option key={d} value={d}>{d}</option>)}
          </select>
        </div>
        {sel.size > 0 && (
          <div className="inline" style={{ marginLeft: "auto" }}>
            <span className="badge badge-blue">{sel.size} seleccionados</span>
            <select value={bulkTruck} onChange={(e) => setBulkTruck(e.target.value)} style={{ width: 180 }}>
              <option value="">Asignar a camión…</option>
              {activeTrucks.map((t) => <option key={t.id} value={t.id}>{t.name} ({t.plate})</option>)}
            </select>
            <button className="btn btn-primary btn-sm" onClick={bulkAssign} disabled={!bulkTruck}>Cargar</button>
            <button className="btn btn-sm" onClick={() => setSel(new Set())}>Limpiar</button>
          </div>
        )}
      </div>

      {loading ? (
        <div className="empty">Cargando…</div>
      ) : visible.length === 0 ? (
        <div className="empty">
          No hay pedidos enrutados en logística. Ve al <Link className="btn-ghost" href="/">Tablero</Link> y
          presiona <b>Sincronizar con Graf</b>.
        </div>
      ) : (
        groups.map(([zone, list]) => {
          const units = list.reduce((s, o) => s + o.units, 0);
          const kg = list.reduce((s, o) => s + o.weightKg, 0);
          return (
            <div className="zone-group" key={zone}>
              <div className="zone-head">
                <div className="zone-title">{zone} <span className="muted">· {list.length} pedidos</span></div>
                <div className="muted">{units} u · {fmtKg(Math.round(kg * 100) / 100)}{list[0]?.routeGroup ? ` · ${list[0].routeGroup}` : ""}</div>
              </div>
              <table className="table" style={{ border: "none", borderRadius: 0 }}>
                <thead>
                  <tr>
                    <th style={{ width: 30 }}></th>
                    <th>Pedido</th><th>Cliente / Dirección</th><th>Vendedor</th>
                    <th>Carga</th><th>Camión</th><th>Estado</th><th>Acción</th>
                  </tr>
                </thead>
                <tbody>
                  {list.map((o) => (
                    <tr key={o.id}>
                      <td>
                        {o.status === "pending" && (
                          <input type="checkbox" style={{ width: "auto" }} checked={sel.has(o.id)} onChange={() => toggleSel(o.id)} />
                        )}
                      </td>
                      <td><b>#{o.grafOrderId}</b><br /><span className="muted">{o.routeDate ?? ""}</span></td>
                      <td>{o.customerName}<br /><span className="muted">{o.address}{o.city ? `, ${o.city}` : ""}</span></td>
                      <td>{o.sellerName ?? <span className="muted">—</span>}</td>
                      <td>{o.units} u<br /><span className="muted">{fmtKg(o.weightKg)}</span></td>
                      <td>
                        <select value={o.truckId ?? ""} onChange={(e) => assignTruck(o.id, e.target.value)} style={{ minWidth: 130 }} disabled={o.status === "delivered"}>
                          <option value="">— sin asignar —</option>
                          {activeTrucks.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                        </select>
                      </td>
                      <td><span className={`badge ${STATUS_BADGE[o.status]}`}>{STATUS_LABEL[o.status]}</span></td>
                      <td>
                        <div className="row-actions">
                          {NEXT_STATUS[o.status] && (
                            <button
                              className={`btn btn-sm ${NEXT_STATUS[o.status]!.cls}`}
                              onClick={() => setStatus(o.id, NEXT_STATUS[o.status]!.to)}
                              disabled={o.status === "pending" && !o.truckId}
                              title={o.status === "pending" && !o.truckId ? "Asigna un camión primero" : ""}
                            >
                              {NEXT_STATUS[o.status]!.label}
                            </button>
                          )}
                          {o.status !== "pending" && o.status !== "delivered" && (
                            <button className="btn btn-sm" onClick={() => setStatus(o.id, "pending")}>Revertir</button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
        })
      )}
    </>
  );
}
