"use client";
import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  Modal,
  Button,
  Form,
  Row,
  Col,
  InputGroup,
  Table,
  Badge,
  Alert,
  Spinner,
  Card,
  OverlayTrigger,
  Tooltip,
} from "react-bootstrap";
import {
  FaSearch,
  FaPlus,
  FaTimes,
  FaUser,
  FaBox,
  FaCalculator,
  FaCheck,
  FaInfoCircle,
} from "react-icons/fa";
import { useParams } from "next/navigation";
import {
  OrderService,
  CreateOrderData,
  ValidateOrderResponse,
} from "@/services/orderService";
import { User, Product, DeliveryZone, CustomQuestion, Tax } from "@/types";
import { OrderStatus, DiscountType, PaymentMethod } from "@/types/order";
import { formatNumberWithCommas } from "@/utils/formatters";
import DocumentUploader from "@/components/DocumentUploader";
import { storage } from "@/utils/firebase";

interface CreateOrderModalProps {
  show: boolean;
  onHide: () => void;
  onOrderCreated: () => void;
  customQuestions?: CustomQuestion[];
  deliveryEnabled?: boolean;
}

interface SelectedProduct {
  product: Product;
  quantity: number;
}

interface OrderValidation extends ValidateOrderResponse {
  isValid: boolean;
  errors: string[];
}

export default function CreateOrderModal({
  show,
  onHide,
  onOrderCreated,
  customQuestions = [],
}: CreateOrderModalProps) {
  const { storeId } = useParams() as { storeId: string };

  const [currentStep, setCurrentStep] = useState<
    "customer" | "products" | "review"
  >("customer");
  const [selectedCustomer, setSelectedCustomer] = useState<User | null>(null);
  const [isGuestOrder, setIsGuestOrder] = useState(false);
  const [customerSearch, setCustomerSearch] = useState("");
  const [customerSearchResults, setCustomerSearchResults] = useState<User[]>(
    [],
  );
  const [isSearchingCustomers, setIsSearchingCustomers] = useState(false);

  const [productSearch, setProductSearch] = useState("");
  const [productSearchResults, setProductSearchResults] = useState<Product[]>(
    [],
  );
  const [isSearchingProducts, setIsSearchingProducts] = useState(false);
  const [selectedProducts, setSelectedProducts] = useState<SelectedProduct[]>(
    [],
  );

  const [customAnswers, setCustomAnswers] = useState<
    { question: string; answer: string }[]
  >([]);
  const [deliveryZones, setDeliveryZones] = useState<DeliveryZone[]>([]);
  const [selectedDeliveryZone, setSelectedDeliveryZone] =
    useState<DeliveryZone | null>(null);
  const [taxes, setTaxes] = useState<Tax[]>([]);
  const [selectedTaxIds, setSelectedTaxIds] = useState<number[]>([]);

  const [orderValidation, setOrderValidation] =
    useState<OrderValidation | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(PaymentMethod.CASH);
  const [creditDays, setCreditDays] = useState<number>(0);
  const [notes, setNotes] = useState<string>("");
  const [initialStatus, setInitialStatus] = useState<OrderStatus>(
    OrderStatus.PENDING,
  );

  const [documents, setDocuments] = useState<string[]>([]);
  const [documentFiles, setDocumentFiles] = useState<File[]>([]);
  const [isUploadingDocuments, setIsUploadingDocuments] = useState(false);

  const [discountType, setDiscountType] = useState<"percentage" | "fixed" | "">(
    "",
  );
  const [discountValue, setDiscountValue] = useState<number>(0);

  const [showNewCustomerForm, setShowNewCustomerForm] = useState(false);
  const [newCustomerData, setNewCustomerData] = useState({
    name: "",
    email: "",
    phone: "",
    documentNumber: "",
    address: "",
    city: "",
    postalCode: "",
    birthDate: "",
    notes: "",
  });
  const [isCreatingCustomer, setIsCreatingCustomer] = useState(false);

  const loadDeliveryZones = useCallback(async () => {
    try {
      const zones = await OrderService.getDeliveryZones(storeId);
      setDeliveryZones(zones);
    } catch (error) {
      console.error("Error loading delivery zones:", error);
    }
  }, [storeId]);

  const loadTaxes = useCallback(async () => {
    try {
      const taxList = await OrderService.getTaxes(storeId);
      setTaxes(taxList);
    } catch (error) {
      console.error("Error loading taxes:", error);
    }
  }, [storeId]);

  useEffect(() => {
    if (show) {
      resetForm();
      loadDeliveryZones();
      loadTaxes();
    }
  }, [show, loadDeliveryZones, loadTaxes]);

  useEffect(() => {
    if (customQuestions.length > 0) {
      setCustomAnswers(
        customQuestions.map((q) => ({ question: q.question, answer: "" })),
      );
    }
  }, [customQuestions]);

  const resetForm = () => {
    setCurrentStep("customer");
    setSelectedCustomer(null);
    setIsGuestOrder(false);
    setCustomerSearch("");
    setCustomerSearchResults([]);
    setProductSearch("");
    setProductSearchResults([]);
    setSelectedProducts([]);
    setCustomAnswers([]);
    setSelectedDeliveryZone(null);
    setSelectedTaxIds([]);
    setOrderValidation(null);
    setError(null);
    setPaymentMethod(PaymentMethod.CASH);
    setCreditDays(0);
    setNotes("");
    setInitialStatus(OrderStatus.PENDING);
    setDocuments([]);
    setDocumentFiles([]);
    setDiscountType("");
    setDiscountValue(0);
    setShowNewCustomerForm(false);
    setNewCustomerData({
      name: "",
      email: "",
      phone: "",
      documentNumber: "",
      address: "",
      city: "",
      postalCode: "",
      birthDate: "",
      notes: "",
    });
  };

  const resetNewCustomerForm = () => {
    setNewCustomerData({
      name: "",
      email: "",
      phone: "",
      documentNumber: "",
      address: "",
      city: "",
      postalCode: "",
      birthDate: "",
      notes: "",
    });
  };

  const createNewCustomer = async () => {
    const hasIdentifier = !!(
      (newCustomerData.email && newCustomerData.email.trim()) ||
      (newCustomerData.phone && newCustomerData.phone.trim()) ||
      (newCustomerData.documentNumber && newCustomerData.documentNumber.trim())
    );
    if (!newCustomerData.name || !hasIdentifier) {
      setError(
        "Ingrese nombre y al menos uno: email, teléfono o documento",
      );
      return;
    }

    setIsCreatingCustomer(true);
    setError(null);

    try {
      const customerPayload = {
        name: newCustomerData.name,
        ...(newCustomerData.email && { email: newCustomerData.email }),
        storeId,
        ...(newCustomerData.phone && { phone: newCustomerData.phone }),
        ...(newCustomerData.documentNumber && {
          documentNumber: newCustomerData.documentNumber,
        }),
        ...(newCustomerData.address && { address: newCustomerData.address }),
        ...(newCustomerData.city && { city: newCustomerData.city }),
        ...(newCustomerData.postalCode && {
          postalCode: newCustomerData.postalCode,
        }),
        ...(newCustomerData.birthDate && {
          birthDate: newCustomerData.birthDate,
        }),
        ...(newCustomerData.notes && { notes: newCustomerData.notes }),
      };

      const response = await OrderService.createCustomer(
        storeId,
        customerPayload,
      );

      setSelectedCustomer(response);
      setIsGuestOrder(false);
      setShowNewCustomerForm(false);
      resetNewCustomerForm();
    } catch (error) {
      console.error("Error creating customer:", error);
      setError("Error al crear el cliente. Por favor intente nuevamente.");
    } finally {
      setIsCreatingCustomer(false);
    }
  };

  const searchCustomers = async (query: string) => {
    if (query.length < 2) {
      setCustomerSearchResults([]);
      return;
    }

    setIsSearchingCustomers(true);
    try {
      const customers = await OrderService.searchCustomers(storeId, query);
      setCustomerSearchResults(customers);
    } catch (error) {
      console.error("Error searching customers:", error);
      setCustomerSearchResults([]);
    } finally {
      setIsSearchingCustomers(false);
    }
  };

  const searchProducts = async (query: string) => {
    if (query.length < 2) {
      setProductSearchResults([]);
      return;
    }

    setIsSearchingProducts(true);
    try {
      const response = await OrderService.searchProducts(storeId, query);
      setProductSearchResults(response.products);
    } catch (error) {
      console.error("Error searching products:", error);
      setProductSearchResults([]);
    } finally {
      setIsSearchingProducts(false);
    }
  };

  const addProduct = (product: Product) => {
    const existing = selectedProducts.find((p) => p.product.id === product.id);
    if (existing) {
      setSelectedProducts((prev) =>
        prev.map((p) =>
          p.product.id === product.id ? { ...p, quantity: p.quantity + 1 } : p,
        ),
      );
    } else {
      setSelectedProducts((prev) => [...prev, { product, quantity: 1 }]);
    }
    setProductSearch("");
    setProductSearchResults([]);
  };

  const updateProductQuantity = (productId: number, quantity: number) => {
    if (quantity <= 0) {
      removeProduct(productId);
      return;
    }
    setSelectedProducts((prev) =>
      prev.map((p) => (p.product.id === productId ? { ...p, quantity } : p)),
    );
  };

  const removeProduct = (productId: number) => {
    setSelectedProducts((prev) =>
      prev.filter((p) => p.product.id !== productId),
    );
  };

  const validateOrder = useCallback(async () => {
    if (selectedProducts.length === 0) {
      setOrderValidation({
        items: [],
        subTotal: 0,
        discountTotal: 0,
        taxTotal: 0,
        total: 0,
        isValid: false,
        errors: ["Debe seleccionar al menos un producto"],
      });
      return;
    }

    setIsValidating(true);
    try {
      const validation = await OrderService.validateOrder({
        items: selectedProducts.map((sp) => ({
          product: { id: sp.product.id },
          quantity: sp.quantity,
        })),
        deliveryZoneId: selectedDeliveryZone?.id,
        taxIds: selectedTaxIds.length > 0 ? selectedTaxIds : undefined,
        store: { id: storeId },
        discountType: discountType || undefined,
        discountValue: discountValue > 0 ? discountValue : undefined,
      });

      const normalized = {
        ...validation,
        items: (validation.items || []).map((it) => ({
          ...it,
          basePrice: Number(it.basePrice),
          unitPrice: Number(it.unitPrice),
          finalPrice: Number(it.finalPrice),
          totalPrice: Number(it.totalPrice),
        })),
        subTotal: Number(validation.subTotal),
        discountTotal: Number(validation.discountTotal),
        taxTotal: Number(validation.taxTotal),
        delivery: validation.delivery != null ? Number(validation.delivery) : 0,
        total: Number(validation.total),
      };

      setOrderValidation({
        ...(normalized as ValidateOrderResponse),
        isValid: true,
        errors: [],
      });
    } catch (error: unknown) {
      console.error("Error validating order:", error);
      const errorMessage =
        error instanceof Error && "response" in error
          ? (error as { response?: { data?: { message?: string } } }).response
              ?.data?.message || "Error al validar la orden"
          : "Error al validar la orden";
      setOrderValidation({
        items: [],
        subTotal: 0,
        discountTotal: 0,
        taxTotal: 0,
        total: 0,
        isValid: false,
        errors: [errorMessage],
      });
    } finally {
      setIsValidating(false);
    }
  }, [selectedProducts, selectedDeliveryZone, selectedTaxIds, storeId, discountType, discountValue]);

  useEffect(() => {
    if (currentStep === "review" && selectedProducts.length > 0) {
      const timer = setTimeout(() => {
        validateOrder();
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [selectedTaxIds, selectedDeliveryZone, selectedProducts, currentStep, validateOrder]);

  const createOrder = async () => {
    if (!orderValidation?.isValid) {
      await validateOrder();
      return;
    }

    setIsCreating(true);
    setError(null);

    try {
      let uploadedDocumentUrls: string[] = [...documents];

      if (documentFiles.length > 0) {
        setIsUploadingDocuments(true);
        try {
          const uploadPromises = documentFiles.map(async (file) => {
            const timestamp = Date.now();
            const sanitizedFileName = file.name.replace(
              /[^a-zA-Z0-9._-]/g,
              "_",
            );
            const fileRef = storage.ref(
              `/orders/pending/documents/${sanitizedFileName}-${timestamp}`,
            );
            await fileRef.put(file);
            return await fileRef.getDownloadURL();
          });

          const newUrls = await Promise.all(uploadPromises);
          uploadedDocumentUrls = [...uploadedDocumentUrls, ...newUrls];
        } catch (uploadError) {
          console.error("Error uploading documents:", uploadError);
          setError("Error al subir documentos. La orden no se creará.");
          return;
        } finally {
          setIsUploadingDocuments(false);
        }
      }

      const payload: CreateOrderData = {
        customerId: selectedCustomer?.id
          ? Number(selectedCustomer.id)
          : undefined,
        items: orderValidation.items.map((item) => ({
          product: { id: item.productId },
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          finalPrice: item.finalPrice,
        })),
        customAnswers,
        deliveryZoneId: selectedDeliveryZone?.id,
        taxIds: selectedTaxIds.length > 0 ? selectedTaxIds : undefined,
        paymentMethod: paymentMethod,
        ...(paymentMethod === PaymentMethod.CREDIT ? { creditDays } : {}),
        ...(notes.trim() ? { notes: notes.trim() } : {}),
        status: initialStatus,
        ...(uploadedDocumentUrls.length > 0
          ? { documents: uploadedDocumentUrls }
          : {}),
        ...(discountType && discountValue > 0
          ? {
              discountType: discountType as "percentage" | "fixed",
              discountValue,
            }
          : {}),
      };

      await OrderService.createOrder(storeId, payload);
      onOrderCreated();
      onHide();
    } catch (error: unknown) {
      console.error("Error creating order:", error);
      const errorMessage =
        error instanceof Error && "response" in error
          ? (error as { response?: { data?: { message?: string } } }).response
              ?.data?.message || "Error al crear la orden"
          : "Error al crear la orden";
      setError(errorMessage);
    } finally {
      setIsCreating(false);
    }
  };

  const canGoToNextStep = useMemo(() => {
    switch (currentStep) {
      case "customer":
        return selectedCustomer !== null || isGuestOrder;
      case "products":
        return selectedProducts.length > 0;
      case "review":
        return orderValidation?.isValid;
      default:
        return false;
    }
  }, [
    currentStep,
    selectedCustomer,
    isGuestOrder,
    selectedProducts.length,
    orderValidation?.isValid,
  ]);

  const goToNextStep = () => {
    if (!canGoToNextStep) {
      if (currentStep === "customer") {
        setError(
          'Por favor seleccione un cliente, cree uno nuevo, o marque "Orden de Invitado"',
        );
      }
      return;
    }

    setError(null);

    switch (currentStep) {
      case "customer":
        setCurrentStep("products");
        break;
      case "products":
        setCurrentStep("review");
        validateOrder();
        break;
    }
  };

  const goToPreviousStep = () => {
    switch (currentStep) {
      case "products":
        setCurrentStep("customer");
        break;
      case "review":
        setCurrentStep("products");
        break;
    }
  };

  return (
    <Modal show={show} onHide={onHide} size="xl" centered>
      <Modal.Header
        closeButton
        style={{
          backgroundColor: "var(--bg-color)",
          borderColor: "var(--border-color)",
        }}
      >
        <Modal.Title style={{ color: "var(--card-title-color)" }}>
          <FaPlus className="me-2" />
          Crear Nueva Orden
        </Modal.Title>
      </Modal.Header>

      <Modal.Body
        style={{
          backgroundColor: "var(--card-color)",
          maxHeight: "70vh",
          overflowY: "auto",
        }}
      >
        {error && (
          <Alert variant="danger" className="mb-3">
            {error}
          </Alert>
        )}

        <div className="d-flex justify-content-center mb-4">
          <div className="d-flex align-items-center">
            <Badge
              bg={currentStep === "customer" ? "primary" : "secondary"}
              className="me-2"
            >
              1
            </Badge>
            <span
              className={`me-3 ${currentStep === "customer" ? "fw-bold" : ""}`}
            >
              Cliente
            </span>

            <Badge
              bg={currentStep === "products" ? "primary" : "secondary"}
              className="me-2"
            >
              2
            </Badge>
            <span
              className={`me-3 ${currentStep === "products" ? "fw-bold" : ""}`}
            >
              Productos
            </span>

            <Badge
              bg={currentStep === "review" ? "primary" : "secondary"}
              className="me-2"
            >
              3
            </Badge>
            <span className={currentStep === "review" ? "fw-bold" : ""}>
              Revisión
            </span>
          </div>
        </div>

        {currentStep === "customer" && (
          <Card>
            <Card.Header>
              <FaUser className="me-2" />
              Información del Cliente
            </Card.Header>
            <Card.Body>
              <Form.Group className="mb-3">
                <OverlayTrigger
                  placement="right"
                  overlay={
                    <Tooltip id="search-customer-tooltip">
                      Busque por nombre o email. También puede crear un nuevo
                      cliente con el botón de abajo o marcar &quot;Orden de
                      Invitado&quot; para ventas rápidas sin registro.
                    </Tooltip>
                  }
                >
                  <Form.Label>
                    Buscar cliente existente{" "}
                    <FaInfoCircle
                      className="text-muted"
                      style={{ fontSize: "0.85em" }}
                    />
                  </Form.Label>
                </OverlayTrigger>
                <InputGroup>
                  <Form.Control
                    type="text"
                    placeholder="Escriba el nombre o email del cliente..."
                    value={customerSearch}
                    onChange={(e) => {
                      setCustomerSearch(e.target.value);
                      searchCustomers(e.target.value);
                    }}
                    disabled={isGuestOrder}
                  />
                  <InputGroup.Text>
                    {isSearchingCustomers ? (
                      <Spinner size="sm" />
                    ) : (
                      <FaSearch />
                    )}
                  </InputGroup.Text>
                </InputGroup>
              </Form.Group>

              {selectedCustomer && (
                <Alert variant="success">
                  <strong>Cliente seleccionado:</strong>{" "}
                  {selectedCustomer.name || selectedCustomer.email}
                  <Button
                    variant="link"
                    size="sm"
                    className="float-end"
                    onClick={() => {
                      setSelectedCustomer(null);
                      setIsGuestOrder(false);
                    }}
                  >
                    <FaTimes />
                  </Button>
                </Alert>
              )}

              {customerSearchResults.length > 0 && !selectedCustomer && (
                <div className="mt-3">
                  <h6>Resultados de búsqueda:</h6>
                  <div style={{ maxHeight: "200px", overflowY: "auto" }}>
                    {customerSearchResults.map((customer) => (
                      <div
                        key={customer.id}
                        className="border rounded p-2 mb-2 cursor-pointer"
                        style={{
                          cursor: "pointer",
                          backgroundColor: "var(--bg-color)",
                        }}
                        onMouseOver={(e) => {
                          e.currentTarget.style.backgroundColor =
                            "var(--primary-color-light)";
                        }}
                        onMouseOut={(e) => {
                          e.currentTarget.style.backgroundColor =
                            "var(--bg-color)";
                        }}
                        onClick={() => {
                          setSelectedCustomer(customer);
                          setIsGuestOrder(false);
                          setCustomerSearch("");
                          setCustomerSearchResults([]);
                        }}
                      >
                        <strong>{customer.name || customer.email}</strong>
                        {customer.name && (
                          <div>
                            <small className="text-muted">
                              {customer.email}
                            </small>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div
                className="mt-3 p-3 border rounded"
                style={{ backgroundColor: "var(--warning-light, #fff3cd)" }}
              >
                <Form.Check
                  type="checkbox"
                  id="guest-order-checkbox"
                  checked={isGuestOrder}
                  onChange={(e) => {
                    setIsGuestOrder(e.target.checked);
                    if (e.target.checked) {
                      setSelectedCustomer(null);
                      setCustomerSearch("");
                      setCustomerSearchResults([]);
                    }
                  }}
                  label={
                    <OverlayTrigger
                      placement="right"
                      overlay={
                        <Tooltip id="guest-order-tooltip">
                          Solo use esta opción para ventas rápidas sin
                          información del cliente. El cliente NO aparecerá en la
                          vista de clientes.
                        </Tooltip>
                      }
                    >
                      <strong>
                        Orden de Invitado (NO se creará registro de cliente){" "}
                        <FaInfoCircle
                          className="text-muted"
                          style={{ fontSize: "0.85em" }}
                        />
                      </strong>
                    </OverlayTrigger>
                  }
                />
              </div>

              <div className="mt-4 pt-3 border-top">
                <div className="d-flex align-items-center justify-content-between mb-3">
                  <div>
                    <strong>¿Cliente nuevo?</strong>
                    <p className="text-muted small mb-0">
                      Cree un perfil de cliente para hacer seguimiento de sus
                      compras
                    </p>
                  </div>
                  {!showNewCustomerForm && (
                    <Button
                      variant="primary"
                      size="lg"
                      onClick={() => setShowNewCustomerForm(true)}
                      disabled={isGuestOrder}
                      className="d-flex align-items-center"
                    >
                      <FaPlus className="me-2" />
                      Crear Nuevo Cliente
                    </Button>
                  )}
                </div>

                {showNewCustomerForm && (
                  <Card>
                    <Card.Header className="d-flex justify-content-between align-items-center">
                      <span>Nuevo Cliente</span>
                      <Button
                        variant="link"
                        size="sm"
                        onClick={() => {
                          setShowNewCustomerForm(false);
                          resetNewCustomerForm();
                        }}
                      >
                        <FaTimes />
                      </Button>
                    </Card.Header>
                    <Card.Body>
                      <Row>
                        <Col md={6}>
                          <Form.Group className="mb-3">
                            <Form.Label>Nombre *</Form.Label>
                            <Form.Control
                              type="text"
                              placeholder="Nombre completo"
                              value={newCustomerData.name}
                              onChange={(e) =>
                                setNewCustomerData({
                                  ...newCustomerData,
                                  name: e.target.value,
                                })
                              }
                              required
                            />
                          </Form.Group>
                        </Col>

                        <Col md={6}>
                          <Form.Group className="mb-3">
                            <Form.Label>Email *</Form.Label>
                            <Form.Control
                              type="email"
                              placeholder="correo@ejemplo.com"
                              value={newCustomerData.email}
                              onChange={(e) =>
                                setNewCustomerData({
                                  ...newCustomerData,
                                  email: e.target.value,
                                })
                              }
                              required
                            />
                          </Form.Group>
                        </Col>
                      </Row>

                      <Row>
                        <Col md={6}>
                          <Form.Group className="mb-3">
                            <Form.Label>Teléfono</Form.Label>
                            <Form.Control
                              type="tel"
                              placeholder="+57 300 123 4567"
                              value={newCustomerData.phone}
                              onChange={(e) =>
                                setNewCustomerData({
                                  ...newCustomerData,
                                  phone: e.target.value,
                                })
                              }
                            />
                          </Form.Group>
                        </Col>

                        <Col md={6}>
                          <Form.Group className="mb-3">
                            <Form.Label>Número de Documento</Form.Label>
                            <Form.Control
                              type="text"
                              placeholder="1234567890"
                              value={newCustomerData.documentNumber}
                              onChange={(e) =>
                                setNewCustomerData({
                                  ...newCustomerData,
                                  documentNumber: e.target.value,
                                })
                              }
                            />
                          </Form.Group>
                        </Col>
                      </Row>

                      <Form.Group className="mb-3">
                        <Form.Label>Dirección</Form.Label>
                        <Form.Control
                          type="text"
                          placeholder="Calle 123 #45-67"
                          value={newCustomerData.address}
                          onChange={(e) =>
                            setNewCustomerData({
                              ...newCustomerData,
                              address: e.target.value,
                            })
                          }
                        />
                      </Form.Group>

                      <Row>
                        <Col md={6}>
                          <Form.Group className="mb-3">
                            <Form.Label>Ciudad</Form.Label>
                            <Form.Control
                              type="text"
                              placeholder="Bogotá"
                              value={newCustomerData.city}
                              onChange={(e) =>
                                setNewCustomerData({
                                  ...newCustomerData,
                                  city: e.target.value,
                                })
                              }
                            />
                          </Form.Group>
                        </Col>

                        <Col md={6}>
                          <Form.Group className="mb-3">
                            <Form.Label>Código Postal</Form.Label>
                            <Form.Control
                              type="text"
                              placeholder="110111"
                              value={newCustomerData.postalCode}
                              onChange={(e) =>
                                setNewCustomerData({
                                  ...newCustomerData,
                                  postalCode: e.target.value,
                                })
                              }
                            />
                          </Form.Group>
                        </Col>
                      </Row>

                      <Form.Group className="mb-3">
                        <Form.Label>Fecha de Nacimiento</Form.Label>
                        <Form.Control
                          type="date"
                          value={newCustomerData.birthDate}
                          onChange={(e) =>
                            setNewCustomerData({
                              ...newCustomerData,
                              birthDate: e.target.value,
                            })
                          }
                        />
                      </Form.Group>

                      <Form.Group className="mb-3">
                        <Form.Label>Notas</Form.Label>
                        <Form.Control
                          as="textarea"
                          rows={2}
                          placeholder="Notas adicionales sobre el cliente"
                          value={newCustomerData.notes}
                          onChange={(e) =>
                            setNewCustomerData({
                              ...newCustomerData,
                              notes: e.target.value,
                            })
                          }
                        />
                      </Form.Group>

                      <Button
                        variant="success"
                        onClick={createNewCustomer}
                        disabled={
                          isCreatingCustomer ||
                          !newCustomerData.name ||
                          !newCustomerData.email
                        }
                      >
                        {isCreatingCustomer ? (
                          <>
                            <Spinner size="sm" className="me-2" />
                            Creando...
                          </>
                        ) : (
                          <>
                            <FaCheck className="me-2" />
                            Crear y Seleccionar
                          </>
                        )}
                      </Button>
                    </Card.Body>
                  </Card>
                )}
              </div>
            </Card.Body>
          </Card>
        )}

        {currentStep === "products" && (
          <Card>
            <Card.Header>
              <FaBox className="me-2" />
              Seleccionar Productos
            </Card.Header>
            <Card.Body>
              <Form.Group className="mb-3">
                <Form.Label>Buscar productos</Form.Label>
                <InputGroup>
                  <Form.Control
                    type="text"
                    placeholder="Escriba el nombre del producto..."
                    value={productSearch}
                    onChange={(e) => {
                      setProductSearch(e.target.value);
                      searchProducts(e.target.value);
                    }}
                  />
                  <InputGroup.Text>
                    {isSearchingProducts ? <Spinner size="sm" /> : <FaSearch />}
                  </InputGroup.Text>
                </InputGroup>
              </Form.Group>

              {productSearchResults.length > 0 && (
                <div className="mb-4">
                  <h6>Resultados de búsqueda:</h6>
                  <div style={{ maxHeight: "200px", overflowY: "auto" }}>
                    {productSearchResults.map((product) => (
                      <div
                        key={product.id}
                        className="border rounded p-2 mb-2 d-flex justify-content-between align-items-center"
                        style={{ backgroundColor: "var(--bg-color)" }}
                      >
                        <div>
                          <strong>{product.title}</strong>
                          <div>
                            <small className="text-muted">
                              $
                              {formatNumberWithCommas(
                                typeof product.basePrice === "string"
                                  ? parseFloat(product.basePrice) || 0
                                  : product.basePrice || 0,
                                0,
                              )}
                              {product.stock !== null &&
                                ` - Stock: ${product.stock}`}
                            </small>
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant="primary"
                          onClick={() => addProduct(product)}
                          disabled={product.stock === 0}
                        >
                          <FaPlus />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {selectedProducts.length > 0 && (
                <div>
                  <h6>Productos seleccionados:</h6>
                  <Table striped bordered size="sm">
                    <thead>
                      <tr>
                        <th>Producto</th>
                        <th style={{ width: "100px" }}>Cantidad</th>
                        <th style={{ width: "120px" }}>Precio Unit.</th>
                        <th style={{ width: "50px" }}>Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedProducts.map(({ product, quantity }) => (
                        <tr key={product.id}>
                          <td>
                            <strong>{product.title}</strong>
                            {product.stock !== null && (
                              <div>
                                <small className="text-muted">
                                  Stock: {product.stock}
                                </small>
                              </div>
                            )}
                          </td>
                          <td>
                            <Form.Control
                              type="number"
                              min="1"
                              max={product.stock || undefined}
                              value={quantity}
                              onChange={(e) =>
                                updateProductQuantity(
                                  product.id,
                                  parseInt(e.target.value) || 1,
                                )
                              }
                              size="sm"
                            />
                          </td>
                          <td>
                            $
                            {formatNumberWithCommas(
                              product.basePrice as number,
                              0,
                            )}
                          </td>
                          <td>
                            <Button
                              size="sm"
                              variant="danger"
                              onClick={() => removeProduct(product.id)}
                            >
                              <FaTimes />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </div>
              )}

              {selectedProducts.length === 0 && (
                <Alert variant="info">
                  Busque y seleccione productos para agregar a la orden.
                </Alert>
              )}

              {selectedProducts.length > 0 && (
                <Card className="mt-3">
                  <Card.Header>Descuento de Orden (Opcional)</Card.Header>
                  <Card.Body>
                    <Row>
                      <Col md={6}>
                        <Form.Group className="mb-2">
                          <Form.Label>Tipo de Descuento</Form.Label>
                          <Form.Select
                            value={discountType}
                            onChange={(e) =>
                              setDiscountType(
                                e.target.value as "percentage" | "fixed" | "",
                              )
                            }
                          >
                            <option value="">Sin descuento</option>
                            <option value="percentage">Porcentaje</option>
                            <option value="fixed">Cantidad Fija</option>
                          </Form.Select>
                        </Form.Group>
                      </Col>
                      <Col md={6}>
                        <Form.Group className="mb-2">
                          <Form.Label>
                            {discountType === DiscountType.PERCENTAGE
                              ? "Porcentaje (%)"
                              : "Cantidad ($)"}
                          </Form.Label>
                          <Form.Control
                            type="number"
                            min="0"
                            max={
                              discountType === DiscountType.PERCENTAGE ? 100 : undefined
                            }
                            step={discountType === DiscountType.PERCENTAGE ? "1" : "100"}
                            value={discountValue}
                            onChange={(e) =>
                              setDiscountValue(parseFloat(e.target.value) || 0)
                            }
                            disabled={!discountType}
                            placeholder={
                              discountType === DiscountType.PERCENTAGE
                                ? "Ej: 10"
                                : "Ej: 5000"
                            }
                          />
                        </Form.Group>
                      </Col>
                    </Row>
                    {discountType && discountValue > 0 && (
                      <Alert variant="success" className="mt-2 mb-0">
                        <small>
                          Se aplicará un descuento de{" "}
                          {discountType === DiscountType.PERCENTAGE
                            ? `${discountValue}%`
                            : `$${formatNumberWithCommas(discountValue, 0)}`}{" "}
                          sobre el subtotal
                        </small>
                      </Alert>
                    )}
                  </Card.Body>
                </Card>
              )}

              {selectedProducts.length > 0 && (
                <Card className="mt-3">
                  <Card.Header>Documentos Adjuntos (Opcional)</Card.Header>
                  <Card.Body>
                    <DocumentUploader
                      currentDocuments={documents}
                      onDocumentsChange={setDocumentFiles}
                      maxFiles={5}
                      label="Adjuntar Documentos (PDF, Word, Excel, Imágenes)"
                    />
                    {isUploadingDocuments && (
                      <Alert variant="info" className="mt-2 mb-0">
                        <Spinner size="sm" className="me-2" />
                        Subiendo documentos a Firebase Storage...
                      </Alert>
                    )}
                  </Card.Body>
                </Card>
              )}
            </Card.Body>
          </Card>
        )}

        {currentStep === "review" && (
          <div>
            <Card className="mb-3">
              <Card.Header>
                <FaCalculator className="me-2" />
                Resumen de la Orden
              </Card.Header>
              <Card.Body>
                {isValidating ? (
                  <div className="text-center py-4">
                    <Spinner />
                    <div className="mt-2">Validando orden...</div>
                  </div>
                ) : orderValidation ? (
                  <div>
                    {!orderValidation.isValid && (
                      <Alert variant="danger">
                        <strong>Errores:</strong>
                        <ul className="mb-0 mt-2">
                          {orderValidation.errors.map((error, index) => (
                            <li key={index}>{error}</li>
                          ))}
                        </ul>
                      </Alert>
                    )}

                    {orderValidation.isValid && (
                      <div>
                        <Row>
                          <Col md={6}>
                            <h6>Cliente:</h6>
                            <p>
                              {selectedCustomer
                                ? `${selectedCustomer.name || selectedCustomer.email}`
                                : "Orden de invitado"}
                            </p>

                            <h6>Productos:</h6>
                            {orderValidation.items.map((item) => {
                              const selectedProduct = selectedProducts.find(
                                (sp) => sp.product.id === item.productId,
                              );
                              return (
                                <div key={item.productId} className="mb-2">
                                  <strong>
                                    {selectedProduct?.product.title}
                                  </strong>{" "}
                                  x {item.quantity}
                                  <div>
                                    <small className="text-muted">
                                      $
                                      {formatNumberWithCommas(
                                        typeof item.unitPrice === "string"
                                          ? parseFloat(item.unitPrice) || 0
                                          : item.unitPrice || 0,
                                        0,
                                      )}{" "}
                                      c/u = $
                                      {formatNumberWithCommas(
                                        typeof item.totalPrice === "string"
                                          ? parseFloat(item.totalPrice) || 0
                                          : item.totalPrice || 0,
                                        0,
                                      )}
                                    </small>
                                  </div>
                                </div>
                              );
                            })}
                          </Col>

                          <Col md={6}>
                            <h6>Totales:</h6>
                            <div
                              className="border rounded p-3"
                              style={{ backgroundColor: "var(--bg-color)" }}
                            >
                              <div className="d-flex justify-content-between">
                                <span>Subtotal:</span>
                                <span>
                                  $
                                  {formatNumberWithCommas(
                                    orderValidation.subTotal as number,
                                    0,
                                  )}
                                </span>
                              </div>
                              {orderValidation.discountTotal > 0 && (
                                <div className="d-flex justify-content-between text-success">
                                  <span>Descuentos (productos):</span>
                                  <span>
                                    -$
                                    {formatNumberWithCommas(
                                      orderValidation.discountTotal as number,
                                      0,
                                    )}
                                  </span>
                                </div>
                              )}
                              {discountType && discountValue > 0 && (
                                <div className="d-flex justify-content-between text-success">
                                  <span>
                                    Descuento orden (
                                    {discountType === DiscountType.PERCENTAGE
                                      ? `${discountValue}%`
                                      : "fijo"}
                                    ):
                                  </span>
                                  <span>
                                    -
                                    {discountType === DiscountType.PERCENTAGE
                                      ? `$${formatNumberWithCommas(((orderValidation.subTotal as number) * discountValue) / 100, 0)}`
                                      : `$${formatNumberWithCommas(discountValue, 0)}`}
                                  </span>
                                </div>
                              )}
                              {orderValidation.taxTotal > 0 && (
                                <div className="d-flex justify-content-between">
                                  <span>Impuestos:</span>
                                  <span>
                                    $
                                    {formatNumberWithCommas(
                                      orderValidation.taxTotal as number,
                                      0,
                                    )}
                                  </span>
                                </div>
                              )}
                              {orderValidation.delivery &&
                                orderValidation.delivery > 0 && (
                                  <div className="d-flex justify-content-between">
                                    <span>Envío:</span>
                                    <span>
                                      $
                                      {formatNumberWithCommas(
                                        orderValidation.delivery as number,
                                        0,
                                      )}
                                    </span>
                                  </div>
                                )}
                              <hr />
                              <div className="d-flex justify-content-between fw-bold">
                                <span>Total:</span>
                                <span>
                                  $
                                  {formatNumberWithCommas(
                                    orderValidation.total as number,
                                    0,
                                  )}
                                </span>
                              </div>
                            </div>

                            {documents.length > 0 && (
                              <div className="mt-3">
                                <h6>Documentos Adjuntos:</h6>
                                <div className="small">
                                  {documents.map((doc, index) => (
                                    <div key={index} className="text-truncate">
                                      📎{" "}
                                      <a
                                        href={doc}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                      >
                                        {doc}
                                      </a>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </Col>
                        </Row>
                      </div>
                    )}
                  </div>
                ) : (
                  <Alert variant="warning">No se pudo validar la orden.</Alert>
                )}
              </Card.Body>
            </Card>

            <Card className="mb-3">
              <Card.Header>Método de Pago</Card.Header>
              <Card.Body>
                <Form.Group className="mb-3">
                  <Form.Label>Seleccione el método de pago</Form.Label>
                  <Form.Select
                    value={paymentMethod}
                    onChange={(e) =>
                      setPaymentMethod(e.target.value as PaymentMethod)
                    }
                  >
                    <option value="cash">Efectivo</option>
                    <option value="bank_transfer">
                      Transferencia Bancaria
                    </option>
                    <option value="wompi">Wompi</option>
                    <option value="bold">Bold</option>
                    <option value="credit">Crédito</option>
                  </Form.Select>
                </Form.Group>

                {paymentMethod === PaymentMethod.CREDIT && (
                  <Form.Group>
                    <Form.Label>Días de crédito</Form.Label>
                    <Form.Control
                      type="number"
                      min="0"
                      value={creditDays}
                      onChange={(e) =>
                        setCreditDays(parseInt(e.target.value) || 0)
                      }
                      placeholder="Ej: 30"
                    />
                  </Form.Group>
                )}
              </Card.Body>
            </Card>

            <Card className="mb-3">
              <Card.Header>Estado Inicial</Card.Header>
              <Card.Body>
                <Form.Group>
                  <Form.Label>
                    Seleccione el estado inicial de la orden
                  </Form.Label>
                  <Form.Select
                    value={initialStatus}
                    onChange={(e) =>
                      setInitialStatus(e.target.value as OrderStatus)
                    }
                  >
                    <option value={OrderStatus.PENDING}>Pendiente</option>
                    <option value={OrderStatus.PAID}>Pagada</option>
                    <option value={OrderStatus.SHIPPED}>Enviada</option>
                    <option value={OrderStatus.DELIVERED}>Entregada</option>
                  </Form.Select>
                  <Form.Text className="text-muted">
                    Puede establecer el estado inicial para ahorrar pasos
                    administrativos
                  </Form.Text>
                </Form.Group>
              </Card.Body>
            </Card>

            <Card className="mb-3">
              <Card.Header>Notas</Card.Header>
              <Card.Body>
                <Form.Group>
                  <Form.Label>Notas de la orden (opcional)</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={3}
                    placeholder="Notas, comentarios u observaciones para esta orden"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                  />
                </Form.Group>
              </Card.Body>
            </Card>

            {deliveryZones.length > 0 && (
              <Card className="mb-3">
                <Card.Header>Zona de Entrega</Card.Header>
                <Card.Body>
                  <Form.Group>
                    <Form.Label>
                      Seleccione una zona de entrega (opcional)
                    </Form.Label>
                    <Form.Select
                      value={selectedDeliveryZone?.id || ""}
                      onChange={(e) => {
                        const zoneId = parseInt(e.target.value);
                        const zone = deliveryZones.find((z) => z.id === zoneId);
                        setSelectedDeliveryZone(zone || null);
                      }}
                    >
                      <option value="">Sin zona de entrega</option>
                      {deliveryZones.map((zone) => (
                        <option key={zone.id} value={zone.id}>
                          {zone.zone} - $
                          {formatNumberWithCommas(
                            typeof zone.price === "string"
                              ? parseFloat(zone.price) || 0
                              : zone.price || 0,
                            0,
                          )}{" "}
                          ({zone.estimatedTime})
                        </option>
                      ))}
                    </Form.Select>
                  </Form.Group>
                </Card.Body>
              </Card>
            )}

            {taxes.length > 0 && (
              <Card className="mb-3">
                <Card.Header>Impuestos Adicionales</Card.Header>
                <Card.Body>
                  <Form.Group>
                    <Form.Label>
                      Seleccione impuestos a aplicar (opcional)
                    </Form.Label>
                    {taxes.map((tax) => (
                      <Form.Check
                        key={tax.id}
                        type="checkbox"
                        id={`tax-${tax.id}`}
                        label={`${tax.name} (${tax.rate}%)`}
                        checked={selectedTaxIds.includes(tax.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedTaxIds([...selectedTaxIds, tax.id]);
                          } else {
                            setSelectedTaxIds(
                              selectedTaxIds.filter((id) => id !== tax.id)
                            );
                          }
                        }}
                      />
                    ))}
                    {selectedTaxIds.length > 0 && (
                      <Alert variant="info" className="mt-2 mb-0">
                        <small>
                          Los impuestos se calcularán sobre el subtotal de la orden
                        </small>
                      </Alert>
                    )}
                  </Form.Group>
                </Card.Body>
              </Card>
            )}

            {customQuestions.length > 0 && (
              <Card>
                <Card.Header>Preguntas Personalizadas</Card.Header>
                <Card.Body>
                  {customQuestions.map((question, index) => (
                    <Form.Group key={index} className="mb-3">
                      <Form.Label>{question.question}</Form.Label>
                      <Form.Control
                        type="text"
                        value={customAnswers[index]?.answer || ""}
                        onChange={(e) => {
                          const newAnswers = [...customAnswers];
                          newAnswers[index] = {
                            question: question.question,
                            answer: e.target.value,
                          };
                          setCustomAnswers(newAnswers);
                        }}
                        required={question.required}
                      />
                    </Form.Group>
                  ))}
                </Card.Body>
              </Card>
            )}
          </div>
        )}
      </Modal.Body>

      <Modal.Footer
        style={{
          backgroundColor: "var(--card-color)",
          borderColor: "var(--border-color)",
        }}
      >
        <Button
          variant="secondary"
          onClick={currentStep === "customer" ? onHide : goToPreviousStep}
        >
          {currentStep === "customer" ? "Cancelar" : "Anterior"}
        </Button>

        {currentStep !== "review" ? (
          <Button
            variant="primary"
            onClick={goToNextStep}
            disabled={!canGoToNextStep}
          >
            Siguiente
          </Button>
        ) : (
          <Button
            variant="success"
            onClick={createOrder}
            disabled={!orderValidation?.isValid || isCreating}
          >
            {isCreating ? (
              <>
                <Spinner size="sm" className="me-2" />
                Creando...
              </>
            ) : (
              <>
                <FaCheck className="me-2" />
                Crear Orden
              </>
            )}
          </Button>
        )}
      </Modal.Footer>
    </Modal>
  );
}
