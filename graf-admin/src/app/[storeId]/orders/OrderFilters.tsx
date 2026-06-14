import React from 'react';
import { Card, Form, Row, Col, Button } from 'react-bootstrap';
import { OrderFilters } from '@/types/order';
import { FaSearch, FaFilter, FaTimes, FaSyncAlt } from 'react-icons/fa';

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
  const handleChange = (field: keyof OrderFilters, value: string) => {
    onFilterChange({
      ...filters,
      [field]: value
    });
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
        <Row>
          <Col xs={12} md={4} lg={3} className="mb-3 mb-md-0">
            <Form.Group>
              <Form.Label style={{ color: 'var(--card-title-color)' }}>Estado</Form.Label>
              <Form.Select
                value={filters.status || 'all'}
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
                value={filters.startDate || ''}
                onChange={(e) => handleChange('startDate', e.target.value)}
                style={{ 
                  backgroundColor: '#ffffff', 
                  color: '#333333', 
                  borderColor: 'var(--border-color)' 
                }}
              />
            </Form.Group>
          </Col>
          
          <Col xs={12} md={4} lg={3} className="mb-3 mb-md-0">
            <Form.Group>
              <Form.Label style={{ color: 'var(--card-title-color)' }}>Hasta</Form.Label>
              <Form.Control
                type="date"
                value={filters.endDate || ''}
                onChange={(e) => handleChange('endDate', e.target.value)}
                style={{ 
                  backgroundColor: '#ffffff', 
                  color: '#333333', 
                  borderColor: 'var(--border-color)' 
                }}
              />
            </Form.Group>
          </Col>
          
          <Col xs={12} lg={3}>
            <Form.Group>
              <Form.Label style={{ color: 'var(--card-title-color)' }}>Buscar</Form.Label>
              <div className="position-relative">
                <Form.Control
                  type="text"
                  placeholder="ID, cliente, teléfono..."
                  value={filters.search || ''}
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
      </Card.Body>
    </Card>
  );
}
