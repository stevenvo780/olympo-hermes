'use client';
import React, { useCallback, useEffect, useState } from 'react';
import { Form, Button, Spinner, Alert, Row, Col, Card } from 'react-bootstrap';
import api from '@/utils/axios';
import { useDispatch } from 'react-redux';
import { addNotification } from '@/redux/ui';
import {
  FaFileInvoiceDollar,
  FaCheckCircle,
  FaCircle,
  FaChartLine,
  FaEye,
  FaEyeSlash,
} from 'react-icons/fa';
import { useParams } from 'next/navigation';

interface IntegrationStatus {
  hasSigoCredentials: boolean;
}

interface SigoPaymentMapping {
  types?: Record<string, unknown>;
  creditDays?: number;
  diasCredito?: number;
  [key: string]: unknown;
}

interface SigoConfig {
  payments?: SigoPaymentMapping;
  paymentMapping?: SigoPaymentMapping;
  triggerEvents?: string[];
  triggerEvent?: string;
}

const PRESET_TRIGGER_EVENTS = [
  'order.pending',
  'order.paid',
  'order.shipped',
  'order.delivered',
  'order.canceled',
] as const;

const IntegrationsSection: React.FC = () => {
  const dispatch = useDispatch();
  const { storeId } = useParams() as { storeId: string };
  const [sigoEmail, setSigoEmail] = useState('');
  const [sigoApiKey, setSigoApiKey] = useState('');
  const [loading, setLoading] = useState(false);
  const [savingIntegration, setSavingIntegration] = useState<'sigo' | null>(null);
  const [error, setError] = useState('');
  const [integrationStatus, setIntegrationStatus] = useState<IntegrationStatus>({
    hasSigoCredentials: false,
  });
  const [showSigoApiKey, setShowSigoApiKey] = useState(false);
  const [isEditingCredentials, setIsEditingCredentials] = useState(false);

  const [paymentIds, setPaymentIds] = useState({
    cash: '',
    bank_transfer: '',
    wompi: '',
    bold: '',
    credit: '',
    credit_days: '',
  });
  const [savingPayments, setSavingPayments] = useState(false);
  const presetEvents = PRESET_TRIGGER_EVENTS as unknown as string[];
  const [triggerEvent, setTriggerEvent] = useState<string>('order.paid');

  const loadApiSigoConfig = useCallback(async () => {
    try {
      const res = await api.get(`/integrations/apisigo/${storeId}`);
      const cfg = res.data?.config as SigoConfig | undefined;

      if (!cfg) return;

      const pm = cfg.payments ?? cfg.paymentMapping ?? {};
      const triggers = cfg.triggerEvents;
      const triggerSingle = cfg.triggerEvent;
      const types = (pm.types ?? pm) as Record<string, unknown>;

      const extractId = (v: unknown): string => {
        if (v == null) return '';
        if (typeof v === 'number' || typeof v === 'string') return String(v);
        if (typeof v === 'object') {
          const id = (v as { id?: unknown })['id'];
          return id == null ? '' : String(id);
        }
        return '';
      };

      setPaymentIds({
        cash: extractId(types['cash']),
        bank_transfer: extractId(types['bank_transfer']),
        wompi: extractId(types['wompi']),
        bold: extractId(types['bold']),
        credit: extractId(types['credit']),
        credit_days: String((pm.creditDays ?? pm.diasCredito) ?? ''),
      });

      const pickOne = (): string => {
        if (typeof triggerSingle === 'string' && triggerSingle.trim()) return triggerSingle.trim();
        if (Array.isArray(triggers) && triggers.length > 0) {
          const first = triggers.find((v) => typeof v === 'string');
          if (first) return first;
        }
        return 'order.paid';
      };
      const chosen = pickOne();
      setTriggerEvent((PRESET_TRIGGER_EVENTS as readonly string[]).includes(chosen) ? chosen : 'order.paid');
    } catch {
    }
  }, [storeId]);

  const loadIntegrationStatus = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.get('/user/me/integrations/status');
      const status = response.data as IntegrationStatus;
      setIntegrationStatus(status);
      if (status.hasSigoCredentials) {
        setSigoEmail('••••••••');
        setSigoApiKey('••••••••');
      }
    } catch (error) {
      console.error('Error loading integration status:', error);
      setError('No se pudo cargar el estado de las integraciones');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadIntegrationStatus();
    if (storeId) {
      loadApiSigoConfig().catch(() => void 0);
    }
  }, [storeId, loadApiSigoConfig, loadIntegrationStatus]);

  const handleSaveSigo = async () => {
    setSavingIntegration('sigo');
    setError('');

    const hasMaskedCredentials = sigoEmail === '••••••••' && sigoApiKey === '••••••••';
    const hasBothCredentials = sigoEmail && sigoApiKey && sigoEmail !== '••••••••' && sigoApiKey !== '••••••••';
    const hasPartialCredentials = (sigoEmail && !sigoApiKey) || (!sigoEmail && sigoApiKey);

    if (!hasMaskedCredentials && hasPartialCredentials && (sigoEmail !== '••••••••' || sigoApiKey !== '••••••••')) {
      setError('Si deseas configurar SIGO, debes ingresar tanto el Email de Usuario como la API Key, o dejar ambos vacíos para desactivar SIGO');
      setSavingIntegration(null);
      return;
    }
    
    try {
      const shouldDisableSigo = !sigoEmail && !sigoApiKey;
      
      if (hasMaskedCredentials) {
        dispatch(addNotification({
          message: 'Las credenciales SIGO no han cambiado',
          color: 'info'
        }));
      } else if (shouldDisableSigo) {
        await api.patch('/user/me/integrations', { sigo: {} });
        setIntegrationStatus(prev => ({ ...prev, hasSigoCredentials: false }));
        dispatch(addNotification({
          message: 'Configuración guardada correctamente (SIGO desactivado)',
          color: 'success'
        }));
      } else if (hasBothCredentials) {
        await api.patch('/user/me/integrations', {
          sigo: {
            email: sigoEmail,
            apiKey: sigoApiKey
          }
        });
        setSigoEmail('••••••••');
        setSigoApiKey('••••••••');
        setIsEditingCredentials(false);
        setIntegrationStatus(prev => ({ ...prev, hasSigoCredentials: true }));
        dispatch(addNotification({
          message: 'Credenciales de SIGO guardadas correctamente',
          color: 'success'
        }));
      }
    } catch (error) {
      console.error('Error saving SIGO credentials:', error);
      setError('Error al guardar las credenciales de SIGO');
      dispatch(addNotification({
        message: 'Error al guardar las credenciales de SIGO',
        color: 'danger'
      }));
    } finally {
      setSavingIntegration(null);
    }
  };

  const clearSigoCredentials = () => {
    setSigoEmail('');
    setSigoApiKey('');
    setIsEditingCredentials(true);
  };

  const handleSavePaymentIds = async () => {
    if (!storeId) return;
    setSavingPayments(true);
    try {
      const types: Record<string, { id: number }> = {};
      if (paymentIds.cash) types.cash = { id: Number(paymentIds.cash) };
      if (paymentIds.bank_transfer) types.bank_transfer = { id: Number(paymentIds.bank_transfer) };
      if (paymentIds.wompi) types.wompi = { id: Number(paymentIds.wompi) };
      if (paymentIds.bold) types.bold = { id: Number(paymentIds.bold) };
      if (paymentIds.credit) types.credit = { id: Number(paymentIds.credit) };

      const selectedTrigger = (PRESET_TRIGGER_EVENTS as readonly string[]).includes(String(triggerEvent))
        ? String(triggerEvent)
        : 'order.paid';

      const configBody = {
        payments: {
          types,
          creditDays: paymentIds.credit_days ? Number(paymentIds.credit_days) : undefined,
          aliases: {
            bank_transfer: ['transferencia', 'transfer', 'transferencia_bancaria', 'pse'],
            bold: ['bold'],
          },
          defaultKey: 'cash',
        },
        triggerEvent: selectedTrigger,
      };

      await api.put(`/integrations/apisigo/${storeId}?enabled=true`, configBody);
      await loadApiSigoConfig();
      dispatch(
        addNotification({
          message: 'Configuración de SIGO guardada',
          color: 'success',
        }),
      );
    } catch {
      dispatch(
        addNotification({ message: 'Error guardando tipos de pago', color: 'danger' })
      );
    } finally {
      setSavingPayments(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center">
        <Spinner animation="border" variant="primary" />
        <p className="mt-2">Cargando configuración de integraciones...</p>
      </div>
    );
  }

  return (
    <div>
      {error && <Alert variant="danger" className="mb-4">{error}</Alert>}
      <Row className="justify-content-center">
        <Col md={8} lg={6} className="mb-4">
          <Card className="h-100 border-primary">
            <Card.Header className="d-flex justify-content-between align-items-center bg-primary text-white">
              <h5 className="mb-0">
                <FaFileInvoiceDollar className="me-2" />
                SIGO - Facturación Electrónica
              </h5>
              {integrationStatus.hasSigoCredentials && (
                <span className="badge bg-light text-dark">
                  <FaCheckCircle className="me-1" />
                  Configurado
                </span>
              )}
            </Card.Header>
            <Card.Body>
              <div>
                <Form.Group className="mb-3">
                  <Form.Label>Email de Usuario SIGO *</Form.Label>
                  <Form.Control
                    type="email"
                    value={sigoEmail}
                    onChange={e => setSigoEmail(e.target.value)}
                    placeholder="correo@empresa.com"
                    autoComplete="off"
                    disabled={!isEditingCredentials && sigoEmail === '••••••••'}
                  />
                  <Form.Text className="text-muted">
                    Email del usuario registrado en SIGO (requerido para facturación electrónica)
                  </Form.Text>
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label>API Key (Access Key)</Form.Label>
                  <Row>
                    <Col xs={10}>
                      <Form.Control
                        type={showSigoApiKey ? 'text' : 'password'}
                        value={sigoApiKey}
                        onChange={e => setSigoApiKey(e.target.value)}
                        placeholder="Access Key de SIGO (opcional)"
                        autoComplete="off"
                        disabled={!isEditingCredentials && sigoApiKey === '••••••••'}
                      />
                    </Col>
                    <Col xs={2} className="d-flex align-items-center">
                      <Button
                        variant="outline-secondary"
                        size="sm"
                        type="button"
                        onClick={() => setShowSigoApiKey(v => !v)}
                        tabIndex={-1}
                      >
                        {showSigoApiKey ? <FaEyeSlash /> : <FaEye />}
                      </Button>
                    </Col>
                  </Row>
                  <Form.Text className="text-muted">
                    Access Key generado en tu panel de SIGO (opcional)
                  </Form.Text>
                </Form.Group>
                <div className="d-flex gap-2">
                  <Button
                    type="button"
                    variant="primary"
                    disabled={savingIntegration === 'sigo' || (!isEditingCredentials && sigoEmail === '••••••••' && sigoApiKey === '••••••••')}
                    onClick={handleSaveSigo}
                  >
                    {savingIntegration === 'sigo' ? (
                      <>
                        <Spinner animation="border" size="sm" className="me-2" />
                        Guardando...
                      </>
                    ) : (
                      (!sigoEmail && !sigoApiKey) ? 'Guardar configuración' : 'Guardar SIGO'
                    )}
                  </Button>
                  {integrationStatus.hasSigoCredentials && !isEditingCredentials && (
                    <Button
                      variant="outline-secondary"
                      size="sm"
                      onClick={clearSigoCredentials}
                      type="button"
                    >
                      Cambiar credenciales
                    </Button>
                  )}
                </div>
                {(!isEditingCredentials && sigoEmail === '••••••••' && sigoApiKey === '••••••••') && (
                  <Form.Text className="text-muted d-block mt-2">
                    Las credenciales están guardadas de forma segura. Para modificarlas, haz clic en &quot;Cambiar credenciales&quot;.
                  </Form.Text>
                )}
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
      
      <Row className="justify-content-center mt-4">
        <Col md={8} lg={6} className="mb-4">
          <Card className="h-100 border-secondary">
            <Card.Header className="bg-secondary text-white">
              <h6 className="mb-0">Mapeo de tipos de pago (SIGO)</h6>
            </Card.Header>
            <Card.Body>
              <div>
                <Row className="g-3">
                  <Col xs={12} md={6}>
                    <Form.Group>
                      <Form.Label>Cash (Efectivo) - ID</Form.Label>
                      <Form.Control
                        type="number"
                        inputMode="numeric"
                        value={paymentIds.cash}
                        onChange={(e) => setPaymentIds((p) => ({ ...p, cash: e.target.value }))}
                        placeholder="ID en SIGO"
                      />
                    </Form.Group>
                  </Col>
                  <Col xs={12} md={6}>
                    <Form.Group>
                      <Form.Label>Transferencia bancaria - ID</Form.Label>
                      <Form.Control
                        type="number"
                        inputMode="numeric"
                        value={paymentIds.bank_transfer}
                        onChange={(e) =>
                          setPaymentIds((p) => ({ ...p, bank_transfer: e.target.value }))
                        }
                        placeholder="ID en SIGO"
                      />
                    </Form.Group>
                  </Col>
                  <Col xs={12} md={6}>
                    <Form.Group>
                      <Form.Label>Wompi - ID</Form.Label>
                      <Form.Control
                        type="number"
                        inputMode="numeric"
                        value={paymentIds.wompi}
                        onChange={(e) => setPaymentIds((p) => ({ ...p, wompi: e.target.value }))}
                        placeholder="ID en SIGO"
                      />
                    </Form.Group>
                  </Col>
                  <Col xs={12} md={6}>
                    <Form.Group>
                      <Form.Label>Bold - ID</Form.Label>
                      <Form.Control
                        type="number"
                        inputMode="numeric"
                        value={paymentIds.bold}
                        onChange={(e) => setPaymentIds((p) => ({ ...p, bold: e.target.value }))}
                        placeholder="ID en SIGO"
                      />
                    </Form.Group>
                  </Col>
                  <Col xs={12} md={6}>
                    <Form.Group>
                      <Form.Label>Crédito - ID</Form.Label>
                      <Form.Control
                        type="number"
                        inputMode="numeric"
                        value={paymentIds.credit}
                        onChange={(e) => setPaymentIds((p) => ({ ...p, credit: e.target.value }))}
                        placeholder="ID en SIGO"
                      />
                    </Form.Group>
                  </Col>
                  <Col xs={12} md={6}>
                    <Form.Group>
                      <Form.Label>Días de crédito (opcional)</Form.Label>
                      <Form.Control
                        type="number"
                        inputMode="numeric"
                        value={paymentIds.credit_days}
                        onChange={(e) =>
                          setPaymentIds((p) => ({ ...p, credit_days: e.target.value }))
                        }
                        placeholder="Ej: 30"
                      />
                    </Form.Group>
                  </Col>
                </Row>
                <div className="d-flex gap-2 mt-3">
                  <Button
                    type="button"
                    variant="secondary"
                    disabled={savingPayments}
                    onClick={handleSavePaymentIds}
                  >
                    {savingPayments ? (
                      <>
                        <Spinner animation="border" size="sm" className="me-2" />
                        Guardando...
                      </>
                    ) : (
                      'Guardar mapeo SIGO'
                    )}
                  </Button>
                  <Button
                    type="button"
                    variant="outline-secondary"
                    onClick={() => loadApiSigoConfig()}
                  >
                    Recargar
                  </Button>
                </div>
                <small className="text-muted d-block mt-2">
                  Tip: Obtén los IDs en ApiSigo → GET /api/invoices/payment-types y pégalos aquí.
                </small>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Row className="justify-content-center mt-4">
        <Col md={8} lg={6} className="mb-4">
          <Card className="h-100 border-info">
            <Card.Header className="bg-info text-white">
              <h6 className="mb-0">Cuándo generar factura en HubCentral (un solo evento)</h6>
            </Card.Header>
            <Card.Body>
              <div>
                <p className="text-muted mb-2">
                  Selecciona en qué estado de la orden se generará la factura en SIGO. Por defecto: <strong>Pagado</strong>.
                </p>
                <div className="d-flex flex-column gap-2">
                  {presetEvents.map((key) => {
                    const labelMap: Record<string, string> = {
                      'order.pending': 'Pendiente',
                      'order.paid': 'Pagado',
                      'order.shipped': 'Enviado',
                      'order.delivered': 'Entregado',
                      'order.canceled': 'Cancelado',
                    };
                    return (
                      <Form.Check
                        key={key}
                        type="radio"
                        name="triggerEvent"
                        id={`trigger-${key}`}
                        label={`${labelMap[key] || key}`}
                        checked={triggerEvent === key}
                        onChange={() => setTriggerEvent(key)}
                      />
                    );
                  })}
                </div>
                <div className="d-flex align-items-center gap-2 mt-3">
                  <Button
                    type="button"
                    variant="info"
                    disabled={savingPayments}
                    onClick={handleSavePaymentIds}
                  >
                    {savingPayments ? (
                      <>
                        <Spinner animation="border" size="sm" className="me-2" />
                        Guardando...
                      </>
                    ) : (
                      'Guardar'
                    )}
                  </Button>
                  <small className="text-muted">Debes guardar para aplicar el cambio.</small>
                </div>
                <small className="text-muted d-block mt-2">Este ajuste controla cuándo HubCentral enviará la factura a SIGO.</small>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
      <Alert variant="info" className="mt-4">
        <div className="d-flex align-items-center justify-content-between">
          <div>
            <h6 className="mb-2">
              <FaChartLine className="me-2" />
              Estado de las Integraciones
            </h6>
            <div className="d-flex gap-4">
              <span>
                <strong>SIGO:</strong> {integrationStatus.hasSigoCredentials ? (
                  <span className="text-success">
                    <FaCheckCircle className="me-1" />
                    Activo
                  </span>
                ) : (
                  <span className="text-muted">
                    <FaCircle className="me-1" />
                    Pendiente
                  </span>
                )}
              </span>
            </div>
          </div>
          <small className="text-muted">Hub Central gestiona automáticamente</small>
        </div>
      </Alert>
    </div>
  );
};

export default IntegrationsSection;
