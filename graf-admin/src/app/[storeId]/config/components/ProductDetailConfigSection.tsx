import React from 'react';
import { Form, Row, Col, Card } from 'react-bootstrap';
import {
  ProductDetailConfig,
  ProductDetailViewType,
  ProductContentType,
  ProductViewVariant,
  RecommendedDisplayMode,
} from '@/types';
import {
  FaDesktop,
  FaExpand,
  FaFile,
  FaCode,
  FaAlignLeft,
  FaThumbsUp,
  FaTshirt,
  FaTh,
  FaCompress,
  FaStar,
} from 'react-icons/fa';
import { MdViewCarousel } from 'react-icons/md';
import { BsGrid3X3Gap, BsViewList, BsCardList } from 'react-icons/bs';

type ProductDetailConfigProps = {
  productDetailConfig: ProductDetailConfig;
  handleNestedChange: (
    field: 'productDetailConfig',
    key: string,
    value: string | boolean
  ) => void;
};

const ProductDetailConfigSection: React.FC<ProductDetailConfigProps> = ({
  productDetailConfig,
  handleNestedChange,
}) => {
  const viewTypeOptions = [
    {
      value: ProductDetailViewType.MODAL,
      label: 'Modal Estándar',
      description: 'Vista compacta en modal, ideal para tiendas con muchos productos',
      icon: FaDesktop,
    },
    {
      value: ProductDetailViewType.MODAL_LARGE,
      label: 'Modal Grande',
      description: 'Modal amplio con mayor protagonismo a las imágenes del producto',
      icon: FaExpand,
    },
    {
      value: ProductDetailViewType.PAGE,
      label: 'Página Completa',
      description: 'Página dedicada con descripciones extensas, ideal para productos técnicos (ej: PCs, electrónicos)',
      icon: FaFile,
    },
  ];

  const contentTypeOptions = [
    {
      value: ProductContentType.PLAIN,
      label: 'Texto Plano',
      description: 'Descripciones simples sin formato especial',
      icon: FaAlignLeft,
    },
    {
      value: ProductContentType.HTML,
      label: 'HTML Enriquecido',
      description: 'Descripciones con formato, listas, tablas y estilos personalizados',
      icon: FaCode,
    },
  ];

  const cardTypeOptions: Array<{ value: ProductViewVariant; label: string; icon: React.ComponentType<{ size?: number; className?: string }> }> = [
    { value: 'carousel', label: 'Carrusel', icon: MdViewCarousel },
    { value: 'grid', label: 'Cuadrícula', icon: BsGrid3X3Gap },
    { value: 'clothing', label: 'Ropa', icon: FaTshirt },
    { value: 'list', label: 'Lista', icon: BsViewList },
    { value: 'featured', label: 'Destacada', icon: FaStar },
    { value: 'clothing-grid', label: 'Ropa Cuadrícula', icon: FaTh },
    { value: 'wide-card', label: 'Amplia', icon: BsCardList },
    { value: 'compact', label: 'Compacta', icon: FaCompress },
  ];

  const displayModeOptions: Array<{ value: RecommendedDisplayMode; label: string; description: string; icon: React.ComponentType<{ size?: number; className?: string }> }> = [
    { 
      value: 'carousel', 
      label: 'Carrusel Horizontal', 
      description: 'Los productos se muestran en un slider que se puede desplazar horizontalmente',
      icon: MdViewCarousel 
    },
    { 
      value: 'grid', 
      label: 'Cuadrícula Completa', 
      description: 'Los productos se muestran en una cuadrícula responsiva, igual que en la página principal',
      icon: BsGrid3X3Gap 
    },
  ];

  const checkboxStyle = {
    width: '20px',
    height: '20px',
    marginRight: '10px',
    accentColor: 'var(--primary-color, #007bff)',
    cursor: 'pointer',
  };

  return (
    <fieldset className="mb-4">
      <legend>Configuración de Vista de Detalle de Productos</legend>

      {/* View Type Selection */}
      <div className="mb-4">
        <Form.Label className="fw-bold mb-3">Tipo de Vista de Detalle</Form.Label>
        <Row>
          {viewTypeOptions.map((option) => {
            const isSelected = productDetailConfig.viewType === option.value;
            const IconComponent = option.icon;

            return (
              <Col md={4} key={option.value} className="mb-3">
                <Card
                  className={`h-100 cursor-pointer ${isSelected ? 'border-primary' : ''}`}
                  style={{
                    cursor: 'pointer',
                    backgroundColor: isSelected ? '#e7f1ff' : '#ffffff',
                    borderWidth: isSelected ? '2px' : '1px',
                  }}
                  onClick={() =>
                    handleNestedChange('productDetailConfig', 'viewType', option.value)
                  }
                >
                  <Card.Body className="text-center">
                    <IconComponent
                      size={32}
                      className={`mb-2 ${isSelected ? 'text-primary' : 'text-secondary'}`}
                    />
                    <h6 className={isSelected ? 'text-primary' : 'text-dark'}>
                      {option.label}
                    </h6>
                    <small className="text-muted">{option.description}</small>
                    {isSelected && (
                      <div className="mt-2">
                        <span className="badge bg-primary">Seleccionado</span>
                      </div>
                    )}
                  </Card.Body>
                </Card>
              </Col>
            );
          })}
        </Row>
      </div>

      {/* Content Type Selection */}
      <div className="mb-4">
        <Form.Label className="fw-bold mb-3">Tipo de Contenido de Descripción</Form.Label>
        <Row>
          {contentTypeOptions.map((option) => {
            const isSelected = productDetailConfig.contentType === option.value;
            const IconComponent = option.icon;

            return (
              <Col md={6} key={option.value} className="mb-3">
                <Card
                  className={`h-100 ${isSelected ? 'border-primary' : ''}`}
                  style={{
                    cursor: 'pointer',
                    backgroundColor: isSelected ? '#e7f1ff' : '#ffffff',
                    borderWidth: isSelected ? '2px' : '1px',
                  }}
                  onClick={() =>
                    handleNestedChange('productDetailConfig', 'contentType', option.value)
                  }
                >
                  <Card.Body className="d-flex align-items-center">
                    <IconComponent
                      size={24}
                      className={`me-3 ${isSelected ? 'text-primary' : 'text-secondary'}`}
                    />
                    <div className="flex-grow-1">
                      <h6 className={`mb-1 ${isSelected ? 'text-primary' : 'text-dark'}`}>
                        {option.label}
                      </h6>
                      <small className="text-muted">{option.description}</small>
                    </div>
                    {isSelected && <span className="badge bg-primary">✓</span>}
                  </Card.Body>
                </Card>
              </Col>
            );
          })}
        </Row>
      </div>

      {/* Recommended Products Toggle */}
      <div className="mb-3 p-3" style={{ backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
        <div className="d-flex align-items-center">
          <FaThumbsUp className="me-3 text-primary" size={24} />
          <div className="flex-grow-1">
            <Form.Group className="mb-0">
              <Form.Text className="d-block mb-2">
                Muestra productos relacionados o sugeridos en la vista de detalle del producto
              </Form.Text>
              <div className="d-flex align-items-center">
                <input
                  type="checkbox"
                  id="showRecommendedProducts"
                  style={checkboxStyle}
                  checked={productDetailConfig.showRecommendedProducts ?? true}
                  onChange={(e) =>
                    handleNestedChange(
                      'productDetailConfig',
                      'showRecommendedProducts',
                      e.target.checked
                    )
                  }
                />
                <label htmlFor="showRecommendedProducts" className="fw-bold">
                  Mostrar productos recomendados
                </label>
              </div>
            </Form.Group>
          </div>
        </div>
      </div>

      {/* Recommended Products Card Type - Only show when recommendations are enabled */}
      {productDetailConfig.showRecommendedProducts && (
        <>
          <div className="mb-4">
            <Form.Label className="fw-bold mb-3">
              Modo de Visualización de Productos Recomendados
            </Form.Label>
            <Row>
              {displayModeOptions.map((option) => {
                const isSelected = productDetailConfig.recommendedDisplayMode === option.value;
                const IconComponent = option.icon;

                return (
                  <Col md={6} key={option.value} className="mb-3">
                    <Card
                      className={`h-100 ${isSelected ? 'border-primary' : ''}`}
                      style={{
                        cursor: 'pointer',
                        backgroundColor: isSelected ? '#e7f1ff' : '#ffffff',
                        borderWidth: isSelected ? '2px' : '1px',
                      }}
                      onClick={() =>
                        handleNestedChange('productDetailConfig', 'recommendedDisplayMode', option.value)
                      }
                    >
                      <Card.Body className="d-flex align-items-center">
                        <IconComponent
                          size={24}
                          className={`me-3 ${isSelected ? 'text-primary' : 'text-secondary'}`}
                        />
                        <div className="flex-grow-1">
                          <h6 className={`mb-1 ${isSelected ? 'text-primary' : 'text-dark'}`}>
                            {option.label}
                          </h6>
                          <small className="text-muted">{option.description}</small>
                        </div>
                        {isSelected && <span className="badge bg-primary">✓</span>}
                      </Card.Body>
                    </Card>
                  </Col>
                );
              })}
            </Row>
          </div>

          <div className="mb-4">
            <Form.Label className="fw-bold mb-3">
              Tipo de Tarjeta para Productos Recomendados
            </Form.Label>
            <Row>
              {cardTypeOptions.map((option) => {
                const isSelected = productDetailConfig.recommendedCardType === option.value;
                const IconComponent = option.icon;

                return (
                  <Col xs={6} md={3} key={option.value} className="mb-2">
                    <Card
                      className={`h-100 ${isSelected ? 'border-primary' : ''}`}
                      style={{
                        cursor: 'pointer',
                        backgroundColor: isSelected ? '#e7f1ff' : '#ffffff',
                        borderWidth: isSelected ? '2px' : '1px',
                      }}
                      onClick={() =>
                        handleNestedChange('productDetailConfig', 'recommendedCardType', option.value)
                      }
                    >
                      <Card.Body className="text-center py-3">
                        <IconComponent
                          size={24}
                          className={isSelected ? 'text-primary' : 'text-secondary'}
                        />
                        <div
                          className={`small mt-1 ${isSelected ? 'text-primary fw-bold' : 'text-muted'}`}
                        >
                          {option.label}
                        </div>
                      </Card.Body>
                    </Card>
                  </Col>
                );
              })}
            </Row>
          </div>
        </>
      )}
    </fieldset>
  );
};

export default ProductDetailConfigSection;
