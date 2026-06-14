import React from 'react';
import { Form, Row, Col, Button } from 'react-bootstrap';
import { Config } from '@/types';

type ConfigWithBanners = Config & { banners: string[] };

type ContactSectionProps = {
  formData: ConfigWithBanners;
  setFormData: React.Dispatch<React.SetStateAction<ConfigWithBanners | null>>;
};

const ContactSection: React.FC<ContactSectionProps> = ({ formData, setFormData }) => {

  const handleRemoveItem = (field: string, index: number) => {
    if (field === 'contactNumbers') {
      setFormData(prev => {
        if (!prev) return prev;
        const newNumbers = [...prev.contactNumbers];
        newNumbers.splice(index, 1);
        return { ...prev, contactNumbers: newNumbers };
      });
    } else if (field === 'socialNetworks') {
      setFormData(prev => {
        if (!prev) return prev;
        const newNetworks = [...prev.socialNetworks];
        newNetworks.splice(index, 1);
        return { ...prev, socialNetworks: newNetworks };
      });
    }
  };

  const handleArrayChange = (
    field: 'socialNetworks',
    index: number,
    key: string,
    value: string
  ) => {
    setFormData(prev => {
      if (!prev || !Array.isArray(prev[field])) return prev;
      const updated = [...prev[field]];
      updated[index] = {
        ...updated[index],
        [key]: value
      };
      return {
        ...prev,
        [field]: updated
      };
    });
  };

  return (
    <fieldset className="mb-4">
      <legend>Contacto y Links</legend>
      <Row>
        <Col md={6}>
          <Form.Group className="mb-3">
            <Form.Label>Números de Contacto</Form.Label>
            {formData.contactNumbers.map((number, index) => (
              <Row key={index} className="mb-2">
                <Col>
                  <div className="d-flex">
                    <Form.Control
                      type="text"
                      value={number}
                      onChange={(e) => {
                        const newValue = e.target.value;
                        setFormData(prev => {
                          if (!prev) return prev;
                          const newNumbers = [...prev.contactNumbers];
                          newNumbers[index] = newValue;
                          return { ...prev, contactNumbers: newNumbers };
                        });
                      }}
                    />
                    <Button
                      variant="outline-danger"
                      size="sm"
                      className="ms-2"
                      onClick={() => handleRemoveItem('contactNumbers', index)}
                    >
                      ×
                    </Button>
                  </div>
                </Col>
              </Row>
            ))}
            <br />
            <Button
              size="sm"
              variant="secondary"
              onClick={() =>
                setFormData(prev => prev ? {
                  ...prev,
                  contactNumbers: [...prev.contactNumbers, '']
                } : prev)
              }
            >
              + Número de Contacto
            </Button>
          </Form.Group>
        </Col>
        
        <Col md={6}>
          <div className="mb-3">
            <label className="d-block mb-2">Links</label>
            <p className="text-muted mb-1">
              <small>
                Agrega tus redes sociales para que tus clientes o cualquier otro enlace a tus clientes puedan contactarte.
              </small>
            </p>
            {formData.socialNetworks.map((rs, index) => (
              <Row key={index} className="mb-2">
                <Col md={5}>
                  <Form.Control
                    type="text"
                    placeholder="Red Social"
                    value={rs.name}
                    onChange={(e) => handleArrayChange('socialNetworks', index, 'name', e.target.value)}
                  />
                </Col>
                <Col md={6}>
                  <Form.Control
                    type="text"
                    placeholder="URL"
                    value={rs.url}
                    onChange={(e) => handleArrayChange('socialNetworks', index, 'url', e.target.value)}
                  />
                </Col>
                <Col md={1}>
                  <Button
                    variant="outline-danger"
                    size="sm"
                    onClick={() => handleRemoveItem('socialNetworks', index)}
                  >
                    ×
                  </Button>
                </Col>
              </Row>
            ))}
            <Button
              size="sm"
              variant="secondary"
              onClick={() => setFormData(prev => prev ? { ...prev, socialNetworks: [...prev.socialNetworks, { name: '', url: '' }] } : prev)}
            >
              + Link
            </Button>
          </div>
        </Col>
      </Row>
    </fieldset>
  );
};

export default ContactSection;
