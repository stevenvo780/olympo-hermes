'use client';

import React, { useState, useCallback } from 'react';
import { 
  Modal, 
  Button, 
  Form, 
  Row, 
  Col, 
  Alert, 
  Spinner 
} from 'react-bootstrap';
import { FaDownload, FaCalendarAlt, FaHashtag } from 'react-icons/fa';
import api from '@/utils/axios';
import { useDispatch } from 'react-redux';
import { addNotification } from '@/redux/ui';

interface ExportModalProps {
  show: boolean;
  onHide: () => void;
  title: string;
  exportType: 'orders' | 'customers';
  storeId: string;
}

interface ExportFilters {
  startDate: string;
  endDate: string;
  limit: number;
  status?: string;
  search?: string;
}

export default function ExportModal({ 
  show, 
  onHide, 
  title, 
  exportType, 
  storeId 
}: ExportModalProps) {
  const dispatch = useDispatch();
  const [isExporting, setIsExporting] = useState(false);
  const [filters, setFilters] = useState<ExportFilters>({
    startDate: '',
    endDate: '',
    limit: 1000,
    status: '',
    search: ''
  });
  const [error, setError] = useState<string | null>(null);

  const getDefaultStartDate = () => {
    const date = new Date();
    date.setDate(date.getDate() - 30);
    return date.toISOString().split('T')[0];
  };

  const getDefaultEndDate = () => {
    return new Date().toISOString().split('T')[0];
  };

  const handleInputChange = useCallback((field: keyof ExportFilters, value: string | number) => {
    setFilters(prev => ({
      ...prev,
      [field]: value
    }));
    setError(null);
  }, []);

  const validateFilters = (): boolean => {
    if (!filters.startDate || !filters.endDate) {
      setError('Las fechas de inicio y fin son obligatorias');
      return false;
    }

    if (new Date(filters.startDate) > new Date(filters.endDate)) {
      setError('La fecha de inicio no puede ser mayor que la fecha de fin');
      return false;
    }

    if (filters.limit < 1 || filters.limit > 20000) {
      setError('El límite debe estar entre 1 y 20,000 registros');
      return false;
    }

    return true;
  };

  const handleExport = async () => {
    if (!validateFilters()) return;

    setIsExporting(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      params.append('startDate', filters.startDate);
      params.append('endDate', filters.endDate);
      params.append('limit', filters.limit.toString());

      if (filters.status && filters.status !== 'all') {
        params.append('status', filters.status);
      }

      if (filters.search && filters.search.trim()) {
        params.append('search', filters.search.trim());
      }

      const endpoint = exportType === 'orders' 
        ? `/orders/store/${storeId}/export`
        : `/orders/store/${storeId}/customers/export`;

      const response = await api.get(`${endpoint}?${params.toString()}`, {
        responseType: 'blob',
        timeout: 300000,
      });

      const blob = new Blob([response.data], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      });

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      
      const filename = exportType === 'orders' 
        ? `ordenes_${storeId}_${filters.startDate}_${filters.endDate}.xlsx`
        : `clientes_${storeId}_${filters.startDate}_${filters.endDate}.xlsx`;
      
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      dispatch(addNotification({
        message: `Reporte de ${exportType === 'orders' ? 'órdenes' : 'clientes'} exportado exitosamente`,
        color: 'success'
      }));

      onHide();
    } catch (error: unknown) {
      console.error('Error al exportar:', error);
      let errorMessage = `Error al exportar el reporte de ${exportType === 'orders' ? 'órdenes' : 'clientes'}`;
      
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === 'object' && error !== null && 'response' in error) {
        const axiosError = error as { response?: { data?: { message?: string } } };
        errorMessage = axiosError.response?.data?.message || errorMessage;
      }
      
      setError(errorMessage);
      dispatch(addNotification({
        message: errorMessage,
        color: 'danger'
      }));
    } finally {
      setIsExporting(false);
    }
  };

  React.useEffect(() => {
    if (show) {

      setFilters({
        startDate: getDefaultStartDate(),
        endDate: getDefaultEndDate(),
        limit: 1000,
        status: '',
        search: ''
      });
      setError(null);
    }
  }, [show]);

  return (
    <Modal show={show} onHide={onHide} size="lg" centered>
      <Modal.Header closeButton>
        <Modal.Title>
          <FaDownload className="me-2" />
          {title}
        </Modal.Title>
      </Modal.Header>

      <Modal.Body>
        {error && (
          <Alert variant="danger" className="mb-3">
            {error}
          </Alert>
        )}

        <Form>
          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>
                  <FaCalendarAlt className="me-2" />
                  Fecha de Inicio
                </Form.Label>
                <Form.Control
                  type="date"
                  value={filters.startDate}
                  onChange={(e) => handleInputChange('startDate', e.target.value)}
                  required
                />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>
                  <FaCalendarAlt className="me-2" />
                  Fecha de Fin
                </Form.Label>
                <Form.Control
                  type="date"
                  value={filters.endDate}
                  onChange={(e) => handleInputChange('endDate', e.target.value)}
                  required
                />
              </Form.Group>
            </Col>
          </Row>

          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>
                  <FaHashtag className="me-2" />
                  Límite de Registros
                </Form.Label>
                <Form.Control
                  type="number"
                  min={1}
                  max={20000}
                  value={filters.limit}
                  onChange={(e) => handleInputChange('limit', parseInt(e.target.value) || 1000)}
                  required
                />
                <Form.Text className="text-muted">
                  Máximo 20,000 registros
                </Form.Text>
              </Form.Group>
            </Col>
            {exportType === 'orders' && (
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Estado de la Orden</Form.Label>
                  <Form.Select
                    value={filters.status || ''}
                    onChange={(e) => handleInputChange('status', e.target.value)}
                  >
                    <option value="">Todos los estados</option>
                    <option value="pending">Pendiente</option>
                    <option value="paid">Pagada</option>
                    <option value="shipped">Enviada</option>
                    <option value="delivered">Entregada</option>
                    <option value="canceled">Cancelada</option>
                  </Form.Select>
                </Form.Group>
              </Col>
            )}
          </Row>

          <Form.Group className="mb-3">
            <Form.Label>Búsqueda (Opcional)</Form.Label>
            <Form.Control
              type="text"
              placeholder={exportType === 'orders' 
                ? "Buscar por ID de orden, cliente, email..." 
                : "Buscar por nombre, email, teléfono..."
              }
              value={filters.search}
              onChange={(e) => handleInputChange('search', e.target.value)}
            />
            <Form.Text className="text-muted">
              Filtro adicional para la búsqueda
            </Form.Text>
          </Form.Group>
        </Form>
      </Modal.Body>

      <Modal.Footer>
        <Button variant="secondary" onClick={onHide} disabled={isExporting}>
          Cancelar
        </Button>
        <Button 
          variant="primary" 
          onClick={handleExport}
          disabled={isExporting}
          className="d-flex align-items-center"
        >
          {isExporting ? (
            <>
              <Spinner size="sm" className="me-2" />
              Exportando...
            </>
          ) : (
            <>
              <FaDownload className="me-2" />
              Exportar a Excel
            </>
          )}
        </Button>
      </Modal.Footer>
    </Modal>
  );
}
