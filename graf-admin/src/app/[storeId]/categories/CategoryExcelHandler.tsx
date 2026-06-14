import React from 'react';
import { Button, Spinner } from 'react-bootstrap';
import { useDispatch } from 'react-redux';
import CategoryExcelImportResultModal from './CategoryExcelImportResultModal';
import { useCategoryExcelHandler } from './hooks/useCategoryExcelHandler';

interface CategoryExcelHandlerProps {
  storeId: string;
  onImportComplete: () => void;
}

export default function CategoryExcelHandler({ 
  storeId, 
  onImportComplete, 
}: CategoryExcelHandlerProps) {
  const dispatch = useDispatch();

  const {
    isLoading,
    loadingMessage,
    importResults,
    showResultModal,
    resultSummary,
    fileInputRef,
    setShowResultModal,
    handleExportExcel,
    handleImportExcel
  } = useCategoryExcelHandler({
    storeId,
    dispatch,
    onImportComplete,
  });

  return (
    <div className="mb-3 position-relative">
      {isLoading && (
        <div
          style={{
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
            zIndex: 1040
          }}
        >
          <Spinner animation="border" variant="light" style={{ width: '3rem', height: '3rem' }} />
          <div className="text-white mt-3 font-weight-bold">{loadingMessage}</div>
        </div>
      )}

      <Button onClick={handleExportExcel} disabled={isLoading}>
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
          'Exportar'
        )}
      </Button>

      <Button onClick={() => fileInputRef.current?.click()} className="ms-2" disabled={isLoading}>
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
          'Importar'
        )}
      </Button>

      <input
        type="file"
        accept=".xlsx"
        ref={fileInputRef}
        style={{ display: 'none' }}
        onChange={handleImportExcel}
        disabled={isLoading}
      />

      <CategoryExcelImportResultModal
        show={showResultModal}
        onHide={() => {
          setShowResultModal(false);
          onImportComplete();
        }}
        results={importResults}
        summary={resultSummary}
      />
    </div>
  );
}
