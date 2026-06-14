import React from 'react';
import { Form, Row, Col, Button } from 'react-bootstrap';
import { useDispatch } from 'react-redux';
import { addNotification } from '@/redux/ui';
import { ProductViewConfig, ProductViewVariant } from '@/types';
import { 
  FaEye, FaFilter, FaTimes, FaTshirt, FaTh, FaCompress, FaStar 
} from 'react-icons/fa';
import { 
  MdViewCarousel
} from 'react-icons/md';
import { 
  BsGrid3X3Gap, BsViewList, BsCardList
} from 'react-icons/bs';

type ProductViewConfigProps = {
  productViewConfig: ProductViewConfig;
  handleNestedChange: (field: 'productViewConfig', key: string, value: string | string[] | undefined) => void;
};

const ProductViewConfigSection: React.FC<ProductViewConfigProps> = ({ 
  productViewConfig, 
  handleNestedChange 
}) => {
  const dispatch = useDispatch();

  const viewOptions: Array<{ value: ProductViewVariant; label: string; icon: React.ComponentType<{ size?: number; className?: string; }> }> = [
    { value: 'carousel', label: 'Vista Carrusel', icon: MdViewCarousel },
    { value: 'grid', label: 'Vista Cuadrícula', icon: BsGrid3X3Gap },
    { value: 'clothing', label: 'Vista Ropa', icon: FaTshirt },
    { value: 'list', label: 'Vista Lista', icon: BsViewList },
    { value: 'featured', label: 'Vista Destacada', icon: FaStar },
    { value: 'clothing-grid', label: 'Ropa en Cuadrícula', icon: FaTh },
    { value: 'wide-card', label: 'Vista Amplia', icon: BsCardList },
    { value: 'compact', label: 'Vista Compacta', icon: FaCompress }
  ];

  const handleViewToggle = (viewValue: ProductViewVariant, isEnabled: boolean) => {
    const currentViews = productViewConfig.availableViews || [];
    let newViews: ProductViewVariant[];
    
    if (isEnabled) {
      newViews = [...currentViews, viewValue];
    } else {

      if (currentViews.length <= 1) {
        dispatch(addNotification({ message: 'Debe tener al menos una vista activa.', color: 'danger' }));
        return;
      }
      newViews = currentViews.filter(view => view !== viewValue);

      if (productViewConfig.defaultView === viewValue) {
        handleNestedChange('productViewConfig', 'defaultView', newViews[0]);
      }

      if (productViewConfig.filteredView === viewValue) {
        handleNestedChange('productViewConfig', 'filteredView', undefined);
      }
    }
    
    handleNestedChange('productViewConfig', 'availableViews', newViews);
  };

  const setAsDefault = (viewValue: ProductViewVariant) => {
    handleNestedChange('productViewConfig', 'defaultView', viewValue);
  };

  const setAsFiltered = (viewValue: ProductViewVariant) => {
    if (productViewConfig.filteredView === viewValue) {

      handleNestedChange('productViewConfig', 'filteredView', undefined);
    } else {
      handleNestedChange('productViewConfig', 'filteredView', viewValue);
    }
  };

  const getOptionByValue = (value: ProductViewVariant) => viewOptions.find(opt => opt.value === value);

  return (
    <fieldset className="mb-4">
      <legend>Configuración de Vistas de Productos</legend>

      <div className="mb-4 p-3" style={{ backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
        <Row>
          <Col md={6}>
            <div className="d-flex align-items-center mb-2">
              <FaEye className="me-2 text-primary" />
              <strong>Vista por Defecto:</strong>
            </div>
            {productViewConfig.defaultView && (
              <div className="d-flex align-items-center">
                {(() => {
                  const option = getOptionByValue(productViewConfig.defaultView);
                  const IconComponent = option?.icon;
                  return IconComponent ? <IconComponent className="me-2" /> : null;
                })()}
                <span>{getOptionByValue(productViewConfig.defaultView)?.label}</span>
              </div>
            )}
          </Col>
          <Col md={6}>
            <div className="d-flex align-items-center mb-2">
              <FaFilter className="me-2 text-secondary" />
              <strong>Vista con Filtros:</strong>
            </div>
            {productViewConfig.filteredView ? (
              <div className="d-flex align-items-center">
                {(() => {
                  const option = getOptionByValue(productViewConfig.filteredView);
                  const IconComponent = option?.icon;
                  return IconComponent ? <IconComponent className="me-2" /> : null;
                })()}
                <span>{getOptionByValue(productViewConfig.filteredView)?.label}</span>
              </div>
            ) : (
              <span className="text-muted">Usar vista por defecto</span>
            )}
          </Col>
        </Row>
      </div>

      <div className="border rounded p-3">
        <Row>
          {viewOptions.map(option => {
            const isEnabled = productViewConfig.availableViews?.includes(option.value) || false;
            const isDefault = productViewConfig.defaultView === option.value;
            const isFiltered = productViewConfig.filteredView === option.value;
            const IconComponent = option.icon;
            
            return (
              <Col md={6} lg={3} key={option.value} className="mb-3">
                <div 
                  className="border rounded p-3 h-100"
                  style={{ 
                    backgroundColor: isEnabled ? '#f8f9fa' : '#ffffff',
                    borderColor: isEnabled ? '#0d6efd' : '#dee2e6'
                  }}
                >

                  <div className="d-flex align-items-center mb-3">
                    <IconComponent 
                      size={20} 
                      className={`me-2 ${isEnabled ? 'text-primary' : 'text-muted'}`}
                    />
                    <strong className={isEnabled ? 'text-dark' : 'text-muted'}>
                      {option.label}
                    </strong>
                  </div>

                  <div className="mb-3">
                    <div className="d-flex align-items-center gap-2">
                      <Form.Check
                        type="switch"
                        id={`view-${option.value}`}
                        checked={isEnabled}
                        onChange={(e) => handleViewToggle(option.value, e.target.checked)}
                        style={{
                          transform: 'scale(1.2)',
                        }}
                      />
                      <span 
                        className={`fw-bold ${isEnabled ? 'text-success' : 'text-secondary'}`}
                        style={{ 
                          fontSize: '0.9rem',
                          padding: '0.25rem 0.5rem',
                          borderRadius: '15px',
                          backgroundColor: isEnabled ? '#d1e7dd' : '#f8f9fa',
                          border: `1px solid ${isEnabled ? '#badbcc' : '#dee2e6'}`
                        }}
                      >
                        {isEnabled ? '✓ Activado' : '⊗ Desactivado'}
                      </span>
                    </div>
                  </div>

                  {isEnabled && (
                    <div className="d-flex flex-column gap-2">
                      <Button
                        variant={isDefault ? "primary" : "outline-primary"}
                        size="sm"
                        onClick={() => setAsDefault(option.value)}
                        className="d-flex align-items-center justify-content-center"
                        disabled={isDefault}
                      >
                        <FaEye className="me-1" size={12} />
                        {isDefault ? 'Por Defecto' : 'Usar por Defecto'}
                      </Button>
                      
                      <Button
                        variant={isFiltered ? "secondary" : "outline-secondary"}
                        size="sm"
                        onClick={() => setAsFiltered(option.value)}
                        className="d-flex align-items-center justify-content-center"
                      >
                        {isFiltered ? (
                          <>
                            <FaTimes className="me-1" size={12} />
                            Quitar Filtro
                          </>
                        ) : (
                          <>
                            <FaFilter className="me-1" size={12} />
                            Con Filtros
                          </>
                        )}
                      </Button>
                    </div>
                  )}
                </div>
              </Col>
            );
          })}
        </Row>
      </div>
    </fieldset>
  );
};

export default ProductViewConfigSection;
