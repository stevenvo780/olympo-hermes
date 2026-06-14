import React from 'react';
import { Row, Col, Card } from 'react-bootstrap';
import { 
  PieChart, Pie, Cell, ResponsiveContainer, 
  Tooltip, Legend 
} from 'recharts';
import { DashboardStatistics, OrderStatus } from '@/types/dashboard';

interface SalesMetricsProps {
  statistics: DashboardStatistics;
}

const COLORS = {
  [OrderStatus.PENDING]: '#ffc107',
  [OrderStatus.PAID]: '#17a2b8',
  [OrderStatus.SHIPPED]: '#007bff',
  [OrderStatus.DELIVERED]: '#28a745',
  [OrderStatus.CANCELED]: '#dc3545',
};

const STATUS_LABELS: Record<string, string> = {
  [OrderStatus.PENDING]: 'Pendiente',
  [OrderStatus.PAID]: 'Pagada',
  [OrderStatus.SHIPPED]: 'Enviado',
  [OrderStatus.DELIVERED]: 'Entregado',
  [OrderStatus.CANCELED]: 'Cancelado',
};

const getStatusLabel = (status: string): string => {
  return STATUS_LABELS[status] || status;
};

const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

const SalesMetrics: React.FC<SalesMetricsProps> = ({ statistics }) => {
  const {
    totalSales,
    totalOrders,
    averageTicket,
    ordersByStatus,
    growthRate,
    cancellationRate,
  } = statistics;
  
  const orderStatusData = ordersByStatus.filter(status => status.count > 0);

  return (
    <>
      <Row className="mb-4">
        <Col lg={3} md={6} className="mb-4">
          <Card className="h-100">
            <Card.Body>
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h6 className="text-muted">Total Ventas</h6>
                  <h3>{formatCurrency(totalSales)}</h3>
                </div>
                <div className="bg-light-primary rounded-circle p-3">
                  <i className="bi bi-cash-coin fs-4 text-primary"></i>
                </div>
              </div>
              <div className={`mt-3 ${growthRate >= 0 ? 'text-success' : 'text-danger'}`}>
                <i className={`bi ${growthRate >= 0 ? 'bi-arrow-up' : 'bi-arrow-down'}`}></i>
                {` ${Math.abs(growthRate)}% `}
                <span className="text-muted">vs período anterior</span>
              </div>
            </Card.Body>
          </Card>
        </Col>
        
        <Col lg={3} md={6} className="mb-4">
          <Card className="h-100">
            <Card.Body>
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h6 className="text-muted">Ordenes</h6>
                  <h3>{totalOrders}</h3>
                </div>
                <div className="bg-light-info rounded-circle p-3">
                  <i className="bi bi-bag fs-4 text-info"></i>
                </div>
              </div>
              <div className="mt-3 text-muted">
                <span>Ticket medio: {formatCurrency(averageTicket)}</span>
              </div>
            </Card.Body>
          </Card>
        </Col>
        
        <Col lg={3} md={6} className="mb-4">
          <Card className="h-100">
            <Card.Body>
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h6 className="text-muted">Tasa Cancelación</h6>
                  <h3>{cancellationRate}%</h3>
                </div>
                <div className="bg-light-warning rounded-circle p-3">
                  <i className="bi bi-x-circle fs-4 text-warning"></i>
                </div>
              </div>
              <div className="mt-3 text-muted">
                <span>De {totalOrders} pedidos totales</span>
              </div>
            </Card.Body>
          </Card>
        </Col>
        
        <Col lg={3} md={6} className="mb-4">
          <Card className="h-100">
            <Card.Body>
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h6 className="text-muted">Pedidos Completados</h6>
                  <h3>
                    {ordersByStatus.find(status => status.status === OrderStatus.DELIVERED)?.percentage || 0}%
                  </h3>
                </div>
                <div className="bg-light-success rounded-circle p-3">
                  <i className="bi bi-check-circle fs-4 text-success"></i>
                </div>
              </div>
              <div className="mt-3 text-muted">
                <span>Tasa de conversión</span>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Row className="mb-4">
        <Col lg={6}>
          <Card className="h-100">
            <Card.Body>
              <h5 className="card-title">Estado de Pedidos</h5>
              <div style={{ height: 300 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={orderStatusData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="count"
                      nameKey="status"
                      label={({ status, percentage }) => `${getStatusLabel(status)}: ${percentage}%`}
                    >
                      {orderStatusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[entry.status]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value, name) => [
                        `${value} pedidos (${ordersByStatus.find(s => s.status === name)?.percentage || 0}%)`,
                        `Estado: ${getStatusLabel(name as string)}`
                      ]} 
                    />
                    <Legend formatter={(value) => getStatusLabel(value)} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </Card.Body>
          </Card>
        </Col>
        
        <Col lg={6}>
          <Card className="h-100">
            <Card.Body>
              <h5 className="card-title">Detalles por Estado</h5>
              <div className="table-responsive">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Estado</th>
                      <th>Pedidos</th>
                      <th>Porcentaje</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ordersByStatus.map((status) => (
                      <tr key={status.status}>
                        <td>
                          <span
                            className="badge"
                            style={{ backgroundColor: COLORS[status.status] }}
                          >
                            {getStatusLabel(status.status)}
                          </span>
                        </td>
                        <td>{status.count}</td>
                        <td>{status.percentage}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </>
  );
};

export default SalesMetrics;
