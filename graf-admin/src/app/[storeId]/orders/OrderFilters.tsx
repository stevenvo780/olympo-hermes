import React, { useState } from 'react';
import { Card, Form, Row, Col, Button, Alert } from 'react-bootstrap';
import { OrderFilters } from '@/types/order';
import { FaSearch, FaFilter, FaTimes, FaSyncAlt, FaExclamationTriangle } from 'react-icons/fa';
import { useDispatch } from 'react-redux';
import { addNotification } from '@/redux/ui';

interface OrderFiltersProps {
  filters: OrderFilters;
  onFilterChange: (filters: OrderFilters) => void;
  onRefresh: () => void;
}

export default function OrderFiltersComponent({
  filters,
  onFilterChange,
  onRefresh
}: OrderFiltersProps) {
  const dispatch = useDispatch();
  const [dateError, setDateError] = useState<string | null>(null);
  const [tempFilters, setTempFilters] = useState<OrderFilters>(filters);

  React.useEffect(() => {
    setTempFilters(filters);
    // Reset date error if filters are cleared or updated externally
    if (filters.startDate && filters.endDate) {
      const startDate = new Date(filters.startDate);
      const endDate = new Date(filters.endDate);
      if (startDate <= endDate) {
        setDateError(null);
      }
    } else {
      setDateError(null);
    }
  }, [filters]);

  const handleChange = (field: keyof OrderFilters, value: string) => {
    const newFilters = {
      ...tempFilters,
      [field]: value === '' ? undefined : value
    };
    setTempFilters(newFilters);

    // Validar rango de fechas
    if (newFilters.startDate && newFilters.endDate) {
      const startDate = new Date(newFilters.startDate);
      const endDate = new Date(newFilters.endDate);
      if (startDate > endDate) {
        setDateError('La fecha inicial no puede ser mayor a la fecha final');
        dispatch(addNotification({
          message: 'La fecha inicial no puede ser mayor a la fecha final',
          color: 'warning'
        }));
        return;
      }
    }
    setDateError(null);
  };

  const handleApply = () => {
    if (dateError) return;
    onFilterChange(tempFilters);
  };

  const clearFilters = () => {
    onFilterChange({
      status: 'all',
      startDate: undefined,
      endDate: undefined,
      search: undefined
    });
  };

  const hasActiveFilters = () => {
    return filters.status !== 'all' || 
           !!filters.startDate || 
           !!filters.endDate || 
           !!filters.search;
  };

  return (
    <Card className="shadow-sm" style={{ backgroundColor: 'var(--card-color)', color: 'var(--card-text)' }}>
      <Card.Header style={{ backgroundColor: 'var(--bg-color)', color: 'var(--card-title-color)' }}>
        <div className="d-flex justify-content-between align-items-center">
          <span><FaFilter className="me-2" />Filtros</span>
          <div>
            <Button 
              variant="link" 
              className="text-decoration-none p-0 me-3" 
              onClick={onRefresh}
              title="Actualizar órdenes"
              style={{ color: 'var(--link-color)' }}
            >
              <FaSyncAlt />
            </Button>
            {hasActiveFilters() && (
              <Button 
                variant="link" 
                className="text-decoration-none p-0" 
                onClick={clearFilters}
                title="Limpiar filtros"
                style={{ color: 'var(--link-color)' }}
              >
                <FaTimes />
              </Button>
            )}
          </div>
        </div>
      </Card.Header>
      <Card.Body>
        {dateError && (
          <Alert variant="warning" className="py-2 mb-3">{dateError}</Alert>
        )}
        <Row>
          <Col xs={12} md={4} lg={3} className="mb-3 mb-md-0">
            <Form.Group>
              <Form.Label style={{ color: 'var(--card-title-color)' }}>Estado</Form.Label>
              <Form.Select
                value={tempFilters.status || 'all'}
                onChange={(e) => handleChange('status', e.target.value)}
                style={{ 
                  backgroundColor: '#ffffff', 
                  color: '#333333', 
                  borderColor: 'var(--border-color)' 
                  }}
                >
                <option value="all">Todos</option>
                <option value="pending">Pendiente</option>
                <option value="paid">Pagada</option>
                <option value="shipped">Enviada</option>
                <option value="delivered">Entregada</option>
                <option value="canceled">Cancelada</option>
              </Form.Select>
            </Form.Group>
          </Col>
          
          <Col xs={12} md={4} lg={3} className="mb-3 mb-md-0">
            <Form.Group>
              <Form.Label style={{ color: 'var(--card-title-color)' }}>Desde</Form.Label>
              <Form.Control
                type="date"
                value={tempFilters.startDate || ''}
                onChange={(e) => handleChange('startDate', e.target.value)}
                isInvalid={dateError !== null}
                style={{ 
                  backgroundColor: '#ffffff', 
                  color: '#333333', 
                  borderColor: dateError ? 'var(--bs-danger)' : 'var(--border-color)' 
                }}
              />
              {dateError && (
                <Form.Control.Feedback type="invalid">
                  {dateError}
                </Form.Control.Feedback>
              )}
            </Form.Group>
          </Col>
          
          <Col xs={12} md={4} lg={3} className="mb-3 mb-md-0">
            <Form.Group>
              <Form.Label style={{ color: 'var(--card-title-color)' }}>Hasta</Form.Label>
              <Form.Control
                type="date"
                value={tempFilters.endDate || ''}
                onChange={(e) => handleChange('endDate', e.target.value)}
                isInvalid={dateError !== null}
                style={{ 
                  backgroundColor: '#ffffff', 
                  color: '#333333', 
                  borderColor: dateError ? 'var(--bs-danger)' : 'var(--border-color)' 
                }}
              />
              {dateError && (
                <Form.Control.Feedback type="invalid">
                  {dateError}
                </Form.Control.Feedback>
              )}
            </Form.Group>
          </Col>
          
          <Col xs={12} lg={3}>
            <Form.Group>
              <Form.Label style={{ color: 'var(--card-title-color)' }}>Buscar</Form.Label>
              <div className="position-relative">
                <Form.Control
                  type="text"
                  placeholder="ID, cliente, teléfono..."
                  value={tempFilters.search || ''}
                  onChange={(e) => handleChange('search', e.target.value)}
                  style={{ 
                    backgroundColor: '#ffffff', 
                    color: '#333333', 
                    borderColor: 'var(--border-color)' 
                  }}
                />
                <div 
                  className="position-absolute top-50 end-0 translate-middle-y me-2"
                  style={{ pointerEvents: 'none' }}
                >
                  <FaSearch className="text-muted" />
                </div>
              </div>
            </Form.Group>
          </Col>
        </Row>
        <Row className="mt-3">
          <Col className="d-flex justify-content-end align-items-center">
            {dateError && (
              <span className="text-danger me-3 d-flex align-items-center" style={{ fontSize: '0.9rem' }}>
                <FaExclamationTriangle className="me-1" />
                {dateError}
              </span>
            )}
            <Button
              variant="primary"
              onClick={handleApply}
              disabled={dateError !== null}
              className={dateError !== null ? 'disabled' : ''}
            >
              Aplicar filtros
            </Button>
          </Col>
        </Row>
      </Card.Body>
    </Card>
  );
}
