'use client'
import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import { useSelector, useDispatch } from 'react-redux';
import axios from '@/utils/axios';
import { AxiosError } from 'axios';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { RootState } from '@/redux/store';
import { PlanType, Store, StoreFormData } from '@/types';
import { Button, Modal, Card, Form, Container, Row, Col, Alert } from 'react-bootstrap';
import { Badge } from 'prizma-ui';
import { setCommerces, removeCommerce } from '@/redux/commerces';
import StoreModal from './StoreModal';
import StorePaymentModal from './StorePaymentModal';
import PlanModal from './PlanModal';
import { addNotification } from '@/redux/ui';
import styles from './AdminHome.module.scss';

export default function AdminHome() {
  const config = useSelector((state: RootState) => state.auth.userData);
  const commerces = useSelector((state: RootState) => state.commerces.commerces);
  const dispatch = useDispatch();
  const searchParams = useSearchParams();
  const router = useRouter();

  const [showModal, setShowModal] = useState(false);
  const [selectedCommerceId, setSelectedCommerceId] = useState<string | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showStorePaymentModal, setShowStorePaymentModal] = useState(false);
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [currentPlan, setCurrentPlan] = useState<PlanType>(PlanType.FREE);
  const [editCommerceData, setEditCommerceData] = useState<StoreFormData>({
    id: '',
    name: '',
    phonePrefix: '',
    phoneNumber: '',
    description: '',
    address: ''
  });
  const [showStoreNameModal, setShowStoreNameModal] = useState(false);
  const [newStoreName, setNewStoreName] = useState('');

  // Pagination
  const itemsPerPage = 10;
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [hasTotalCountHeader, setHasTotalCountHeader] = useState(false);
  // Fallback pagination: if backend did not paginate and returned all commerces (> itemsPerPage),
  // we slice client-side. Otherwise, we use the server-paginated data as-is.
  const paginatedCommerces = (commerces && commerces.length > itemsPerPage)
    ? commerces.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
    : (commerces || []);
  const totalPages = Math.ceil(totalCount / itemsPerPage);

  useEffect(() => {
    if (searchParams) {
      const paymentSuccess = searchParams.get('paymentSuccessStore');
      if (paymentSuccess === 'true') {
        dispatch(addNotification({
          message: '¡Felicidades! Tu nueva tienda ha sido registrada con éxito. Ya puedes comenzar a configurarla.',
          color: 'success'
        }));

        const url = new URL(window.location.href);
        url.searchParams.delete('paymentSuccessStore');
        router.replace(url.pathname);
      }
    }

    if (config) {
      axios.get<Store[]>('/store/get/my', {
        params: {
          page: currentPage,
          limit: itemsPerPage
        }
      })
        .then(res => {
          dispatch(setCommerces(res.data));
          const totalHeader = res.headers['x-total-count'] || res.headers['X-Total-Count'] || res.headers['total-count'];
          if (res.data.length > itemsPerPage) {
            setTotalCount(res.data.length);
            setHasTotalCountHeader(true);
          } else if (totalHeader) {
            setTotalCount(parseInt(totalHeader as string, 10));
            setHasTotalCountHeader(true);
          } else {
            setHasTotalCountHeader(false);
            if (res.data.length < itemsPerPage) {
              setTotalCount((currentPage - 1) * itemsPerPage + res.data.length);
            } else {
              setTotalCount(currentPage * itemsPerPage + 1);
            }
          }
        })
        .catch(() => {
          dispatch(setCommerces([]));
          setTotalCount(0);
          setHasTotalCountHeader(false);
        });

      if (config.subscription && config.subscription.planType) {
        setCurrentPlan(config.subscription.planType as PlanType);
      }
    }
  }, [config, dispatch, searchParams, router, currentPage]);

  const openDeleteModal = (commerceId: string) => {
    setSelectedCommerceId(commerceId);
    setShowModal(true);
  };

  const openEditModal = (commerce: Store) => {
    setEditCommerceData({
      id: commerce.id,
      name: commerce.name,
      phonePrefix: commerce.phonePrefix,
      phoneNumber: commerce.phoneNumber,
      description: commerce.description,
      address: commerce.address || ''
    });
    setShowEditModal(true);
  };

  const handleStoreSave = async (updatedData: StoreFormData) => {
    try {
      const { data: updatedCommerce } = await axios.patch<Store>(`/store/${updatedData.id}`, updatedData);
      dispatch(setCommerces(commerces.map(commerce =>
        commerce.id === updatedCommerce.id ? updatedCommerce : commerce
      )));
      dispatch(addNotification({ message: 'Comercio editado exitosamente', color: 'success' }));
      setShowEditModal(false);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Error al editar el comercio';
      dispatch(addNotification({ message: errorMessage, color: 'danger' }));
    }
  };

  const confirmDelete = async () => {
    if (!selectedCommerceId) return;
    try {
      await axios.delete(`/store/${selectedCommerceId}`);
      dispatch(removeCommerce(selectedCommerceId));
      dispatch(addNotification({ message: 'Comercio eliminado exitosamente', color: 'success' }));

      // Re-fetch current page to fill empty slot and sync count
      if (config) {
        axios.get<Store[]>('/store/get/my', {
          params: {
            page: currentPage,
            limit: itemsPerPage
          }
        })
          .then(res => {
            dispatch(setCommerces(res.data));
            const totalHeader = res.headers['x-total-count'] || res.headers['X-Total-Count'] || res.headers['total-count'];
            if (res.data.length > itemsPerPage) {
              setTotalCount(res.data.length);
              setHasTotalCountHeader(true);
            } else if (totalHeader) {
              setTotalCount(parseInt(totalHeader as string, 10));
              setHasTotalCountHeader(true);
            } else {
              setHasTotalCountHeader(false);
              if (res.data.length < itemsPerPage) {
                setTotalCount((currentPage - 1) * itemsPerPage + res.data.length);
              } else {
                setTotalCount(currentPage * itemsPerPage + 1);
              }
            }
          })
          .catch(() => {
            dispatch(setCommerces([]));
            setTotalCount(0);
            setHasTotalCountHeader(false);
          });
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Error al eliminar el comercio';
      dispatch(addNotification({ message: errorMessage, color: 'danger' }));
    } finally {
      setShowModal(false);
      setSelectedCommerceId(null);
    }
  };

  const cancelDelete = () => {
    setShowModal(false);
    setSelectedCommerceId(null);
  };

  const confirmStoreName = async () => {
    if (!newStoreName.trim()) {
      dispatch(addNotification({ message: 'Por favor ingresa un identificador para la tienda', color: 'danger' }));
      return;
    }
    try {
      const response = await axios.get(`/store/${newStoreName}`);
      if (response.data) {
        dispatch(addNotification({
          message: 'El nombre de la tienda ya está ocupado. Por favor, elige otro.',
          color: 'danger'
        }));
        return;
      }
    } catch (error: unknown) {
      const axiosError = error as AxiosError;
      const notFound = axiosError.response?.status === 404;
      if (!notFound) {
        dispatch(addNotification({
          message: 'Error al validar el nombre de la tienda',
          color: 'danger'
        }));
        return;
      }
    }
    setShowStoreNameModal(false);
    setShowStorePaymentModal(true);
  };

  if (!config) {
    return (
      <Container className="py-4">
        <Row className="justify-content-center">
          <Col md={10}>
            <Card className="shadow border-0 text-center" style={{ borderRadius: '1rem' }}>
              <Card.Body className="position-relative p-4 p-md-5">
                <div className={styles.decoTopRight}></div>
                <div className={styles.decoBottomLeft}></div>

                <div className="d-flex justify-content-center mb-2">
                  <Badge tone="primary">Prizma</Badge>
                </div>
                <div className="d-flex align-items-center justify-content-center mb-4">
                  <Image
                    src="/images/logo.svg"
                    alt="Logo"
                    width={70}
                    height={70}
                  />
                  <h1 className="display-4 fw-bold mb-0 ms-2 ">
                    Hermes
                  </h1>
                </div>

                <div className="mb-4 px-md-5">
                  <p className="lead mb-3">
                    <span className="fw-bold">Un eCommerce económico, eficiente y escalable</span>,
                    diseñado específicamente para las necesidades del mercado latinoamericano.
                  </p>

                  <Row className="justify-content-center">
                    <Col xs="auto" className="text-center mb-3 mx-3">
                      <div className="text-primary fs-4">💰</div>
                      <div>Económico</div>
                    </Col>
                    <Col xs="auto" className="text-center mb-3 mx-3">
                      <div className="text-primary fs-4">⚡</div>
                      <div>Rápido</div>
                    </Col>
                    <Col xs="auto" className="text-center mb-3 mx-3">
                      <div className="text-primary fs-4">📱</div>
                      <div>Responsive</div>
                    </Col>
                    <Col xs="auto" className="text-center mb-3 mx-3">
                      <div className="text-primary fs-4">🚀</div>
                      <div>Escalable</div>
                    </Col>
                  </Row>
                </div>

                <div className="d-flex flex-wrap justify-content-center mt-4">
                  <Link href="/login" className={`${styles.transition} me-2 mb-2`}>
                    <Button variant="primary" size="lg" className="fw-bold">
                      <span className="me-2">👤</span>
                      Iniciar Sesión
                    </Button>
                  </Link>
                  <Link href="/register" className={`${styles.transition} mb-2`}>
                    <Button variant="secondary" size="lg" className="fw-bold">
                      <span className="me-2">✨</span>
                      Registrarse
                    </Button>
                  </Link>
                </div>

                <p className="text-muted mt-4 fs-6">
                  Únete a nuestros socios que ya confían en Hermes
                </p>

                <p className="text-muted mt-4 small d-flex align-items-center justify-content-center gap-1">
                  Powered by
                  <Image
                    src="/images/prizma-symbol.svg"
                    alt="Prizma"
                    width={16}
                    height={16}
                    style={{ verticalAlign: 'middle' }}
                  />
                  Prizma
                </p>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    );
  }

  return (
    <Container>
      <Row className="mb-4">
        <Col md={12}>
          <h2 className="border-bottom border-secondary pb-2 mb-3 d-inline-block">Tu Plan</h2>
          <Card className="mb-4 shadow-sm" style={{ borderRadius: '0.75rem' }}>
            <Card.Body>
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h4>Plan {currentPlan.charAt(0) + currentPlan.slice(1).toLowerCase()}</h4>
                  <p className="text-muted mb-0">
                    {currentPlan === PlanType.FREE ? 'Plan gratuito con funcionalidades básicas' : 'Plan premium con funcionalidades avanzadas'}
                  </p>
                </div>
                <Button variant="outline-primary" onClick={() => setShowPlanModal(true)}>
                  Cambiar Plan
                </Button>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Row className="mb-4">
        <Col md={9}>
          <h2 className="border-secondary">Tus Comercios</h2>
        </Col>
        <Col md={3}>
          <Button variant="primary" onClick={() => setShowStoreNameModal(true)}>
            Comprar Nueva Tienda
          </Button>
        </Col>
      </Row>

      {commerces?.length === 0 ? (
        <Alert variant="info">
          <p>No tienes comercios disponibles.</p>
          <p className="mb-0">Para comenzar, haz clic en &quot;Comprar Nueva Tienda&quot; y sigue las instrucciones de pago.</p>
        </Alert>
      ) : (
        <>
          <Row>
            <Col className="mb-3">
              <p className="text-muted">
                Mostrando {(currentPage - 1) * itemsPerPage + 1} a {(currentPage - 1) * itemsPerPage + paginatedCommerces.length} de {hasTotalCountHeader ? totalCount : (commerces.length < itemsPerPage ? (currentPage - 1) * itemsPerPage + commerces.length : `${currentPage * itemsPerPage}+`)} tiendas
              </p>
            </Col>
          </Row>
          <Row>
            {paginatedCommerces.map(commerce => (
            <Col key={commerce.id} md={4} className="mb-4">
              <Card className="h-100">
                {commerce.configuration?.logo && (
                  <Image
                    src={commerce.configuration.logo || '/images/no-image.png'}
                    className="card-img-top"
                    alt={commerce.name}
                    width={500}
                    height={300}
                    style={{ objectFit: 'contain', height: '250px' }}
                  />
                )}
                <Card.Body>
                  <Card.Title>{commerce.name}</Card.Title>
                  <Card.Text>{commerce.description}</Card.Text>
                  {commerce.address && (
                    <Card.Text>
                      <small className="text-muted">📍 {commerce.address}</small>
                    </Card.Text>
                  )}
                </Card.Body>
                <Card.Footer className="d-flex justify-content-between">
                  <Button variant="primary" size="sm" onClick={() => openEditModal(commerce)}>
                    Editar
                  </Button>
                  <Link href={`/${commerce.id}/orders`}>
                    <Button variant="secondary" size="sm">
                      Entrar al detalle
                    </Button>
                  </Link>
                  <a href={`${process.env.NEXT_PUBLIC_STORE_URL}/${commerce.id}`} target="_blank" rel="noopener noreferrer">
                    <Button variant="success" size="sm">
                      Ver tienda
                    </Button>
                  </a>
                </Card.Footer>
              </Card>
            </Col>
          ))}
          </Row>
          {totalPages > 1 && (
            <Row className="mt-4">
              <Col xs="auto" className="mx-auto">
                <div className="btn-group">
                  <Button
                    variant="outline-secondary"
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage(currentPage - 1)}
                  >
                    Anterior
                  </Button>
                  <Button variant="outline-secondary" disabled>
                    Página {currentPage} de {totalPages}
                  </Button>
                  <Button
                    variant="outline-secondary"
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage(currentPage + 1)}
                  >
                    Siguiente
                  </Button>
                </div>
              </Col>
            </Row>
          )}
        </>
      )}

      <Modal show={showModal} onHide={cancelDelete}>
        <Modal.Header closeButton>
          <Modal.Title>Confirmar eliminación</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          ¿Estás seguro de que deseas eliminar este comercio? Esta acción no se puede deshacer.
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={cancelDelete}>
            Cancelar
          </Button>
          <Button variant="danger" onClick={confirmDelete}>
            Eliminar
          </Button>
        </Modal.Footer>
      </Modal>

      {showEditModal && (
        <StoreModal
          store={editCommerceData}
          onClose={() => setShowEditModal(false)}
          onSave={handleStoreSave}
          onDelete={openDeleteModal}
        />
      )}

      <Modal show={showStoreNameModal} onHide={() => setShowStoreNameModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Identificador de la Tienda</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form.Group className="mb-3">
            <Form.Label>Identificador de la Tienda</Form.Label>
            <Form.Control
              type="text"
              value={newStoreName}
              onChange={(e) => setNewStoreName(e.target.value.replace(/\s/g, ''))}
              placeholder="Ingresa el identificador de la tienda"
            />
          </Form.Group>
          <p className="text-muted">
            Nota: El identificador de la tienda luego de comprarla no se puede cambiar.
          </p>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowStoreNameModal(false)}>
            Cancelar
          </Button>
          <Button variant="primary" onClick={confirmStoreName}>
            Confirmar
          </Button>
        </Modal.Footer>
      </Modal>

      {showStorePaymentModal && (
        <StorePaymentModal
          storeName={newStoreName}
          onClose={() => setShowStorePaymentModal(false)}
        />
      )}

      {showPlanModal && (
        <PlanModal
          currentPlan={currentPlan}
          onClose={() => setShowPlanModal(false)}
        />
      )}
    </Container>
  );
}
