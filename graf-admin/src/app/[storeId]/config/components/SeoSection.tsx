import React from 'react';
import { Form, Row, Col, Button } from 'react-bootstrap';
import { Config } from '@/types';

type SeoSectionProps = {
  formData: Config;
  handleNestedChange: (field: keyof Config, key: string, value: string | string[]) => void;
};

const SeoSection: React.FC<SeoSectionProps> = ({ formData, handleNestedChange }) => {
  
  const handleRemoveItem = (field: string, index: number) => {
    if (field === 'keywords') {
      const newKeywords = [...(formData.seo.keywords || [])];
      newKeywords.splice(index, 1);
      handleNestedChange('seo', 'keywords', newKeywords);
    }
  };
  
  return (
    <fieldset className="mb-4">
      <Form.Group className="mb-3">
        <Form.Label>Meta Title</Form.Label>
        <Form.Control 
          type="text" 
          value={formData.seo.metaTitle || ''} 
          onChange={(e) => handleNestedChange('seo', 'metaTitle', e.target.value)} 
        />
      </Form.Group>

      <Form.Group className="mb-3">
        <Form.Label>Meta Description</Form.Label>
        <Form.Control 
          as="textarea" 
          rows={2} 
          value={formData.seo.metaDescription || ''} 
          onChange={(e) => handleNestedChange('seo', 'metaDescription', e.target.value)} 
        />
      </Form.Group>

      <Form.Group className="mb-3">
        <Form.Label>Palabras clave para tu comercio</Form.Label>
        {(formData.seo.keywords || []).map((keyword, index) => (
          <Row key={index} className="mb-2">
            <Col>
              <div className="d-flex">
                <Form.Control
                  type="text"
                  value={keyword}
                  onChange={(e) => {
                    const newKeywords = [...(formData.seo.keywords || [])];
                    newKeywords[index] = e.target.value;
                    handleNestedChange('seo', 'keywords', newKeywords);
                  }}
                />
                <Button
                  variant="outline-danger"
                  size="sm"
                  className="ms-2"
                  onClick={() => handleRemoveItem('keywords', index)}
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
          onClick={() => {
            const currentKeywords = formData.seo.keywords || [];
            handleNestedChange('seo', 'keywords', [...currentKeywords, '']);
          }}
        >
          + Palabra Clave
        </Button>
      </Form.Group>
    </fieldset>
  );
};

export default SeoSection;
