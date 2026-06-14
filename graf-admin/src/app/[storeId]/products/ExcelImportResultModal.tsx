import React from 'react';
import { Modal, Button, Table, Badge } from 'react-bootstrap';
import { ImportResult } from '@/types/product-excel';

interface ExcelImportResultModalProps {
  show: boolean;
  onHide: () => void;
  results: ImportResult[];
  summary: {
    total: number;
    created: number;
    updated: number;
    deleted: number;
    skipped: number;
    failed: number;
  };
}

const statusVariant: Record<string, string> = {
  created: 'success',
  updated: 'primary',
  skipped: 'secondary',
  failed: 'danger',
  deleted: 'warning',
};

const statusLabel: Record<string, string> = {
  created: 'Creado',
  updated: 'Actualizado',
  skipped: 'Sin cambios',
  failed: 'Error',
  deleted: 'Eliminado',
};

export default function ExcelImportResultModal({ 
  show, 
  onHide, 
  results,
  summary 
}: ExcelImportResultModalProps) {
  return (
    <Modal show={show} onHide={onHide} size="lg">
      <Modal.Header closeButton>
        <Modal.Title>Resumen de importación</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <div className="mb-4">
          <h5>Estadísticas</h5>
          <div className="d-flex flex-wrap gap-2">
            <Badge bg="info" className="fs-6 p-2">Total: {summary.total}</Badge>
            <Badge bg="success" className="fs-6 p-2">Creados: {summary.created}</Badge>
            <Badge bg="primary" className="fs-6 p-2">Actualizados: {summary.updated}</Badge>
            <Badge bg="warning" className="fs-6 p-2">Eliminados: {summary.deleted}</Badge>
            <Badge bg="secondary" className="fs-6 p-2">Sin cambios: {summary.skipped}</Badge>
            <Badge bg="danger" className="fs-6 p-2">Errores: {summary.failed}</Badge>
          </div>
        </div>
        
        <div className="table-responsive" style={{ maxHeight: '50vh' }}>
          <Table striped bordered hover size="sm">
            <thead>
              <tr>
                <th>#</th>
                <th>Nombre del producto</th>
                <th>Estado</th>
                <th>Detalles</th>
              </tr>
            </thead>
            <tbody>
              {results.map((result, index) => (
                <tr key={index}>
                  <td>{index + 1}</td>
                  <td>{result.row ? `Fila ${result.row}: ` : ''}{result.sku || 'Sin SKU'}</td>
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
