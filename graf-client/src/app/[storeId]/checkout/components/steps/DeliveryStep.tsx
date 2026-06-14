'use client';
import React, { useState } from 'react';
import { Button } from 'react-bootstrap';
import Select from 'react-select';
import { useSelector } from 'react-redux';
import { RootState } from '@/redux/store';
import { DeliveryZone } from '@/types';
import { formatNumberWithCommas } from '@/utils/formatters';
import { FaTruck, FaMapMarkerAlt, FaGift, FaClock } from 'react-icons/fa';

interface DeliveryStepProps {
  selectedZone: DeliveryZone | null;
  onSelectZone: (zone: DeliveryZone | null) => void;
  onNext: () => void;
  onBack: () => void;
}

const DeliveryStep: React.FC<DeliveryStepProps> = ({
  selectedZone, onSelectZone, onNext, onBack,
}) => {
  const store = useSelector((state: RootState) => state.ui.store);
  const zones = store?.deliveryZones || [];
  const [localZone, setLocalZone] = useState<DeliveryZone | null>(selectedZone);

  const options = zones.map(z => ({
    value: z.id,
    label: `${z.zone} — $${formatNumberWithCommas(Number(z.price))}${z.estimatedTime ? ` (${z.estimatedTime})` : ''}`,
    zoneData: z,
  }));

  const handleConfirm = () => {
    onSelectZone(localZone);
    onNext();
  };

  const handleSkip = () => {
    onSelectZone(null);
    onNext();
  };

  return (
    <div className="wizard-step-card">
      <div className="wizard-step-card__title"><FaTruck className="me-2" />Zona de Entrega</div>
      <p className="wizard-step-card__subtitle">
        Selecciona tu zona para calcular el costo de envío, o continúa sin envío.
      </p>

      {zones.length === 0 ? (
        <p className="text-muted">No hay zonas de entrega configuradas.</p>
      ) : (
        <Select
          options={options}
          value={localZone ? options.find(o => o.value === localZone.id) : null}
          onChange={option => {
            if (option && 'zoneData' in option) {
              setLocalZone(option.zoneData);
            }
          }}
          placeholder="Elige tu zona de entrega..."
          isClearable
          styles={{
            control: (base) => ({ ...base, backgroundColor: 'var(--card-color)', borderColor: 'var(--border-color)' }),
            menu: (base) => ({ ...base, backgroundColor: 'var(--card-color)', zIndex: 10 }),
          }}
        />
      )}

      {localZone && (
        <div className="mt-3 p-2 rounded" style={{ background: 'var(--bg-color)' }}>
          <small>
            <FaMapMarkerAlt className="me-1" /><strong>{localZone.zone}</strong> — 
            Costo: <strong>${formatNumberWithCommas(Number(localZone.price))}</strong>
            {localZone.estimatedTime && <> · <FaClock className="me-1" />{localZone.estimatedTime}</>}
            {localZone.freeShippingThreshold && (
              <> · <FaGift className="me-1" />Envío gratis desde ${formatNumberWithCommas(localZone.freeShippingThreshold)}</>
            )}
          </small>
        </div>
      )}

      <div className="wizard-nav">
        <Button variant="outline-secondary" onClick={onBack} className="wizard-nav__btn">
          ← Atrás
        </Button>
        <div className="d-flex gap-2">
          <Button variant="outline-primary" onClick={handleSkip} className="wizard-nav__btn">
            Sin envío
          </Button>
          <Button variant="primary" onClick={handleConfirm} disabled={!localZone} className="wizard-nav__btn">
            Confirmar zona →
          </Button>
        </div>
      </div>
    </div>
  );
};

export default DeliveryStep;
