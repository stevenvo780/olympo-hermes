import React from 'react';
import { Row, Col, Card, ProgressBar } from 'react-bootstrap';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, Legend, ResponsiveContainer 
} from 'recharts';
import { TopProduct, LowStockProduct } from '@/types/dashboard';

interface ProductMetricsProps {
  topProducts: TopProduct[];
  lowStockProducts: LowStockProduct[];
}

const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

const ProductMetrics: React.FC<ProductMetricsProps> = ({
  topProducts,
  lowStockProducts,
}) => {
  const chartData = topProducts.map(product => ({
    ...product,
    name: product.title.length > 20 ? product.title.substring(0, 20) + '...' : product.title,
  }));

  return (
    <>
      <Row className="mb-4">
        <Col lg={8}>
          <Card className="h-100">
            <Card.Body>
              <h5 className="card-title">Productos Más Vendidos</h5>
              <div style={{ height: 400 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={chartData}
                    layout="vertical"
                    margin={{
                      top: 5,
                      right: 30,
                      left: 100,
                      bottom: 5,
                    }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis 
                      type="category" 
                      dataKey="name" 
                      tickMargin={5}
                    />
                    <Tooltip 
                      formatter={(value, name) => {
                        if (name === 'Ingresos') return formatCurrency(value as number);
                        return value;
                      }}
                    />
                    <Legend />
                    <Bar 
                      dataKey="salesCount" 
                      name="Unidades Vendidas" 
                      fill="#0d6efd" 
                    />
                    <Bar 
                      dataKey="revenue" 
                      name="Ingresos" 
                      fill="#20c997" 
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card.Body>
          </Card>
        </Col>
        
        <Col lg={4}>
          <Card className="h-100">
            <Card.Body>
              <h5 className="card-title">Productos con Bajo Stock</h5>
              <div className="table-responsive" style={{ maxHeight: 400, overflowY: 'auto' }}>
                {lowStockProducts.length === 0 ? (
                  <div className="text-center py-3 text-muted">
                    <i className="bi bi-check-circle fs-2"></i>
                    <p>No hay productos con bajo stock</p>
                  </div>
                ) : (
                  lowStockProducts.map((product) => (
                    <div key={product.productId} className="mb-3">
                      <div className="d-flex justify-content-between align-items-center">
                        <strong>{product.title}</strong>
                        <span 
                          className={`badge ${
                            product.estimatedDaysRemaining < 7 
                              ? 'bg-danger' 
                              : product.estimatedDaysRemaining < 14 
                              ? 'bg-warning' 
                              : 'bg-info'
                          }`}
                        >
                          {product.estimatedDaysRemaining === 9999 
                            ? 'Sin ventas' 
                            : `${product.estimatedDaysRemaining} días`}
                        </span>
                      </div>
                      <div className="d-flex justify-content-between mt-1">
                        <small>Stock actual: {product.currentStock}</small>
                      </div>
                      <ProgressBar 
                        variant={
                          product.estimatedDaysRemaining < 7 
                            ? 'danger' 
                            : product.estimatedDaysRemaining < 14 
                            ? 'warning' 
                            : 'info'
                        }
                        now={Math.min(100, (product.currentStock / 20) * 100)} 
                        className="mt-2"
                      />
                    </div>
                  ))
                )}
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Row>
        <Col>
          <Card>
            <Card.Body>
              <h5 className="card-title">Detalles de Productos Top</h5>
              <div className="table-responsive">
                <table className="table table-hover">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Producto</th>
                      <th>Unidades Vendidas</th>
                      <th>Ingresos</th>
                      <th>Ingresos por Unidad</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topProducts.map((product, index) => (
                      <tr key={product.productId}>
                        <td>{index + 1}</td>
                        <td>{product.title}</td>
                        <td>{product.salesCount}</td>
                        <td>{formatCurrency(product.revenue)}</td>
                        <td>
                          {formatCurrency(
                            product.salesCount > 0 
                              ? product.revenue / product.salesCount 
                              : 0
                          )}
                        </td>
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

export default ProductMetrics;