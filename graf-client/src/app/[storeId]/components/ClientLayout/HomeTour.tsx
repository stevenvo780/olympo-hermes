'use client';
import React from 'react';
import { PrizmaTour, usePrizmaTour, type TourStep } from 'prizma-ui';

const TOUR_STEPS: TourStep[] = [
  {
    target: '[data-tour="search"]',
    title: 'Busca lo que necesitas',
    body: 'Escribe el nombre de un producto aquí para encontrarlo de inmediato entre todo el catálogo.',
    placement: 'bottom',
  },
  {
    target: '[data-tour="categories"]',
    title: 'Filtra por categoría',
    body: 'Toca una categoría para ver solo los productos de esa sección. Tócala de nuevo para quitar el filtro.',
    placement: 'bottom',
  },
  {
    target: '[data-tour="products"]',
    title: 'Explora el catálogo',
    body: 'Aquí ves todos los productos disponibles. Toca cualquier tarjeta para ver detalles, precio y opciones.',
    placement: 'top',
  },
  {
    target: '[data-tour="filter-btn"]',
    title: 'Refina con filtros',
    body: 'Usa los filtros para acotar por precio, descuento u otras características del producto.',
    placement: 'top',
  },
  {
    target: '[data-tour="cart-btn"]',
    title: 'Revisa tu carrito',
    body: 'Cuando agregues productos, aquí aparece el total. Toca el botón para revisar los artículos antes de confirmar.',
    placement: 'top',
  },
  {
    target: '[data-tour="whatsapp-btn"]',
    title: 'Confirma tu pedido',
    body: 'Cuando estés listo, confirma tu pedido. Si la tienda lo requiere, pasarás por el proceso de pago; de lo contrario, el pedido se enviará directo por WhatsApp.',
    placement: 'top',
  },
];

interface HomeTourProps {
  onStart?: (startFn: () => void) => void;
}

const HomeTour: React.FC<HomeTourProps> = ({ onStart }) => {
  const tour = usePrizmaTour({ runKey: 'hermes-client-v1', total: TOUR_STEPS.length });

  // Expose the start function to the parent via callback ref pattern
  React.useEffect(() => {
    if (onStart) {
      onStart(tour.start);
    }
  }, [onStart, tour.start]);

  return (
    <PrizmaTour
      steps={TOUR_STEPS}
      runKey="hermes-client-v1"
      autoStart
      onFinish={() => {}}
      onSkip={() => {}}
      {...tour.tourProps}
    />
  );
};

export default HomeTour;
