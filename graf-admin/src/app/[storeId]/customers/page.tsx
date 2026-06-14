'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { Container, Row, Col, Card, Button } from 'react-bootstrap';
import { FiUsers, FiDownload, FiUpload, FiUserPlus } from 'react-icons/fi';
import { useCustomers } from './hooks/useCustomers';
import { CustomersList } from '@/components/Dashboard/CustomersList';
import { CustomerForm } from '@/components/Dashboard/CustomerForm';
import ExportModal from '@/components/Dashboard/ExportModal';
import ImportCustomersModal from '@/components/Dashboard/ImportCustomersModal';

export default function CustomersPage() {
  const { storeId } = useParams();
  const [showExportModal, setShowExportModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const { customers, isLoading, stats, refetch, updateCustomer, deleteCustomer } = useCustomers(storeId as string);

  return (
    <Container fluid className="py-4">
      <div className="mb-4">
        <Row className="align-items-center">
          <Col>
            <h1 className="h3 mb-2">
              <FiUsers className="me-2" size={20} style={{ color: 'var(--primary-color, #1B3862)' }} />
              Gestión de Clientes
            </h1>
            <p className="text-muted mb-0">
              Visualiza los clientes que han realizado pedidos en tu tienda
            </p>
          </Col>
          <Col xs="auto" className="d-flex gap-2">
            <Button
              variant="primary"
              onClick={() => setShowCreateModal(true)}
              className="d-flex align-items-center"
            >
              <FiUserPlus className="me-2" size={16} />
              Nuevo Cliente
            </Button>
            <Button
              variant="primary"
              onClick={() => setShowImportModal(true)}
              className="d-flex align-items-center"
            >
              <FiUpload className="me-2" size={16} />
              Importar Excel
            </Button>
            <Button
              variant="outline-primary"
              onClick={() => setShowExportModal(true)}
              className="d-flex align-items-center"
            >
              <FiDownload className="me-2" size={16} />
              Exportar Excel
            </Button>
          </Col>
        </Row>
      </div>

      <Row className="mb-4">
        <Col md={3}>
          <Card className="text-center">
            <Card.Body>
              <FiUsers size={32} style={{ color: 'var(--primary-color, #1B3862)' }} />
              <h4>{stats?.totalCustomers || 0}</h4>
              <p className="text-muted mb-0">Total Clientes</p>
            </Card.Body>
          </Card>
        </Col>

        <Col md={3}>
          <Card className="text-center">
            <Card.Body>
              <div className="d-flex justify-content-center mb-2">
                <div 
                  className="rounded-circle d-flex align-items-center justify-content-center"
                  style={{
                    width: '40px',
                    height: '40px',
                    backgroundColor: 'var(--success-color, #278F7E)',
                    color: 'white'
                  }}
                >
                  <span className="fw-bold">✓</span>
                </div>
              </div>
              <h4>{stats?.activeCustomers || 0}</h4>
              <p className="text-muted mb-0">Clientes Activos</p>
            </Card.Body>
          </Card>
        </Col>

        <Col md={4}>
          <Card className="text-center">
            <Card.Body>
              <div className="d-flex justify-content-center mb-2">
                <div 
                  className="rounded-circle d-flex align-items-center justify-content-center"
                  style={{
                    width: '40px',
                    height: '40px',
                    backgroundColor: 'var(--success-color, #278F7E)',
                    color: 'white'
                  }}
                >
                  <span className="fw-bold">$</span>
                </div>
              </div>
              <h4>
                ${Math.round(stats?.averageSpent || 0).toLocaleString()}
              </h4>
              <p className="text-muted mb-0">Promedio Gastado</p>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <CustomersList
        customers={customers}
        isLoading={isLoading}
        storeId={storeId as string}
        onUpdateCustomer={(id, data) => updateCustomer(id, data)}
        onDeleteCustomer={(id) => deleteCustomer(id)}
      />

      {showExportModal && (
        <ExportModal
          show={showExportModal}
          onHide={() => setShowExportModal(false)}
          title="Exportar Clientes a Excel"
          exportType="customers"
          storeId={storeId as string}
        />
      )}

      {showImportModal && (
        <ImportCustomersModal
          show={showImportModal}
          onHide={() => setShowImportModal(false)}
          storeId={storeId as string}
          onSuccess={() => {
            refetch();
            setShowImportModal(false);
          }}
        />
      )}

      {showCreateModal && (
        <CustomerForm
          storeId={storeId as string}
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            refetch();
            setShowCreateModal(false);
          }}
        />
      )}
    </Container>
  );
}
