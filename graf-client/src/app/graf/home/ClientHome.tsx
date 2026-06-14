'use client';
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Container, Row, Col, Card, Badge, Spinner } from 'react-bootstrap';
import { Store, Product } from '@/types';
import axios from '@/utils/axios';
import {
  FaCogs, FaGlobe, FaServer, FaEdit, FaRocket, FaHeadset,
  FaStore, FaArrowRight, FaSearch, FaTimes, FaShoppingBag,
  FaBoxOpen, FaTag
} from 'react-icons/fa';
import { defaultPalette } from '@/utils/defaultPalette';
import PricingSection from '../components/PricingSection';

interface ProductResult {
  product: Product;
  store: Store;
}

const PRIMARY = defaultPalette['--primary-color'];
const SECONDARY = defaultPalette['--secondary-color'];

const ClientHome: React.FC = () => {
  const [stores, setStores] = useState<Store[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [productResults, setProductResults] = useState<ProductResult[]>([]);
  const [searchingProducts, setSearchingProducts] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);
  const searchTimeout = useRef<NodeJS.Timeout | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const adminUrl = process.env.NEXT_PUBLIC_ADMIN_URL || 'http://localhost:3001';

  const isSearchActive = searchTerm.trim().length > 0 || searchFocused;

  const getStores = useCallback(async () => {
    const storesRes = await axios.get('/store');
    const storesData: Store[] = storesRes.data;
    setStores(storesData);
    return storesData;
  }, []);

  useEffect(() => {
    getStores();
  }, [getStores]);

  const filteredStores = useMemo(() => {
    if (!searchTerm.trim()) return stores;
    const term = searchTerm.toLowerCase();
    return stores.filter(
      (s) =>
        s.name.toLowerCase().includes(term) ||
        (s.description && s.description.toLowerCase().includes(term))
    );
  }, [stores, searchTerm]);

  const searchProducts = useCallback(
    async (term: string) => {
      if (!term.trim()) {
        setProductResults([]);
        return;
      }

      if (abortRef.current) abortRef.current.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      setSearchingProducts(true);
      try {
        const res = await axios.get('/products-search', {
          params: { query: term, limit: 40, offset: 0 },
          signal: controller.signal,
        });
        const data = res.data;
        const products = data?.products ?? (Array.isArray(data) ? data : []);
        if (!controller.signal.aborted) {
          setProductResults(
            products.map((p: Product & { store?: Store }) => ({
              product: p,
              store: p.store as Store,
            }))
          );
        }
      } catch (err: unknown) {
        if (!controller.signal.aborted) {
          setProductResults([]);
        }
      } finally {
        if (!controller.signal.aborted) {
          setSearchingProducts(false);
        }
      }
    },
    []
  );

  useEffect(() => {
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    if (!searchTerm.trim()) {
      if (abortRef.current) abortRef.current.abort();
      setProductResults([]);
      setSearchingProducts(false);
      return;
    }
    searchTimeout.current = setTimeout(() => {
      searchProducts(searchTerm);
    }, 400);
    return () => {
      if (searchTimeout.current) clearTimeout(searchTimeout.current);
    };
  }, [searchTerm, searchProducts]);

  const clearSearch = () => {
    if (abortRef.current) abortRef.current.abort();
    setSearchTerm('');
    setProductResults([]);
    setSearchingProducts(false);
    setSearchFocused(false);
  };

  const features = [
    { icon: <FaCogs />, title: 'Alta personalización', desc: 'Tu tienda, tu identidad' },
    { icon: <FaGlobe />, title: 'Dominios personalizados', desc: 'A muy bajo costo' },
    { icon: <FaServer />, title: 'Alto rendimiento', desc: 'Miles de productos sin ralentizar' },
    { icon: <FaEdit />, title: 'Edición simplificada', desc: 'Gestión y seguimiento fácil' },
    { icon: <FaRocket />, title: 'Actualizaciones constantes', desc: 'Siempre a la vanguardia' },
    { icon: <FaHeadset />, title: 'Soporte profesional', desc: 'Asistencia cuando la necesites' },
  ];

  const hasSearchTerm = searchTerm.trim().length > 0;

  return (
    <div className="graf-home">
      {/* ── Barra de búsqueda STICKY ── */}
      <div
        className="graf-search-bar"
        style={{
          position: 'sticky',
          top: 56,
          zIndex: 999,
          background: isSearchActive && hasSearchTerm
            ? '#fff'
            : `linear-gradient(135deg, ${PRIMARY} 0%, ${SECONDARY} 100%)`,
          padding: isSearchActive && hasSearchTerm ? '12px 0' : '16px 0',
          boxShadow: '0 2px 12px rgba(0,0,0,0.1)',
          transition: 'all 0.3s ease',
        }}
      >
        <Container>
          <div style={{ maxWidth: 700, margin: '0 auto' }}>
            {!hasSearchTerm && (
              <p
                className="text-center mb-2"
                style={{
                  color: '#fff',
                  fontSize: '0.85rem',
                  opacity: 0.9,
                  margin: 0,
                  fontWeight: 500,
                }}
              >
                Busca productos en todas las tiendas
              </p>
            )}
            <div
              className="shadow-sm d-flex align-items-center"
              style={{
                borderRadius: '50px',
                height: 48,
                backgroundColor: '#fff',
                paddingLeft: '1.2rem',
                paddingRight: '1.2rem',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', flexShrink: 0, width: 20, justifyContent: 'center' }}>
                {searchingProducts ? (
                  <Spinner animation="border" size="sm" style={{ color: PRIMARY, width: 16, height: 16 }} />
                ) : (
                  <FaSearch style={{ color: hasSearchTerm ? PRIMARY : '#999', fontSize: 16 }} />
                )}
              </div>
              <input
                ref={inputRef as React.RefObject<HTMLInputElement>}
                placeholder="Buscar productos, tiendas..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onFocus={() => setSearchFocused(true)}
                onBlur={() => {
                  if (!searchTerm.trim()) setSearchFocused(false);
                }}
                style={{
                  border: 'none',
                  outline: 'none',
                  flex: 1,
                  fontSize: '1rem',
                  color: '#333',
                  backgroundColor: 'transparent',
                  padding: '0 12px',
                  height: '100%',
                }}
              />
              <div style={{ display: 'flex', alignItems: 'center', flexShrink: 0, width: 20, justifyContent: 'center' }}>
                {searchTerm ? (
                  <FaTimes
                    onClick={clearSearch}
                    style={{ color: '#999', cursor: 'pointer', fontSize: 16 }}
                  />
                ) : (
                  <span style={{ width: 16 }} />
                )}
              </div>
            </div>
            {hasSearchTerm && (
              <div className="d-flex align-items-center justify-content-center gap-3 mt-2">
                <small style={{ color: isSearchActive ? '#666' : 'rgba(255,255,255,0.8)', fontSize: '0.8rem' }}>
                  {searchingProducts
                    ? `Buscando en ${stores.length} tiendas...`
                    : `${productResults.length} producto${productResults.length !== 1 ? 's' : ''} · ${filteredStores.length} tienda${filteredStores.length !== 1 ? 's' : ''}`}
                </small>
              </div>
            )}
          </div>
        </Container>
      </div>

      {/* ── Contenido publicitario (se oculta al buscar) ── */}
      {!hasSearchTerm && (
        <>
          {/* ── Hero ── */}
          <section
            style={{
              background: `linear-gradient(135deg, ${PRIMARY} 0%, ${SECONDARY} 100%)`,
              color: '#fff',
              padding: '60px 0 50px',
            }}
          >
            <Container>
              <Row className="align-items-center">
                <Col lg={7}>
                  <h1 className="fw-bold mb-3" style={{ fontSize: 'clamp(2rem, 5vw, 3.2rem)' }}>
                    Tu Ecommerce Profesional <br /> en Minutos
                  </h1>
                  <p className="lead mb-4" style={{ opacity: 0.9, maxWidth: 540 }}>
                    Crea una tienda online con alta personalización, rendimiento excepcional
                    y a un costo sorprendentemente accesible.
                  </p>
                  <Link href={`${adminUrl}/register`} target="_blank" rel="noopener noreferrer">
                    <button
                      className="btn btn-lg fw-bold px-4 py-3 graf-hero-btn"
                      style={{
                        borderRadius: '50px',
                        backgroundColor: '#fff',
                        color: PRIMARY,
                        border: 'none',
                        fontSize: '1.1rem',
                      }}
                    >
                      <FaStore className="me-2" /> Crea tu tienda gratis <FaArrowRight className="ms-2" />
                    </button>
                  </Link>
                </Col>
                <Col lg={5} className="text-center d-none d-lg-block">
                  <div style={{ fontSize: '8rem', opacity: 0.15 }}>
                    <FaGlobe />
                  </div>
                </Col>
              </Row>
            </Container>
          </section>

          {/* ── Features compactas ── */}
          <section style={{ backgroundColor: '#f8f9fa', padding: '40px 0' }}>
            <Container>
              <Row className="g-3 justify-content-center">
                {features.map((f, i) => (
                  <Col key={i} xs={6} md={4} lg={2}>
                    <div className="text-center p-3 graf-feature-card">
                      <div style={{ fontSize: '1.6rem', color: PRIMARY, marginBottom: 8 }}>{f.icon}</div>
                      <h6 className="fw-bold mb-1" style={{ fontSize: '0.85rem' }}>{f.title}</h6>
                      <small className="text-muted" style={{ fontSize: '0.75rem' }}>{f.desc}</small>
                    </div>
                  </Col>
                ))}
              </Row>
            </Container>
          </section>

          {/* ── Planes ── */}
          <section style={{ padding: '50px 0 30px' }}>
            <PricingSection />
          </section>
        </>
      )}

      {/* ── Resultados de búsqueda ── */}
      {hasSearchTerm && (
        <section style={{ padding: '24px 0 60px', backgroundColor: '#fff', minHeight: '60vh' }}>
          <Container>
            {/* Productos encontrados */}
            {productResults.length > 0 && (
              <div className="mb-5">
                <h5 className="fw-bold mb-3">
                  <FaBoxOpen className="me-2" style={{ color: SECONDARY }} />
                  Productos encontrados
                  <Badge bg="secondary" className="ms-2">{productResults.length}</Badge>
                </h5>
                <Row className="g-3">
                  {productResults.map((r, i) => (
                    <Col key={`${r.store.id}-${r.product.id}-${i}`} xs={6} sm={4} md={3} lg={2}>
                      <Link
                        href={`/${r.store.id}/products/${r.product.id}`}
                        className="text-decoration-none"
                      >
                        <Card className="h-100 border-0 shadow-sm graf-product-card" style={{ borderRadius: '12px', overflow: 'hidden' }}>
                          {r.product.firstImageUrl ? (
                            <div style={{ position: 'relative', width: '100%', height: '120px', backgroundColor: '#f5f5f5' }}>
                              <Image
                                src={r.product.firstImageUrl}
                                alt={r.product.title}
                                fill
                                style={{ objectFit: 'contain' }}
                                sizes="180px"
                              />
                            </div>
                          ) : (
                            <div
                              className="d-flex align-items-center justify-content-center"
                              style={{ height: '120px', backgroundColor: '#f0f0f0', color: '#ccc', fontSize: '2rem' }}
                            >
                              <FaShoppingBag />
                            </div>
                          )}
                          <Card.Body className="p-2">
                            <Card.Title
                              style={{
                                fontSize: '0.8rem',
                                fontWeight: 600,
                                color: '#333',
                                lineHeight: 1.3,
                                display: '-webkit-box',
                                WebkitLineClamp: 2,
                                WebkitBoxOrient: 'vertical',
                                overflow: 'hidden',
                              }}
                              className="mb-1"
                            >
                              {r.product.title}
                            </Card.Title>
                            <span className="fw-bold" style={{ color: PRIMARY, fontSize: '0.85rem' }}>
                              <FaTag className="me-1" style={{ fontSize: '0.6rem' }} />
                              ${r.product.displayPrice?.toLocaleString('es-CO') ?? r.product.totalPrice?.toLocaleString('es-CO') ?? '—'}
                            </span>
                            <small className="text-muted d-block mt-1" style={{ fontSize: '0.7rem' }}>
                              <FaStore className="me-1" />{r.store.name}
                            </small>
                          </Card.Body>
                        </Card>
                      </Link>
                    </Col>
                  ))}
                </Row>
              </div>
            )}

            {productResults.length === 0 && !searchingProducts && (
              <div className="text-center text-muted mb-4 py-4">
                <FaSearch style={{ fontSize: '2.5rem', opacity: 0.2 }} />
                <p className="mt-2 mb-0">No se encontraron productos para &quot;{searchTerm}&quot;</p>
              </div>
            )}

            {/* Tiendas que coinciden */}
            <div className="d-flex align-items-center justify-content-between mb-3">
              <h5 className="fw-bold mb-0">
                <FaStore className="me-2" style={{ color: PRIMARY }} />
                Tiendas ({filteredStores.length})
              </h5>
              {filteredStores.length !== stores.length && (
                <Badge bg="light" text="dark" className="px-3 py-2">
                  {filteredStores.length} de {stores.length}
                </Badge>
              )}
            </div>

            {filteredStores.length === 0 ? (
              <div className="text-center py-4 text-muted">
                <FaStore style={{ fontSize: '2.5rem', opacity: 0.15 }} />
                <p className="mt-2">No se encontraron tiendas para &quot;{searchTerm}&quot;</p>
              </div>
            ) : (
              <Row className="g-3">
                {filteredStores.map((store) => (
                  <Col key={store.id} xs={6} sm={4} md={3} lg={2}>
                    <Link href={`/${store.id}`} className="text-decoration-none">
                      <Card
                        className="h-100 border-0 shadow-sm graf-store-card"
                        style={{ borderRadius: '12px', overflow: 'hidden', cursor: 'pointer' }}
                      >
                        <div
                          style={{
                            position: 'relative',
                            width: '100%',
                            height: '100px',
                            backgroundColor: store.configuration?.palette?.['--primary-color'] || '#f0f0f0',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          {store.configuration?.logo ? (
                            <Image
                              src={store.configuration.logo}
                              alt={store.name}
                              fill
                              style={{ objectFit: 'contain', padding: '12px' }}
                              sizes="150px"
                            />
                          ) : (
                            <FaStore style={{ fontSize: '2rem', color: 'rgba(255,255,255,0.5)' }} />
                          )}
                        </div>
                        <Card.Body className="p-2 text-center">
                          <Card.Title className="fw-bold mb-0" style={{ fontSize: '0.85rem', color: '#333' }}>
                            {store.name}
                          </Card.Title>
                        </Card.Body>
                      </Card>
                    </Link>
                  </Col>
                ))}
              </Row>
            )}
          </Container>
        </section>
      )}

      {/* ── Tiendas destacadas (sin búsqueda) ── */}
      {!hasSearchTerm && (
        <section style={{ padding: '50px 0 60px', backgroundColor: '#f8f9fa' }}>
          <Container>
            <div className="text-center mb-4">
              <h2 className="fw-bold mb-2">Explora Nuestras Tiendas</h2>
              <p className="text-muted" style={{ maxWidth: 500, margin: '0 auto' }}>
                Descubre las tiendas creadas con Graf
              </p>
            </div>

            <Row className="g-4">
              {stores.map((store) => (
                <Col key={store.id} xs={12} sm={6} md={4} lg={3}>
                  <Link href={`/${store.id}`} className="text-decoration-none">
                    <Card
                      className="h-100 border-0 shadow-sm graf-store-card"
                      style={{ borderRadius: '16px', overflow: 'hidden', cursor: 'pointer' }}
                    >
                      <div
                        style={{
                          position: 'relative',
                          width: '100%',
                          height: '180px',
                          backgroundColor: store.configuration?.palette?.['--primary-color'] || '#f0f0f0',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        {store.configuration?.logo ? (
                          <Image
                            src={store.configuration.logo}
                            alt={store.name}
                            fill
                            style={{ objectFit: 'contain', padding: '16px' }}
                            sizes="(max-width: 768px) 100vw, 25vw"
                          />
                        ) : (
                          <FaStore style={{ fontSize: '3rem', color: 'rgba(255,255,255,0.5)' }} />
                        )}
                      </div>
                      <Card.Body className="p-3">
                        <Card.Title className="fw-bold mb-1" style={{ fontSize: '1rem', color: '#333' }}>
                          {store.name}
                        </Card.Title>
                        {store.description && (
                          <Card.Text
                            className="text-muted mb-2"
                            style={{
                              fontSize: '0.8rem',
                              display: '-webkit-box',
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: 'vertical',
                              overflow: 'hidden',
                              lineHeight: 1.4,
                            }}
                          >
                            {store.description}
                          </Card.Text>
                        )}
                        <div
                          className="d-inline-flex align-items-center gap-1 px-3 py-1"
                          style={{
                            backgroundColor: `${PRIMARY}10`,
                            borderRadius: '50px',
                            fontSize: '0.8rem',
                            fontWeight: 600,
                            color: PRIMARY,
                          }}
                        >
                          Ver tienda <FaArrowRight style={{ fontSize: '0.65rem' }} />
                        </div>
                      </Card.Body>
                    </Card>
                  </Link>
                </Col>
              ))}
            </Row>
          </Container>
        </section>
      )}

      {/* ── CTA Final ── */}
      <section
        className="text-center"
        style={{
          background: `linear-gradient(135deg, ${PRIMARY} 0%, ${SECONDARY} 100%)`,
          color: '#fff',
          padding: '60px 20px',
        }}
      >
        <Container>
          <h2 className="fw-bold mb-3">¿Listo para impulsar tu negocio?</h2>
          <p className="lead mb-4" style={{ opacity: 0.9 }}>Comienza gratis y escala a tu ritmo</p>
          <Link href={`${adminUrl}/register`} target="_blank" rel="noopener noreferrer">
            <button
              className="btn btn-light fw-bold px-5 py-3"
              style={{ borderRadius: '50px', color: PRIMARY, fontSize: '1.1rem' }}
            >
              <FaStore className="me-2" /> Crear mi tienda ahora
            </button>
          </Link>
        </Container>
      </section>

      <style jsx global>{`
        .graf-home { font-family: inherit; }

        .graf-search-bar {
          border-bottom: 1px solid rgba(0,0,0,0.05);
        }

        .graf-feature-card {
          background: white;
          border-radius: 12px;
          transition: transform 0.3s, box-shadow 0.3s;
        }
        .graf-feature-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 8px 24px rgba(0,0,0,0.08);
        }

        .graf-store-card {
          transition: transform 0.3s, box-shadow 0.3s;
        }
        .graf-store-card:hover {
          transform: translateY(-6px);
          box-shadow: 0 12px 32px rgba(0,0,0,0.12) !important;
        }

        .graf-product-card {
          transition: transform 0.25s, box-shadow 0.25s;
        }
        .graf-product-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 8px 20px rgba(0,0,0,0.1) !important;
        }

        .graf-hero-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(255,255,255,0.3);
        }
      `}</style>
    </div>
  );
};

export default ClientHome;
