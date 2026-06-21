'use client';

import { useState } from 'react';
import { Customer } from '@/app/[storeId]/customers/hooks/useCustomers';
import {
  Card,
  Table,
  Badge,
  Form,
  InputGroup,
  Row,
  Col,
  Button,
  Modal
} from 'react-bootstrap';
import {
  FiSearch,
  FiMail,
  FiPhone,
  FiMapPin,
  FiCalendar,
  FiDollarSign,
  FiShoppingBag,
  FiUsers,
  FiEdit,
  FiTrash2,
  FiUserPlus
} from 'react-icons/fi';

interface CustomersListProps {
  customers: Customer[];
  isLoading: boolean;
  storeId: string;
  onUpdateCustomer?: (id: number, data: Partial<Customer>) => Promise<Customer>;
  onDeleteCustomer?: (id: number) => Promise<void>;
  onCreate?: () => void;
}

export function CustomersList({
  customers,
  isLoading,
  onUpdateCustomer,
  onDeleteCustomer,
  onCreate,
}: CustomersListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [showDetail, setShowDetail] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [editData, setEditData] = useState<Partial<Customer>>({});
  const [saving, setSaving] = useState(false);

  const safeCustomers = Array.isArray(customers) ? customers : [];

  const filteredCustomers = safeCustomers.filter(customer =>
    customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.city?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString('es-ES');
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const openDetail = (c: Customer) => {
    setSelectedCustomer(c);
    setShowDetail(true);
  };

  const openEdit = (c: Customer) => {
    setSelectedCustomer(c);
    setEditData({
      name: c.name,
      email: c.email,
      phone: c.phone,
      address: c.address,
      city: c.city,
      postalCode: c.postalCode,
      documentNumber: c.documentNumber,
      isActive: c.isActive,
    });
    setShowEdit(true);
  };

  const handleDelete = async (c: Customer) => {
    if (!onDeleteCustomer) return;
    if (confirm(`¿Eliminar cliente "${c.name}"?`)) {
      await onDeleteCustomer(c.id);
    }
  };

  const handleSaveEdit = async () => {
    if (!onUpdateCustomer || !selectedCustomer) return;
    setSaving(true);
    try {
      await onUpdateCustomer(selectedCustomer.id, editData);
      setShowEdit(false);
    } finally {
      setSaving(false);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <Card.Header>
          <Card.Title>Cargando clientes...</Card.Title>
        </Card.Header>
        <Card.Body>
          <div className="d-flex justify-content-center">
            <div className="spinner-border" role="status">
              <span className="visually-hidden">Cargando...</span>
            </div>
          </div>
        </Card.Body>
      </Card>
    );
  }

  return (
    <Card>
      <Card.Header>
        <Row className="align-items-center">
          <Col>
            <Card.Title className="mb-0 d-flex align-items-center">
              <FiUsers className="me-2" size={18} style={{ color: 'var(--primary-color, #1B3862)' }} />
              Clientes ({filteredCustomers.length})
            </Card.Title>
          </Col>
          <Col xs="auto">
            <InputGroup>
              <InputGroup.Text><FiSearch size={14} style={{ color: 'var(--secondary-color, #06817E)' }} /></InputGroup.Text>
              <Form.Control
                type="text"
                placeholder="Buscar clientes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </InputGroup>
          </Col>
        </Row>
      </Card.Header>
      <Card.Body>
        {filteredCustomers.length === 0 ? (
          <div className="text-center py-5">
            <FiShoppingBag size={32} style={{ color: 'var(--text-muted, #767676)' }} className="mb-3" />
            <h5 className="mt-3 mb-2">No hay clientes</h5>
            <p className="text-muted mb-4">
              {searchTerm ? 'No se encontraron clientes que coincidan con tu búsqueda.' : 'Aún no tienes clientes registrados.'}
            </p>
            {!searchTerm && onCreate && (
              <Button
                variant="primary"
                onClick={onCreate}
                className="d-inline-flex align-items-center"
              >
                <FiUserPlus className="me-2" size={16} />
                Crear Primer Cliente
              </Button>
            )}
          </div>
        ) : (
          <div className="table-responsive">
            <Table striped hover>
              <thead>
                <tr>
                  <th>Cliente</th>
                  <th>Contacto</th>
                  <th>Ubicación</th>
                  <th>Estadísticas</th>
                  <th>Puntos</th>
                  <th>Estado</th>
                  <th>Fecha de registro</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredCustomers.map((customer) => (
                  <tr 
                    key={customer.id} 
                    onClick={() => openDetail(customer)}
                    style={{ cursor: 'pointer' }}
                  >
                    <td>
                      <div className="d-flex align-items-center">
                        <div
                          className="rounded-circle d-flex align-items-center justify-content-center text-white fw-bold me-3"
                          style={{
                            width: '40px',
                            height: '40px',
                            background: 'linear-gradient(45deg, #007bff, #6f42c1)'
                          }}
                        >
                          {customer.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="fw-medium">{customer.name}</div>
                          <small className="text-muted d-flex align-items-center">
                            <FiMail className="me-1" size={10} style={{ color: 'var(--info-color, #4A90A0)' }} />
                            {customer.email}
                          </small>
                        </div>
                      </div>
                    </td>

                    <td>
                      {customer.phone && (
                        <small className="text-muted d-flex align-items-center">
                          <FiPhone className="me-1" size={10} style={{ color: 'var(--success-color, #278F7E)' }} />
                          {customer.phone}
                        </small>
                      )}
                    </td>

                    <td>
                      {customer.city && (
                        <small className="text-muted d-flex align-items-center">
                          <FiMapPin className="me-1" size={10} style={{ color: 'var(--warning-color, #E9B44C)' }} />
                          {customer.city}
                        </small>
                      )}
                    </td>

                    <td>
                      <div>
                        <small className="d-block d-flex align-items-center">
                          <FiDollarSign className="me-1" size={10} style={{ color: 'var(--success-color, #278F7E)' }} />
                          {formatCurrency(customer.totalSpent)}
                        </small>
                        <small className="d-block d-flex align-items-center">
                          <FiShoppingBag className="me-1" size={10} style={{ color: 'var(--info-color, #4A90A0)' }} />
                          {customer.totalOrders} órdenes
                        </small>
                      </div>
                    </td>

                    <td>
                      <Badge
                        style={{
                          backgroundColor: 'var(--badge-info-bg)',
                          color: 'var(--badge-info-text)'
                        }}
                        data-test-contrast="badge-info"
                        className="d-flex align-items-center"
                      >
                        {customer.loyaltyPoints} pts
                      </Badge>
                    </td>

                    <td>
                      <Badge
                        bg={customer.isActive && customer.totalOrders > 0 ? "success" : customer.isActive ? "warning" : "secondary"}
                      >
                        {customer.isActive ? (customer.totalOrders > 0 ? 'Activo' : 'Sin pedidos') : 'Inactivo'}
                      </Badge>
                    </td>

                    <td>
                      <small className="text-muted d-flex align-items-center">
                        <FiCalendar className="me-1" size={10} style={{ color: 'var(--secondary-color, #06817E)' }} />
                        {formatDate(customer.createdAt)}
                      </small>
                    </td>

                    <td onClick={(e) => e.stopPropagation()}>
                      <div className="d-flex gap-2">
                        <Button variant="outline-primary" size="sm" onClick={() => openEdit(customer)} title="Editar">
                          <FiEdit size={16} />
                        </Button>
                        <Button variant="outline-danger" size="sm" onClick={() => handleDelete(customer)} title="Eliminar">
                          <FiTrash2 size={16} />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </div>
        )}
      </Card.Body>

      <Modal show={showDetail} onHide={() => setShowDetail(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Detalle del Cliente</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedCustomer && (
            <div className="small">
              <div className="mb-2"><strong>Nombre:</strong> {selectedCustomer.name}</div>
              <div className="mb-2"><strong>Email:</strong> {selectedCustomer.email || '—'}</div>
              <div className="mb-2"><strong>Teléfono:</strong> {selectedCustomer.phone || '—'}</div>
              <div className="mb-2"><strong>Documento:</strong> {selectedCustomer.documentNumber || '—'}</div>
              <div className="mb-2"><strong>Dirección:</strong> {selectedCustomer.address || '—'}</div>
              <div className="mb-2"><strong>Ciudad:</strong> {selectedCustomer.city || '—'}</div>
              <div className="mb-2"><strong>Código Postal:</strong> {selectedCustomer.postalCode || '—'}</div>
              <div className="mb-2"><strong>Puntos:</strong> {selectedCustomer.loyaltyPoints}</div>
              <div className="mb-2"><strong>Órdenes:</strong> {selectedCustomer.totalOrders}</div>
              <div className="mb-2"><strong>Total gastado:</strong> {formatCurrency(selectedCustomer.totalSpent)}</div>
              <div className="mb-2"><strong>Estado:</strong> {selectedCustomer.isActive ? 'Activo' : 'Inactivo'}</div>
              <div className="mb-2"><strong>Creado:</strong> {formatDate(selectedCustomer.createdAt)}</div>
              <div className="mb-2"><strong>Actualizado:</strong> {formatDate(selectedCustomer.updatedAt)}</div>
            </div>
          )}
        </Modal.Body>
      </Modal>

      <Modal show={showEdit} onHide={() => setShowEdit(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Editar Cliente</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-2">
              <Form.Label>Nombre</Form.Label>
              <Form.Control value={editData.name || ''} onChange={(e) => setEditData({ ...editData, name: e.target.value })} />
            </Form.Group>
            <Form.Group className="mb-2">
              <Form.Label>Email</Form.Label>
              <Form.Control type="email" value={editData.email || ''} onChange={(e) => setEditData({ ...editData, email: e.target.value })} />
            </Form.Group>
            <Form.Group className="mb-2">
              <Form.Label>Teléfono</Form.Label>
              <Form.Control value={editData.phone || ''} onChange={(e) => setEditData({ ...editData, phone: e.target.value })} />
            </Form.Group>
            <Form.Group className="mb-2">
              <Form.Label>Documento</Form.Label>
              <Form.Control value={editData.documentNumber || ''} onChange={(e) => setEditData({ ...editData, documentNumber: e.target.value })} />
            </Form.Group>
            <Form.Group className="mb-2">
              <Form.Label>Dirección</Form.Label>
              <Form.Control value={editData.address || ''} onChange={(e) => setEditData({ ...editData, address: e.target.value })} />
            </Form.Group>
            <Form.Group className="mb-2">
              <Form.Label>Ciudad</Form.Label>
              <Form.Control value={editData.city || ''} onChange={(e) => setEditData({ ...editData, city: e.target.value })} />
            </Form.Group>
            <Form.Group className="mb-2">
              <Form.Label>Código Postal</Form.Label>
              <Form.Control value={editData.postalCode || ''} onChange={(e) => setEditData({ ...editData, postalCode: e.target.value })} />
            </Form.Group>
            <Form.Group className="mb-2">
              <Form.Check type="switch" label="Activo" checked={!!editData.isActive} onChange={(e) => setEditData({ ...editData, isActive: e.target.checked })} />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowEdit(false)}>Cancelar</Button>
          <Button variant="primary" onClick={handleSaveEdit} disabled={saving}>
            {saving ? 'Guardando...' : 'Guardar cambios'}
          </Button>
        </Modal.Footer>
      </Modal>
    </Card>
  );
}
