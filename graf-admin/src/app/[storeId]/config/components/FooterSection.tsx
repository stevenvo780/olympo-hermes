import React from 'react';
import { Form } from 'react-bootstrap';
import { Config } from '@/types';

type FooterSectionProps = {
  formData: Config;
  handleNestedChange: (field: keyof Config, key: string, value: string) => void;
};

const FooterSection: React.FC<FooterSectionProps> = ({ formData, handleNestedChange }) => {
  return (
    <fieldset className="mb-4">
      <legend>Contenido del pie de página</legend>
      <Form.Group className="mb-3">
        <Form.Label>Información Adicional</Form.Label>
        <Form.Text className="d-block mb-1 text-muted">
          Texto breve que aparece debajo del logo en el pie de página
        </Form.Text>
        <Form.Control
          as="textarea"
          rows={2}
          value={formData.footer.info || ''}
          onChange={(e) => handleNestedChange('footer', 'info', e.target.value)}
        />
      </Form.Group>
      <Form.Group className="mb-3">
        <Form.Label>Texto informativo</Form.Label>
        <Form.Text className="d-block mb-1 text-muted">
          Texto que aparece en la sección &quot;Información&quot; del pie de página (ej: políticas de envío, horarios especiales)
        </Form.Text>
        <Form.Control
          as="textarea"
          rows={3}
          value={formData.footer.extraText || ''}
          onChange={(e) => handleNestedChange('footer', 'extraText', e.target.value)}
        />
      </Form.Group>
      <Form.Group className="mb-3">
        <Form.Label>Email de contacto (pie de página)</Form.Label>
        <Form.Control
          type="email"
          placeholder="correo@ejemplo.com"
          value={formData.footer.email || ''}
          onChange={(e) => handleNestedChange('footer', 'email', e.target.value)}
        />
      </Form.Group>
    </fieldset>
  );
};

export default FooterSection;
