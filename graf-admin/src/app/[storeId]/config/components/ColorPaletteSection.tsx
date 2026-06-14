import React, { useState } from 'react';
import { Form, Row, Col, Button, Card, Nav, Badge, Table } from 'react-bootstrap';

type ColorPaletteSectionProps = {
  palette: Record<string, string>;
  handleNestedChange: (key: string, value: string) => void;
};

const PalettePreview: React.FC<{ palette: Record<string, string> }> = ({ palette }) => {
  const previewStyles = {
    ...palette
  };

  return (
    <div className="palette-preview p-3" style={previewStyles}>
      <h5 className="mb-3">Vista previa</h5>

      <div className="mb-4">
        <h6>Tarjetas</h6>
        <Card className="mb-2" style={{ maxWidth: '300px' }}>
          <Card.Header>Encabezado de tarjeta</Card.Header>
          <Card.Body>
            <Card.Title>Título de tarjeta</Card.Title>
            <Card.Text>Contenido de ejemplo para mostrar el estilo de texto en tarjetas.</Card.Text>
            <Button variant="primary" size="sm">Botón primario</Button>{' '}
            <Button variant="secondary" size="sm">Secundario</Button>
          </Card.Body>
          <Card.Footer className="text-muted">Pie de tarjeta</Card.Footer>
        </Card>
      </div>

      <div className="mb-4">
        <h6>Botones</h6>
        <div className="d-flex flex-wrap gap-2 mb-2">
          <Button variant="primary" size="sm">Primario</Button>
          <Button variant="secondary" size="sm">Secundario</Button>
          <Button variant="success" size="sm">Éxito</Button>
          <Button variant="danger" size="sm">Peligro</Button>
          <Button variant="warning" size="sm">Advertencia</Button>
          <Button variant="info" size="sm">Info</Button>
        </div>
        <div className="d-flex flex-wrap gap-2">
          <Button variant="outline-primary" size="sm">Primario</Button>
          <Button variant="outline-secondary" size="sm">Secundario</Button>
          <Button variant="link" size="sm">Enlace</Button>
        </div>
      </div>

      <div className="mb-4">
        <h6>Textos y Enlaces</h6>
        <p>Texto normal en un párrafo. <a href="#">Este es un enlace</a> dentro del texto.</p>
        <p className="text-muted">Texto secundario atenuado.</p>
      </div>

      <div className="mb-4">
        <h6>Alertas</h6>
        <div className="alert alert-primary mb-1 py-1 px-2" role="alert" style={{ fontSize: '0.8rem' }}>
          Alerta primaria
        </div>
        <div className="alert alert-success mb-1 py-1 px-2" role="alert" style={{ fontSize: '0.8rem' }}>
          Alerta éxito
        </div>
        <div className="alert alert-danger mb-1 py-1 px-2" role="alert" style={{ fontSize: '0.8rem' }}>
          Alerta peligro
        </div>
      </div>

      <div className="mb-4">
        <h6>Navegación</h6>
        <Nav className="bg-light p-1 mb-2" style={{ fontSize: '0.8rem' }}>
          <Nav.Item>
            <Nav.Link href="#">Inicio</Nav.Link>
          </Nav.Item>
          <Nav.Item>
            <Nav.Link href="#">Productos</Nav.Link>
          </Nav.Item>
          <Nav.Item>
            <Nav.Link href="#">Contacto</Nav.Link>
          </Nav.Item>
        </Nav>
      </div>

      <div className="mb-3">
        <h6>Tabla</h6>
        <Table bordered hover size="sm" className="mb-0" style={{ fontSize: '0.8rem' }}>
          <thead>
            <tr>
              <th>#</th>
              <th>Nombre</th>
              <th>Acción</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>1</td>
              <td>Producto A</td>
              <td><Badge bg="success">Activo</Badge></td>
            </tr>
            <tr>
              <td>2</td>
              <td>Producto B</td>
              <td><Badge bg="danger">Inactivo</Badge></td>
            </tr>
          </tbody>
        </Table>
      </div>
    </div>
  );
};

const ColorPaletteSection: React.FC<ColorPaletteSectionProps> = ({ palette, handleNestedChange }) => {
  const [showEstados, setShowEstados] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  const getColorLabel = (cssVar: string): string => {
    const colorMap: Record<string, string> = {
      '--font-color': 'Color de Texto Principal',
      '--bg-color': 'Color de Fondo Principal',
      '--white-color': 'Color Blanco Base',
      '--border-color': 'Color de Bordes',
      '--primary-color': 'Color Primario',
      '--primary-hover': 'Primario (Hover)',
      '--primary-border': 'Borde Primario',
      '--primary-text': 'Texto en Primario',
      '--secondary-color': 'Color Secundario',
      '--secondary-hover': 'Secundario (Hover)',
      '--secondary-border': 'Borde Secundario',
      '--secondary-text': 'Texto en Secundario',
      '--info-color': 'Color Info',
      '--info-hover': 'Info (Hover)',
      '--info-border': 'Borde Info',
      '--info-text': 'Texto en Info',
      '--success-color': 'Color Éxito',
      '--success-hover': 'Éxito (Hover)',
      '--success-border': 'Borde Éxito',
      '--success-text': 'Texto en Éxito',
      '--warning-color': 'Color Advertencia',
      '--warning-hover': 'Advertencia (Hover)',
      '--warning-border': 'Borde Advertencia',
      '--warning-text': 'Texto en Advertencia',
      '--danger-color': 'Color Peligro',
      '--danger-hover': 'Peligro (Hover)',
      '--danger-border': 'Borde Peligro',
      '--danger-text': 'Texto en Peligro',
      '--link-color': 'Color Enlaces',
      '--link-hover': 'Enlaces (Hover)',
      '--link-border': 'Borde Enlaces',
      '--link-text': 'Texto en Enlaces',
      '--outline-color': 'Color Contorno',
      '--card-color': 'Fondo Tarjetas',
      '--card-hover': 'Tarjetas (Hover)',
      '--card-border': 'Borde Tarjetas',
      '--card-text': 'Texto en Tarjetas',
      '--card-title-color': 'Título Tarjetas',
      '--text-muted': 'Texto Atenuado',
      '--navbar-color': 'Color Barra Nav.',
      '--navbar-text': 'Texto Barra Nav.',
      '--navbar-hover-text': 'Texto Nav. (Hover)',
      '--navbar-hover-color': 'Fondo Nav. (Hover)',
      '--navbar-border-color': 'Borde Barra Nav.',
      '--text-secondary': 'Texto Secundario',
    };
    return colorMap[cssVar] || cssVar.replace('--', '').replace(/-/g, ' ');
  };

  const groupedColors = {
    'Colores Base': ['--font-color', '--text-muted' , '--text-secondary', '--bg-color', '--white-color', '--border-color'],
    'Encabezado': [
      '--navbar-color', '--navbar-text', '--navbar-hover-text',
      '--navbar-hover-color', '--navbar-border-color'
    ],
    'Tarjetas': [
      '--card-color', '--card-hover', '--card-border', '--card-text', '--card-title-color',
    ],
    'Primario': ['--primary-color', '--primary-hover', '--primary-border', '--primary-text'],
    'Secundario': ['--secondary-color', '--secondary-hover', '--secondary-border', '--secondary-text'],
    'Estados': [
      '--info-color', '--info-hover', '--info-border', '--info-text',
      '--success-color', '--success-hover', '--success-border', '--success-text',
      '--warning-color', '--warning-hover', '--warning-border', '--warning-text',
      '--danger-color', '--danger-hover', '--danger-border', '--danger-text'
    ],
    'Elementos UI': [
      '--link-color', '--link-hover', '--link-border', '--link-text',
      '--outline-color', 
    ],
  };

  return (
    <fieldset className="mb-4">
      <div className="d-flex justify-content-end mb-3">
        <Button
          variant={showPreview ? "outline-primary" : "primary"}
          onClick={() => setShowPreview(!showPreview)}
          className="d-flex align-items-center"
        >
          <i className={`bi ${showPreview ? "bi-gear" : "bi-eye"} me-1`}></i>
          {showPreview ? "Mostrar configuración" : "Vista previa"}
        </Button>
      </div>

      {showPreview ? (
        <Card className="border">
          <Card.Body>
            <PalettePreview palette={palette} />
          </Card.Body>
        </Card>
      ) : (
        <>
          {Object.entries(groupedColors).map(([group, colors]) => {
            let colorsToShow = colors;
            if (group === 'Estados' && !showEstados) {
              colorsToShow = colors.slice(0, 4);
            }
            return (
              <div key={group}>
                <h6 className="mt-3 mb-2">{group}</h6>
                <Row>
                  {colorsToShow.map((key) => (
                    <Col md={4} lg={3} key={key} className="mb-3">
                      <Form.Group className="d-flex align-items-center">
                        <Form.Control
                          type="color"
                          value={palette[key]}
                          className="me-2"
                          style={{ width: '50px' }}
                          onChange={(e) => handleNestedChange(key, e.target.value)}
                        />
                        <Form.Label className="mb-0 small">
                          {getColorLabel(key)}
                        </Form.Label>
                      </Form.Group>
                    </Col>
                  ))}
                </Row>
                {group === 'Estados' && (
                  <Button variant="link" type="button" onClick={() => setShowEstados(!showEstados)}>
                    {showEstados ? 'Ver menos' : 'Ver más'}
                  </Button>
                )}
              </div>
            );
          })}
        </>
      )}
    </fieldset>
  );
};

export default ColorPaletteSection;
