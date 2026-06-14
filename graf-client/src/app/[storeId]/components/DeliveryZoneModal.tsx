import React, { useState } from 'react';
import Select from 'react-select';
import { Modal, Button } from 'react-bootstrap';
import { DeliveryZone } from '@/types';

interface DeliveryZoneModalProps {
  show: boolean;
  onHide: () => void;
  deliveryZones: DeliveryZone[];
  onSelectZone: (zone: DeliveryZone) => void;
}

const DeliveryZoneModal: React.FC<DeliveryZoneModalProps> = ({
  show,
  onHide,
  deliveryZones,
  onSelectZone
}) => {
  const [selectedZone, setSelectedZone] = useState<DeliveryZone | null>(null);

  const handleSubmit = () => {
    if (selectedZone) onSelectZone(selectedZone);
    onHide();
  };

  return (
    <Modal show={show} onHide={onHide} centered backdrop="static" style={{ zIndex: 3000 }}>
      <Modal.Header closeButton>
        <Modal.Title>Selecciona tu zona de entrega</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {deliveryZones.length === 0 ? (
          <p className="text-muted">No hay zonas de entrega configuradas.</p>
        ) : (
          <>
            <p className="mb-2 text-muted" style={{ fontSize: '0.9rem' }}>
              Por favor selecciona una zona de entrega para continuar.
            </p>
            <Select
              options={deliveryZones.map(z => ({
                value: z.id,
                label: `${z.zone} (Costo: $${z.price})`,
                zoneData: z
              }))}
              onChange={option => {
                if (option && 'zoneData' in option) {
                  setSelectedZone(option.zoneData);
                }
              }}
              placeholder="Elige Zona"
            />
          </>
        )}
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide}>
          Cancelar
        </Button>
        <Button
          variant="primary"
          onClick={handleSubmit}
          disabled={!selectedZone || deliveryZones.length === 0}
        >
          Confirmar
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default DeliveryZoneModal;
