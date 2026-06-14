'use client';
import React, { useEffect, useState } from 'react';
import { Table, Button, Container, Spinner } from 'react-bootstrap';
import { useDispatch, useSelector } from 'react-redux';
import api from '@/utils/axios';
import { fetchOrdersStart, fetchOrdersSuccess, fetchOrdersFailure } from '@/redux/orders';
import { RootState, AppDispatch } from '@/redux/store';

interface OrdersListProps {
  storeId?: string;
}

const OrdersList: React.FC<OrdersListProps> = ({ storeId }) => {
  const [page, setPage] = useState(1);
  const limit = 10;
  const dispatch = useDispatch<AppDispatch>();
  const { orders, totalOrders, loading } = useSelector((state: RootState) => state.orders);

  useEffect(() => {
    const loadOrders = async () => {
      dispatch(fetchOrdersStart());
      try {
        const offset = (page - 1) * limit;
        const params = { limit, offset };
        const response = await api.get('/orders/my', { params });
        dispatch(fetchOrdersSuccess({ orders: response.data, total: response.data.length }));
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
        dispatch(fetchOrdersFailure(errorMessage));
      }
    };
    loadOrders();
  }, [dispatch, page, storeId]);

  const totalPages = Math.ceil(totalOrders / limit);

  return (
    <Container className="mt-5">
      <h2>Mis Órdenes</h2>
      <div className="table-responsive">
        <Table hover>
          <thead>
            <tr>
              <th>ID</th>
              <th>Tienda</th>
              <th>Estado</th>
              <th>Total</th>
              <th>Fecha</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5} className="text-center">
                  <Spinner animation="border" />
                </td>
              </tr>
            ) : orders.length > 0 ? (
              orders.map((order) => (
                <tr key={order.id}>
                  <td>{order.id}</td>
                  <td>{order.store?.name || 'Sin tienda'}</td>
                  <td>{order.status}</td>
                  <td>{order.amount.total}</td>
                  <td>{new Date(order.createdAt || new Date()).toLocaleDateString()}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} className="text-center">No se encontraron órdenes</td>
              </tr>
            )}
          </tbody>
        </Table>
      </div>
      <div className="d-flex justify-content-between align-items-center">
        <span>Total: {totalOrders} órdenes</span>
        <div>
          <Button variant="outline-primary" className="me-2" disabled={page === 1} onClick={() => setPage(page - 1)}>
            Anterior
          </Button>
          <span className="mx-2">Página {page} de {totalPages}</span>
          <Button variant="outline-primary" disabled={page === totalPages} onClick={() => setPage(page + 1)}>
            Siguiente
          </Button>
        </div>
      </div>
    </Container>
  );
};

export default OrdersList;