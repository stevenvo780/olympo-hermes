"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { api, fmtKg } from "@/lib/api";

interface Order {
  id: number;
  grafOrderId: number;
  zone: string | null;
  customerName: string | null;
  sellerName: string | null;
  address: string | null;
  city: string | null;
  phone: string | null;
  routeDate: string | null;
  units: number;
  weightKg: number;
  status: string;
  carrierName: string | null;
  trackingNumber: string | null;
}

// Carrier-context labels for the shared status set.
const C_LABEL: Record<string, string> = {
  pending: "Por entregar a transportadora",
  loaded: "Entregado a transportadora",
  dispatched: "En tránsito",
  delivered: "Entregado al cliente",
};
const C_BADGE: Record<string, string> = {
  pending: "badge-gray", loaded: "badge-violet", dispatched: "badge-amber", delivered: "badge-green",
};
const C_NEXT: Record<string, { to: string; label: string } | null> = {
  pending: { to: "loaded", label: "Entregar a transportadora" },
  loaded: { to: "dispatched", label: "Marcar en tránsito" },
  dispatched: { to: "delivered", label: "Marcar entregado" },
  delivered: null,
};

export default function CarrierPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [drafts, setDrafts] = useState<Record<number, { carrierName: string; trackingNumber: string }>>({});

  const load = useCallback(async () => {
    const o = await api<Order[]>("/api/orders?carrier=true");
    setOrders(o);
    const d: Record<number, { carrierName: string; trackingNumber: string }> = {};
    o.forEach((x) => (d[x.id] = { carrierName: x.carrierName ?? "", trackingNumber: x.trackingNumber ?? "" }));
    setDrafts(d);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const saveTracking = async (o: Order) => {
    const d = drafts[o.id];
    await api(`/api/orders/${o.id}`, {
      method: "PATCH",
      body: JSON.stringify({ carrierName: d.carrierName, trackingNumber: d.trackingNumber }),
    });
    await load();
  };

  const advance = async (o: Order, to: string) => {
    await api(`/api/orders/${o.id}`, { method: "PATCH", body: JSON.stringify({ status: to }) });
    await load();
  };

  return (
    <>
      <div className="page-head">
        <div>
          <h1 className="page-title">Transportadora</h1>
          <p className="page-sub">
            Pedidos por transportadora (bucket aparte, se recogen un solo día). Registra la
            transportadora, el número de guía y haz el seguimiento hasta la entrega.
          </p>
        </div>
      </div>

      <div className="banner banner-info">
        Estos pedidos vienen de zonas marcadas como <b>transportadora</b> en Graf. Dirección y teléfono
        son obligatorios (validados en Graf al crear el pedido), por eso aquí siempre llegan completos.
      </div>

      {loading ? (
        <div className="empty">Cargando…</div>
      ) : orders.length === 0 ? (
        <div className="empty">
          No hay pedidos de transportadora. Sincroniza desde el <Link className="btn-ghost" href="/">Tablero</Link>.
        </div>
      ) : (
        <table className="table">
          <thead>
            <tr>
              <th>Pedido</th><th>Cliente / Destino</th><th>Teléfono</th><th>Carga</th>
              <th>Transportadora / Guía</th><th>Estado</th><th>Acción</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((o) => {
              const d = drafts[o.id] ?? { carrierName: "", trackingNumber: "" };
              const dirty = d.carrierName !== (o.carrierName ?? "") || d.trackingNumber !== (o.trackingNumber ?? "");
              const next = C_NEXT[o.status];
              return (
                <tr key={o.id}>
                  <td><b>#{o.grafOrderId}</b><br /><span className="muted">{o.zone}</span></td>
                  <td>{o.customerName}<br /><span className="muted">{o.address}{o.city ? `, ${o.city}` : ""}</span></td>
                  <td>{o.phone || <span className="muted">—</span>}</td>
                  <td>{o.units} u<br /><span className="muted">{fmtKg(o.weightKg)}</span></td>
                  <td style={{ minWidth: 210 }}>
                    <div className="grid" style={{ gap: 6 }}>
                      <input placeholder="Transportadora" value={d.carrierName}
                        onChange={(e) => setDrafts({ ...drafts, [o.id]: { ...d, carrierName: e.target.value } })} />
                      <input placeholder="N° de guía" value={d.trackingNumber}
                        onChange={(e) => setDrafts({ ...drafts, [o.id]: { ...d, trackingNumber: e.target.value } })} />
                      {dirty && <button className="btn btn-sm btn-primary" onClick={() => saveTracking(o)}>Guardar guía</button>}
                    </div>
                  </td>
                  <td><span className={`badge ${C_BADGE[o.status]}`}>{C_LABEL[o.status]}</span></td>
                  <td>
                    {next ? (
                      <button className="btn btn-sm btn-primary" onClick={() => advance(o, next.to)}>{next.label}</button>
                    ) : (
                      <span className="muted">✓ completo</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </>
  );
}
