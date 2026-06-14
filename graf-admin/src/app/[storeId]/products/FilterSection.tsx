import React, { useState } from 'react';
import { Form, Button, Row, Col, Card, Collapse } from 'react-bootstrap';
import { Category } from '@/types';
import { FilterParams } from '@/types/product';
import { FaSearch, FaDollarSign, FaTag, FaPercent, FaFilter, FaTimes, FaBoxes, FaChevronDown, FaChevronUp } from 'react-icons/fa';

interface FilterSectionProps {
  categories: Category[];
  filterForm: FilterParams;
  setFilterForm: React.Dispatch<React.SetStateAction<FilterParams>>;
  handleApplyFilters: () => void;
  handleClearFilters: () => void;
}

export default function FilterSection({
  categories,
  filterForm,
  setFilterForm,
  handleApplyFilters,
  handleClearFilters
}: FilterSectionProps) {
  const [showAdvanced, setShowAdvanced] = useState(false);

  return (
    <Card className="mb-4">
      <Card.Header className="d-flex align-items-center justify-content-between">
        <div className="d-flex align-items-center">
          <FaFilter className="me-2" />
          <strong>Filtros de Productos</strong>
        </div>
      </Card.Header>
      <Card.Body>

        <Row className="g-3 align-items-end">
          <Col md={3}>
            <Form.Label className="d-flex align-items-center mb-2">
              <FaSearch className="me-2" />
              Buscar producto
            </Form.Label>
            <Form.Control
              type="text"
              placeholder="Buscar por título..."
              value={filterForm.text || ''}
              onChange={(e) => setFilterForm(prev => ({
                ...prev,
                text: e.target.value || undefined
              }))}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleApplyFilters();
                }
              }}
            />
          </Col>

          <Col md={3}>
            <Form.Label className="d-flex align-items-center mb-2">
              <FaTag className="me-2" />
              Categoría
            </Form.Label>
            <Form.Select
              value={filterForm.category || ''}
              onChange={(e) => setFilterForm(prev => ({
                ...prev,
                category: e.target.value ? Number(e.target.value) : undefined
              }))}
            >
              <option value="">Todas las categorías</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </Form.Select>
          </Col>

          <Col md={2}>
            <Form.Label className="d-flex align-items-center mb-2">
              <FaBoxes className="me-2" />
              Stock
            </Form.Label>
            <Form.Select
              value={filterForm.exist?.toString() || ''}
              onChange={(e) => setFilterForm(prev => ({
                ...prev,
                exist: e.target.value === "" ? undefined : e.target.value === "true"
              }))}
            >
              <option value="">Todos</option>
              <option value="true">Solo con stock</option>
            </Form.Select>
          </Col>

          <Col md={2}>
            <div className="d-flex gap-2">
              <Button variant="primary" size="sm" onClick={handleApplyFilters}>
                <FaSearch className="me-1" />
                Buscar
              </Button>
              <Button variant="outline-secondary" size="sm" onClick={handleClearFilters}>
                <FaTimes className="me-1" />
                Limpiar
              </Button>
            </div>
          </Col>

          <Col md={2}>
            <Button
              variant="outline-info"
              size="sm"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="w-100"
            >
              {showAdvanced ? <FaChevronUp /> : <FaChevronDown />}
              <span className="ms-2">Más filtros</span>
            </Button>
          </Col>
        </Row>

        <Collapse in={showAdvanced}>
          <div>
            <div className="my-3"></div>
            <Row className="g-3">
              <Col md={3}>
                <Form.Label className="d-flex align-items-center mb-2">
                  <FaDollarSign className="me-2" />
                  Precio mínimo
                </Form.Label>
                <Form.Control
                  type="number"
                  placeholder="0"
                  value={filterForm.minPrice || ''}
                  onChange={(e) => setFilterForm(prev => ({
                    ...prev,
                    minPrice: e.target.value ? Number(e.target.value) : undefined
                  }))}
                />
              </Col>

              <Col md={3}>
                <Form.Label className="d-flex align-items-center mb-2">
                  <FaDollarSign className="me-2" />
                  Precio máximo
                </Form.Label>
                <Form.Control
                  type="number"
                  placeholder="999999"
                  value={filterForm.maxPrice || ''}
                  onChange={(e) => setFilterForm(prev => ({
                    ...prev,
                    maxPrice: e.target.value ? Number(e.target.value) : undefined
                  }))}
                />
              </Col>

              <Col md={3}>
                <Form.Label className="d-flex align-items-center mb-2">
                  <FaPercent className="me-2" />
                  Descuentos
                </Form.Label>
                <Form.Select
                  value={filterForm.discount?.toString() || ''}
                  onChange={(e) => setFilterForm(prev => ({
                    ...prev,
                    discount: e.target.value === "" ? undefined : e.target.value === "true"
                  }))}
                >
                  <option value="">Todos</option>
                  <option value="true">Con descuento</option>
                  <option value="false">Sin descuento</option>
                </Form.Select>
              </Col>
            </Row>
          </div>
        </Collapse>
      </Card.Body>
    </Card>
  );
}
