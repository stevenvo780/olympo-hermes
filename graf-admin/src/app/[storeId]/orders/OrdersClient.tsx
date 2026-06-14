'use client';
import React, { useState, useEffect, useCallback } from 'react';
import { Container, Row, Col, Alert, Button, Modal } from 'react-bootstrap';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import { useSelector } from 'react-redux';
import { FaPlus, FaDownload } from 'react-icons/fa';
import api from '@/utils/axios';
import { useDispatch } from 'react-redux';
import { addNotification } from '@/redux/ui';
import { Order, OrderStatus, OrderFilters } from '@/types/order';
import { RootState } from '@/redux/store';
import OrdersList from './OrdersList';
import OrderDetail from './OrderDetail';
import OrderFiltersComponent from './OrderFilters';
import CreateOrderModal from './CreateOrderModal';
import ExportModal from '@/components/Dashboard/ExportModal';

export default function OrdersClient() {
  const { storeId } = useParams() as { storeId: string };
  const searchParams = useSearchParams();
  const router = useRouter();
  const currentPage = Number(searchParams?.get("page")) || 1;
  const pageSize = Number(searchParams?.get("limit")) || 10;

  const dispatch = useDispatch();
  const config = useSelector((state: RootState) => state.config.config);

  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<OrderFilters>({ status: 'all' });
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [orderToDelete, setOrderToDelete] = useState<number | null>(null);

  const fetchOrders = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      params.append('page', currentPage.toString());
      params.append('limit', pageSize.toString());

      if (filters.status && filters.status !== 'all') {
        params.append('status', filters.status);
      }

      if (filters.search) {
        params.append('search', filters.search);
      }

      if (filters.startDate) {
        params.append('startDate', filters.startDate);
      }

      if (filters.endDate) {
        const endDate = new Date(filters.endDate);
        endDate.setHours(23, 59, 59);
        params.append('endDate', endDate.toISOString());
      }

      const response = await api.get(`/orders/store/${storeId}?${params.toString()}`);

      setOrders(response.data);
    } catch (err: unknown) {
      console.error('Error al cargar las órdenes:', err);
      const axiosErr = err as { response?: { status?: number; data?: { message?: string } } };
      if (axiosErr?.response?.status === 403) {
        setError('No tienes permisos para ver las órdenes de esta tienda.');
      } else if (axiosErr?.response?.data?.message) {
        setError(`No se pudieron cargar las órdenes: ${axiosErr.response.data.message}`);
      } else {
        setError('No se pudieron cargar las órdenes. Inténtalo de nuevo más tarde.');
      }
    } finally {
      setIsLoading(false);
    }
  }, [storeId, currentPage, pageSize, filters]);

  useEffect(() => {
    if (storeId) {
      fetchOrders();
    }
  }, [storeId, fetchOrders]);

  const updateOrderStatus = async (orderId: number, status: OrderStatus) => {
    try {
      await api.patch(`/orders/${orderId}`, { status });

      setOrders(prevOrders => prevOrders.map(order =>
        order.id === orderId ? { ...order, status } : order
      ));

      if (selectedOrder && selectedOrder.id === orderId) {
        setSelectedOrder({ ...selectedOrder, status });
      }

      dispatch(addNotification({
        message: `Estado de la orden #${orderId} actualizado a ${status}`,
        color: 'success'
      }));

      return true;
    } catch (error) {
      console.error('Error al actualizar el estado de la orden:', error);
      dispatch(addNotification({
        message: 'Error al actualizar el estado de la orden',
        color: 'danger'
      }));
      return false;
    }
  };

  const deleteOrder = (orderId: number) => {
    setOrderToDelete(orderId);
    setShowDeleteConfirm(true);
    return Promise.resolve(true);
  };

  const confirmDeleteOrder = async () => {
    if (!orderToDelete) return;

    try {
      await api.delete(`/orders/${orderToDelete}`);

      setOrders(prevOrders => prevOrders.filter(order => order.id !== orderToDelete));

      if (selectedOrder && selectedOrder.id === orderToDelete) {
        setSelectedOrder(null);
      }

      dispatch(addNotification({
        message: `Orden #${orderToDelete} eliminada exitosamente`,
        color: 'success'
      }));

      setShowDeleteConfirm(false);
      setOrderToDelete(null);
      return true;
    } catch (error) {
      console.error('Error al eliminar la orden:', error);
      dispatch(addNotification({
        message: 'Error al eliminar la orden',
        color: 'danger'
      }));
      setShowDeleteConfirm(false);
      setOrderToDelete(null);
      return false;
    }
  };

  const cancelDeleteOrder = () => {
    setShowDeleteConfirm(false);
    setOrderToDelete(null);
  };

  const handleFilterChange = (newFilters: OrderFilters) => {
    if (currentPage !== 1) {
      router.push(`?page=1&limit=${pageSize}`);
    } else {
      setFilters(newFilters);
    }
  };

  const refreshOrders = () => {
    fetchOrders();
  };

  const handleCreateOrder = () => {
    setShowCreateModal(true);
  };

  const handleOrderCreated = () => {
    dispatch(addNotification({
      message: 'Orden creada exitosamente',
      color: 'success'
    }));
    refreshOrders();
  };

  const handleCloseDetail = useCallback(() => {
    setSelectedOrder(null);
  }, []);

  return (
    <Container fluid>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1>Gestión de Órdenes</h1>
        <div className="d-flex gap-2">
          <Button
            variant="outline-primary"
            onClick={() => setShowExportModal(true)}
            className="d-flex align-items-center"
          >
            <FaDownload className="me-2" />
            Exportar Excel
          </Button>
          <Button
            variant="primary"
            onClick={handleCreateOrder}
            className="d-flex align-items-center"
          >
            <FaPlus className="me-2" />
            Crear Orden
          </Button>
        </div>
      </div>

      {error && (
        <Alert variant="danger" className="mb-4">
          {error}
        </Alert>
      )}

      <OrderFiltersComponent
        filters={filters}
        onFilterChange={handleFilterChange}
        onRefresh={refreshOrders}
      />

      <Row className="mt-4">
        <Col xs={12}>
          <OrdersList
            orders={orders}
            isLoading={isLoading}
            selectedOrderId={selectedOrder?.id}
            onSelectOrder={setSelectedOrder}
          />
        </Col>
      </Row>

      {selectedOrder && (
        <OrderDetail
          order={selectedOrder}
          onUpdateStatus={updateOrderStatus}
          onDeleteOrder={deleteOrder}
          onClose={handleCloseDetail}
          show={!!selectedOrder}
          onPatch={(id, patch) => {
            setOrders(prev => prev.map(o => o.id === id ? { ...o, ...patch } : o));
            setSelectedOrder(prev => prev && prev.id === id ? { ...prev, ...patch } : prev);
          }}
        />
      )}

      {showCreateModal && (
        <CreateOrderModal
          show={showCreateModal}
          onHide={() => setShowCreateModal(false)}
          onOrderCreated={handleOrderCreated}
          customQuestions={config?.customQuestions || []}
          deliveryEnabled={config?.activations?.deliveryEnabled || false}
        />
      )}

      {showExportModal && (
        <ExportModal
          show={showExportModal}
          onHide={() => setShowExportModal(false)}
          title="Exportar Órdenes a Excel"
          exportType="orders"
          storeId={storeId}
        />
      )}

      <Row className="mt-4">
        <Col className="d-flex justify-content-between">
          <Button
            variant="secondary"
            disabled={currentPage <= 1}
            onClick={() => router.push(`?page=${currentPage - 1}&limit=${pageSize}`)}
          >
            Anterior
          </Button>
          <Button
            variant="secondary"
            disabled={orders.length < pageSize}
            onClick={() => router.push(`?page=${currentPage + 1}&limit=${pageSize}`)}
          >
            Siguiente
          </Button>
        </Col>
      </Row>

      <Modal show={showDeleteConfirm} onHide={cancelDeleteOrder} centered>
        <Modal.Header closeButton>
          <Modal.Title>Confirmar eliminación</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          ¿Estás seguro de que deseas eliminar esta orden? Esta acción no se puede deshacer.
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={cancelDeleteOrder}>
            Cancelar
          </Button>
          <Button variant="danger" onClick={confirmDeleteOrder}>
            Eliminar
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
}
