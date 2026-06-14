import React from 'react';
import { Card } from 'react-bootstrap';
import { FaBoxOpen } from 'react-icons/fa';
import './styles.scss';

const NoProductsMessage: React.FC = () => {
  return (
    <Card className="text-center p-5 my-5 card-no--products">
      <Card.Body>
        <div className="mb-4">
          <FaBoxOpen size={60} className="text-muted" />
        </div>
        <Card.Title className="mb-3">No hay productos disponibles</Card.Title>
        <Card.Text className="text-muted">
          En este momento no hay productos disponibles con los filtros seleccionados.
          <br />
          Intente modificar los filtros o vuelva más tarde.
        </Card.Text>
      </Card.Body>
    </Card>
  );
};

export default NoProductsMessage;
