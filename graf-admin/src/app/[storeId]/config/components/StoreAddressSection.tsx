import React from 'react';
import { Form } from 'react-bootstrap';

type StoreAddressSectionProps = {
  storeAddress: string;
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
};

const StoreAddressSection: React.FC<StoreAddressSectionProps> = ({ storeAddress, handleInputChange }) => {
  return (
    <fieldset className="mb-4">
      <legend>Dirección de la Tienda</legend>
      <Form.Group className="mb-3">
        <Form.Label>Dirección Completa</Form.Label>
        <Form.Control
          as="textarea"
          rows={3}
          name="storeAddress"
          value={storeAddress}
          placeholder="Av. Principal 123, Ciudad, País"
          onChange={handleInputChange}
        />
      </Form.Group>
    </fieldset>
  );
};

export default StoreAddressSection;
