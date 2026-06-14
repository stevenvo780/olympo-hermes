import React, { useMemo, useState, useEffect } from 'react';
import { Form, Button, ListGroup, Badge } from 'react-bootstrap';
import { useDispatch } from 'react-redux';
import { addNotification } from '@/redux/ui';

/** Límite de tamaño por archivo en bytes (10MB). */
const MAX_FILE_SIZE = 10 * 1024 * 1024;

const ALLOWED_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
];

const ALLOWED_EXTENSIONS = ['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.jpg', '.jpeg', '.png', '.webp'];

interface DocumentUploaderProps {
  /** URLs de documentos ya guardados. */
  currentDocuments?: string[];
  /** Callback que recibe el listado de archivos seleccionados pendientes por subir. */
  onDocumentsChange: (files: File[]) => void;
  /** Número máximo de archivos permitidos. */
  maxFiles?: number;
  /** Etiqueta a mostrar en el control de carga. */
  label?: string;
}

/**
 * Permite cargar, validar y previsualizar documentos antes de enviarlos al backend.
 */
const DocumentUploader: React.FC<DocumentUploaderProps> = ({
  currentDocuments,
  onDocumentsChange,
  maxFiles = 5,
  label = 'Documentos',
}) => {
  const dispatch = useDispatch();
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const normalizedDocuments = useMemo(() => currentDocuments ?? [], [currentDocuments]);
  const [previews, setPreviews] = useState<string[]>(normalizedDocuments);

  useEffect(() => {
    setPreviews(normalizedDocuments);
  }, [normalizedDocuments]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);

    if (files.length === 0) return;

    const totalFiles = selectedFiles.length + previews.length + files.length;
    if (totalFiles > maxFiles) {
      dispatch(
        addNotification({
          message: `Máximo ${maxFiles} archivos permitidos`,
          color: 'warning',
        })
      );
      return;
    }

    const invalidFiles = files.filter(
      (file) =>
        !ALLOWED_TYPES.includes(file.type) &&
        !ALLOWED_EXTENSIONS.some((ext) => file.name.toLowerCase().endsWith(ext))
    );

    if (invalidFiles.length > 0) {
      dispatch(
        addNotification({
          message: `Archivos no permitidos: ${ALLOWED_EXTENSIONS.join(', ')}`,
          color: 'warning',
        })
      );
      return;
    }

    const oversizedFiles = files.filter((file) => file.size > MAX_FILE_SIZE);
    if (oversizedFiles.length > 0) {
      dispatch(
        addNotification({
          message: `Algunos archivos exceden el límite de 10MB`,
          color: 'warning',
        })
      );
      return;
    }

    const newFiles = [...selectedFiles, ...files];
    setSelectedFiles(newFiles);
    onDocumentsChange(newFiles);

    e.target.value = '';
  };

  const removeFile = (index: number) => {
    const newFiles = selectedFiles.filter((_, i) => i !== index);
    setSelectedFiles(newFiles);
    onDocumentsChange(newFiles);
  };

  const removePreview = (index: number) => {
    const newPreviews = previews.filter((_, i) => i !== index);
    setPreviews(newPreviews);
  };

  const getFileIcon = (fileName: string) => {
    const ext = fileName.toLowerCase().split('.').pop();
    switch (ext) {
      case 'pdf':
        return '📄';
      case 'doc':
      case 'docx':
        return '📝';
      case 'xls':
      case 'xlsx':
        return '📊';
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'webp':
        return '🖼️';
      default:
        return '📎';
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <div>
      <Form.Group className="mb-3">
        <Form.Label>{label}</Form.Label>
        <Form.Control
          type="file"
          multiple
          accept={ALLOWED_EXTENSIONS.join(',')}
          onChange={handleFileChange}
          disabled={selectedFiles.length + previews.length >= maxFiles}
        />
        <Form.Text className="text-muted">
          Formatos: PDF, Word, Excel, imágenes. Máximo {maxFiles} archivos de 10MB cada uno.
        </Form.Text>
      </Form.Group>

      {previews.length > 0 && (
        <div className="mb-3">
          <strong>Documentos guardados:</strong>
          <ListGroup className="mt-2">
            {previews.map((url, index) => {
              const fileName = url.split('/').pop()?.split('?')[0] || 'Documento';
              const decodedName = decodeURIComponent(fileName);
              return (
                <ListGroup.Item
                  key={`preview-${index}`}
                  className="d-flex justify-content-between align-items-center"
                >
                  <div className="d-flex align-items-center gap-2">
                    <span>{getFileIcon(decodedName)}</span>
                    <a href={url} target="_blank" rel="noopener noreferrer" className="text-truncate">
                      {decodedName.length > 40 ? decodedName.substring(0, 40) + '...' : decodedName}
                    </a>
                  </div>
                  <Button variant="danger" size="sm" onClick={() => removePreview(index)}>
                    ✕
                  </Button>
                </ListGroup.Item>
              );
            })}
          </ListGroup>
        </div>
      )}

      {selectedFiles.length > 0 && (
        <div className="mb-3">
          <strong>Archivos por subir:</strong>
          <ListGroup className="mt-2">
            {selectedFiles.map((file, index) => (
              <ListGroup.Item
                key={`file-${index}`}
                className="d-flex justify-content-between align-items-center"
              >
                <div className="d-flex align-items-center gap-2">
                  <span>{getFileIcon(file.name)}</span>
                  <span className="text-truncate">
                    {file.name.length > 40 ? file.name.substring(0, 40) + '...' : file.name}
                  </span>
                  <Badge bg="secondary">{formatFileSize(file.size)}</Badge>
                </div>
                <Button variant="danger" size="sm" onClick={() => removeFile(index)}>
                  ✕
                </Button>
              </ListGroup.Item>
            ))}
          </ListGroup>
        </div>
      )}
    </div>
  );
};

export default DocumentUploader;
