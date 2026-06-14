"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { api, fmtMoney, fmtKg } from "@/lib/api";

interface Stats {
  totalOrders: number;
  totalUnits: number;
  totalKg: number;
  totalAmount: number;
  carriers: number;
  activeTrucks: number;
  status: Record<string, { count: number; units: number; kg: number }>;
}

interface SyncResult {
  store: string;
  fetched: number;
  created: number;
  updated: number;
  carriers: number;
  error?: string;
}

const STATUS_LABEL: Record<string, string> = {
  pending: "Pendientes (sin cargar)",
  loaded: "Cargados",
  dispatched: "Despachados",
  delivered: "Entregados",
};
const STATUS_BADGE: Record<string, string> = {
  pending: "badge-gray",
  loaded: "badge-blue",
  dispatched: "badge-amber",
  delivered: "badge-green",
};

export default function Dashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [msg, setMsg] = useState<{ kind: string; text: string } | null>(null);

  const load = useCallback(async () => {
    try {
      setStats(await api<Stats>("/api/stats"));
    } catch (e) {
      setMsg({ kind: "err", text: (e as Error).message });
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const sync = async () => {
    setSyncing(true);
    setMsg(null);
    try {
      const res = await api<{ ok: boolean; results: SyncResult[] }>("/api/sync", {
        method: "POST",
      });
      const r = res.results;
      const created = r.reduce((s, x) => s + x.created, 0);
      const updated = r.reduce((s, x) => s + x.updated, 0);
      const err = r.find((x) => x.error);
      if (err) {
        setMsg({ kind: "err", text: `Sincronización con error: ${err.error}` });
      } else {
        setMsg({
          kind: "ok",
          text: `Sincronizado con Graf: ${created} nuevos, ${updated} actualizados.`,
        });
      }
      await load();
    } catch (e) {
      setMsg({ kind: "err", text: (e as Error).message });
    } finally {
      setSyncing(false);
    }
  };

  return (
    <>
      <div className="page-head">
        <div>
          <h1 className="page-title">Tablero de despacho</h1>
          <p className="page-sub">
            Pedidos <b>enrutados</b> traídos de Graf, listos para cargar y despachar.
          </p>
        </div>
        <button className="btn btn-primary" onClick={sync} disabled={syncing}>
          {syncing ? <span className="spinner" /> : "⟳"} Sincronizar con Graf
        </button>
      </div>

      {msg && (
        <div className={`banner banner-${msg.kind === "err" ? "err" : "ok"}`}>
          {msg.text}
        </div>
      )}

      {!stats ? (
        <div className="empty">Cargando…</div>
      ) : (
        <>
          <div className="cards" style={{ marginBottom: 24 }}>
            <div className="card stat">
              <div className="stat-label">Pedidos en logística</div>
              <div className="stat-value">{stats.totalOrders}</div>
              <div className="stat-sub">{stats.totalUnits} unidades · {fmtKg(stats.totalKg)}</div>
            </div>
            <div className="card stat">
              <div className="stat-label">Valor consolidado</div>
              <div className="stat-value" style={{ fontSize: 20 }}>{fmtMoney(stats.totalAmount)}</div>
              <div className="stat-sub">suma de pedidos</div>
            </div>
            <div className="card stat">
              <div className="stat-label">Camiones activos</div>
              <div className="stat-value">{stats.activeTrucks}</div>
              <div className="stat-sub"><Link className="btn-ghost" href="/trucks">Gestionar →</Link></div>
            </div>
            <div className="card stat">
              <div className="stat-label">Transportadora</div>
              <div className="stat-value">{stats.carriers}</div>
              <div className="stat-sub"><Link className="btn-ghost" href="/carrier">Tracking →</Link></div>
            </div>
          </div>

          <div className="card">
            <h3 style={{ marginTop: 0 }}>Estado del despacho</h3>
            <table className="table">
              <thead>
                <tr><th>Estado</th><th>Pedidos</th><th>Unidades</th><th>Peso</th></tr>
              </thead>
              <tbody>
                {["pending", "loaded", "dispatched", "delivered"].map((s) => {
                  const row = stats.status[s] ?? { count: 0, units: 0, kg: 0 };
                  return (
                    <tr key={s}>
                      <td><span className={`badge ${STATUS_BADGE[s]}`}>{STATUS_LABEL[s]}</span></td>
                      <td>{row.count}</td>
                      <td>{row.units}</td>
                      <td>{fmtKg(row.kg)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <p className="muted" style={{ marginBottom: 0 }}>
              Ve a <Link className="btn-ghost" href="/plan">Cargue / Despacho</Link> para
              asignar pedidos a camiones y mover el despacho.
            </p>
          </div>
        </>
      )}
    </>
  );
}
