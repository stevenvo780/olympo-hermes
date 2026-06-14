import React from 'react';
import { Form } from 'react-bootstrap';
import { Config } from '@/types';

type ConfigWithPaymentLink = Config & { paymentLink: string };

type PaymentLinkSectionProps = {
  formData: ConfigWithPaymentLink;
  setFormData: React.Dispatch<React.SetStateAction<ConfigWithPaymentLink | null>>;
};

const PaymentLinkSection: React.FC<PaymentLinkSectionProps> = ({ formData, setFormData }) => {
  return (
    <fieldset className="mb-4">
      <legend>Link de Pago</legend>
      <Form.Group className="mb-3">
        <Form.Label>URL de Link de Pago</Form.Label>
        <Form.Control
          type="text"
          placeholder="URL de pago"
          value={formData.paymentLink}
          onChange={(e) => setFormData(prev => prev ? { ...prev, paymentLink: e.target.value } : prev)}
        />
      </Form.Group>
    </fieldset>
  );
};

export default PaymentLinkSection;
