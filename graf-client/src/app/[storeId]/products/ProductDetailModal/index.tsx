import React, { useEffect, useState, useCallback } from 'react';
import { Modal, Button, Spinner, Container, Row, Col, Badge, Card } from 'react-bootstrap';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import { Product, ProductDetailViewType, ProductContentType } from '@/types';
import { useDispatch, useSelector } from 'react-redux';
import { addToCart, incrementQuantity, decrementQuantity } from '@/redux/cart';
import api from '@/utils/axios';
import { FaTag, FaRuler, FaLayerGroup, FaCube, FaPlus, FaMinus, FaShoppingCart } from 'react-icons/fa';
import './styles.scss';
import RecommendedProducts from '@/app/[storeId]/components/RecommendedProducts';
import { RootState } from '@/redux/store';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import VariationSelectorModal from '../VariationSelectorModal';
import { getValidImageUrl } from '@/utils/imageUtils';
import SafeHtmlRenderer from '@/components/SafeHtmlRenderer';

interface ProductDetailModalProps {
  show: boolean;
  onHide: () => void;
  product: Product;
}

const ProductDetailModal: React.FC<ProductDetailModalProps> = ({ show, onHide, product }) => {
  const { storeId } = useParams() as { storeId: string };
  const dispatch = useDispatch();
  const [detailedProduct, setDetailedProduct] = useState<Product | null>(null);
  const [suggestedProducts, setSuggestedProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState({ product: false, suggestions: false });
  const cartState = useSelector((state: RootState) => state.cart);
  const productDetailConfig = useSelector((state: RootState) => state.config.config?.productDetailConfig);
  const cart = cartState.carts[storeId] || { items: [] };
  const cartItem = detailedProduct ? cart.items.find(item => item.product.id === detailedProduct.id) : null;
  const quantity = cartItem ? cartItem.quantity : 0;
  const [showVariationSelector, setShowVariationSelector] = useState(false);
  const [variationSelectorParent, setVariationSelectorParent] = useState<Product | null>(null);
  const [nestedProduct, setNestedProduct] = useState<Product | null>(null);

  // Config-driven settings with defaults
  const viewType = productDetailConfig?.viewType || ProductDetailViewType.MODAL;
  const contentType = productDetailConfig?.contentType || ProductContentType.PLAIN;
  const showRecommendedProducts = productDetailConfig?.showRecommendedProducts ?? true;

  const handleShowNestedDetail = useCallback((prod: Product) => {
    setNestedProduct(prod);
  }, []);

  useEffect(() => {
    if (!show) return;
    const fetchData = async () => {
      setLoading(prev => ({ ...prev, product: true }));
      try {
        const { data } = await api.get(`/products/${storeId}/${product.id}`);
        setDetailedProduct(data);
        if (data.categories?.length) {
          setLoading(prev => ({ ...prev, suggestions: true }));
          const productsSuggestions: Product[] = []
          for (const category of data.categories) {
            const suggestionsResponse = await api.get(`/products/${storeId}`, {
              params: {
                category: category.id,
                exist: true
              }
            });
            const filteredSuggestions: Product[] = suggestionsResponse.data.products.filter((p: Product) => p.id !== data.id);
            productsSuggestions.push(...filteredSuggestions);
          }
          setSuggestedProducts(productsSuggestions);
        }
      } catch {
      } finally {
        setLoading({ product: false, suggestions: false });
      }
    };
    const timeoutId = window.setTimeout(fetchData, 200);
    return () => clearTimeout(timeoutId);
  }, [product.id, show, storeId]);

  const formatPeso = (value: number): string => {
    return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(value);
  };

  const renderPrice = () => {
    if (!detailedProduct) return null;
    const isParent = !!(detailedProduct.children && detailedProduct.children.length > 0);

    if (isParent) {
      const fallbackMin = (() => {
        if (!detailedProduct.children || detailedProduct.children.length === 0) return 0;
        const values: number[] = [];
        const collect = (p: Product) => {
          if (!p.children || p.children.length === 0) values.push(Number(p.basePrice) || 0);
          else p.children.forEach(collect);
        };
        collect(detailedProduct);
        return values.length ? Math.min(...values) : 0;
      })();
      const value = detailedProduct.displayPrice && detailedProduct.displayPrice > 0 ? detailedProduct.displayPrice : fallbackMin;
      return (
        <div className="product-price-container">
          <h2 className="fw-bold mb-0">{formatPeso(value)}</h2>
        </div>
      );
    } else {
      const hasDiscount = detailedProduct.discountPrice > 0;
      return (
        <div className="product-price-container">
          {hasDiscount ? (
            <>
              <div className="original-price">
                <span className="text-muted text-decoration-line-through fs-5">
                  {formatPeso(detailedProduct.priceWithTax ?? detailedProduct.basePrice)}
                </span>
              </div>
              <h2 className="discounted-price fw-bold text-primary mb-0">
                {formatPeso(detailedProduct.totalPrice ?? (detailedProduct.basePrice - detailedProduct.discountPrice))}
              </h2>
            </>
          ) : (
            <h2 className="fw-bold mb-0">
              {formatPeso(detailedProduct.totalPrice ?? detailedProduct.basePrice)}
            </h2>
          )}
        </div>
      );
    }
  };

  const handleOpenVariationSelectorFor = useCallback((prod: Product) => {
    setVariationSelectorParent(prod);
    setShowVariationSelector(true);
  }, []);

  const handleAddToCart = useCallback(() => {
    if (detailedProduct) {
      dispatch(addToCart({ product: detailedProduct, storeId: storeId }));
    }
  }, [detailedProduct, dispatch, storeId]);

  const handleIncrement = useCallback(() => {
    if (detailedProduct) {
      dispatch(incrementQuantity({ productId: detailedProduct.id, storeId: storeId }));
    }
  }, [detailedProduct, dispatch, storeId]);

  const handleDecrement = useCallback(() => {
    if (detailedProduct) {
      dispatch(decrementQuantity({ productId: detailedProduct.id, storeId: storeId }));
    }
  }, [detailedProduct, dispatch, storeId]);

  // Render for MODAL_LARGE: image on top, content below
  const renderLargeModalContent = () => {
    if (loading.product || !detailedProduct) {
      return (
        <div className="text-center py-5">
          <Spinner animation="border" variant="primary" />
        </div>
      );
    }
    const isParentProduct = detailedProduct.children && detailedProduct.children.length > 0;
    const hasNoImage = !detailedProduct.images || detailedProduct.images.length === 0;

    return (
      <Container fluid key={`detail-large-${detailedProduct.id}`} className="card-variation modal-large-layout">
        {/* Image Section - Full width on top */}
        {!hasNoImage && (
          <div className="large-modal-gallery">
            <Swiper
              modules={[Navigation, Pagination]}
              navigation
              pagination={{ clickable: true }}
              spaceBetween={10}
              slidesPerView={1}
              className="large-modal-swiper"
            >
              {detailedProduct.images && detailedProduct.images.map((img, index) => {
                const validImageUrl = getValidImageUrl(img);
                if (validImageUrl === '/images/no-image.png') return null;
                return (
                  <SwiperSlide key={index}>
                    <Image
                      src={validImageUrl}
                      alt={detailedProduct.title}
                      fill
                      sizes="100vw"
                      style={{ objectFit: 'contain' }}
                    />
                  </SwiperSlide>
                );
              })}
            </Swiper>
          </div>
        )}

        {/* Content Section - Below images */}
        <Row className="large-modal-content mt-3 px-3">
          <Col md={8}>
            <div className="mb-3 product-description large-description">
              {detailedProduct.description ? (
                contentType === ProductContentType.HTML ? (
                  <SafeHtmlRenderer html={detailedProduct.description} />
                ) : (
                  detailedProduct.description
                )
              ) : (
                'Sin descripción disponible'
              )}
            </div>
            <div className="d-flex flex-wrap gap-1 mb-3">
              {detailedProduct.variationType && detailedProduct.value && (
                <Badge className="badge-measure d-flex align-items-center">
                  <FaRuler className="me-1" /> {detailedProduct.variationType}: {detailedProduct.value}
                </Badge>
              )}
              {detailedProduct.sku && (
                <Badge className="badge-info d-flex align-items-center">
                  <FaCube className="me-1" /> SKU: {detailedProduct.sku}
                </Badge>
              )}
              {detailedProduct.categories && detailedProduct.categories.length > 0 && (
                <Badge className="badge-measure d-flex align-items-center">
                  <FaLayerGroup className="me-1" /> {detailedProduct.categories.map(cat => cat.name).join(', ')}
                </Badge>
              )}
              {detailedProduct.discounts && detailedProduct.discounts.length > 0 &&
                detailedProduct.discounts.map((discount, idx) => (
                  <Badge key={idx} className="badge-measure d-flex align-items-center">
                    <FaTag className="me-1" /> {discount.name}
                  </Badge>
                ))
              }
            </div>
          </Col>
          <Col md={4}>
            <Card className="price-action-card border-0 shadow-sm sticky-top" style={{ top: '1rem' }}>
              <Card.Body>
                <div className="mb-3">
                  {renderPrice()}
                </div>
                {isParentProduct ? (
                  <Button variant="primary" size="lg" className="w-100 btn-add-cart" onClick={() => handleOpenVariationSelectorFor(detailedProduct!)}>
                    <FaShoppingCart className="me-1" /> Añadir
                  </Button>
                ) : quantity > 0 ? (
                  <Card className="quantity-control-card">
                    <Card.Body>
                      <Button variant="primary" className="quantity-btn" onClick={handleDecrement} aria-label="Quitar uno">
                        <FaMinus />
                      </Button>
                      <div className="quantity-display">{quantity}</div>
                      <Button variant="primary" className="quantity-btn" onClick={handleIncrement} aria-label="Añadir uno más">
                        <FaPlus />
                      </Button>
                    </Card.Body>
                  </Card>
                ) : (
                  <Button variant="primary" size="lg" className="w-100 btn-add-cart" onClick={handleAddToCart}>
                    <FaShoppingCart className="me-1" /> Añadir
                  </Button>
                )}
              </Card.Body>
            </Card>
          </Col>
        </Row>

        {/* Recommended Products */}
        {showRecommendedProducts && (
          <div className="large-modal-recommendations">
            <RecommendedProducts
              products={suggestedProducts}
              loading={loading.suggestions}
              dispatch={dispatch}
              storeId={storeId}
              onShowDetails={handleShowNestedDetail}
              onShowVariation={handleOpenVariationSelectorFor}
              compact={true}
              title="Productos relacionados"
            />
          </div>
        )}
      </Container>
    );
  };

  // Render for standard MODAL: side by side layout
  const renderStandardModalContent = () => {
    if (loading.product || !detailedProduct) {
      return (
        <div className="text-center py-5">
          <Spinner animation="border" variant="primary" />
        </div>
      );
    }
    const isParentProduct = detailedProduct.children && detailedProduct.children.length > 0;
    const hasNoImage = !detailedProduct.images || detailedProduct.images.length === 0;
    return (
      <Container fluid key={`detail-${detailedProduct.id}`} className="card-variation">
        <Row className="product-detail-row p-0">
          {!hasNoImage && (
            <Col xs={12} md={6} className="p-0 order-2 order-md-1 product-images-column">
              <div className="product-images-swiper">
                <Swiper
                  modules={[Navigation, Pagination]}
                  navigation={window.innerWidth >= 768}
                  pagination={{ clickable: true }}
                  spaceBetween={10}
                  slidesPerView={1}
                  className="mySwiper"
                >
                  {detailedProduct.images && detailedProduct.images.map((img, index) => {
                    const validImageUrl = getValidImageUrl(img);
                    if (validImageUrl === '/images/no-image.png') return null;
                    return (
                      <SwiperSlide key={index}>
                        <Image
                          src={validImageUrl}
                          alt={detailedProduct.title}
                          fill
                          sizes="(max-width: 768px) 100vw, 50vw"
                          style={{ objectFit: 'contain' }}
                        />
                      </SwiperSlide>
                    );
                  })}
                </Swiper>
              </div>
            </Col>
          )}
          <Col xs={12} md={hasNoImage ? 12 : 6} className="order-1 order-md-2 product-info-column">
            <Card className="border-0 h-100 m-3">
              <Card.Body className="p-3">
                <div className="mb-3">
                  {renderPrice()}
                </div>
                <div className="mb-3 product-description" style={{
                  maxHeight: '150px',
                  overflowY: 'auto',
                  fontSize: '0.875rem',
                  lineHeight: '1.4'
                }}>
                  {detailedProduct.description ? (
                    contentType === ProductContentType.HTML ? (
                      <SafeHtmlRenderer html={detailedProduct.description} />
                    ) : (
                      detailedProduct.description
                    )
                  ) : (
                    'Sin descripción disponible'
                  )}
                </div>
                <div className="d-flex flex-wrap gap-1 mb-3">
                  {detailedProduct.variationType && detailedProduct.value && (
                    <Badge className="badge-measure d-flex align-items-center">
                      <FaRuler className="me-1" /> {detailedProduct.variationType}: {detailedProduct.value}
                    </Badge>
                  )}
                  {detailedProduct.sku && (
                    <Badge className="badge-info d-flex align-items-center">
                      <FaCube className="me-1" /> SKU: {detailedProduct.sku}
                    </Badge>
                  )}
                  {detailedProduct.categories && detailedProduct.categories.length > 0 && (
                    <Badge className="badge-measure d-flex align-items-center">
                      <FaLayerGroup className="me-1" /> {detailedProduct.categories.map(cat => cat.name).join(', ')}
                    </Badge>
                  )}
                  {detailedProduct.discounts && detailedProduct.discounts.length > 0 &&
                    detailedProduct.discounts.map((discount, idx) => (
                      <Badge key={idx} className="badge-measure d-flex align-items-center">
                        <FaTag className="me-1" /> {discount.name}
                      </Badge>
                    ))
                  }
                </div>

                {isParentProduct ? (
                  <Button variant="primary" className="w-100 btn-add-cart" onClick={() => handleOpenVariationSelectorFor(detailedProduct!)}>
                    <FaShoppingCart className="me-1" /> Añadir
                  </Button>
                ) : quantity > 0 ? (
                  <Card className="quantity-control-card">
                    <Card.Body>
                      <Button variant="primary" className="quantity-btn" onClick={handleDecrement} aria-label="Quitar uno">
                        <FaMinus />
                      </Button>
                      <div className="quantity-display">{quantity}</div>
                      <Button variant="primary" className="quantity-btn" onClick={handleIncrement} aria-label="Añadir uno más">
                        <FaPlus />
                      </Button>
                    </Card.Body>
                  </Card>
                ) : (
                  <Button variant="primary" className="w-100 btn-add-cart" onClick={handleAddToCart}>
                    <FaShoppingCart className="me-1" /> Añadir
                  </Button>
                )}
              </Card.Body>
            </Card>
          </Col>
        </Row>
        {showRecommendedProducts && (
          <RecommendedProducts
            products={suggestedProducts}
            loading={loading.suggestions}
            dispatch={dispatch}
            storeId={storeId}
            onShowDetails={handleShowNestedDetail}
            onShowVariation={handleOpenVariationSelectorFor}
            compact={true}
            showTitle={false}
          />
        )}
      </Container>
    );
  };

  // Determine modal size based on view type
  const isLargeModal = viewType === ProductDetailViewType.MODAL_LARGE;

  return (
    <>
      <Modal 
        show={show} 
        onHide={onHide} 
        size={isLargeModal ? undefined : 'lg'}
        centered={!isLargeModal}
        fullscreen={isLargeModal ? true : undefined}
        dialogClassName={`product-detail-modal ${isLargeModal ? 'modal-large' : ''}`}
      >
        <Modal.Header closeButton>
          <Modal.Title>{detailedProduct ? detailedProduct.title : 'Cargando...'}</Modal.Title>
        </Modal.Header>
        <Modal.Body className="p-0">
          {isLargeModal ? renderLargeModalContent() : renderStandardModalContent()}
        </Modal.Body>
        {!isLargeModal && (
          <Modal.Footer>
            <Button variant="secondary" onClick={onHide}>Cerrar</Button>
          </Modal.Footer>
        )}
      </Modal>

      {variationSelectorParent && (
        <VariationSelectorModal
          show={showVariationSelector}
          onHide={() => setShowVariationSelector(false)}
          parentProduct={variationSelectorParent}
          dispatch={dispatch}
          storeId={storeId}
        />
      )}

      {nestedProduct && (
        <ProductDetailModal
          show={true}
          onHide={() => setNestedProduct(null)}
          product={nestedProduct}
        />
      )}
    </>
  );
};

export default ProductDetailModal;
