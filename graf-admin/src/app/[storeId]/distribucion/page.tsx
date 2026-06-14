"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { useSelector } from "react-redux";
import { RootState } from "@/redux/store";
import {
  DistOrder,
  DistOrderStatus,
  InventoryCheck,
  OrderFilters,
  Product,
  Seller,
  Zone,
  distributionService as svc,
} from "@/services/distributionService";

const STATUS_META: Record<
  DistOrderStatus,
  { label: string; className: string }
> = {
  queued: { label: "En cola", className: "bg-secondary" },
  accepted: { label: "Aceptado", className: "bg-info text-dark" },
  routed: { label: "Enrutado", className: "bg-primary" },
  dispatched: { label: "Despachado", className: "bg-success" },
  canceled: { label: "Anulado", className: "bg-danger" },
};

const money = (n: number) =>
  new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(n || 0);

// Surface a backend error message (e.g. HTTP 409 "inventario insuficiente").
function errMessage(e: unknown): string {
  const ax = e as {
    response?: { data?: { message?: string | string[] } };
    message?: string;
  };
  const m = ax?.response?.data?.message;
  if (Array.isArray(m)) return m.join(", ");
  if (typeof m === "string" && m) return m;
  return ax?.message || "Ocurrió un error";
}

interface EditState {
  order: DistOrder;
  lines: { productId: number; quantity: number }[];
}

export default function DistribucionPage() {
  const { storeId } = useParams() as { storeId: string };
  const config = useSelector((s: RootState) => s.config.config);

  const [sellers, setSellers] = useState<Seller[]>([]);
  const [zones, setZones] = useState<Zone[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<DistOrder[]>([]);
  const [filters, setFilters] = useState<OrderFilters>({});
  const [routeDate, setRouteDate] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [showRouting, setShowRouting] = useState<boolean>(false);
  const [routing, setRouting] = useState<
    Awaited<ReturnType<typeof svc.getRouting>>
  >([]);
  const [edit, setEdit] = useState<EditState | null>(null);
  const [addProductId, setAddProductId] = useState<string>("");
  const [inventory, setInventory] = useState<InventoryCheck | null>(null);

  const distributionEnabled = config?.activations?.distributionEnabled === true;

  const loadOrders = useCallback(async () => {
    if (!storeId) return;
    setLoading(true);
    setError("");
    try {
      setOrders(await svc.getOrders(storeId, filters));
    } catch (e) {
      setError(errMessage(e));
    } finally {
      setLoading(false);
    }
  }, [storeId, filters]);

  useEffect(() => {
    if (!storeId || !distributionEnabled) return;
    Promise.all([
      svc.getSellers(storeId),
      svc.getZones(storeId),
      svc.getProducts(storeId),
    ])
      .then(([s, z, p]) => {
        setSellers(s);
        setZones(z);
        setProducts(p);
      })
      .catch((e) => setError(errMessage(e)));
  }, [storeId, distributionEnabled]);

  useEffect(() => {
    if (!distributionEnabled) return;
    loadOrders();
  }, [loadOrders, distributionEnabled]);

  const runAction = async (fn: () => Promise<unknown>) => {
    setError("");
    try {
      await fn();
      await loadOrders();
      if (showRouting) setRouting(await svc.getRouting(storeId));
    } catch (e) {
      setError(errMessage(e));
    }
  };

  const openRouting = async () => {
    setError("");
    try {
      setRouting(await svc.getRouting(storeId));
      setShowRouting(true);
    } catch (e) {
      setError(errMessage(e));
    }
  };

  const showInventory = async (id: number) => {
    setError("");
    setInventory(null);
    try {
      setInventory(await svc.getInventory(storeId, id));
    } catch (e) {
      setError(errMessage(e));
    }
  };

  const changeRouteDate = (id: number, value: string) =>
    runAction(() => svc.setRouteDate(storeId, id, value || null));

  const exportConsolidated = async () => {
    setError("");
    try {
      await svc.exportDownload(storeId, filters);
    } catch (e) {
      setError(errMessage(e));
    }
  };

  const totals = useMemo(
    () => orders.reduce((acc, o) => acc + Number(o.amount?.total || 0), 0),
    [orders],
  );

  const startEdit = (order: DistOrder) => {
    setEdit({
      order,
      lines: order.items.map((i) => ({
        productId: i.product.id,
        quantity: i.quantity,
      })),
    });
    setAddProductId("");
  };

  const saveEdit = async () => {
    if (!edit) return;
    const items = edit.lines.filter((l) => l.quantity > 0);
    if (items.length === 0) {
      setError("El pedido debe tener al menos un producto");
      return;
    }
    await runAction(() => svc.updateItems(storeId, edit.order.id, { items }));
    setEdit(null);
  };

  // ── Feature gate ──
  if (config && !distributionEnabled) {
    return (
      <div className="container-fluid py-4">
        <div className="alert alert-warning">
          La distribución no está activada para esta tienda.
        </div>
      </div>
    );
  }

  return (
    <div className="container-fluid py-4">
      <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
        <div>
          <h3 className="mb-0">Cola de pedidos — Oficina</h3>
          <small className="text-muted">
            Distribución multivendedor · {orders.length} pedidos ·{" "}
            {money(totals)}
          </small>
        </div>
        <div className="d-flex gap-2">
          <button className="btn btn-outline-primary" onClick={openRouting}>
            Ver enrutamiento
          </button>
          <button className="btn btn-success" onClick={exportConsolidated}>
            Exportar consolidado
          </button>
        </div>
      </div>

      {error && <div className="alert alert-danger py-2">{error}</div>}

      <div className="card mb-3">
        <div className="card-body">
          <div className="row g-2">
            <div className="col-md-3">
              <label className="form-label small mb-1">Vendedor</label>
              <select
                className="form-select form-select-sm"
                value={filters.sellerId ?? ""}
                onChange={(e) =>
                  setFilters((f) => ({
                    ...f,
                    sellerId: e.target.value
                      ? Number(e.target.value)
                      : undefined,
                  }))
                }
              >
                <option value="">Todos</option>
                {sellers.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="col-md-3">
              <label className="form-label small mb-1">Zona / ruta</label>
              <select
                className="form-select form-select-sm"
                value={filters.deliveryZoneId ?? ""}
                onChange={(e) =>
                  setFilters((f) => ({
                    ...f,
                    deliveryZoneId: e.target.value
                      ? Number(e.target.value)
                      : undefined,
                  }))
                }
              >
                <option value="">Todas</option>
                {zones.map((z) => (
                  <option key={z.id} value={z.id}>
                    {z.zone}
                    {z.isCarrier ? " (transportadora)" : ""}
                  </option>
                ))}
              </select>
            </div>
            <div className="col-md-2">
              <label className="form-label small mb-1">Estado</label>
              <select
                className="form-select form-select-sm"
                value={filters.status ?? ""}
                onChange={(e) =>
                  setFilters((f) => ({
                    ...f,
                    status: (e.target.value || undefined) as
                      | DistOrderStatus
                      | undefined,
                  }))
                }
              >
                <option value="">Todos</option>
                {Object.entries(STATUS_META).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="col-md-2">
              <label className="form-label small mb-1">Desde</label>
              <input
                type="date"
                className="form-control form-control-sm"
                value={filters.startDate ?? ""}
                onChange={(e) =>
                  setFilters((f) => ({
                    ...f,
                    startDate: e.target.value || undefined,
                  }))
                }
              />
            </div>
            <div className="col-md-2">
              <label className="form-label small mb-1">Hasta</label>
              <input
                type="date"
                className="form-control form-control-sm"
                value={filters.endDate ?? ""}
                onChange={(e) =>
                  setFilters((f) => ({
                    ...f,
                    endDate: e.target.value || undefined,
                  }))
                }
              />
            </div>
            <div className="col-md-3">
              <label className="form-label small mb-1">Ruta desde</label>
              <input
                type="date"
                className="form-control form-control-sm"
                value={filters.routeStartDate ?? ""}
                onChange={(e) =>
                  setFilters((f) => ({
                    ...f,
                    routeStartDate: e.target.value || undefined,
                  }))
                }
              />
            </div>
            <div className="col-md-3">
              <label className="form-label small mb-1">Ruta hasta</label>
              <input
                type="date"
                className="form-control form-control-sm"
                value={filters.routeEndDate ?? ""}
                onChange={(e) =>
                  setFilters((f) => ({
                    ...f,
                    routeEndDate: e.target.value || undefined,
                  }))
                }
              />
            </div>
            <div className="col-md-4">
              <label className="form-label small mb-1">
                Buscar (cliente / vendedor)
              </label>
              <input
                type="text"
                className="form-control form-control-sm"
                value={filters.search ?? ""}
                onChange={(e) =>
                  setFilters((f) => ({
                    ...f,
                    search: e.target.value || undefined,
                  }))
                }
              />
            </div>
            <div className="col-md-2 d-flex align-items-end">
              <button
                className="btn btn-sm btn-outline-secondary w-100"
                onClick={() => setFilters({})}
              >
                Limpiar
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="table-responsive">
        <table className="table table-sm table-hover align-middle">
          <thead className="table-light">
            <tr>
              <th>#</th>
              <th>Fecha</th>
              <th>Vendedor</th>
              <th>Cliente</th>
              <th>Zona</th>
              <th>Sede / dirección</th>
              <th>Teléfono</th>
              <th>Estado</th>
              <th>Día de ruta</th>
              <th className="text-end">Total</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={11} className="text-center text-muted py-3">
                  Cargando...
                </td>
              </tr>
            )}
            {!loading && orders.length === 0 && (
              <tr>
                <td colSpan={11} className="text-center text-muted py-3">
                  Sin pedidos para los filtros seleccionados.
                </td>
              </tr>
            )}
            {orders.map((o) => {
              const meta = STATUS_META[o.distStatus];
              const canEdit =
                o.distStatus === "queued" || o.distStatus === "accepted";
              return (
                <tr key={o.id}>
                  <td>{o.id}</td>
                  <td>{o.createdAt?.split("T")[0]}</td>
                  <td>{o.seller?.name ?? "-"}</td>
                  <td>{o.customer?.name ?? o.buyerName ?? "-"}</td>
                  <td>
                    {o.deliveryZone?.zone ?? "Sin zona"}
                    {o.deliveryZone?.isCarrier && (
                      <span className="badge bg-warning text-dark ms-1">
                        transp.
                      </span>
                    )}
                  </td>
                  <td className="small">
                    {o.customerAddress
                      ? `${o.customerAddress.label}: ${o.customerAddress.address}`
                      : "-"}
                  </td>
                  <td className="small">{o.buyerPhone ?? "-"}</td>
                  <td>
                    <span className={`badge ${meta.className}`}>
                      {meta.label}
                    </span>
                  </td>
                  <td>
                    {canEdit ? (
                      <input
                        type="date"
                        className="form-control form-control-sm"
                        style={{ width: 150 }}
                        value={o.routeDate?.split("T")[0] ?? ""}
                        onChange={(e) => changeRouteDate(o.id, e.target.value)}
                      />
                    ) : (
                      <span className="small text-muted">
                        {o.routeDate?.split("T")[0] ?? "-"}
                      </span>
                    )}
                  </td>
                  <td className="text-end">
                    {money(Number(o.amount?.total))}
                  </td>
                  <td>
                    <div className="d-flex gap-1 flex-wrap">
                      {o.distStatus === "queued" && (
                        <>
                          <button
                            className="btn btn-sm btn-outline-dark"
                            onClick={() => showInventory(o.id)}
                          >
                            Inventario
                          </button>
                          <button
                            className="btn btn-sm btn-outline-info"
                            onClick={() =>
                              runAction(() =>
                                svc.transition(storeId, o.id, "accepted"),
                              )
                            }
                          >
                            Aceptar
                          </button>
                        </>
                      )}
                      {o.distStatus === "accepted" && (
                        <button
                          className="btn btn-sm btn-outline-primary"
                          onClick={() =>
                            runAction(() =>
                              svc.transition(
                                storeId,
                                o.id,
                                "routed",
                                routeDate || undefined,
                              ),
                            )
                          }
                        >
                          Enrutar
                        </button>
                      )}
                      {o.distStatus === "routed" && (
                        <button
                          className="btn btn-sm btn-outline-success"
                          onClick={() =>
                            runAction(() =>
                              svc.transition(storeId, o.id, "dispatched"),
                            )
                          }
                        >
                          Despachar
                        </button>
                      )}
                      {canEdit && (
                        <button
                          className="btn btn-sm btn-outline-secondary"
                          onClick={() => startEdit(o)}
                        >
                          Editar
                        </button>
                      )}
                      {o.distStatus !== "dispatched" &&
                        o.distStatus !== "canceled" && (
                          <button
                            className="btn btn-sm btn-outline-danger"
                            onClick={() =>
                              runAction(() => svc.cancel(storeId, o.id))
                            }
                          >
                            Anular
                          </button>
                        )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {inventory && (
        <div className="card mt-3">
          <div className="card-header d-flex justify-content-between align-items-center">
            <strong>
              Inventario — pedido #{inventory.orderId}{" "}
              {inventory.allOk ? (
                <span className="badge bg-success">Disponible</span>
              ) : (
                <span className="badge bg-danger">Insuficiente</span>
              )}
            </strong>
            <button
              className="btn btn-sm btn-outline-secondary"
              onClick={() => setInventory(null)}
            >
              Cerrar
            </button>
          </div>
          <div className="card-body p-0">
            <table className="table table-sm mb-0">
              <thead className="table-light">
                <tr>
                  <th>Producto</th>
                  <th className="text-end">Requerido</th>
                  <th className="text-end">Disponible</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                {inventory.items.map((it) => (
                  <tr key={it.productId}>
                    <td>{it.title}</td>
                    <td className="text-end">{it.required}</td>
                    <td className="text-end">{it.available}</td>
                    <td>
                      {it.ok ? (
                        <span className="badge bg-success">OK</span>
                      ) : (
                        <span className="badge bg-danger">Falta</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showRouting && (
        <div className="card mt-3">
          <div className="card-header d-flex justify-content-between align-items-center">
            <strong>Enrutamiento — pendientes por ruta</strong>
            <div className="d-flex align-items-center gap-2">
              <label className="small mb-0">Día de ruta</label>
              <input
                type="date"
                className="form-control form-control-sm"
                style={{ width: 160 }}
                value={routeDate}
                onChange={(e) => setRouteDate(e.target.value)}
              />
              <button
                className="btn btn-sm btn-outline-secondary"
                onClick={() => setShowRouting(false)}
              >
                Cerrar
              </button>
            </div>
          </div>
          <div className="card-body">
            {routing.length === 0 && (
              <div className="text-muted">No hay pedidos pendientes.</div>
            )}
            {routing.map((g) => (
              <div key={g.zone} className="mb-3">
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    <strong>{g.zone}</strong>{" "}
                    {g.isCarrier && (
                      <span className="badge bg-warning text-dark">
                        transportadora
                      </span>
                    )}{" "}
                    <span className="text-muted small">
                      {g.routeGroup ?? ""} · {g.orders.length} pedidos
                    </span>
                  </div>
                  <button
                    className="btn btn-sm btn-primary"
                    onClick={() =>
                      runAction(() =>
                        svc.assignRoute(
                          storeId,
                          g.orders.map((o) => o.id),
                          routeDate || undefined,
                        ),
                      )
                    }
                  >
                    Enrutar grupo
                  </button>
                </div>
                <div className="small text-muted">
                  {g.orders
                    .map((o) => `#${o.id} ${o.customer?.name ?? ""}`)
                    .join(" · ")}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {edit && (
        <div
          className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center"
          style={{ background: "rgba(0,0,0,0.5)", zIndex: 1050 }}
        >
          <div className="card shadow" style={{ width: 520, maxWidth: "95vw" }}>
            <div className="card-header d-flex justify-content-between align-items-center">
              <strong>Editar unidades — pedido #{edit.order.id}</strong>
              <button
                className="btn-close"
                onClick={() => setEdit(null)}
                aria-label="Cerrar"
              />
            </div>
            <div className="card-body">
              {edit.lines.map((line, idx) => {
                const prod = products.find((p) => p.id === line.productId);
                return (
                  <div
                    key={line.productId}
                    className="d-flex align-items-center gap-2 mb-2"
                  >
                    <span className="flex-grow-1 small">
                      {prod?.title ?? `Producto ${line.productId}`}
                    </span>
                    <input
                      type="number"
                      min={0}
                      className="form-control form-control-sm"
                      style={{ width: 90 }}
                      value={line.quantity}
                      onChange={(e) =>
                        setEdit((s) =>
                          s
                            ? {
                                ...s,
                                lines: s.lines.map((l, i) =>
                                  i === idx
                                    ? {
                                        ...l,
                                        quantity: Number(e.target.value),
                                      }
                                    : l,
                                ),
                              }
                            : s,
                        )
                      }
                    />
                  </div>
                );
              })}
              <div className="d-flex gap-2 mt-3">
                <select
                  className="form-select form-select-sm"
                  value={addProductId}
                  onChange={(e) => setAddProductId(e.target.value)}
                >
                  <option value="">Agregar producto...</option>
                  {products
                    .filter(
                      (p) => !edit.lines.some((l) => l.productId === p.id),
                    )
                    .map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.title}
                      </option>
                    ))}
                </select>
                <button
                  className="btn btn-sm btn-outline-secondary"
                  disabled={!addProductId}
                  onClick={() =>
                    setEdit((s) =>
                      s
                        ? {
                            ...s,
                            lines: [
                              ...s.lines,
                              { productId: Number(addProductId), quantity: 1 },
                            ],
                          }
                        : s,
                    )
                  }
                >
                  Agregar
                </button>
              </div>
            </div>
            <div className="card-footer d-flex justify-content-end gap-2">
              <button
                className="btn btn-sm btn-outline-secondary"
                onClick={() => setEdit(null)}
              >
                Cancelar
              </button>
              <button className="btn btn-sm btn-primary" onClick={saveEdit}>
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
