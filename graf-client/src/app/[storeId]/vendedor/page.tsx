"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { AxiosError } from "axios";
import {
  Customer,
  Product,
  Seller,
  Zone,
  distributionService as svc,
} from "@/services/distributionService";

const money = (n: number) =>
  new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(n || 0);

const errMessage = (e: unknown): string => {
  if (e instanceof AxiosError) {
    const data = e.response?.data as { message?: string | string[] } | undefined;
    const msg = data?.message;
    if (Array.isArray(msg)) return msg.join(", ");
    if (msg) return msg;
    return e.message;
  }
  if (e instanceof Error) return e.message;
  return "Error desconocido";
};

export default function VendedorPage() {
  const { storeId } = useParams() as { storeId: string };

  const [sellers, setSellers] = useState<Seller[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [zones, setZones] = useState<Zone[]>([]);
  const [search, setSearch] = useState("");

  // New-customer inline form state (G2/G3: vendor can create a customer and a
  // customer requires at least one address).
  const [showNewCustomer, setShowNewCustomer] = useState(false);
  const [savingCustomer, setSavingCustomer] = useState(false);
  const [ncName, setNcName] = useState("");
  const [ncDocument, setNcDocument] = useState("");
  const [ncPhone, setNcPhone] = useState("");
  const [ncZoneId, setNcZoneId] = useState<number | "">("");
  const [ncLabel, setNcLabel] = useState("Sede principal");
  const [ncAddress, setNcAddress] = useState("");
  const [ncCity, setNcCity] = useState("");
  const [ncAddrPhone, setNcAddrPhone] = useState("");

  // Add-address inline form state for the selected customer (G1: load/edit
  // addresses on legacy customers; G4: multiple sedes per customer).
  const [showNewAddress, setShowNewAddress] = useState(false);
  const [savingAddress, setSavingAddress] = useState(false);
  const [naLabel, setNaLabel] = useState("");
  const [naAddress, setNaAddress] = useState("");
  const [naCity, setNaCity] = useState("");
  const [naPhone, setNaPhone] = useState("");

  const [sellerId, setSellerId] = useState<number | "">("");
  const [customerId, setCustomerId] = useState<number | "">("");
  const [addressId, setAddressId] = useState<number | "">("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [cart, setCart] = useState<Record<number, number>>({});

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!storeId) return;
    Promise.all([
      svc.getSellers(storeId),
      svc.getProducts(storeId),
      svc.getCustomers(storeId),
      svc.getZones(storeId),
    ])
      .then(([s, p, c, z]) => {
        setSellers(s);
        setProducts(p);
        setCustomers(c);
        setZones(z);
      })
      .catch((e) => setError(errMessage(e)));
  }, [storeId]);

  const customer = useMemo(
    () => customers.find((c) => c.id === customerId),
    [customers, customerId],
  );
  const isCarrier = !!customer?.zone?.isCarrier;
  const selectedAddress = useMemo(
    () => customer?.addresses.find((a) => a.id === addressId),
    [customer, addressId],
  );

  const filteredCustomers = useMemo(() => {
    if (!search.trim()) return customers;
    const q = search.toLowerCase();
    return customers.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        (c.documentNumber ?? "").toLowerCase().includes(q),
    );
  }, [customers, search]);

  const selectCustomer = (c: Customer) => {
    setCustomerId(c.id);
    const def = c.addresses.find((a) => a.isDefault) ?? c.addresses[0];
    setAddressId(def?.id ?? "");
    setPhone(def?.phone ?? c.phone ?? "");
    setShowNewAddress(false);
    setSuccess("");
    setError("");
  };

  const resetNewCustomer = () => {
    setShowNewCustomer(false);
    setNcName("");
    setNcDocument("");
    setNcPhone("");
    setNcZoneId("");
    setNcLabel("Sede principal");
    setNcAddress("");
    setNcCity("");
    setNcAddrPhone("");
  };

  // G3: a customer requires at least one address (label + dirección).
  const canSaveCustomer =
    ncName.trim() !== "" && ncLabel.trim() !== "" && ncAddress.trim() !== "";

  const saveCustomer = async () => {
    setError("");
    setSuccess("");
    if (!canSaveCustomer) {
      setError("Nombre, etiqueta y dirección de la sede son obligatorios");
      return;
    }
    setSavingCustomer(true);
    try {
      const created = await svc.createCustomer(storeId, {
        name: ncName.trim(),
        documentNumber: ncDocument.trim() || undefined,
        phone: ncPhone.trim() || undefined,
        deliveryZoneId: ncZoneId === "" ? undefined : Number(ncZoneId),
        addresses: [
          {
            label: ncLabel.trim(),
            address: ncAddress.trim(),
            city: ncCity.trim() || undefined,
            phone: ncAddrPhone.trim() || undefined,
            isDefault: true,
          },
        ],
      });
      // Refresh the list so the new customer (with zone + addresses) is present.
      const refreshed = await svc.getCustomers(storeId);
      setCustomers(refreshed);
      const fresh = refreshed.find((c) => c.id === created.id) ?? created;
      selectCustomer(fresh);
      resetNewCustomer();
      setSuccess(`Cliente "${fresh.name}" creado y seleccionado`);
    } catch (e) {
      setError(errMessage(e));
    } finally {
      setSavingCustomer(false);
    }
  };

  // G1/G4: add a new sede/address to the already-selected customer.
  const canSaveAddress = naLabel.trim() !== "" && naAddress.trim() !== "";

  const saveAddress = async () => {
    setError("");
    setSuccess("");
    if (customerId === "") return;
    if (!canSaveAddress) {
      setError("Etiqueta y dirección de la sede son obligatorias");
      return;
    }
    setSavingAddress(true);
    try {
      const created = await svc.addAddress(storeId, Number(customerId), {
        label: naLabel.trim(),
        address: naAddress.trim(),
        city: naCity.trim() || undefined,
        phone: naPhone.trim() || undefined,
      });
      const refreshed = await svc.getCustomers(storeId);
      setCustomers(refreshed);
      const fresh = refreshed.find((c) => c.id === customerId);
      if (fresh) {
        setCustomerId(fresh.id);
        setAddressId(created.id);
        setPhone(created.phone ?? fresh.phone ?? "");
      }
      setShowNewAddress(false);
      setNaLabel("");
      setNaAddress("");
      setNaCity("");
      setNaPhone("");
      setSuccess(`Sede "${created.label}" agregada`);
    } catch (e) {
      setError(errMessage(e));
    } finally {
      setSavingAddress(false);
    }
  };

  const cartItems = useMemo(
    () =>
      Object.entries(cart)
        .map(([pid, qty]) => ({
          product: products.find((p) => p.id === Number(pid)),
          quantity: qty,
        }))
        .filter((i) => i.product && i.quantity > 0),
    [cart, products],
  );
  const total = useMemo(
    () =>
      cartItems.reduce(
        (acc, i) => acc + Number(i.product!.basePrice) * i.quantity,
        0,
      ),
    [cartItems],
  );

  const setQty = (pid: number, qty: number) =>
    setCart((c) => ({ ...c, [pid]: Math.max(0, qty) }));

  // Front-end mirror of the backend carrier rule, surfaced before submit.
  const carrierBlock =
    isCarrier &&
    (!selectedAddress || !selectedAddress.address?.trim() || !phone.trim());

  const canSubmit =
    sellerId !== "" && customerId !== "" && cartItems.length > 0 && !carrierBlock;

  const submit = async () => {
    setError("");
    setSuccess("");
    if (sellerId === "" || customerId === "") {
      setError("Seleccione vendedor y cliente");
      return;
    }
    if (cartItems.length === 0) {
      setError("Agregue al menos un producto al carrito");
      return;
    }
    if (carrierBlock) {
      setError(
        "Zona transportadora: la dirección de entrega y el teléfono son obligatorios",
      );
      return;
    }
    setSubmitting(true);
    try {
      const order = await svc.createOrder(storeId, {
        sellerId: Number(sellerId),
        customerId: Number(customerId),
        customerAddressId: addressId === "" ? undefined : Number(addressId),
        items: cartItems.map((i) => ({
          productId: i.product!.id,
          quantity: i.quantity,
        })),
        notes: notes || undefined,
        buyerPhone: phone || undefined,
      });
      setSuccess(
        `Pedido #${order.id} creado (${order.deliveryZone?.zone ?? "sin zona"}) por ${money(
          order.amount.total,
        )}`,
      );
      setCart({});
      setNotes("");
    } catch (e) {
      setError(errMessage(e));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="container py-4">
      <h3 className="mb-1">Nuevo pedido — Vendedor</h3>
      <p className="text-muted">Toma de pedidos para distribución</p>

      {error && <div className="alert alert-danger py-2">{error}</div>}
      {success && <div className="alert alert-success py-2">{success}</div>}

      <div className="row g-3">
        <div className="col-lg-5">
          <div className="card mb-3">
            <div className="card-body">
              <label className="form-label">Vendedor</label>
              <select
                className="form-select mb-3"
                value={sellerId}
                onChange={(e) =>
                  setSellerId(e.target.value ? Number(e.target.value) : "")
                }
              >
                <option value="">Seleccione vendedor...</option>
                {sellers.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.code})
                  </option>
                ))}
              </select>

              <div className="d-flex justify-content-between align-items-center">
                <label className="form-label mb-0">Cliente</label>
                <button
                  type="button"
                  className="btn btn-sm btn-outline-primary"
                  onClick={() => {
                    setShowNewCustomer((v) => !v);
                    setError("");
                    setSuccess("");
                  }}
                >
                  {showNewCustomer ? "Cancelar" : "+ Nuevo cliente"}
                </button>
              </div>

              {showNewCustomer && (
                <div className="border rounded p-2 mb-3 bg-light">
                  <label className="form-label small mb-1">
                    Nombre <span className="text-danger">*</span>
                  </label>
                  <input
                    className="form-control form-control-sm mb-2"
                    value={ncName}
                    onChange={(e) => setNcName(e.target.value)}
                  />

                  <div className="row g-2 mb-2">
                    <div className="col-6">
                      <label className="form-label small mb-1">Documento</label>
                      <input
                        className="form-control form-control-sm"
                        value={ncDocument}
                        onChange={(e) => setNcDocument(e.target.value)}
                      />
                    </div>
                    <div className="col-6">
                      <label className="form-label small mb-1">Teléfono</label>
                      <input
                        className="form-control form-control-sm"
                        value={ncPhone}
                        onChange={(e) => setNcPhone(e.target.value)}
                      />
                    </div>
                  </div>

                  <label className="form-label small mb-1">Zona / ruta</label>
                  <select
                    className="form-select form-select-sm mb-2"
                    value={ncZoneId}
                    onChange={(e) =>
                      setNcZoneId(e.target.value ? Number(e.target.value) : "")
                    }
                  >
                    <option value="">Sin zona...</option>
                    {zones.map((z) => (
                      <option key={z.id} value={z.id}>
                        {z.zone}
                        {z.isCarrier ? " (transportadora)" : ""}
                      </option>
                    ))}
                  </select>

                  <div className="fw-semibold small mt-2 mb-1">
                    Sede / dirección <span className="text-danger">*</span>
                  </div>

                  <label className="form-label small mb-1">
                    Etiqueta <span className="text-danger">*</span>
                  </label>
                  <input
                    className="form-control form-control-sm mb-2"
                    placeholder="Sede principal"
                    value={ncLabel}
                    onChange={(e) => setNcLabel(e.target.value)}
                  />

                  <label className="form-label small mb-1">
                    Dirección <span className="text-danger">*</span>
                  </label>
                  <input
                    className="form-control form-control-sm mb-2"
                    value={ncAddress}
                    onChange={(e) => setNcAddress(e.target.value)}
                  />

                  <div className="row g-2 mb-2">
                    <div className="col-6">
                      <label className="form-label small mb-1">Ciudad</label>
                      <input
                        className="form-control form-control-sm"
                        value={ncCity}
                        onChange={(e) => setNcCity(e.target.value)}
                      />
                    </div>
                    <div className="col-6">
                      <label className="form-label small mb-1">
                        Teléfono sede
                      </label>
                      <input
                        className="form-control form-control-sm"
                        value={ncAddrPhone}
                        onChange={(e) => setNcAddrPhone(e.target.value)}
                      />
                    </div>
                  </div>

                  <button
                    type="button"
                    className="btn btn-sm btn-primary w-100"
                    disabled={!canSaveCustomer || savingCustomer}
                    onClick={saveCustomer}
                  >
                    {savingCustomer ? "Guardando..." : "Guardar cliente"}
                  </button>
                </div>
              )}

              <input
                className="form-control mb-2"
                placeholder="Buscar por nombre o documento..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <div
                className="list-group mb-2"
                style={{ maxHeight: 180, overflowY: "auto" }}
              >
                {filteredCustomers.map((c) => (
                  <button
                    type="button"
                    key={c.id}
                    className={`list-group-item list-group-item-action d-flex justify-content-between align-items-center ${
                      c.id === customerId ? "active" : ""
                    }`}
                    onClick={() => selectCustomer(c)}
                  >
                    <span>{c.name}</span>
                    <small>
                      {c.zone?.zone ?? "sin zona"}
                      {c.zone?.isCarrier ? " · transp." : ""}
                    </small>
                  </button>
                ))}
              </div>

              {customer && (
                <>
                  <div className="mb-2">
                    Zona:{" "}
                    <strong>{customer.zone?.zone ?? "Sin zona"}</strong>
                    {isCarrier && (
                      <span className="badge bg-warning text-dark ms-2">
                        Transportadora
                      </span>
                    )}
                  </div>

                  <div className="d-flex justify-content-between align-items-center">
                    <label className="form-label mb-0">
                      Dirección / sede
                      {isCarrier && <span className="text-danger"> *</span>}
                    </label>
                    <button
                      type="button"
                      className="btn btn-sm btn-outline-secondary"
                      onClick={() => {
                        setShowNewAddress((v) => !v);
                        setError("");
                        setSuccess("");
                      }}
                    >
                      {showNewAddress ? "Cancelar" : "+ Agregar sede"}
                    </button>
                  </div>
                  <select
                    className="form-select mb-2 mt-1"
                    value={addressId}
                    onChange={(e) => {
                      const id = e.target.value ? Number(e.target.value) : "";
                      setAddressId(id);
                      const addr = customer.addresses.find((a) => a.id === id);
                      if (addr?.phone) setPhone(addr.phone);
                    }}
                  >
                    <option value="">
                      {customer.addresses.length
                        ? "Seleccione sede..."
                        : "El cliente no tiene direcciones"}
                    </option>
                    {customer.addresses.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.label} — {a.address}
                        {a.city ? `, ${a.city}` : ""}
                      </option>
                    ))}
                  </select>

                  {showNewAddress && (
                    <div className="border rounded p-2 mb-2 bg-light">
                      <div className="row g-2 mb-2">
                        <div className="col-6">
                          <label className="form-label small mb-1">
                            Etiqueta <span className="text-danger">*</span>
                          </label>
                          <input
                            className="form-control form-control-sm"
                            placeholder="Sede / bodega"
                            value={naLabel}
                            onChange={(e) => setNaLabel(e.target.value)}
                          />
                        </div>
                        <div className="col-6">
                          <label className="form-label small mb-1">Ciudad</label>
                          <input
                            className="form-control form-control-sm"
                            value={naCity}
                            onChange={(e) => setNaCity(e.target.value)}
                          />
                        </div>
                      </div>
                      <label className="form-label small mb-1">
                        Dirección <span className="text-danger">*</span>
                      </label>
                      <input
                        className="form-control form-control-sm mb-2"
                        value={naAddress}
                        onChange={(e) => setNaAddress(e.target.value)}
                      />
                      <label className="form-label small mb-1">
                        Teléfono sede
                      </label>
                      <input
                        className="form-control form-control-sm mb-2"
                        value={naPhone}
                        onChange={(e) => setNaPhone(e.target.value)}
                      />
                      <button
                        type="button"
                        className="btn btn-sm btn-primary w-100"
                        disabled={!canSaveAddress || savingAddress}
                        onClick={saveAddress}
                      >
                        {savingAddress ? "Guardando..." : "Guardar sede"}
                      </button>
                    </div>
                  )}

                  <label className="form-label">
                    Teléfono de contacto
                    {isCarrier && <span className="text-danger"> *</span>}
                  </label>
                  <input
                    className="form-control mb-2"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />

                  {carrierBlock && (
                    <div className="alert alert-warning py-2 small mb-2">
                      Esta zona es por transportadora: debe seleccionar una
                      dirección y diligenciar el teléfono antes de enviar.
                    </div>
                  )}

                  <label className="form-label">Notas</label>
                  <textarea
                    className="form-control"
                    rows={2}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                  />
                </>
              )}
            </div>
          </div>
        </div>

        <div className="col-lg-7">
          <div className="card mb-3">
            <div className="card-header">Carrito</div>
            <div className="card-body p-0">
              <table className="table table-sm mb-0 align-middle">
                <thead className="table-light">
                  <tr>
                    <th>Producto</th>
                    <th className="text-end">Precio</th>
                    <th style={{ width: 120 }}>Cantidad</th>
                    <th className="text-end">Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((p) => {
                    const qty = cart[p.id] ?? 0;
                    return (
                      <tr key={p.id}>
                        <td className="small">
                          {p.title}
                          <div className="text-muted">{p.sku}</div>
                        </td>
                        <td className="text-end">{money(Number(p.basePrice))}</td>
                        <td>
                          <input
                            type="number"
                            min={0}
                            className="form-control form-control-sm"
                            value={qty}
                            onChange={(e) => setQty(p.id, Number(e.target.value))}
                          />
                        </td>
                        <td className="text-end">
                          {money(Number(p.basePrice) * qty)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr>
                    <th colSpan={3} className="text-end">
                      Total
                    </th>
                    <th className="text-end">{money(total)}</th>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          <button
            className="btn btn-primary w-100"
            disabled={!canSubmit || submitting}
            onClick={submit}
          >
            {submitting ? "Enviando..." : "Crear pedido"}
          </button>
        </div>
      </div>
    </div>
  );
}
