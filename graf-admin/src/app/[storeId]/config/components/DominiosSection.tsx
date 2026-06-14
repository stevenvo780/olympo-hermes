import React, { useState } from 'react';
import { Form, Button, ListGroup, Alert } from 'react-bootstrap';
import { useDispatch } from 'react-redux';
import { addNotification } from '@/redux/ui';

type DominiosSectionProps = {
  dominios: string[];
  onDominiosChange: (dominios: string[]) => void;
};

const DominiosSection: React.FC<DominiosSectionProps> = ({ dominios, onDominiosChange }) => {
  const [nuevoDominio, setNuevoDominio] = useState<string>('');
  const MAX_DOMINIOS = 3;
  const dispatch = useDispatch();

  const handleAgregarDominio = () => {
    if (!nuevoDominio.trim()) return;
    const dispatchNotification = (message: string, color: 'danger' | 'warning' | 'success' = 'danger') =>
      dispatch(addNotification({ message, color }));

    const dominioRegex = /^([a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$/;
    if (!dominioRegex.test(nuevoDominio)) {
      dispatchNotification('Por favor ingresa un dominio válido (ej: midominio.com)');
      return;
    }

    if (dominios.includes(nuevoDominio)) {
      dispatchNotification('Este dominio ya ha sido añadido');
      return;
    }

    if (dominios.length >= MAX_DOMINIOS) {
      dispatchNotification(`Solo puedes añadir hasta ${MAX_DOMINIOS} dominios`);
      return;
    }

    const nuevosDominios = [...dominios, nuevoDominio];
    onDominiosChange(nuevosDominios);
    setNuevoDominio('');
  };

  const handleEliminarDominio = (index: number) => {
    const nuevosDominios = dominios.filter((_, i) => i !== index);
    onDominiosChange(nuevosDominios);
  };

  return (
    <fieldset className="mb-4">
      <legend>Dominios Personalizados</legend>
      
      <ListGroup className="mb-3">
        {dominios.length === 0 && (
          <ListGroup.Item variant="light">No hay dominios configurados</ListGroup.Item>
        )}
        
        {dominios.map((dominio, index) => (
          <ListGroup.Item key={index} className="d-flex justify-content-between align-items-center">
            {dominio}
            <Button 
              variant="outline-danger" 
              size="sm" 
              onClick={() => handleEliminarDominio(index)}
            >
              Eliminar
            </Button>
          </ListGroup.Item>
        ))}
      </ListGroup>
      
      <Form.Group className="mb-3 d-flex">
        <Form.Control
          type="text"
          placeholder="Ingresa un dominio (ej: mitienda.com)"
          value={nuevoDominio}
          onChange={(e) => setNuevoDominio(e.target.value)}
          disabled={dominios.length >= MAX_DOMINIOS}
        />
        <Button 
          variant="primary" 
          onClick={handleAgregarDominio} 
          disabled={dominios.length >= MAX_DOMINIOS || !nuevoDominio.trim()}
          className="ms-2"
        >
          Agregar
        </Button>
      </Form.Group>
      
      {dominios.length >= MAX_DOMINIOS && (
        <Alert variant="warning">
          Has alcanzado el límite máximo de dominios permitidos.
        </Alert>
      )}
    </fieldset>
  );
};

export default DominiosSection;
