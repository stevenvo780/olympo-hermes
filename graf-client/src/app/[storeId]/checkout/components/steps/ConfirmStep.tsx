'use client';
import React, { useMemo } from 'react';
import { Button, Spinner, Image } from 'react-bootstrap';
import { useSelector } from 'react-redux';
import { RootState } from '@/redux/store';
import { BuyerData, DeliveryZone, PaymentMethod, ShippingAddress } from '@/types';
import { formatNumberWithCommas } from '@/utils/formatters';
import { calculateCartTotals } from '@/utils/cartUtils';
import { extractFirstValidImageUrl } from '@/utils/imageUtils';
import { FaCreditCard, FaCheckCircle, FaGift, FaUser, FaTruck, FaMapMarkerAlt, FaPencilAlt, FaWhatsapp } from 'react-icons/fa';

interface ConfirmStepProps {
  enablePaymentLinks: boolean;
  buyerData: BuyerData;
  deliveryZone: DeliveryZone | null;
  shippingAddress: ShippingAddress;
  customAnswers: { question: string; answer: string }[];
  isSubmitting: boolean;
  onSubmit: (method?: PaymentMethod) => void;
  onBack: () => void;
  /** Which data sections to show based on steps the user went through */
  showBuyerData: boolean;
  showShipping: boolean;
  showDelivery: boolean;
}

const ConfirmStep: React.FC<ConfirmStepProps> = ({
  enablePaymentLinks, buyerData, deliveryZone, shippingAddress,
  customAnswers, isSubmitting, onSubmit, onBack,
  showBuyerData, showShipping, showDelivery,
}) => {
  const { carts } = useSelector((state: RootState) => state.cart);
  const store = useSelector((state: RootState) => state.ui.store);
  const config = useSelector((state: RootState) => state.ui.store?.configuration);
  const storeId = store?.id || '';
  const currentCart = storeId ? carts[storeId] : null;
  const cartItems = useMemo(() => currentCart?.items || [], [currentCart]);

  const deliveryEnabled = config?.activations?.deliveryEnabled;

  const cartTotals = useMemo(
    () => calculateCartTotals(cartItems, deliveryEnabled && deliveryZone ? deliveryZone : null),
    [cartItems, deliveryEnabled, deliveryZone]
  );

  const { subtotal, discountTotal, taxTotal, total } = cartTotals;

  return (
    <div className="wizard-step-card">
      <div className="wizard-step-card__title">
        <FaCheckCircle className="me-2" />Confirmar Pedido
      </div>
      <p className="wizard-step-card__subtitle">
        Revisa los detalles de tu pedido antes de confirmar.
      </p>

      {/* ── Cart items ── */}
      <div style={{ maxHeight: '200px', overflowY: 'auto', marginBottom: '1rem', borderBottom: '2px solid rgba(0, 0, 0, 0.1)' }}>
        {cartItems.map(item => {
          const unitPrice = Number(item.product.totalPrice ?? item.product.basePrice);
          const lineTotal = unitPrice * item.quantity;
          const hasImage = item.product.images && item.product.images.length > 0;
          return (
            <div key={item.product.id} className="order-summary__item">
              <div className="d-flex align-items-center gap-2">
                {hasImage && (
                  <Image
                    src={extractFirstValidImageUrl(item.product.images)}
                    thumbnail
                    style={{ width: '36px', height: '36px', objectFit: 'cover' }}
                    alt={item.product.title}
                  />
                )}
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{item.product.title}</div>
                  <small className="text-muted">{item.quantity} × ${formatNumberWithCommas(unitPrice)}</small>
                </div>
              </div>
              <strong>${formatNumberWithCommas(lineTotal)}</strong>
            </div>
          );
        })}
      </div>

      {/* ── Totals ── */}
      <div className="mb-3">
        {subtotal > 0 && (
          <div className="d-flex justify-content-between" style={{ fontSize: '0.9rem' }}>
            <span>Subtotal</span>
            <span>${formatNumberWithCommas(subtotal)}</span>
          </div>
        )}
        {discountTotal > 0 && (
          <div className="d-flex justify-content-between" style={{ fontSize: '0.9rem', color: 'var(--danger-color)' }}>
            <span>Descuentos</span>
            <span>-${formatNumberWithCommas(discountTotal)}</span>
          </div>
        )}
        {taxTotal > 0 && (
          <div className="d-flex justify-content-between" style={{ fontSize: '0.9rem' }}>
            <span>Impuestos</span>
            <span>+${formatNumberWithCommas(taxTotal)}</span>
          </div>
        )}
        {deliveryZone && (
          <div className="d-flex justify-content-between" style={{ fontSize: '0.9rem' }}>
            <span>Envío ({deliveryZone.zone})</span>
            <span>
              {deliveryZone.freeShippingThreshold && subtotal >= deliveryZone.freeShippingThreshold
                ? <><FaGift className="me-1" />Gratis</>
                : `$${formatNumberWithCommas(Number(deliveryZone.price))}`}
            </span>
          </div>
        )}
        <hr className="my-2" />
        <div className="order-summary__total">
          <span>Total</span>
          <span>${formatNumberWithCommas(total)}</span>
        </div>
      </div>

      {/* ── Collected data summary ── */}
      {showBuyerData && buyerData.fullName && (
        <div className="data-summary">
          <div className="data-summary__title"><FaUser className="me-2" />Datos del Comprador</div>
          <div className="data-summary__row">
            <span className="data-summary__label">Nombre</span>
            <span>{buyerData.fullName}</span>
          </div>
          <div className="data-summary__row">
            <span className="data-summary__label">Teléfono</span>
            <span>{buyerData.phone}</span>
          </div>
          {buyerData.email && (
            <div className="data-summary__row">
              <span className="data-summary__label">Email</span>
              <span>{buyerData.email}</span>
            </div>
          )}
          {buyerData.documentNumber && (
            <div className="data-summary__row">
              <span className="data-summary__label">Documento</span>
              <span>{buyerData.documentNumber}</span>
            </div>
          )}
        </div>
      )}

      {showDelivery && deliveryZone && (
        <div className="data-summary">
          <div className="data-summary__title"><FaTruck className="me-2" />Zona de Entrega</div>
          <div className="data-summary__row">
            <span className="data-summary__label">Zona</span>
            <span>{deliveryZone.zone}</span>
          </div>
          {deliveryZone.estimatedTime && (
            <div className="data-summary__row">
              <span className="data-summary__label">Tiempo estimado</span>
              <span>{deliveryZone.estimatedTime}</span>
            </div>
          )}
        </div>
      )}

      {showShipping && shippingAddress.address && (
        <div className="data-summary">
          <div className="data-summary__title"><FaMapMarkerAlt className="me-2" />Dirección de Envío</div>
          <div className="data-summary__row">
            <span className="data-summary__label">Dirección</span>
            <span>{shippingAddress.address}</span>
          </div>
          {shippingAddress.reference && (
            <div className="data-summary__row">
              <span className="data-summary__label">Referencia</span>
              <span>{shippingAddress.reference}</span>
            </div>
          )}
          {(shippingAddress.city || shippingAddress.department) && (
            <div className="data-summary__row">
              <span className="data-summary__label">Ciudad / Depto.</span>
              <span>{[shippingAddress.city, shippingAddress.department].filter(Boolean).join(', ')}</span>
            </div>
          )}
        </div>
      )}

      {customAnswers.length > 0 && (
        <div className="data-summary">
          <div className="data-summary__title"><FaPencilAlt className="me-2" />Información Adicional</div>
          {customAnswers.map((a, i) => (
            <div key={i} className="data-summary__row">
              <span className="data-summary__label">{a.question}</span>
              <span>{a.answer}</span>
            </div>
          ))}
        </div>
      )}

      {/* ── Submit ── */}
      <div className="wizard-nav">
        <Button variant="outline-secondary" onClick={onBack} className="wizard-nav__btn" disabled={isSubmitting}>
          ← Atrás
        </Button>
        <div className="d-flex flex-column flex-sm-row gap-2">
          <Button
            variant="success"
            onClick={() => onSubmit('whatsapp')}
            disabled={isSubmitting || cartItems.length === 0}
            className="wizard-nav__btn d-flex align-items-center justify-content-center gap-2"
          >
            {isSubmitting ? (
              <><Spinner animation="border" size="sm" /> Procesando...</>
            ) : (
              <><FaWhatsapp /> Finalizar compra por WhatsApp</>
            )}
          </Button>
          {enablePaymentLinks && (
            <Button
              variant="primary"
              onClick={() => onSubmit('wompi')}
              disabled={isSubmitting || cartItems.length === 0}
              className="wizard-nav__btn d-flex align-items-center justify-content-center gap-2"
            >
              {isSubmitting ? (
                <><Spinner animation="border" size="sm" /> Procesando...</>
              ) : (
                <><FaCreditCard /> Pagar en Línea</>
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ConfirmStep;
