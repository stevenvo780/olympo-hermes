'use client';
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Button, ListGroup, Spinner, Modal, Offcanvas } from 'react-bootstrap';
import { FaTrashAlt, FaCheckCircle } from 'react-icons/fa';
import { RootState } from '@/redux/store';
import { addNotification, closeCart } from '@/redux/ui';
import { formatNumberWithCommas } from '@/utils/formatters';
import { useParams, useRouter } from 'next/navigation';
import {
  removeItem,
  incrementQuantity,
  decrementQuantity,
  clearCart,
} from '@/redux/cart';
import { calculateCartTotals } from '@/utils/cartUtils';
import {
  createOrderAndSendWhatsApp,
  hasCustomQuestions,
} from '@/services/orderService';
import CustomQuestions from '../../CustomQuestions';
import { useMediaQuery } from 'react-responsive';
import CartItem from './CartItem';
import './styles.scss';

const CartModal: React.FC<{
  isProfileComplete: boolean;
}> = ({ isProfileComplete }) => {
  const { storeId } = useParams() as { storeId: string };
  const [isProcessing, setIsProcessing] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showQuestionsModal, setShowQuestionsModal] = useState(false);
  const [customAnswers, setCustomAnswers] = useState<{ question: string; answer: string }[]>([]);
  const [isRendered, setIsRendered] = useState(false);

  const dispatch = useDispatch();
  const router = useRouter();

  const cart = useSelector((state: RootState) =>
    storeId ? state.cart.carts[storeId] : null
  );
  const isOrderLoading = useSelector((state: RootState) => state.orders.loading);
  const config = useSelector((state: RootState) => state.ui.store?.configuration);
  const cartOpen = useSelector((state: RootState) => state.ui.cartOpen);
  const { userData } = useSelector((state: RootState) => state.auth);
  const deliveryEnabled = config?.activations?.deliveryEnabled;

  const cartItems = useMemo(() => cart?.items || [], [cart]);
  // Cart sidebar never includes shipping — shipping cost only shown in wizard confirm step
  const cartTotals = useMemo(() =>
    calculateCartTotals(cartItems, null),
    [cartItems]);

  const { subtotal, discountTotal, taxTotal, total } = cartTotals;

  const isMobile = useMediaQuery({ maxWidth: 768 });
  const placement = isMobile ? 'bottom' : 'end';

  // Determine if the store has ANY checkout steps configured
  // (buyer data, login, delivery, shipping, custom questions)
  const hasCheckoutSteps = useMemo(() => {
    const requireLogin = config?.activations?.requireLogin ?? false;
    const requireBuyerData = config?.activations?.requireBuyerData ?? config?.activations?.requireUserData ?? false;
    const requireShipping = config?.activations?.requireShippingData ?? false;
    const hasQuestions = hasCustomQuestions(config ?? null);
    return requireLogin || requireBuyerData || deliveryEnabled || requireShipping || hasQuestions;
  }, [config, deliveryEnabled]);

  useEffect(() => {
    if (cartOpen) {
      setIsRendered(true);
      return;
    }

    const timer = setTimeout(() => {
      setIsRendered(false);
    }, 300);
    return () => clearTimeout(timer);
  }, [cartOpen]);

  const handleRemoveItem = useCallback((productId: number) =>
    dispatch(removeItem({ productId, storeId: storeId })),
    [dispatch, storeId]
  );

  const handleIncrementQuantity = useCallback((productId: number) =>
    dispatch(incrementQuantity({ productId, storeId: storeId })),
    [dispatch, storeId]
  );

  const handleDecrementQuantity = useCallback((productId: number) =>
    dispatch(decrementQuantity({ productId, storeId: storeId })),
    [dispatch, storeId]
  );

  const handleClearCart = useCallback(() => {
    setShowConfirmModal(false);
    dispatch(clearCart(storeId));
  }, [dispatch, storeId]);

  // ── WhatsApp: direct send (only for simple stores with NO steps) ──
  const handleDirectWhatsApp = useCallback(async () => {
    if (cartItems.length === 0) {
      dispatch(addNotification({ message: 'Tu carrito está vacío', color: 'warning' }));
      return;
    }

    setIsProcessing(true);
    try {
      const result = await createOrderAndSendWhatsApp(customAnswers, {
        buyerName: userData?.user?.name,
        buyerPhone: userData?.profile?.additionalPhone,
      });

      if (result.success) {
        dispatch(addNotification({ message: result.message, color: 'success' }));
        if (result.orderId) dispatch(clearCart(storeId));
        dispatch(closeCart());
      } else {
        dispatch(addNotification({ message: result.message, color: 'warning' }));
      }
    } catch {
      dispatch(addNotification({ message: 'Error al procesar el pedido', color: 'danger' }));
    } finally {
      setIsProcessing(false);
    }
  }, [cartItems.length, customAnswers, dispatch, storeId, userData]);

  // ── Navigate to checkout wizard ──
  const goToCheckout = useCallback(() => {
    if (cartItems.length === 0) {
      dispatch(addNotification({ message: 'Tu carrito está vacío', color: 'warning' }));
      return;
    }
    dispatch(closeCart());
    router.push(`/${storeId}/checkout`);
  }, [cartItems.length, dispatch, router, storeId]);

  const shouldShowCustomQuestions = Boolean(config && hasCustomQuestions(config));

  const handleQuestionsSubmit = useCallback((answers: { question: string; answer: string }[]) => {
    if (answers.length === 0) {
      setShowQuestionsModal(false);
      return dispatch(addNotification({ message: 'Se requieren respuestas para continuar', color: 'warning' }));
    }

    setCustomAnswers(answers);
    setShowQuestionsModal(false);

    setTimeout(() => {
      setIsProcessing(true);
      createOrderAndSendWhatsApp(answers, {
        buyerName: userData?.user?.name,
        buyerPhone: userData?.profile?.additionalPhone,
      })
        .then(result => {
          if (result.success) {
            dispatch(addNotification({ message: result.message, color: 'success' }));
            if (result.orderId) dispatch(clearCart(storeId));
            dispatch(closeCart());
          } else {
            dispatch(addNotification({ message: result.message, color: 'warning' }));
          }
        })
        .catch(() => {
          dispatch(addNotification({ message: 'Error al procesar el pedido', color: 'danger' }));
        })
        .finally(() => {
          setIsProcessing(false);
        });
    }, 100);
  }, [dispatch, storeId, userData]);

  if (!isRendered && !cartOpen) return null;

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    e.stopPropagation();
  };

  return (
    <>
      <div className="cart-container">
        <Offcanvas
          show={cartOpen}
          onHide={() => dispatch(closeCart())}
          placement={placement}
          backdrop={true}
          style={{ backgroundColor: 'var(--card-color)' }}
          className="cart-offcanvas-custom"
          container={document.body}
          scroll={false}
          restoreFocus={false}
        >
          <Offcanvas.Header
            closeButton
            className="border-bottom"
            style={{ backgroundColor: 'var(--navbar-color)' }}
          >
            <Offcanvas.Title style={{ color: 'var(--navbar-text)', fontWeight: 'bold' }}>
              Tu Carrito
            </Offcanvas.Title>
          </Offcanvas.Header>

          <Offcanvas.Body className="p-0 d-flex flex-column">
            <div
              className="cart-products-container p-3"
              onScroll={handleScroll}
            >
              {cartItems.length > 0 ? (
                <ListGroup variant="flush">
                  {cartItems.map(item => (
                    <CartItem
                      key={item.product.id}
                      item={item}
                      storeId={storeId}
                      handleDecrement={handleDecrementQuantity}
                      handleIncrement={handleIncrementQuantity}
                      handleRemoveItem={handleRemoveItem}
                    />
                  ))}
                </ListGroup>
              ) : (
                <div className="text-center py-5" style={{ color: 'var(--text-muted)' }}>
                  <p className="mb-0">No hay productos en el carrito</p>
                </div>
              )}
            </div>

            <div className="cart-footer-container">
              {cartItems.length > 0 && (
                <div className="cart-summary mb-3">
                  {subtotal > 0 && (
                    <div className="d-flex justify-content-between mb-1">
                      <div style={{ color: 'var(--card-text)' }}>Subtotal:</div>
                      <div style={{ color: 'var(--card-text)' }}>${formatNumberWithCommas(subtotal)}</div>
                    </div>
                  )}
                  {discountTotal > 0 && (
                    <div className="d-flex justify-content-between mb-1">
                      <div style={{ color: 'var(--card-text)' }}>Descuentos:</div>
                      <div style={{ color: 'var(--danger-color)' }}>-${formatNumberWithCommas(discountTotal)}</div>
                    </div>
                  )}
                  {taxTotal > 0 && (
                    <div className="d-flex justify-content-between mb-1">
                      <div style={{ color: 'var(--card-text)' }}>Impuestos:</div>
                      <div style={{ color: 'var(--card-text)' }}>+${formatNumberWithCommas(taxTotal)}</div>
                    </div>
                  )}
                  <hr />
                </div>
              )}

              <div className="d-flex justify-content-between align-items-center mb-3">
                <h5 className="mb-0" style={{ color: 'var(--card-text)' }}>Total:</h5>
                <h4 className="mb-0" style={{ color: 'var(--card-text)' }}>
                  ${formatNumberWithCommas(Number(total))}
                </h4>
              </div>
              <div className="d-grid gap-2">
                <Button
                  variant="success"
                  onClick={hasCheckoutSteps ? goToCheckout : handleDirectWhatsApp}
                  disabled={cartItems.length === 0 || isProcessing || isOrderLoading}
                  className="d-flex align-items-center justify-content-center"
                >
                  {isProcessing || isOrderLoading ? (
                    <><Spinner size="sm" animation="border" className="me-2" /> Procesando...</>
                  ) : (
                    <><FaCheckCircle className="me-2" /> Confirmar Pedido</>
                  )}
                </Button>
                <Button
                  variant="outline-danger"
                  onClick={() => setShowConfirmModal(true)}
                  disabled={cartItems.length === 0}
                  className="d-flex align-items-center justify-content-center"
                >
                  <FaTrashAlt className="me-2" /> Vaciar Carrito
                </Button>
              </div>
            </div>
          </Offcanvas.Body>
        </Offcanvas>
      </div>

      <Modal
        show={showConfirmModal}
        onHide={() => setShowConfirmModal(false)}
        centered
        size="sm"
        style={{ zIndex: 2100 }}
      >
        <Modal.Header closeButton>
          <Modal.Title>Confirmar acción</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p className="mb-0">¿Estás seguro que deseas eliminar todos los productos del carrito?</p>
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="secondary"
            onClick={() => setShowConfirmModal(false)}
          >
            Cancelar
          </Button>
          <Button
            variant="danger"
            onClick={handleClearCart}
          >
            <FaTrashAlt className="me-2" /> Vaciar carrito
          </Button>
        </Modal.Footer>
      </Modal>

      {shouldShowCustomQuestions && (
        <CustomQuestions
          show={showQuestionsModal}
          onHide={() => setShowQuestionsModal(false)}
          questions={[...(config?.customQuestions || [])]}
          onSubmit={handleQuestionsSubmit}
          isSubmitting={isProcessing}
          title="Información del Pedido"
        />
      )}
    </>
  );
};

export default CartModal;
