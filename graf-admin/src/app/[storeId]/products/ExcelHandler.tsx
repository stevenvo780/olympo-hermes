import React from 'react';
import { Button, Spinner, Form } from 'react-bootstrap';
import { useDispatch } from 'react-redux';
import ExcelImportResultModal from './ExcelImportResultModal';
import { useExcelHandler } from './hooks/useExcelHandler';
import { FaFileExcel, FaDownload, FaUpload, FaTrash } from 'react-icons/fa';

interface ExcelHandlerProps {
  storeId: string;
  onImportComplete: () => void;
}

export default function ExcelHandler({ storeId, onImportComplete }: ExcelHandlerProps) {
  const dispatch = useDispatch();

  const {
    isLoading,
    loadingMessage,
    importResults,
    showResultModal,
    resultSummary,
    fileInputRef,
    deleteProductsNotInExcel,
    setShowResultModal,
    setDeleteProductsNotInExcel,
    handleExportExcel,
    handleImportExcel,
    generateExcelTemplate,
  } = useExcelHandler({
    storeId,
    dispatch,
    onImportComplete,
  });

  return (
    <div className="mb-3 position-relative">
      {isLoading && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999
        }}>
          <Spinner animation="border" variant="light" style={{ width: '3rem', height: '3rem' }} />
          <div className="text-white mt-3 font-weight-bold">{loadingMessage}</div>
          <div className="text-white mt-2 small">
            {loadingMessage.includes('Procesando') && (
              <div>Por favor espere, esto puede tomar unos minutos...</div>
            )}
          </div>
        </div>
      )}

      <div className="d-flex gap-2 flex-wrap align-items-center">
        <Button 
          variant="info" 
          onClick={generateExcelTemplate} 
          disabled={isLoading}
          size="sm"
        >
          <FaDownload className="me-1" />
          Descargar Plantilla
        </Button>

        <Button 
          variant="success" 
          onClick={handleExportExcel} 
          disabled={isLoading}
          size="sm"
        >
          {isLoading && loadingMessage.includes('Exportando') ? (
            <>
              <Spinner
                as="span"
                animation="border"
                size="sm"
                role="status"
                aria-hidden="true"
                className="me-2"
              />
              Exportando...
            </>
          ) : (
            <>
              <FaFileExcel className="me-1" />
              Exportar Excel
            </>
          )}
        </Button>

        <Button 
          variant="primary" 
          onClick={() => fileInputRef.current?.click()} 
          disabled={isLoading}
          size="sm"
        >
          {isLoading && loadingMessage.includes('Importando') ? (
            <>
              <Spinner
                as="span"
                animation="border"
                size="sm"
                role="status"
                aria-hidden="true"
                className="me-2"
              />
              Importando...
            </>
          ) : (
            <>
              <FaUpload className="me-1" />
              Importar Excel
            </>
          )}
        </Button>

        <Form.Check
          type="switch"
          id="delete-products-switch"
          label={
            <span>
              <FaTrash className="me-1" />
              Eliminar productos no presentes en Excel
            </span>
          }
          checked={deleteProductsNotInExcel}
          onChange={(e) => setDeleteProductsNotInExcel(e.target.checked)}
          disabled={isLoading}
          className="ms-3"
        />
      </div>

      <input
        type="file"
        accept=".xlsx"
        ref={fileInputRef}
        style={{ display: 'none' }}
        onChange={handleImportExcel}
        disabled={isLoading}
      />

      <ExcelImportResultModal
        show={showResultModal}
        onHide={() => setShowResultModal(false)}
        results={importResults}
        summary={resultSummary}
      />
    </div>
  );
}
