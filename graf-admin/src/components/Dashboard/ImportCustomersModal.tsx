'use client';

import { useState } from 'react';
import { Modal, Button, Form, Alert, Table, Spinner, ProgressBar, OverlayTrigger, Tooltip } from 'react-bootstrap';
import { FiUpload, FiDownload, FiCheckCircle, FiAlertCircle, FiInfo } from 'react-icons/fi';
import * as XLSX from 'xlsx';
import { CustomerService, CustomerExcelRow } from '@/services/customerService';
import { ImportOperationStatus } from '@/types/product-excel';

interface ImportCustomersModalProps {
  show: boolean;
  onHide: () => void;
  storeId: string;
  onSuccess?: () => void;
}

export default function ImportCustomersModal({
  show,
  onHide,
  storeId,
  onSuccess,
}: ImportCustomersModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<CustomerExcelRow[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<{ created: number; updated: number; deleted: number; skipped: number; failed: number; results: { email: string; name?: string; status: string; message: string }[] } | null>(null);
  const [error, setError] = useState<string>('');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    setError('');
    setResult(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = event.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet) as Record<string, unknown>[];

        const mappedData: CustomerExcelRow[] = jsonData.map((row) => ({
          email: String(row.email || row.Email || row.EMAIL || ''),
          name: String(row.name || row.Name || row.NAME || row.nombre || row.Nombre || ''),
          phone: String(row.phone || row.Phone || row.PHONE || row.telefono || row.Teléfono || ''),
          documentNumber: String(row.documentNumber || row.DocumentNumber || row.documento || row.Documento || ''),
          address: String(row.address || row.Address || row.ADDRESS || row.direccion || row.Dirección || ''),
          city: String(row.city || row.City || row.CITY || row.ciudad || row.Ciudad || ''),
          postalCode: String(row.postalCode || row['Código Postal'] || row['codigo postal'] || ''),
          action: (row.action || row.Action || row.accion || 'update') as 'create' | 'update' | 'delete',
        }));

        setPreview(mappedData.slice(0, 10));
      } catch (err) {
        setError('Error al leer el archivo. Asegúrate de que sea un archivo Excel válido.');
        console.error(err);
      }
    };

    reader.readAsBinaryString(selectedFile);
  };

  const handleImport = async () => {
    if (!file || preview.length === 0) {
      setError('Por favor selecciona un archivo válido');
      return;
    }

    setIsProcessing(true);
    setError('');

    try {
      const reader = new FileReader();
      reader.onload = async (event) => {
        try {
          const data = event.target?.result;
          const workbook = XLSX.read(data, { type: 'binary' });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet) as Record<string, unknown>[];

          const rows: CustomerExcelRow[] = jsonData.map((row) => ({
            email: String(row.email || row.Email || row.EMAIL || ''),
            name: String(row.name || row.Name || row.NAME || row.nombre || row.Nombre || ''),
            phone: String(row.phone || row.Phone || row.PHONE || row.telefono || row.Teléfono || ''),
            documentNumber: String(row.documentNumber || row.DocumentNumber || row.documento || row.Documento || ''),
            address: String(row.address || row.Address || row.ADDRESS || row.direccion || row.Dirección || ''),
            city: String(row.city || row.City || row.CITY || row.ciudad || row.Ciudad || ''),
            postalCode: String(row.postalCode || row['Código Postal'] || row['codigo postal'] || ''),
            action: (row.action || row.Action || row.accion || 'update') as 'create' | 'update' | 'delete',
          }));

          const response = await CustomerService.importCustomersFromExcel(storeId, rows);
          setResult(response);
          
          if (onSuccess && (response.created > 0 || response.updated > 0)) {
            setTimeout(() => {
              onSuccess();
            }, 2000);
          }
        } catch (err) {
          const error = err as { response?: { data?: { message?: string } } };
          setError(error.response?.data?.message || 'Error al importar clientes');
        } finally {
          setIsProcessing(false);
        }
      };

      reader.readAsBinaryString(file);
    } catch (err) {
      const error = err as { response?: { data?: { message?: string } } };
      setError(error.response?.data?.message || 'Error al procesar el archivo');
      setIsProcessing(false);
    }
  };

  const downloadTemplate = () => {
    const template = [
      {
        email: 'cliente@example.com',
        name: 'Juan Pérez',
        phone: '+57 300 123 4567',
        documentNumber: '1234567890',
        address: 'Calle 123 #45-67',
        city: 'Bogotá',
        postalCode: '110111',
        action: 'update',
      },
    ];

    const worksheet = XLSX.utils.json_to_sheet(template);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Clientes');
    XLSX.writeFile(workbook, 'plantilla_clientes.xlsx');
  };

  const handleClose = () => {
    setFile(null);
    setPreview([]);
    setResult(null);
    setError('');
    onHide();
  };

  return (
    <Modal show={show} onHide={handleClose} size="lg">
      <Modal.Header closeButton>
        <Modal.Title>
          <FiUpload className="me-2" />
          Importar Clientes desde Excel
        </Modal.Title>
      </Modal.Header>

      <Modal.Body>
        {!result ? (
          <>
            <div className="mb-3">
              <OverlayTrigger
                placement="right"
                overlay={
                  <Tooltip>
                    <div className="text-start">
                      <strong>Formato del archivo Excel:</strong>
                      <ul className="ps-3 mb-0 mt-1" style={{ fontSize: '0.85rem' }}>
                        <li><strong>email</strong> (opcional)</li>
                        <li><strong>name</strong>: Nombre del cliente</li>
                        <li><strong>phone</strong> (opcional): Teléfono</li>
                        <li><strong>documentNumber</strong> (opcional): Documento</li>
                        <li><strong>address</strong>: Dirección</li>
                        <li><strong>city</strong>: Ciudad</li>
                        <li><strong>postalCode</strong>: Código postal</li>
                        <li><strong>action</strong>: create, update, o delete (por defecto: update)</li>
                        <li>Debe incluir al menos uno entre: email, phone o documentNumber</li>
                      </ul>
                    </div>
                  </Tooltip>
                }
              >
                <div className="d-inline-flex align-items-center text-muted" style={{ cursor: 'help' }}>
                  <FiInfo className="me-1" size={18} />
                  <small>Ver formato requerido del archivo Excel</small>
                </div>
              </OverlayTrigger>
            </div>

            <div className="mb-3">
              <Button variant="outline-secondary" onClick={downloadTemplate} size="sm">
                <FiDownload className="me-2" />
                Descargar Plantilla de Ejemplo
              </Button>
            </div>

            <Form.Group className="mb-3">
              <Form.Label>Seleccionar archivo Excel</Form.Label>
              <Form.Control
                type="file"
                accept=".xlsx,.xls"
                onChange={handleFileChange}
                disabled={isProcessing}
              />
            </Form.Group>

            {error && (
              <Alert variant="danger">
                <FiAlertCircle className="me-2" />
                {error}
              </Alert>
            )}

            {preview.length > 0 && (
              <div>
                <h6>Vista previa (primeros 10 registros):</h6>
                <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                  <Table striped bordered hover size="sm">
                    <thead>
                      <tr>
                        <th>Email</th>
                        <th>Nombre</th>
                        <th>Teléfono</th>
                        <th>Documento</th>
                        <th>Ciudad</th>
                        <th>Acción</th>
                      </tr>
                    </thead>
                    <tbody>
                      {preview.map((row, idx) => (
                        <tr key={idx}>
                          <td>{row.email}</td>
                          <td>{row.name}</td>
                          <td>{row.phone}</td>
                          <td>{row.documentNumber}</td>
                          <td>{row.city}</td>
                          <td>
                            <span
                              className={`badge bg-${
                                row.action === 'create'
                                  ? 'success'
                                  : row.action === 'delete'
                                    ? 'danger'
                                    : 'primary'
                              }`}
                            >
                              {row.action}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </div>
              </div>
            )}
          </>
        ) : (
          <div>
            <Alert variant="success">
              <FiCheckCircle className="me-2" size={20} />
              <strong>Importación completada</strong>
            </Alert>

            <div className="mb-3">
              <div className="mb-2">
                <strong>Creados:</strong> <span className="badge bg-success">{result.created}</span>
              </div>
              <div className="mb-2">
                <strong>Actualizados:</strong> <span className="badge bg-primary">{result.updated}</span>
              </div>
              <div className="mb-2">
                <strong>Eliminados:</strong> <span className="badge bg-danger">{result.deleted}</span>
              </div>
              <div className="mb-2">
                <strong>Omitidos:</strong> <span className="badge bg-warning">{result.skipped}</span>
              </div>
              <div className="mb-2">
                <strong>Fallidos:</strong> <span className="badge bg-danger">{result.failed}</span>
              </div>
            </div>

            {result.results && result.results.length > 0 && (
              <div>
                <h6>Detalles:</h6>
                <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                  <Table striped bordered hover size="sm">
                    <thead>
                      <tr>
                        <th>Email</th>
                        <th>Nombre</th>
                        <th>Estado</th>
                        <th>Mensaje</th>
                      </tr>
                    </thead>
                    <tbody>
                      {result.results.map((r, idx: number) => (
                        <tr key={idx}>
                          <td>{r.email}</td>
                          <td>{r.name || '-'}</td>
                          <td>
                            <span
                              className={`badge bg-${
                                r.status === ImportOperationStatus.CREATED
                                  ? 'success'
                                  : r.status === ImportOperationStatus.UPDATED
                                    ? 'primary'
                                    : r.status === ImportOperationStatus.DELETED
                                      ? 'danger'
                                      : r.status === ImportOperationStatus.SKIPPED
                                        ? 'warning'
                                        : 'danger'
                              }`}
                            >
                              {r.status}
                            </span>
                          </td>
                          <td>{r.message}</td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </div>
              </div>
            )}
          </div>
        )}

        {isProcessing && (
          <div className="text-center">
            <Spinner animation="border" variant="primary" />
            <p className="mt-2">Procesando importación...</p>
            <ProgressBar animated now={100} />
          </div>
        )}
      </Modal.Body>

      <Modal.Footer>
        <Button variant="secondary" onClick={handleClose} disabled={isProcessing}>
          {result ? 'Cerrar' : 'Cancelar'}
        </Button>
        {!result && (
          <Button variant="primary" onClick={handleImport} disabled={!file || isProcessing}>
            {isProcessing ? (
              <>
                <Spinner animation="border" size="sm" className="me-2" />
                Importando...
              </>
            ) : (
              <>
                <FiUpload className="me-2" />
                Importar
              </>
            )}
          </Button>
        )}
      </Modal.Footer>
    </Modal>
  );
}
