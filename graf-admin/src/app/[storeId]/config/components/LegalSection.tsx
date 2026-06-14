import React from 'react';
import { Form, Row, Col } from 'react-bootstrap';
import { Config } from '@/types';

type LegalSectionProps = {
  formData: Config;
  handleNestedChange: (field: keyof Config, key: string, value: string) => void;
};

const LegalSection: React.FC<LegalSectionProps> = ({ formData, handleNestedChange }) => {
  return (
    <fieldset className="mb-4">
      <legend>Información legal</legend>
      <Row className="g-3">
        <Col md={6}>
          <Form.Group className="mb-3">
            <Form.Label>Mapa del Sitio</Form.Label>
            <Form.Control
              type="text"
              value={formData.legal.sitemapLink || ''}
              onChange={(e) => handleNestedChange('legal', 'sitemapLink', e.target.value)}
            />
          </Form.Group>
        </Col>
        <Col md={6}>
          <Form.Group className="mb-3">
            <Form.Label>Términos de Servicio</Form.Label>
            <Form.Control
              type="text"
              value={formData.legal.termsOfServiceLink || ''}
              onChange={(e) => handleNestedChange('legal', 'termsOfServiceLink', e.target.value)}
            />
          </Form.Group>
        </Col>
      </Row>
      <Row className="g-3">
        <Col md={6}>

          <Form.Group className="mb-3">
            <Form.Label>Aviso Legal</Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              value={formData.legal.legalNotice || ''}
              onChange={(e) => handleNestedChange('legal', 'legalNotice', e.target.value)}
            />
          </Form.Group>
        </Col>
        <Col md={6}>
          <Form.Group className="mb-3">
            <Form.Label>Disclaimer</Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              value={formData.legal.disclaimer || ''}
              onChange={(e) => handleNestedChange('legal', 'disclaimer', e.target.value)}
            />
          </Form.Group>
        </Col>
      </Row>
    </fieldset>
  );
};

export default LegalSection;
