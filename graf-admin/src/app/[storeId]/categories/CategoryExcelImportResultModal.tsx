import React from 'react';
import { Modal, Button, Table, Badge } from 'react-bootstrap';
import { ImportOperationStatus } from '@/types/product-excel';

interface CategoryImportResult {
  categoryName: string;
  row?: number;
  status: ImportOperationStatus;
  message: string;
  categoryId?: number;
  error?: unknown;
}

interface CategoryExcelImportResultModalProps {
  show: boolean;
  onHide: () => void;
  results: CategoryImportResult[];
  summary: {
    total: number;
    created: number;
    updated: number;
    skipped: number;
    failed: number;
    deleted?: number;
  };
}

const statusVariant = {
  [ImportOperationStatus.CREATED]: 'success',
  [ImportOperationStatus.UPDATED]: 'primary',
  [ImportOperationStatus.SKIPPED]: 'secondary',
  [ImportOperationStatus.FAILED]: 'danger',
  [ImportOperationStatus.DELETED]: 'warning',
};

const statusLabel = {
  [ImportOperationStatus.CREATED]: 'Creada',
  [ImportOperationStatus.UPDATED]: 'Actualizada',
  [ImportOperationStatus.SKIPPED]: 'Sin cambios',
  [ImportOperationStatus.FAILED]: 'Error',
  [ImportOperationStatus.DELETED]: 'Eliminada',
};

export default function CategoryExcelImportResultModal({ 
  show, 
  onHide, 
  results,
  summary 
}: CategoryExcelImportResultModalProps) {

  return (
    <Modal 
      show={show} 
      onHide={onHide} 
      size="lg"
    >
      <Modal.Header closeButton>
        <Modal.Title>Resumen de importación de categorías</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <div className="mb-4">
          <h5>Estadísticas</h5>
          <div className="d-flex flex-wrap gap-2">
            <Badge bg="info" className="fs-6 p-2">Total: {summary.total}</Badge>
            <Badge bg="success" className="fs-6 p-2">Creadas: {summary.created}</Badge>
            <Badge bg="primary" className="fs-6 p-2">Actualizadas: {summary.updated}</Badge>
            <Badge bg="secondary" className="fs-6 p-2">Sin cambios: {summary.skipped}</Badge>
            {summary.deleted !== undefined && (
              <Badge bg="warning" className="fs-6 p-2">Eliminadas: {summary.deleted}</Badge>
            )}
            <Badge bg="danger" className="fs-6 p-2">Errores: {summary.failed}</Badge>
          </div>
        </div>
        
        <div className="table-responsive" style={{ maxHeight: '50vh' }}>
          <Table striped bordered hover size="sm">
            <thead>
              <tr>
                <th>#</th>
                <th>Nombre de la categoría</th>
                <th>Estado</th>
                <th>Detalles</th>
              </tr>
            </thead>
            <tbody>
              {results.map((result, index) => (
                <tr key={index}>
                  <td>{index + 1}</td>
                  <td>{result.row ? `Fila ${result.row}: ` : ''}{result.categoryName || 'Sin nombre'}</td>
                  <td>
                    <Badge bg={statusVariant[result.status]}>
                      {statusLabel[result.status]}
                    </Badge>
                  </td>
                  <td>{result.message}</td>
                </tr>
              ))}
            </tbody>
          </Table>
        </div>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="primary" onClick={onHide}>
          Cerrar
        </Button>
      </Modal.Footer>
    </Modal>
  );
}
