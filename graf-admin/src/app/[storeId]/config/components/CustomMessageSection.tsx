import React from 'react';
import { Form } from 'react-bootstrap';

type CustomMessageSectionProps = {
  customMessage: string;
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
};

const CustomMessageSection: React.FC<CustomMessageSectionProps> = ({ customMessage, handleInputChange }) => {
  return (
    <fieldset className="mb-4">
      <legend>Mensaje Personalizado (Opcional)</legend>
      <Form.Group className="mb-3">
        <Form.Label>Mensaje personalizado</Form.Label>
        <Form.Control 
          as="textarea" 
          rows={4} 
          name="customMessage" 
          value={customMessage || ''} 
          onChange={handleInputChange} 
        />
      </Form.Group>
    </fieldset>
  );
};

export default CustomMessageSection;
