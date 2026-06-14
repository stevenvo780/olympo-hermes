import React, { useState, useMemo } from 'react';
import { Modal, Button, Row, Col, Table, Spinner, Form, Alert, Card } from 'react-bootstrap';
import { Order, OrderStatus, PaymentMethod, DiscountType } from '@/types/order';
import { Tax, DeliveryZone, Product } from '@/types';
import StatusBadge from './StatusBadge';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { FaTrash, FaUser, FaEnvelope, FaPhone, FaMapMarkerAlt, FaShoppingCart, FaStickyNote, FaQuestionCircle, FaTruck, FaCreditCard, FaPercentage, FaFile, FaPlus } from 'react-icons/fa';
import StatusSelector from './StatusSelector';
import { formatNumberWithCommas, parseEsNumber } from '@/utils/formatters';
import api from '@/utils/axios';
import DocumentUploader from '@/components/DocumentUploader';
import { storage } from '@/utils/firebase';

interface OrderDetailProps {
  order: Order;
  onUpdateStatus: (orderId: number, status: OrderStatus) => Promise<boolean>;
  onDeleteOrder: (orderId: number) => Promise<boolean>;
  onClose: () => void;
  show: boolean;
  onPatch?: (orderId: number, patch: Partial<Order>) => void;
}

export default function OrderDetail({ order, onUpdateStatus, onDeleteOrder, onClose, show, onPatch }: OrderDetailProps) {
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [notes, setNotes] = useState<string>(order.notes || '');
  const [savingNotes, setSavingNotes] = useState<boolean>(false);
  const [notesSaved, setNotesSaved] = useState<boolean>(false);
  const [notesError, setNotesError] = useState<string | null>(null);

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(order.paymentMethod || PaymentMethod.CASH);
  const [creditDays, setCreditDays] = useState<number>(order.creditDays || 0);
  const [savingPayment, setSavingPayment] = useState<boolean>(false);
  const [paymentSaved, setPaymentSaved] = useState<boolean>(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);

  const [discountType, setDiscountType] = useState<DiscountType | null>(order.discountType || null);
  const [discountValue, setDiscountValue] = useState<number>(order.discountValue ? parseFloat(order.discountValue.toString()) : 0);
  const [savingDiscount, setSavingDiscount] = useState<boolean>(false);
  const [discountSaved, setDiscountSaved] = useState<boolean>(false);
  const [discountError, setDiscountError] = useState<string | null>(null);

  const [availableTaxes, setAvailableTaxes] = useState<Tax[]>(order.taxes || []);
  const [selectedTaxIds, setSelectedTaxIds] = useState<number[]>(order.taxes ? order.taxes.map((t) => t.id) : []);
  const [availableDeliveryZones, setAvailableDeliveryZones] = useState<DeliveryZone[]>([]);
  const [selectedDeliveryZoneId, setSelectedDeliveryZoneId] = useState<number | null>(order.deliveryZone?.id || null);
  const [savingDeliveryTaxes, setSavingDeliveryTaxes] = useState(false);
  const [deliveryTaxesError, setDeliveryTaxesError] = useState<string | null>(null);

  const [documents, setDocuments] = useState<string[]>(order.documents || []);
  const [documentInput, setDocumentInput] = useState<string>('');
  const [documentFiles, setDocumentFiles] = useState<File[]>([]);
  const [savingDocuments, setSavingDocuments] = useState<boolean>(false);
  const [documentsSaved, setDocumentsSaved] = useState<boolean>(false);
  const [documentsError, setDocumentsError] = useState<string | null>(null);

  const [isEditingProducts, setIsEditingProducts] = useState<boolean>(false);
  const [editedItems, setEditedItems] = useState<{ id: number; quantity: number; productId: number }[]>([]);
  const [savingProducts, setSavingProducts] = useState<boolean>(false);
  const [productsError, setProductsError] = useState<string | null>(null);
  const [productSearch, setProductSearch] = useState<string>('');
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [addedProductsCache, setAddedProductsCache] = useState<Map<number, Product>>(new Map());

  const toNumber = (val: string | number): number => {
    if (typeof val === 'number') return val;
    const s = (val ?? '').toString();
    const hasLocaleMarks = s.includes(',') || /\.\d{3}(\D|$)/.test(s);
    const n = hasLocaleMarks ? parseEsNumber(s) : Number(s);
    return isNaN(n) ? 0 : n;
  };

  const formatMoney = (val: string | number): string => {
    return formatNumberWithCommas(toNumber(val), 0);
  };

  const handleConfirmDelete = async () => {
    setIsDeleting(true);
    const success = await onDeleteOrder(order.id);
    if (!success) {
      setIsDeleting(false);
    }
  };

  const formattedDate = format(new Date(order.createdAt), "dd 'de' MMMM, yyyy HH:mm", { locale: es });

  const getSectionTitleStyle = () => ({
    borderBottom: '2px solid var(--primary-color)',
    paddingBottom: '0.5rem',
    marginBottom: '1rem',
    color: 'var(--card-title-color)',
    display: 'flex',
    alignItems: 'center'
  });

  React.useEffect(() => {
    setNotes(order.notes || '');
    setPaymentMethod(order.paymentMethod || PaymentMethod.CASH);
    setCreditDays(order.creditDays || 0);
    setDiscountType(order.discountType || null);
    setDiscountValue(order.discountValue ? parseFloat(order.discountValue.toString()) : 0);
    setDocuments(order.documents || []);
    setDocumentInput((order.documents || []).join('\n'));
    setDocumentFiles([]);
    setNotesSaved(false);
    setPaymentSaved(false);
    setDiscountSaved(false);
    setDocumentsSaved(false);
    setNotesError(null);
    setPaymentError(null);
    setDiscountError(null);
    setDocumentsError(null);
    setSelectedTaxIds(order.taxes ? order.taxes.map((t) => t.id) : []);
    setSelectedDeliveryZoneId(order.deliveryZone?.id || null);
  }, [order]);

  React.useEffect(() => {
    (async () => {
      try {
        const storeId = order.store?.id;
        if (!storeId) return;
        const [taxRes, dzRes] = await Promise.all([
          api.get(`/taxes/${storeId}`),
          api.get(`/delivery-zones/${storeId}`),
        ]);
        setAvailableTaxes(taxRes.data || []);
        setAvailableDeliveryZones(dzRes.data || []);
      } catch (err) {
        console.error('Error cargando taxes/delivery zones:', err);
      }
    })();
  }, [order.store?.id]);

  const handleSaveNotes = async () => {
    try {
      setSavingNotes(true);
      setNotesError(null);
      setNotesSaved(false);
      const newValue = (notes || '').trim();
      const { data: updated } = await api.patch(`/orders/${order.id}`, { notes: newValue });
      setNotes(updated?.notes || newValue);
      if (onPatch) onPatch(order.id, { notes: updated?.notes || newValue });
      setNotesSaved(true);
      setTimeout(() => setNotesSaved(false), 2000);
    } catch (err) {
      console.error('Error al actualizar notas:', err);
      setNotesError('No se pudieron guardar las notas');
    } finally {
      setSavingNotes(false);
    }
  };

  const handleSavePayment = async () => {
    try {
      setSavingPayment(true);
      setPaymentError(null);
      setPaymentSaved(false);
      const paymentData: { paymentMethod: PaymentMethod; creditDays?: number } = { paymentMethod };
      if (paymentMethod === PaymentMethod.CREDIT) {
        paymentData.creditDays = creditDays;
      }
      const { data: updated } = await api.patch(`/orders/${order.id}`, paymentData);
      if (onPatch) onPatch(order.id, { paymentMethod: updated?.paymentMethod || paymentMethod, creditDays: updated?.creditDays });
      setPaymentSaved(true);
      setTimeout(() => setPaymentSaved(false), 2000);
    } catch (err) {
      console.error('Error al actualizar método de pago:', err);
      setPaymentError('No se pudo guardar el método de pago');
    } finally {
      setSavingPayment(false);
    }
  };

  const handleSaveDiscount = async () => {
    try {
      setSavingDiscount(true);
      setDiscountError(null);
      setDiscountSaved(false);
      
      if (discountType === DiscountType.PERCENTAGE && discountValue > 100) {
        setDiscountError('El porcentaje no puede ser mayor a 100%');
        setSavingDiscount(false);
        return;
      }

      if (discountValue < 0) {
        setDiscountError('El descuento no puede ser negativo');
        setSavingDiscount(false);
        return;
      }
      
      const discountData: { discountType: DiscountType | null; discountValue: number | null } = {
        discountType: discountType || null,
        discountValue: discountType ? discountValue : null,
      };

      const { data: updated } = await api.patch(`/orders/${order.id}`, discountData);
      if (onPatch) onPatch(order.id, { 
        discountType: updated?.discountType || discountType, 
        discountValue: updated?.discountValue || discountValue,
        amount: updated?.amount || order.amount
      });
      setDiscountSaved(true);
      setTimeout(() => setDiscountSaved(false), 2000);
    } catch (err) {
      console.error('Error al actualizar descuento:', err);
      const errorMessage = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'No se pudo guardar el descuento';
      setDiscountError(errorMessage);
    } finally {
      setSavingDiscount(false);
    }
  };

  const handleSaveDeliveryAndTaxes = async () => {
    try {
      setSavingDeliveryTaxes(true);
      setDeliveryTaxesError(null);
      const payload: { deliveryZoneId?: number | null; taxIds?: number[] } = {
        deliveryZoneId: selectedDeliveryZoneId,
        taxIds: selectedTaxIds,
      };
      const { data: updated } = await api.patch(`/orders/${order.id}`, payload);
      if (onPatch) onPatch(order.id, updated);
      setSelectedDeliveryZoneId(updated.deliveryZone?.id || null);
      setSelectedTaxIds(updated.taxes ? updated.taxes.map((t) => t.id) : []);
      setDeliveryTaxesError(null);
      setTimeout(() => {}, 500);
    } catch (err) {
      console.error('Error guardando delivery/taxes:', err);
      setDeliveryTaxesError('No se pudo guardar zona de envío o impuestos');
    } finally {
      setSavingDeliveryTaxes(false);
    }
  };

  const handleSaveDocuments = async () => {
    try {
      setSavingDocuments(true);
      setDocumentsError(null);
      setDocumentsSaved(false);

      const manualUrls = documentInput
        .split('\n')
        .map(url => url.trim())
        .filter(url => url.length > 0);

      const urlPattern = /^https?:\/\/.+/i;
      const invalidUrls = manualUrls.filter(url => !urlPattern.test(url));
      
      if (invalidUrls.length > 0) {
        setDocumentsError(`URLs inválidas: ${invalidUrls.join(', ')}`);
        setSavingDocuments(false);
        return;
      }

      let uploadedUrls: string[] = [];
      if (documentFiles.length > 0) {
        try {
          const uploadPromises = documentFiles.map(async (file) => {
            const timestamp = Date.now();
            const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
            const fileRef = storage.ref(`/orders/${order.id}/documents/${sanitizedFileName}-${timestamp}`);
            await fileRef.put(file);
            return await fileRef.getDownloadURL();
          });
          
          uploadedUrls = await Promise.all(uploadPromises);
        } catch (uploadError) {
          console.error('Error uploading documents:', uploadError);
          setDocumentsError('Error al subir archivos a Firebase Storage');
          setSavingDocuments(false);
          return;
        }
      }

      const allUrls = [...manualUrls, ...uploadedUrls];

      const { data: updated } = await api.patch(`/orders/${order.id}`, { documents: allUrls });
      setDocuments(allUrls);
      setDocumentInput(allUrls.join('\n'));
      setDocumentFiles([]);
      if (onPatch) onPatch(order.id, { documents: updated?.documents || allUrls });
      setDocumentsSaved(true);
      setTimeout(() => setDocumentsSaved(false), 2000);
    } catch (err) {
      console.error('Error al actualizar documentos:', err);
      setDocumentsError('No se pudieron guardar los documentos');
    } finally {
      setSavingDocuments(false);
    }
  };

  const handleStartEditProducts = () => {
    setIsEditingProducts(true);
    setEditedItems(
      (order.items || []).map(item => ({
        id: item.id,
        quantity: item.quantity,
        productId: item.product.id
      }))
    );
    setProductsError(null);
    setProductSearch('');
    setSearchResults([]);
    setAddedProductsCache(new Map());
  };

  const handleCancelEditProducts = () => {
    setIsEditingProducts(false);
    setEditedItems([]);
    setProductsError(null);
    setProductSearch('');
    setSearchResults([]);
    setAddedProductsCache(new Map());
  };

  const handleSearchProducts = async (query: string) => {
    setProductSearch(query);
    
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const response = await api.get(`/products/${order.store.id}`, {
        params: {
          text: query,
          limit: 10,
          exist: true
        }
      });
      setSearchResults(response.data.products || []);
    } catch (error) {
      console.error('Error searching products:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleAddProduct = (product: Product) => {
    const existingItemFromOrder = order.items?.find(i => i.product.id === product.id);

    if (existingItemFromOrder) {
      const existingInEdited = editedItems.find(i => i.id === existingItemFromOrder.id);
      if (existingInEdited) {
        setEditedItems(prev =>
          prev.map(item =>
            item.id === existingItemFromOrder.id 
              ? { ...item, quantity: item.quantity + 1 } 
              : item
          )
        );
      } else {
        setEditedItems(prev => [...prev, {
          id: existingItemFromOrder.id,
          quantity: 1,
          productId: product.id
        }]);
      }
    } else {
      const tempId = -(editedItems.length + 1);
      setEditedItems(prev => [...prev, {
        id: tempId,
        quantity: 1,
        productId: product.id
      }]);

      setAddedProductsCache(prev => {
        const newCache = new Map(prev);
        newCache.set(product.id, product);
        return newCache;
      });
    }
    
    setProductSearch('');
    setSearchResults([]);
  };

  const handleQuantityChange = (itemId: number, newQuantity: number) => {
    setEditedItems(prev =>
      prev.map(item =>
        item.id === itemId ? { ...item, quantity: Math.max(1, newQuantity) } : item
      )
    );
  };

  const handleRemoveItem = (itemId: number) => {
    setEditedItems(prev => prev.filter(item => item.id !== itemId));
  };

  const handleSaveProducts = async () => {
    try {
      setSavingProducts(true);
      setProductsError(null);

      if (editedItems.length === 0) {
        setProductsError('Debe haber al menos un producto en la orden');
        setSavingProducts(false);
        return;
      }

      const itemsPayload = editedItems.map(item => ({
        id: item.id,
        quantity: item.quantity,
        productId: item.productId
      }));

      const { data: updated } = await api.patch(`/orders/${order.id}`, { 
        items: itemsPayload 
      });

      if (onPatch) {
        onPatch(order.id, {
          items: updated?.items || order.items,
          amount: updated?.amount || order.amount
        });
      }

      setIsEditingProducts(false);
      setProductsError(null);
      setAddedProductsCache(new Map());

      setTimeout(() => {
        window.location.reload();
      }, 500);
    } catch (err) {
      console.error('Error al actualizar productos:', err);
      const errorMessage = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'No se pudieron guardar los cambios de productos';
      setProductsError(errorMessage);
    } finally {
      setSavingProducts(false);
    }
  };

  const calculatedTotals = useMemo(() => {
    if (!isEditingProducts) {
      const subtotal = (order.items || []).reduce((sum, item) => {
        return sum + (toNumber(item.unitPrice) * item.quantity);
      }, 0);
      
      return {
        subtotal,
        discountTotal: order.amount.discountTotal,
        taxTotal: order.amount.taxTotal,
        delivery: order.amount.delivery,
        total: order.amount.total
      };
    }

    let subtotal = 0;
    for (const editedItem of editedItems) {
      const originalItem = order.items?.find(i => i.id === editedItem.id);
      const productInfo = originalItem?.product || addedProductsCache.get(editedItem.productId);
      
      if (productInfo) {
        const unitPrice = originalItem?.unitPrice || productInfo.basePrice;
        subtotal += toNumber(unitPrice) * editedItem.quantity;
      }
    }

    let discountAmount = 0;
    if (discountType && discountValue > 0) {
      if (discountType === DiscountType.PERCENTAGE) {
        discountAmount = subtotal * (discountValue / 100);
      } else {
        discountAmount = discountValue;
      }
    }

    const subtotalAfterDiscount = subtotal - discountAmount;

    const selectedTaxes = availableTaxes.filter(t => selectedTaxIds.includes(t.id));
    let taxTotal = 0;
    for (const tax of selectedTaxes) {
      taxTotal += subtotalAfterDiscount * (toNumber(tax.rate) / 100);
    }

    const selectedZone = availableDeliveryZones.find(z => z.id === selectedDeliveryZoneId);
    let delivery = selectedZone ? toNumber(selectedZone.price) : 0;

    if (selectedZone?.freeShippingThreshold && subtotalAfterDiscount >= selectedZone.freeShippingThreshold) {
      delivery = 0;
    }

    const total = subtotalAfterDiscount + taxTotal + delivery;

    return {
      subtotal,
      discountTotal: discountAmount,
      taxTotal,
      delivery,
      total
    };
  }, [
    isEditingProducts,
    editedItems,
    order.items,
    order.amount,
    addedProductsCache,
    discountType,
    discountValue,
    availableTaxes,
    selectedTaxIds,
    availableDeliveryZones,
    selectedDeliveryZoneId
  ]);

  return (
    <>
      <Modal
        show={show}
        onHide={onClose}
        size="lg"
        centered
        dialogClassName="order-detail-modal"
      >
        <Modal.Header
          style={{
            backgroundColor: 'var(--bg-color)',
            color: 'var(--card-title-color)',
            borderBottom: `3px solid ${getStatusBorderColor(order.status)}`,
          }}
          closeButton
        >
          <Modal.Title>
            Orden #{order.id}
            <span className="ms-2" style={{ fontSize: '0.9rem' }}>{formattedDate}</span>
          </Modal.Title>
        </Modal.Header>

        <Modal.Body style={{ backgroundColor: 'var(--card-color)', color: 'var(--card-text)', maxHeight: '80vh', overflowY: 'auto' }}>
          <div className="mb-4 pb-3" style={{ borderBottom: '1px solid var(--border-color)' }}>
            <div className="d-flex align-items-center mb-3">
              <StatusBadge status={order.status} size="lg" />
            </div>
            <StatusSelector
              currentStatus={order.status}
              orderId={order.id}
              onUpdateStatus={onUpdateStatus}
            />
          </div>

          <div className="mb-4">
            <h6 style={getSectionTitleStyle()}>
              <FaUser className="me-2" style={{ color: 'var(--info-color)' }} /> Información del Cliente
            </h6>
            <Row>
              <Col>
                <div className="mb-3 d-flex">
                  <div style={{ minWidth: '120px', fontWeight: 600 }}>Nombre:</div>
                  <div>{order.customer?.name || order.user?.name || 'No especificado'}</div>
                </div>
                <div className="mb-3 d-flex">
                  <div style={{ minWidth: '120px', fontWeight: 600 }}>Email:</div>
                  <div className="d-flex align-items-center">
                    <FaEnvelope className="me-1" style={{ color: 'var(--info-color)', fontSize: '0.9rem' }} />
                    {order.customer?.email || order.user?.email || 'No especificado'}
                  </div>
                </div>
                <div className="mb-3 d-flex">
                  <div style={{ minWidth: '120px', fontWeight: 600 }}>Teléfono:</div>
                  <div className="d-flex align-items-center">
                    <FaPhone className="me-1" style={{ color: 'var(--info-color)', fontSize: '0.9rem' }} />
                    {order.customer?.phone || order.user?.profile?.additionalPhone || 'No especificado'}
                  </div>
                </div>
                <div className="mb-3 d-flex">
                  <div style={{ minWidth: '120px', fontWeight: 600 }}>Documento:</div>
                  <div>{order.customer?.documentNumber || 'No especificado'}</div>
                </div>
                <div className="mb-3">
                  <div style={{ fontWeight: 600, marginBottom: '0.5rem', display: 'flex', alignItems: 'center' }}>
                    <FaMapMarkerAlt className="me-2" style={{ color: 'var(--primary-color)' }} />
                    Dirección Registrada del Cliente:
                  </div>
                  {order.customer?.address ? (
                    <div className="ps-3 border-start" style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-light, #f8f9fa)', padding: '0.75rem', borderRadius: '4px' }}>
                      <div><strong>Dirección:</strong> {order.customer.address}</div>
                      {order.customer.city && <div><strong>Ciudad:</strong> {order.customer.city}</div>}
                      {order.customer.postalCode && <div><strong>Código Postal:</strong> {order.customer.postalCode}</div>}
                    </div>
                  ) : (
                    <div className="ps-3 text-muted">No hay dirección registrada para este cliente</div>
                  )}
                </div>
              </Col>
            </Row>
          </div>

          <div className="mb-4">
            <h6 style={getSectionTitleStyle()}>
              <FaCreditCard className="me-2" style={{ color: 'var(--success-color)' }} /> Información de Pago
            </h6>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label style={{ fontWeight: 600 }}>Método de pago</Form.Label>
                  <Form.Select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                  >
                    <option value={PaymentMethod.CASH}>Efectivo</option>
                    <option value={PaymentMethod.BANK_TRANSFER}>Transferencia bancaria</option>
                    <option value={PaymentMethod.WOMPI}>Wompi</option>
                    <option value={PaymentMethod.BOLD}>Bold</option>
                    <option value={PaymentMethod.CREDIT}>Crédito</option>
                  </Form.Select>
                </Form.Group>
                {paymentMethod === PaymentMethod.CREDIT && (
                  <Form.Group className="mb-3">
                    <Form.Label style={{ fontWeight: 600 }}>Días de crédito</Form.Label>
                    <Form.Control
                      type="number"
                      min="0"
                      value={creditDays}
                      onChange={(e) => setCreditDays(parseInt(e.target.value) || 0)}
                    />
                  </Form.Group>
                )}
              </Col>
              <Col md={6} className="d-flex align-items-start">
                <div className="d-flex flex-column gap-3 mt-4">
                  <Button
                    variant="primary"
                    onClick={handleSavePayment}
                    disabled={savingPayment}
                    size="sm"
                  >
                    {savingPayment ? (
                      <>
                        <Spinner as="span" animation="border" size="sm" className="me-2" />
                        Guardando...
                      </>
                    ) : (
                      'Guardar método de pago'
                    )}
                  </Button>
                  {paymentSaved && (
                    <span style={{ color: 'var(--success-color)', fontSize: '0.9rem' }}>✓ Método de pago guardado</span>
                  )}
                  {paymentError && (
                    <span style={{ color: 'var(--danger-color)', fontSize: '0.9rem' }}>{paymentError}</span>
                  )}
                </div>
              </Col>
            </Row>
          </div>

          <div className="mb-4">
            <h6 style={getSectionTitleStyle()}>
              <FaPercentage className="me-2" style={{ color: 'var(--warning-color)' }} /> Descuento de Orden
            </h6>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label style={{ fontWeight: 600 }}>Tipo de descuento</Form.Label>
                  <Form.Select
                    value={discountType || ''}
                    onChange={(e) => setDiscountType(e.target.value as DiscountType || null)}
                  >
                    <option value="">Sin descuento</option>
                    <option value="percentage">Porcentaje</option>
                    <option value="fixed">Cantidad Fija</option>
                  </Form.Select>
                </Form.Group>
                {discountType && (
                  <Form.Group className="mb-3">
                    <Form.Label style={{ fontWeight: 600 }}>
                      {discountType === DiscountType.PERCENTAGE ? 'Porcentaje (%)' : 'Cantidad Fija ($)'}
                    </Form.Label>
                    <Form.Control
                      type="number"
                      min="0"
                      max={discountType === DiscountType.PERCENTAGE ? '100' : undefined}
                      step={discountType === DiscountType.PERCENTAGE ? '0.01' : '1'}
                      value={discountValue}
                      onChange={(e) => setDiscountValue(parseFloat(e.target.value) || 0)}
                    />
                  </Form.Group>
                )}
                {discountType && discountValue > 0 && (
                  <Alert variant="info" className="mt-2">
                    Se aplicará un descuento de {discountType === DiscountType.PERCENTAGE ? `${discountValue}%` : `$${formatMoney(discountValue)}`} sobre el subtotal
                  </Alert>
                )}
              </Col>
              <Col md={6} className="d-flex align-items-start">
                <div className="d-flex flex-column gap-3 mt-4">
                  <Button
                    variant="primary"
                    onClick={handleSaveDiscount}
                    disabled={savingDiscount}
                    size="sm"
                  >
                    {savingDiscount ? (
                      <>
                        <Spinner as="span" animation="border" size="sm" className="me-2" />
                        Guardando...
                      </>
                    ) : (
                      'Guardar descuento'
                    )}
                  </Button>
                  {discountSaved && (
                    <span style={{ color: 'var(--success-color)', fontSize: '0.9rem' }}>✓ Descuento guardado</span>
                  )}
                  {discountError && (
                    <span style={{ color: 'var(--danger-color)', fontSize: '0.9rem' }}>{discountError}</span>
                  )}
                </div>
              </Col>
            </Row>
          </div>

          <div className="mb-4">
            <h6 style={getSectionTitleStyle()}>
              <FaFile className="me-2" style={{ color: 'var(--info-color)' }} /> Documentos Adjuntos
            </h6>
            <Row>
              <Col md={12}>
                <DocumentUploader
                  currentDocuments={documents}
                  onDocumentsChange={setDocumentFiles}
                  maxFiles={5}
                  label="Subir Documentos"
                />
                
                <Form.Group className="mb-3 mt-3">
                  <Form.Label style={{ fontWeight: 600 }}>O ingrese URLs manualmente</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={3}
                    placeholder="Ingrese URLs de documentos (una por línea)&#10;Ejemplo:&#10;https://ejemplo.com/factura.pdf&#10;https://ejemplo.com/comprobante.pdf"
                    value={documentInput}
                    onChange={(e) => setDocumentInput(e.target.value)}
                    style={{ backgroundColor: 'var(--bg-color)', color: 'var(--card-text)', fontFamily: 'monospace', fontSize: '0.9rem' }}
                  />
                  <Form.Text className="text-muted">
                    Puede subir archivos arriba o ingresar URLs manualmente aquí.
                  </Form.Text>
                </Form.Group>
              </Col>
            </Row>
            <Row>
              <Col className="d-flex align-items-center gap-3">
                <Button
                  variant="primary"
                  onClick={handleSaveDocuments}
                  disabled={savingDocuments}
                  size="sm"
                >
                  {savingDocuments ? (
                    <>
                      <Spinner as="span" animation="border" size="sm" className="me-2" />
                      Guardando...
                    </>
                  ) : (
                    'Guardar documentos'
                  )}
                </Button>
                {documentsSaved && (
                  <span style={{ color: 'var(--success-color)', fontSize: '0.9rem' }}>✓ Documentos guardados</span>
                )}
                {documentsError && (
                  <span style={{ color: 'var(--danger-color)', fontSize: '0.9rem' }}>{documentsError}</span>
                )}
              </Col>
            </Row>
          </div>

          <div className="mb-4">
            <h6 style={getSectionTitleStyle()}>
              <FaTruck className="me-2" style={{ color: 'var(--info-color)' }} /> Zona de Envío y Impuestos
            </h6>
            <Row>
              <Col md={6}>
                <Form.Group>
                  <Form.Label style={{ fontWeight: 600 }}>Seleccionar Zona de Envío</Form.Label>
                  <Form.Select
                    value={selectedDeliveryZoneId ?? ''}
                    onChange={(e) => setSelectedDeliveryZoneId(e.target.value ? parseInt(e.target.value) : null)}
                  >
                    <option value="">-- Ninguna --</option>
                    {order.deliveryZone && !availableDeliveryZones.find(dz => dz.id === order.deliveryZone?.id) && (
                      <option key={order.deliveryZone.id} value={order.deliveryZone.id}>
                        {order.deliveryZone.zone} {order.deliveryZone.price !== undefined ? `- $${formatMoney(order.deliveryZone.price)}` : ''}
                      </option>
                    )}
                    {availableDeliveryZones.map((dz) => (
                      <option key={dz.id} value={dz.id}>{dz.zone} {dz.price !== undefined ? `- $${formatMoney(dz.price)}` : ''}</option>
                    ))}
                  </Form.Select>
                  {order.deliveryZone && (
                    <div className="mt-2 ps-3 border-start" style={{ borderColor: 'var(--border-color)' }}>
                      <div><strong>Actual:</strong> {order.deliveryZone.zone}</div>
                      {order.deliveryZone.price !== undefined && (
                        <div><strong>Costo actual:</strong> ${formatMoney(order.deliveryZone.price)}</div>
                      )}
                    </div>
                  )}
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label style={{ fontWeight: 600 }}>Impuestos de Orden</Form.Label>
                  <div className="ps-3 border-start" style={{ borderColor: 'var(--border-color)' }}>
                    {availableTaxes.length === 0 && <div style={{ color: 'var(--text-secondary)' }}>No hay impuestos disponibles</div>}
                    {availableTaxes.map((tax) => (
                      <Form.Check
                        key={tax.id}
                        type="checkbox"
                        id={`tax-${tax.id}`}
                        label={`${tax.name} (${tax.rate}%)`}
                        checked={selectedTaxIds.includes(tax.id)}
                        onChange={(e) => {
                          if (e.target.checked) setSelectedTaxIds(prev => Array.from(new Set([...prev, tax.id])));
                          else setSelectedTaxIds(prev => prev.filter(id => id !== tax.id));
                        }}
                      />
                    ))}
                  </div>
                </Form.Group>
              </Col>
            </Row>
            <Row className="mt-3">
              <Col className="d-flex align-items-center gap-3">
                <Button
                  variant="primary"
                  onClick={handleSaveDeliveryAndTaxes}
                  disabled={savingDeliveryTaxes}
                  size="sm"
                >
                  {savingDeliveryTaxes ? (
                    <>
                      <Spinner as="span" animation="border" size="sm" className="me-2" />
                      Guardando...
                    </>
                  ) : (
                    'Guardar Zona / Impuestos'
                  )}
                </Button>
                {deliveryTaxesError && (
                  <span style={{ color: 'var(--danger-color)' }}>{deliveryTaxesError}</span>
                )}
              </Col>
            </Row>
          </div>

          <div className="mb-4">
            <h6 style={getSectionTitleStyle()}>
              <FaShoppingCart className="me-2" style={{ color: 'var(--success-color)' }} /> Productos
            </h6>
            
            {productsError && (
              <Alert variant="danger" className="mb-3">
                {productsError}
              </Alert>
            )}

            {isEditingProducts && (
              <Card className="mb-3" style={{ backgroundColor: 'var(--bg-light, #f8f9fa)' }}>
                <Card.Body>
                  <Form.Group className="mb-3">
                    <Form.Label className="fw-bold">
                      <FaPlus className="me-2" style={{ color: 'var(--success-color)' }} />
                      Buscar y Agregar Productos
                    </Form.Label>
                    <Form.Control
                      type="text"
                      placeholder="Buscar productos para agregar..."
                      value={productSearch}
                      onChange={(e) => handleSearchProducts(e.target.value)}
                    />
                    {isSearching && (
                      <div className="text-center mt-2">
                        <Spinner size="sm" /> Buscando...
                      </div>
                    )}
                  </Form.Group>
                  
                  {searchResults.length > 0 && (
                    <div style={{ maxHeight: '200px', overflowY: 'auto', border: '1px solid var(--border-color)', borderRadius: '4px' }}>
                      {searchResults.map((product) => (
                        <div
                          key={product.id}
                          className="p-2 d-flex justify-content-between align-items-center"
                          style={{
                            borderBottom: '1px solid var(--border-color)',
                            cursor: 'pointer',
                            transition: 'background-color 0.2s'
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--hover-bg, #e9ecef)'}
                          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                        >
                          <div>
                            <div className="fw-bold">{product.title}</div>
                            <small className="text-muted">
                              ${formatMoney(product.basePrice)} - Stock: {product.stock}
                            </small>
                          </div>
                          <Button
                            size="sm"
                            variant="success"
                            onClick={() => handleAddProduct(product)}
                          >
                            <FaPlus /> Agregar
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </Card.Body>
              </Card>
            )}

            <div className="table-responsive" style={{ maxHeight: '300px', overflowY: 'auto' }}>
              <Table style={{ color: 'var(--card-text)', backgroundColor: 'transparent' }}>
                <thead style={{ position: 'sticky', top: 0, backgroundColor: 'var(--card-color)', zIndex: 1 }}>
                  <tr style={{ backgroundColor: 'var(--bg-color)' }}>
                    <th>Producto</th>
                    <th className="text-center" style={{ width: '150px' }}>Cantidad</th>
                    <th className="text-end" style={{ width: '120px' }}>Precio Unit.</th>
                    <th className="text-end" style={{ width: '120px' }}>Total</th>
                    {isEditingProducts && <th style={{ width: '80px' }}>Acciones</th>}
                  </tr>
                </thead>
                <tbody>
                  {!isEditingProducts ? (
                    order.items && order.items.length > 0 ? (
                      order.items.map((item) => (
                        <tr key={item.id}>
                          <td>{item.product.title}</td>
                          <td className="text-center">
                            <span style={{
                              backgroundColor: 'var(--secondary-color)',
                              color: 'var(--white-color)',
                              padding: '2px 8px',
                              borderRadius: '12px',
                              fontSize: '0.9rem'
                            }}>
                              {item.quantity}
                            </span>
                          </td>
                          <td className="text-end">
                            ${formatMoney(item.unitPrice)}
                          </td>
                          <td className="text-end">
                            ${formatMoney(toNumber(item.unitPrice) * item.quantity)}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={4} className="text-center">No hay productos en esta orden</td>
                      </tr>
                    )
                  ) : (
                    editedItems.length > 0 ? (
                      editedItems.map((editedItem) => {
                        const originalItem = order.items?.find(i => i.id === editedItem.id);
                        const productInfo = originalItem?.product || addedProductsCache.get(editedItem.productId) || searchResults.find(p => p.id === editedItem.productId);
                        
                        if (!productInfo) return null;
                        
                        const unitPrice = originalItem?.unitPrice || productInfo.basePrice;
                        const isNewProduct = editedItem.id < 0;
                        
                        return (
                          <tr key={editedItem.id} style={isNewProduct ? { backgroundColor: 'rgba(40, 167, 69, 0.1)' } : undefined}>
                            <td>
                              {productInfo.title}
                              {isNewProduct && (
                                <span className="badge bg-success ms-2" style={{ fontSize: '0.7rem' }}>
                                  NUEVO
                                </span>
                              )}
                            </td>
                            <td className="text-center">
                              <Form.Control
                                type="number"
                                min="1"
                                value={editedItem.quantity}
                                onChange={(e) => handleQuantityChange(editedItem.id, parseInt(e.target.value) || 1)}
                                style={{ width: '80px', display: 'inline-block' }}
                              />
                            </td>
                            <td className="text-end">
                              ${formatMoney(unitPrice)}
                            </td>
                            <td className="text-end">
                              ${formatMoney(toNumber(unitPrice) * editedItem.quantity)}
                            </td>
                            <td className="text-center">
                              <Button
                                variant="danger"
                                size="sm"
                                onClick={() => handleRemoveItem(editedItem.id)}
                                title="Eliminar producto"
                              >
                                <FaTrash />
                              </Button>
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan={5} className="text-center text-danger">
                          No hay productos. Debe haber al menos un producto en la orden.
                        </td>
                      </tr>
                    )
                  )}
                </tbody>
                <tfoot>
                  <tr style={{ backgroundColor: 'var(--bg-color)' }}>
                    <td colSpan={3} className="text-end"><strong>Subtotal:</strong></td>
                    <td className="text-end">
                      <strong>
                        ${formatMoney(calculatedTotals.subtotal)}
                      </strong>
                    </td>
                  </tr>

                  <tr style={{ backgroundColor: 'var(--bg-color)' }}>
                    <td colSpan={3} className="text-end"><strong>Descuentos:</strong></td>
                    <td className="text-end">
                      <strong style={{ color: 'var(--success-color)' }}>
                        -${formatMoney(calculatedTotals.discountTotal)}
                      </strong>
                    </td>
                  </tr>

                  <tr style={{ backgroundColor: 'var(--bg-color)' }}>
                    <td colSpan={3} className="text-end"><strong>Impuestos:</strong></td>
                    <td className="text-end">
                      <strong>
                        ${formatMoney(calculatedTotals.taxTotal)}
                      </strong>
                    </td>
                  </tr>
                  <tr style={{ backgroundColor: 'var(--bg-color)' }}>
                    <td colSpan={3} className="text-end"><strong>Costo de envío:</strong></td>
                    <td className="text-end">
                      <strong style={{ color: calculatedTotals.delivery === 0 && selectedDeliveryZoneId ? 'var(--success-color)' : 'inherit' }}>
                        {calculatedTotals.delivery === 0 && selectedDeliveryZoneId ? '🎉 ¡Envío Gratis! $0' : `$${formatMoney(calculatedTotals.delivery)}`}
                      </strong>
                    </td>
                  </tr>
                  <tr style={{ backgroundColor: 'var(--bg-color)', borderTop: '2px solid var(--primary-color)' }}>
                    <td colSpan={3} className="text-end"><strong>Total:</strong></td>
                    <td className="text-end"><strong>${formatMoney(calculatedTotals.total)}</strong></td>
                  </tr>
                </tfoot>
              </Table>
            </div>

            <div className="d-flex justify-content-end gap-2 mt-3">
              {!isEditingProducts ? (
                <Button
                  variant="outline-primary"
                  size="sm"
                  onClick={handleStartEditProducts}
                >
                  <FaPlus className="me-1" /> Editar Productos
                </Button>
              ) : (
                <>
                  <Button
                    variant="success"
                    size="sm"
                    onClick={handleSaveProducts}
                    disabled={savingProducts || editedItems.length === 0}
                  >
                    {savingProducts ? (
                      <>
                        <Spinner as="span" animation="border" size="sm" className="me-1" />
                        Guardando...
                      </>
                    ) : (
                      'Guardar Cambios'
                    )}
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={handleCancelEditProducts}
                    disabled={savingProducts}
                  >
                    Cancelar
                  </Button>
                </>
              )}
            </div>
          </div>

          <div className="mb-4">
            <h6 style={getSectionTitleStyle()}>
              <FaStickyNote className="me-2" style={{ color: 'var(--warning-color)' }} /> Notas de la Orden
            </h6>
            <Form.Group>
              <Form.Control
                as="textarea"
                rows={3}
                placeholder="Notas, comentarios u observaciones para esta orden"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                style={{ backgroundColor: 'var(--bg-color)', color: 'var(--card-text)' }}
              />
            </Form.Group>
            <div className="d-flex align-items-center gap-3 mt-2">
              <Button
                variant="primary"
                onClick={handleSaveNotes}
                disabled={savingNotes}
              >
                {savingNotes ? (
                  <>
                    <Spinner as="span" animation="border" size="sm" className="me-2" />
                    Guardando...
                  </>
                ) : (
                  'Guardar notas'
                )}
              </Button>
              {notesSaved && (
                <span style={{ color: 'var(--success-color)' }}>Notas guardadas</span>
              )}
              {notesError && (
                <span style={{ color: 'var(--danger-color)' }}>{notesError}</span>
              )}
            </div>
          </div>

          {order.customAnswers && order.customAnswers.length > 0 && (
            <div className="mb-4">
              <h6 style={getSectionTitleStyle()}>
                <FaQuestionCircle className="me-2" style={{ color: 'var(--info-color)' }} /> Preguntas Personalizadas
              </h6>
              <dl>
                {order.customAnswers.map((answer, index) => (
                  <React.Fragment key={index}>
                    <dt style={{ color: 'var(--info-color)' }}>{answer.question}</dt>
                    <dd className="ms-3 mb-3">{answer.answer}</dd>
                  </React.Fragment>
                ))}
              </dl>
            </div>
          )}
        </Modal.Body>

        <Modal.Footer style={{ backgroundColor: 'var(--card-color)', borderColor: 'var(--border-color)' }}>
          <Button
            variant="outline-danger"
            className="d-flex align-items-center me-auto"
            style={{
              borderColor: 'var(--danger-border)',
              color: 'var(--danger-color)',
              transition: 'all 0.2s'
            }}
            onClick={() => setShowDeleteModal(true)}
            onMouseOver={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--danger-color)';
              e.currentTarget.style.color = 'var(--white-color)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.color = 'var(--danger-color)';
            }}
          >
            <FaTrash className="me-2" /> Eliminar Orden
          </Button>
          <Button
            style={{
              backgroundColor: 'var(--secondary-color)',
              borderColor: 'var(--secondary-border)',
              color: 'var(--white-color)'
            }}
            onClick={onClose}
          >
            Cerrar
          </Button>
        </Modal.Footer>
      </Modal>

      <Modal show={showDeleteModal} onHide={() => !isDeleting && setShowDeleteModal(false)} centered>
        <Modal.Header closeButton={!isDeleting} style={{ backgroundColor: 'var(--danger-color)', color: 'var(--white-color)' }}>
          <Modal.Title>Eliminar orden #{order.id}</Modal.Title>
        </Modal.Header>
        <Modal.Body style={{ backgroundColor: 'var(--card-color)', color: 'var(--card-text)' }}>
          <div className="text-center mb-3">
            <FaTrash size={32} style={{ color: 'var(--danger-color)' }} />
          </div>
          <p className="mb-0 text-center">
            Esta acción eliminará permanentemente la orden #{order.id} y todos sus datos asociados.
            <br /><br />
            <strong>¿Estás seguro de que deseas continuar?</strong>
          </p>
        </Modal.Body>
        <Modal.Footer style={{ backgroundColor: 'var(--card-color)', borderColor: 'var(--border-color)' }}>
          <Button
            style={{
              backgroundColor: 'var(--secondary-color)',
              borderColor: 'var(--secondary-border)',
              color: 'var(--white-color)'
            }}
            onClick={() => setShowDeleteModal(false)}
            disabled={isDeleting}
          >
            Cancelar
          </Button>
          <Button
            style={{
              backgroundColor: 'var(--danger-color)',
              borderColor: 'var(--danger-border)',
              color: 'var(--white-color)'
            }}
            onClick={handleConfirmDelete}
            disabled={isDeleting}
          >
            {isDeleting ? (
              <>
                <Spinner as="span" animation="border" size="sm" className="me-2" />
                Eliminando...
              </>
            ) : (
              <>
                <FaTrash className="me-2" />
                Eliminar
              </>
            )}
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
}

function getStatusBorderColor(status: OrderStatus): string {
  switch (status) {
    case OrderStatus.PENDING: return 'var(--warning-color)';
    case OrderStatus.PAID: return 'var(--info-color)';
    case OrderStatus.SHIPPED: return 'var(--primary-color)';
    case OrderStatus.DELIVERED: return 'var(--success-color)';
    case OrderStatus.CANCELED: return 'var(--danger-color)';
    default: return 'var(--border-color)';
  }
}