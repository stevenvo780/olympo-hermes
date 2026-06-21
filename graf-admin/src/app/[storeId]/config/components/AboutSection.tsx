import React, { useState } from 'react';
import { Form, Button, ButtonGroup, Row, Col } from 'react-bootstrap';
import SafeHtmlRenderer from '@/components/SafeHtmlRenderer';

type AboutSectionProps = {
  about: string;
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
};

const AboutSection: React.FC<AboutSectionProps> = ({ about, handleInputChange }) => {
  const [viewMode, setViewMode] = useState<'editor' | 'preview' | 'split'>('split');

  return (
    <fieldset className="mb-4">
      <legend>Acerca de</legend>

      <Form.Group className="mb-3">
        <div className="d-flex justify-content-between align-items-center mb-2">
          <Form.Label className="mb-0">Contenido HTML</Form.Label>
          <ButtonGroup size="sm">
            <Button
              variant={viewMode === 'editor' ? 'primary' : 'outline-primary'}
              onClick={() => setViewMode('editor')}
            >
              Editor
            </Button>
            <Button
              variant={viewMode === 'split' ? 'primary' : 'outline-primary'}
              onClick={() => setViewMode('split')}
            >
              Dividido
            </Button>
            <Button
              variant={viewMode === 'preview' ? 'primary' : 'outline-primary'}
              onClick={() => setViewMode('preview')}
            >
              Vista Previa
            </Button>
          </ButtonGroup>
        </div>

        <Row>

          {(viewMode === 'editor' || viewMode === 'split') && (
            <Col md={viewMode === 'split' ? 6 : 12}>
              <Form.Control
                as="textarea"
                rows={20}
                name="about"
                value={about || ''}
                onChange={handleInputChange}
                placeholder="<h2>Mi Empresa</h2>
<p>Somos una empresa <strong>líder</strong> en el mercado...</p>

<div style='background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;'>
  <h3 style='color: #0d6efd;'>Nuestros Servicios</h3>
  <ul>
    <li>Servicio premium</li>
    <li>Atención 24/7</li>
    <li>Garantía total</li>
  </ul>
</div>

<p>Contáctanos en <a href='mailto:info@empresa.com'>info@empresa.com</a></p>"
                style={{
                  fontFamily: 'Monaco, Menlo, "Ubuntu Mono", Consolas, "Courier New", monospace',
                  fontSize: '13px',
                  lineHeight: '1.5',
                  backgroundColor: '#f8f9fa',
                  border: '1px solid #dee2e6',
                  borderRadius: '8px',
                  resize: 'vertical'
                }}
              />
            </Col>
          )}

          {(viewMode === 'preview' || viewMode === 'split') && (
            <Col md={viewMode === 'split' ? 6 : 12}>
              <div
                className="border rounded p-3 bg-white"
                style={{
                  minHeight: '500px',
                  maxHeight: '600px',
                  overflowY: 'auto',
                  border: '1px solid #dee2e6'
                }}
              >
                {about ? (
                  <SafeHtmlRenderer html={about} />
                ) : (
                  <div className="text-muted text-center p-4">
                    <p>La vista previa aparecerá aquí...</p>
                    <small>Escriba HTML en el editor para ver el resultado</small>
                  </div>
                )}
              </div>
            </Col>
          )}
        </Row>

        <Form.Text className="text-muted mt-2">
          Editor HTML simple. Use HTML para crear contenido con máxima flexibilidad de diseño.
        </Form.Text>
      </Form.Group>
    </fieldset>
  );
};

export default AboutSection;