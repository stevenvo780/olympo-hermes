'use client';
import React, { useEffect, useState, useCallback } from 'react';
import { Container, Row, Col, Badge, Card, Button, Spinner, Breadcrumb } from 'react-bootstrap';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { Product, ProductContentType } from '@/types';
import { useDispatch, useSelector } from 'react-redux';
import { addToCart, incrementQuantity, decrementQuantity } from '@/redux/cart';
import api from '@/utils/axios';
import { FaCube, FaPlus, FaMinus, FaShoppingCart, FaCheck, FaTruck, FaShieldAlt } from 'react-icons/fa';
import { RootState } from '@/redux/store';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination, Thumbs } from 'swiper/modules';
import type { Swiper as SwiperType } from 'swiper';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import 'swiper/css/thumbs';
import VariationSelectorModal from '../VariationSelectorModal';
import RecommendedProducts from '@/app/[storeId]/components/RecommendedProducts';
import { getValidImageUrl } from '@/utils/imageUtils';
import SafeHtmlRenderer from '@/components/SafeHtmlRenderer';
import './styles.scss';

const ProductDetailPage: React.FC = () => {
  const { storeId, productId } = useParams() as { storeId: string; productId: string };
  const router = useRouter();
  const dispatch = useDispatch();
  const [product, setProduct] = useState<Product | null>(null);
  const [suggestedProducts, setSuggestedProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState({ product: true, suggestions: false });
  const [thumbsSwiper, setThumbsSwiper] = useState<SwiperType | null>(null);
  const [showVariationSelector, setShowVariationSelector] = useState(false);
  
  const cartState = useSelector((state: RootState) => state.cart);
  const storeConfig = useSelector((state: RootState) => state.config.config);
  const productDetailConfig = storeConfig?.productDetailConfig;
  const deliveryEnabled = storeConfig?.activations?.deliveryEnabled ?? false;
  const cart = cartState.carts[storeId] || { items: [] };
  const cartItem = product ? cart.items.find(item => item.product.id === product.id) : null;
  const quantity = cartItem ? cartItem.quantity : 0;

  const contentType = productDetailConfig?.contentType || ProductContentType.PLAIN;
  const showRecommendedProducts = productDetailConfig?.showRecommendedProducts ?? true;

  useEffect(() => {
    const fetchProduct = async () => {
      setLoading(prev => ({ ...prev, product: true }));
      try {
        const { data } = await api.get(`/products/${storeId}/${productId}`);
        setProduct(data);

        if (showRecommendedProducts && data.categories?.length) {
          setLoading(prev => ({ ...prev, suggestions: true }));
          const productsSuggestions: Product[] = [];
          for (const category of data.categories) {
            const suggestionsResponse = await api.get(`/products/${storeId}`, {
              params: { category: category.id, exist: true }
            });
            const filtered: Product[] = suggestionsResponse.data.products.filter(
              (p: Product) => p.id !== data.id
            );
            productsSuggestions.push(...filtered);
          }
          setSuggestedProducts(productsSuggestions.slice(0, 12));
        }
      } catch {
        router.push(`/${storeId}`);
      } finally {
        setLoading({ product: false, suggestions: false });
      }
    };
    fetchProduct();
  }, [productId, storeId, router, showRecommendedProducts]);

  const formatPeso = (value: number): string => {
    return new Intl.NumberFormat('es-CO', { 
      style: 'currency', 
      currency: 'COP', 
      maximumFractionDigits: 0 
    }).format(value);
  };

  const handleAddToCart = useCallback(() => {
    if (product) {
      dispatch(addToCart({ product, storeId }));
    }
  }, [product, dispatch, storeId]);

  const handleIncrement = useCallback(() => {
    if (product) {
      dispatch(incrementQuantity({ productId: product.id, storeId }));
    }
  }, [product, dispatch, storeId]);

  const handleDecrement = useCallback(() => {
    if (product) {
      dispatch(decrementQuantity({ productId: product.id, storeId }));
    }
  }, [product, dispatch, storeId]);

  const handleShowDetails = useCallback((prod: Product) => {
    router.push(`/${storeId}/products/${prod.id}`);
  }, [router, storeId]);

  const handleShowVariation = useCallback((prod: Product) => {
    if (prod.children && prod.children.length > 0) {
      setShowVariationSelector(true);
    }
  }, []);

  if (loading.product || !product) {
    return (
      <Container className="py-5">
        <div className="text-center">
          <Spinner animation="border" variant="primary" style={{ width: '4rem', height: '4rem' }} />
          <p className="mt-3">Cargando producto...</p>
        </div>
      </Container>
    );
  }

  const isParentProduct = product.children && product.children.length > 0;
  const hasImages = product.images && product.images.length > 0;

  const renderPrice = () => {
    if (isParentProduct) {
      const fallbackMin = (() => {
        if (!product.children || product.children.length === 0) return 0;
        const values: number[] = [];
        const collect = (p: Product) => {
          if (!p.children || p.children.length === 0) values.push(Number(p.basePrice) || 0);
          else p.children.forEach(collect);
        };
        collect(product);
        return values.length ? Math.min(...values) : 0;
      })();
      const value = product.displayPrice && product.displayPrice > 0 ? product.displayPrice : fallbackMin;
      return <h1 className="price-main fw-bold">{formatPeso(value)}</h1>;
    } else {
      const hasDiscount = product.discountPrice > 0;
      return (
        <div className="price-container">
          {hasDiscount ? (
            <>
              <span className="price-original text-muted text-decoration-line-through">
                {formatPeso(product.priceWithTax ?? product.basePrice)}
              </span>
              <h1 className="price-main fw-bold text-primary">
                {formatPeso(product.totalPrice ?? (product.basePrice - product.discountPrice))}
              </h1>
            </>
          ) : (
            <h1 className="price-main fw-bold">{formatPeso(product.totalPrice ?? product.basePrice)}</h1>
          )}
        </div>
      );
    }
  };

  return (
    <div className="product-detail-page">
      {/* Breadcrumb */}
      <Container fluid className="breadcrumb-container py-2 border-bottom bg-light">
        <Breadcrumb className="mb-0 small">
          <Breadcrumb.Item linkAs={Link} href={`/${storeId}`}>
            Inicio
          </Breadcrumb.Item>
          {product.categories && product.categories.length > 0 && (
            <Breadcrumb.Item linkAs={Link} href={`/${storeId}`}>
              {product.categories[0].name}
            </Breadcrumb.Item>
          )}
          <Breadcrumb.Item active className="text-truncate" style={{ maxWidth: '300px' }}>
            {product.title}
          </Breadcrumb.Item>
        </Breadcrumb>
      </Container>

      <Container className="py-4">
        {/* Row 1: Image (8 cols) | Info (4 cols) */}
        <Row>
          {/* Left Column - Images Gallery (amplio) */}
          <Col lg={8} className="mb-4">
            <div className="product-gallery-main">
              {/* Thumbnails on the left */}
              {hasImages && product.images && product.images.length > 1 && (
                <div className="thumbs-vertical-container d-none d-md-flex">
                  <Swiper
                    onSwiper={setThumbsSwiper}
                    modules={[Thumbs]}
                    spaceBetween={8}
                    slidesPerView={5}
                    direction="vertical"
                    watchSlidesProgress
                    className="thumbs-vertical-swiper"
                  >
                    {product.images.map((img, index) => {
                      const validImageUrl = getValidImageUrl(img);
                      if (validImageUrl === '/images/no-image.png') return null;
                      return (
                        <SwiperSlide key={index}>
                          <div className="thumb-item">
                            <Image
                              src={validImageUrl}
                              alt={`Miniatura ${index + 1}`}
                              fill
                              sizes="70px"
                              style={{ objectFit: 'contain' }}
                            />
                          </div>
                        </SwiperSlide>
                      );
                    })}
                  </Swiper>
                </div>
              )}

              {/* Main image */}
              <div className="main-image-container">
                {hasImages ? (
                  <Swiper
                    modules={[Navigation, Pagination, Thumbs]}
                    navigation
                    pagination={{ clickable: true }}
                    thumbs={{ swiper: thumbsSwiper && !thumbsSwiper.destroyed ? thumbsSwiper : null }}
                    spaceBetween={10}
                    className="main-swiper-page"
                  >
                    {product.images?.map((img, index) => {
                      const validImageUrl = getValidImageUrl(img);
                      if (validImageUrl === '/images/no-image.png') return null;
                      return (
                        <SwiperSlide key={index}>
                          <div className="main-image-wrapper-page">
                            <Image
                              src={validImageUrl}
                              alt={`${product.title} - Imagen ${index + 1}`}
                              fill
                              sizes="(max-width: 768px) 100vw, 60vw"
                              style={{ objectFit: 'contain' }}
                              priority={index === 0}
                            />
                          </div>
                        </SwiperSlide>
                      );
                    })}
                  </Swiper>
                ) : (
                  <div className="no-image-box">
                    <span>Sin imagen</span>
                  </div>
                )}
              </div>
            </div>
          </Col>

          {/* Right Column - Product Info with short description, prices, cart */}
          <Col lg={4} className="mb-4">
            <div className="product-info-sidebar">
              <h1 className="product-title-page mb-3">{product.title}</h1>
              
              {/* Categories */}
              {product.categories && product.categories.length > 0 && (
                <p className="product-category text-primary mb-2">
                  {product.categories.map(cat => cat.name).join(' | ')}
                </p>
              )}

              {/* Price Section */}
              <div className="price-section-page py-3 border-bottom">
                {renderPrice()}
                {product.discountPrice > 0 && (
                  <Badge bg="danger" className="ms-2">
                    -{Math.round((product.discountPrice / product.basePrice) * 100)}%
                  </Badge>
                )}
              </div>

              {/* Short description */}
              {product.description && (
                <div className="short-description py-3 border-bottom">
                  <h6 className="fw-bold mb-2">Descripción</h6>
                  {contentType === ProductContentType.HTML ? (
                    <SafeHtmlRenderer html={product.description} />
                  ) : (
                    <p className="text-secondary mb-0">{product.description}</p>
                  )}
                </div>
              )}

              {/* SKU / Variation */}
              <div className="product-meta py-3 border-bottom">
                {product.variationType && product.value && (
                  <div className="mb-2">
                    <strong>{product.variationType}:</strong> {product.value}
                  </div>
                )}
                {product.sku && (
                  <div className="text-muted small">
                    <FaCube className="me-1" /> SKU: {product.sku}
                  </div>
                )}
              </div>

              {/* Stock */}
              {product.stock !== undefined && (
                <div className={`stock-status py-2 ${product.stock > 0 ? 'text-success' : 'text-danger'}`}>
                  <FaCheck className="me-1" />
                  {product.stock > 0 
                    ? product.stock > 10 
                      ? 'En stock' 
                      : `Solo quedan ${product.stock}` 
                    : 'Sin stock'}
                </div>
              )}

              {/* Delivery info */}
              <div className="delivery-info py-3 border-bottom">
                {deliveryEnabled && (
                  <div className="d-flex align-items-center mb-2 text-success">
                    <FaTruck className="me-2" />
                    <span className="small">Envío a domicilio disponible</span>
                  </div>
                )}
                <div className="d-flex align-items-center text-muted small">
                  <FaShieldAlt className="me-2" />
                  <span>Compra segura</span>
                </div>
              </div>

              {/* Add to Cart */}
              <div className="cart-actions py-3">
                {isParentProduct ? (
                  <Button 
                    variant="warning" 
                    size="lg" 
                    className="w-100 rounded-pill fw-bold"
                    onClick={() => handleShowVariation(product)}
                  >
                    Seleccionar opciones
                  </Button>
                ) : quantity > 0 ? (
                  <div className="quantity-controls">
                    <div className="d-flex align-items-center justify-content-center border rounded-pill overflow-hidden">
                      <Button 
                        variant="light" 
                        className="border-0 px-3 py-2" 
                        onClick={handleDecrement}
                        aria-label="Quitar uno"
                      >
                        <FaMinus />
                      </Button>
                      <span className="px-4 fs-5 fw-bold">{quantity}</span>
                      <Button 
                        variant="light" 
                        className="border-0 px-3 py-2" 
                        onClick={handleIncrement}
                        aria-label="Añadir uno más"
                      >
                        <FaPlus />
                      </Button>
                    </div>
                    <p className="text-center text-success small mt-2 mb-0">
                      <FaCheck className="me-1" /> En tu carrito
                    </p>
                  </div>
                ) : (
                  <Button 
                    variant="warning" 
                    size="lg" 
                    className="w-100 rounded-pill fw-bold"
                    onClick={handleAddToCart}
                  >
                    <FaShoppingCart className="me-2" /> Añadir al carrito
                  </Button>
                )}
              </div>
            </div>
          </Col>
        </Row>

        {/* Row 2: Long Description (12 cols) */}
        {product.longDescription && (
          <Row className="mt-4">
            <Col xs={12}>
              <Card className="long-description-card">
                <Card.Header>
                  <h4>Descripción detallada</h4>
                </Card.Header>
                <Card.Body className="product-long-description">
                  {contentType === ProductContentType.HTML ? (
                    <SafeHtmlRenderer html={product.longDescription} />
                  ) : (
                    <p className="description-text">{product.longDescription}</p>
                  )}
                </Card.Body>
              </Card>
            </Col>
          </Row>
        )}

        {/* Product Details Table */}
        <Row className="mt-4">
          <Col lg={6}>
            <Card className="border-0 shadow-sm">
              <Card.Header className="bg-white border-bottom">
                <h5 className="mb-0">Detalles del producto</h5>
              </Card.Header>
              <Card.Body className="p-0">
                <table className="table table-striped mb-0">
                  <tbody>
                    {product.sku && (
                      <tr>
                        <td className="text-muted fw-medium" style={{ width: '40%' }}>SKU</td>
                        <td>{product.sku}</td>
                      </tr>
                    )}
                    {product.variationType && product.value && (
                      <tr>
                        <td className="text-muted fw-medium">{product.variationType}</td>
                        <td>{product.value}</td>
                      </tr>
                    )}
                    {product.categories && product.categories.length > 0 && (
                      <tr>
                        <td className="text-muted fw-medium">Categoría</td>
                        <td>{product.categories.map(cat => cat.name).join(', ')}</td>
                      </tr>
                    )}
                    {product.discounts && product.discounts.length > 0 && (
                      <tr>
                        <td className="text-muted fw-medium">Promociones</td>
                        <td>
                          {product.discounts.map((d, i) => (
                            <Badge key={i} bg="success" className="me-1">{d.name}</Badge>
                          ))}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        {/* Row 3: Recommended Products (12 cols) */}
        {showRecommendedProducts && suggestedProducts.length > 0 && (
          <Row className="mt-5">
            <Col xs={12}>
              <RecommendedProducts
                products={suggestedProducts}
                loading={loading.suggestions}
                dispatch={dispatch}
                storeId={storeId}
                onShowDetails={handleShowDetails}
                onShowVariation={handleShowVariation}
                compact={false}
              />
            </Col>
          </Row>
        )}
      </Container>

      {/* Variation Selector Modal */}
      {product && (
        <VariationSelectorModal
          show={showVariationSelector}
          onHide={() => setShowVariationSelector(false)}
          parentProduct={product}
          dispatch={dispatch}
          storeId={storeId}
        />
      )}
    </div>
  );
};

export default ProductDetailPage;
