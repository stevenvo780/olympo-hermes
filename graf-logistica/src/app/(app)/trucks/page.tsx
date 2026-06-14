"use client";

import { useEffect, useState, useCallback } from "react";
import { api, fmtKg } from "@/lib/api";

interface Truck {
  id: number;
  plate: string;
  name: string;
  capacityKg: number;
  capacityUnits: number;
  driverName: string | null;
  driverPhone: string | null;
  active: boolean;
  loadedOrders: number;
  loadedUnits: number;
  loadedKg: number;
}

const EMPTY = {
  plate: "",
  name: "",
  capacityKg: "",
  capacityUnits: "",
  driverName: "",
  driverPhone: "",
};

export default function TrucksPage() {
  const [trucks, setTrucks] = useState<Truck[]>([]);
  const [form, setForm] = useState({ ...EMPTY });
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setTrucks(await api<Truck[]>("/api/trucks"));
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    try {
      await api("/api/trucks", { method: "POST", body: JSON.stringify(form) });
      setForm({ ...EMPTY });
      await load();
    } catch (e) {
      setErr((e as Error).message);
    }
  };

  const toggle = async (t: Truck) => {
    await api(`/api/trucks/${t.id}`, {
      method: "PATCH",
      body: JSON.stringify({ active: !t.active }),
    });
    await load();
  };

  const remove = async (t: Truck) => {
    setErr(null);
    try {
      await api(`/api/trucks/${t.id}`, { method: "DELETE" });
      await load();
    } catch (e) {
      setErr((e as Error).message);
    }
  };

  return (
    <>
      <div className="page-head">
        <div>
          <h1 className="page-title">Camiones</h1>
          <p className="page-sub">Flota de la bodega para el cargue y reparto.</p>
        </div>
      </div>

      {err && <div className="banner banner-err">{err}</div>}

      <div className="card" style={{ marginBottom: 22 }}>
        <h3 style={{ marginTop: 0 }}>Nuevo camión</h3>
        <form onSubmit={create}>
          <div className="form-row">
            <div className="field">
              <label>Placa *</label>
              <input value={form.plate} onChange={(e) => setForm({ ...form, plate: e.target.value })} placeholder="ABC123" />
            </div>
            <div className="field">
              <label>Nombre / alias *</label>
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Camión 1" />
            </div>
            <div className="field">
              <label>Capacidad (kg)</label>
              <input type="number" value={form.capacityKg} onChange={(e) => setForm({ ...form, capacityKg: e.target.value })} placeholder="3000" />
            </div>
            <div className="field">
              <label>Capacidad (unidades)</label>
              <input type="number" value={form.capacityUnits} onChange={(e) => setForm({ ...form, capacityUnits: e.target.value })} placeholder="500" />
            </div>
            <div className="field">
              <label>Conductor</label>
              <input value={form.driverName} onChange={(e) => setForm({ ...form, driverName: e.target.value })} />
            </div>
            <div className="field">
              <label>Teléfono conductor</label>
              <input value={form.driverPhone} onChange={(e) => setForm({ ...form, driverPhone: e.target.value })} />
            </div>
          </div>
          <div style={{ marginTop: 14 }}>
            <button className="btn btn-primary" type="submit">Agregar camión</button>
          </div>
        </form>
      </div>

      {loading ? (
        <div className="empty">Cargando…</div>
      ) : trucks.length === 0 ? (
        <div className="empty">Aún no hay camiones. Agrega el primero arriba.</div>
      ) : (
        <table className="table">
          <thead>
            <tr>
              <th>Placa</th><th>Nombre</th><th>Conductor</th>
              <th>Capacidad</th><th>Carga actual</th><th>Estado</th><th></th>
            </tr>
          </thead>
          <tbody>
            {trucks.map((t) => {
              const pct = t.capacityKg ? Math.min(100, (t.loadedKg / t.capacityKg) * 100) : 0;
              const over = t.capacityKg > 0 && t.loadedKg > t.capacityKg;
              return (
                <tr key={t.id}>
                  <td><b>{t.plate}</b></td>
                  <td>{t.name}</td>
                  <td>{t.driverName || <span className="muted">—</span>}<br /><span className="muted">{t.driverPhone || ""}</span></td>
                  <td>{t.capacityKg ? fmtKg(t.capacityKg) : "—"}{t.capacityUnits ? ` · ${t.capacityUnits} u` : ""}</td>
                  <td style={{ minWidth: 140 }}>
                    {t.loadedOrders} ped · {t.loadedUnits} u · {fmtKg(t.loadedKg)}
                    {t.capacityKg > 0 && (
                      <div className={`capbar ${over ? "over" : ""}`}><span style={{ width: `${pct}%` }} /></div>
                    )}
                  </td>
                  <td>
                    <span className={`badge ${t.active ? "badge-green" : "badge-gray"}`}>
                      {t.active ? "Activo" : "Inactivo"}
                    </span>
                  </td>
                  <td>
                    <div className="row-actions">
                      <button className="btn btn-sm" onClick={() => toggle(t)}>
                        {t.active ? "Desactivar" : "Activar"}
                      </button>
                      <button className="btn btn-sm btn-danger" onClick={() => remove(t)}>Eliminar</button>
                    </div>
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
