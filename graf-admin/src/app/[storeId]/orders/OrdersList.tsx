import React from 'react';
import { Card, Table, Spinner, Badge } from 'react-bootstrap';
import { Order, DiscountType } from '@/types/order';
import StatusBadge from './StatusBadge';
import { formatDistanceToNow, format } from 'date-fns';
import { es } from 'date-fns/locale';
import { formatNumberWithCommas, parseEsNumber } from '@/utils/formatters';

interface OrdersListProps {
  orders: Order[];
  isLoading: boolean;
  selectedOrderId?: number;
  onSelectOrder: (order: Order) => void;
}

export default function OrdersList({
  orders,
  isLoading,
  selectedOrderId,
  onSelectOrder
}: OrdersListProps) {

  const formatRelativeDate = (date: string) => {
    return formatDistanceToNow(new Date(date), {
      addSuffix: true,
      locale: es
    });
  };

  const formatFullDate = (date: string) => {
    return format(new Date(date), "dd/MM/yyyy HH:mm", { locale: es });
  };

  const formatTotal = (amount: string | number): string => {
    const numericAmount = typeof amount === 'string' ? parseEsNumber(amount) : amount;
    return !isNaN(numericAmount as number) ? formatNumberWithCommas(numericAmount as number, 0) : '0';
  };

  const getTotalItems = (order: Order): number => {
    if (!order.items || !Array.isArray(order.items)) {
      return 0;
    }
    return order.items.reduce((total, item) => total + item.quantity, 0);
  };

  if (isLoading) {
    return (
      <Card className="shadow-sm" style={{ backgroundColor: 'var(--card-color)', color: 'var(--card-text)' }}>
        <Card.Body className="text-center py-5">
          <Spinner animation="border" />
          <p className="mt-3">Cargando órdenes...</p>
        </Card.Body>
      </Card>
    );
  }

  if (orders.length === 0) {
    return (
      <Card className="shadow-sm" style={{ backgroundColor: 'var(--card-color)', color: 'var(--card-text)' }}>
        <Card.Body className="text-center py-5">
          <p className="mb-0">No se encontraron órdenes con los filtros aplicados</p>
        </Card.Body>
      </Card>
    );
  }

  return (
    <Card className="shadow-sm" style={{ backgroundColor: 'var(--card-color)', color: 'var(--card-text)' }}>
      <Card.Header style={{ backgroundColor: 'var(--bg-color)', color: 'var(--card-title-color)' }}>
        <div className="d-flex justify-content-between align-items-center">
          <span>Órdenes ({orders.length})</span>
        </div>
      </Card.Header>
      <div className="table-responsive">
        <Table hover className="mb-0" style={{ color: 'var(--card-text)' }}>
          <thead style={{ backgroundColor: 'var(--bg-color)' }}>
            <tr>
              <th>ID</th>
              <th>Cliente</th>
              <th>Fecha</th>
              <th>Total</th>
              <th>Estado</th>
              <th>Items</th>
              <th>Extra</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <tr
                key={order.id}
                onClick={() => onSelectOrder(order)}
                style={{
                  cursor: 'pointer',
                  backgroundColor: selectedOrderId === order.id ? 'var(--primary-color)' : 'inherit',
                  color: selectedOrderId === order.id ? 'var(--primary-text)' : 'inherit'
                }}
                className={selectedOrderId === order.id ? 'border-primary' : ''}
              >
                <td>#{order.id}</td>
                <td>
                  {(() => {
                    const customerEmail = order.customer?.email;
                    const isSyntheticGuest = Boolean(
                      customerEmail && /^guest-.+@guest\.local$/i.test(customerEmail),
                    );
                    const displayName =
                      order.customer?.name || order.user?.name || 'Cliente';
                    const displayEmail = isSyntheticGuest
                      ? null
                      : customerEmail || order.user?.email || null;
                    const phone = order.customer?.phone || order.buyerPhone;
                    return (
                      <>
                        <div className="d-flex align-items-center gap-2">
                          <span>{displayName}</span>
                          {isSyntheticGuest && (
                            <Badge bg="warning" text="dark" title="Compra realizada sin datos de contacto">
                              Invitado
                            </Badge>
                          )}
                        </div>
                        <small style={{ color: 'var(--font-color)' }}>
                          {displayEmail || phone || 'Sin datos de contacto'}
                        </small>
                      </>
                    );
                  })()}
                </td>
                <td>
                  <div title={formatFullDate(order.createdAt)}>
                    {formatRelativeDate(order.createdAt)}
                  </div>
                  <small style={{ color: 'var(--font-color)' }}>
                    {format(new Date(order.createdAt), 'dd/MM/yyyy', { locale: es })}
                  </small>
                </td>
                <td>
                  <strong>${formatTotal(order.amount.total)}</strong>
                  {order.discountType && order.discountValue && (
                    <div>
                      <small className="text-success">
                        Desc: {order.discountType === DiscountType.PERCENTAGE ? `${order.discountValue}%` : `$${formatTotal(order.discountValue)}`}
                      </small>
                    </div>
                  )}
                </td>
                <td>
                  <StatusBadge status={order.status} />
                </td>
                <td>
                  <Badge style={{
                    backgroundColor: 'var(--secondary-color)',
                    color: 'var(--secondary-text)'
                  }}>
                    <span style={{ color: 'var(--white-color) !important' }}>{getTotalItems(order)} items</span>
                  </Badge>
                </td>
                <td>
                  <div className="d-flex gap-1">
                    {order.documents && order.documents.length > 0 && (
                      <Badge bg="info" title={`${order.documents.length} documento(s)`}>
                        📎 {order.documents.length}
                      </Badge>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      </div>
    </Card>
  );
}
