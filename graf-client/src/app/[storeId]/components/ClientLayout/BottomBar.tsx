import React, { memo, useMemo, useCallback } from 'react';
import { Row, Col, Button } from 'react-bootstrap';
import { FiFilter } from 'react-icons/fi';
import { FaWhatsapp, FaShoppingCart } from 'react-icons/fa';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '@/redux/store';
import { addNotification, openCart } from '@/redux/ui';
import { formatNumberWithCommas } from '@/utils/formatters';

interface BottomBarProps {
  storeId: string;
  isProductsPage: boolean;
  handleOpenFilters: () => void;
  handleWhatsAppClick: () => void;
  paymentLink?: string;
}

const BottomBar: React.FC<BottomBarProps> = ({
  storeId,
  isProductsPage,
  handleOpenFilters,
  handleWhatsAppClick,
  paymentLink
}) => {
  const dispatch = useDispatch();
  const currentCart = useSelector((state: RootState) =>
    storeId ? state.cart.carts[storeId] : null
  );

  const cartItems = useMemo(() => currentCart?.items || [], [currentCart]);
  const cartTotal = useMemo(
    () => cartItems.reduce((acc, item) => acc + Number(item.finalPrice), 0),
    [cartItems]
  );
  const cartCount = useMemo(
    () => cartItems.reduce((acc, item) => acc + item.quantity, 0),
    [cartItems]
  );

  const isMobile = useMemo(() => window.innerWidth <= 768, []);

  const handleCartClick = useCallback(() => {
    if (cartItems.length === 0) {
      dispatch(addNotification({ message: 'Tu carrito está vacío', color: 'warning' }));
      return;
    }
    dispatch(openCart());
  }, [cartItems.length, dispatch]);

  if (!storeId) return null;

  return (
    <Row className="floating-buttons-container">
      <Col xs={3} sm={3} md={1} lg={1} className="d-flex justify-content-center">
        {isProductsPage && (
          <Button
            onClick={handleOpenFilters}
            variant="secondary"
            className="floating-button"
            title="Filtrar productos"
          >
            <FiFilter size={24} />
          </Button>
        )}
      </Col>
      <Col xs={6} sm={6} md={10} lg={10} className="d-flex justify-content-center p-0">
        {isProductsPage && (
          <>
            {cartCount > 0 && (
              <Button
                onClick={handleCartClick}
                variant="primary"
                title="Ver carrito"
                aria-label="Ver carrito"
              >
                <FaShoppingCart size={24} />
                {(!isMobile || cartCount < 100000) && (
                  <span className="badge bg-danger ms-1">{cartCount}</span>
                )}
                <span className="ms-2 fw-bold">${formatNumberWithCommas(cartTotal)}</span>
              </Button>
            )}
          </>
        )}
      </Col>
      <Col xs={3} sm={3} md={1} lg={1} className="d-flex justify-content-center">
        <Button
          onClick={handleWhatsAppClick}
          variant="secondary"
          className="floating-button"
          title="Chat de WhatsApp"
        >
          <FaWhatsapp size={24} />
        </Button>
      </Col>
    </Row>
  );
};

export default memo(BottomBar);
