import React from 'react';
import { Row, Col, Card } from 'react-bootstrap';
import {
  XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ResponsiveContainer, ComposedChart, Line
} from 'recharts';
import { TimePeriodSales } from '@/types/dashboard';

interface SalesTrendsProps {
  salesByPeriod: TimePeriodSales[];
  period: 'day' | 'week' | 'month' | 'custom';
}

const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

const formatPeriodLabel = (periodString: string, period: 'day' | 'week' | 'month' | 'custom'): string => {

  if (periodString.includes('-W')) {
    const [year, weekPart] = periodString.split('-W');
    return `Sem ${weekPart}/${year}`;
  }

  if (periodString.match(/^\d{4}-\d{2}$/)) {
    const date = new Date(periodString + '-01');
    return date.toLocaleDateString('es-ES', { month: 'short', year: 'numeric' });
  }

  const date = new Date(periodString);
  if (period === 'day') {
    return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'numeric' });
  }
  
  return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'numeric' });
};

const SalesTrends: React.FC<SalesTrendsProps> = ({ salesByPeriod, period }) => {
  const chartData = salesByPeriod.map(item => ({
    ...item,
    formattedPeriod: formatPeriodLabel(item.period, period),
    formattedSales: formatCurrency(item.totalSales)
  }));

  return (
    <>
      <Row className="mb-4">
        <Col>
          <Card>
            <Card.Body>
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h5 className="card-title mb-0">Tendencias de Ventas</h5>
                <div className="text-muted small">
                  {period === 'day' && 'Mostrando datos del día de hoy'}
                  {period === 'week' && 'Mostrando datos de los últimos 7 días'}
                  {period === 'month' && 'Mostrando datos del mes actual'}
                  {period === 'custom' && 'Mostrando datos del período personalizado'}
                </div>
              </div>
              <div style={{ height: 400 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="formattedPeriod" 
                      angle={0} 
                      textAnchor="middle" 
                      height={40} 
                      tickMargin={10} 
                    />
                    <YAxis 
                      yAxisId="left"
                      orientation="left"
                      stroke="#8884d8"
                      tickFormatter={(value) => formatCurrency(value)}
                    />
                    <YAxis 
                      yAxisId="right"
                      orientation="right"
                      stroke="#82ca9d"
                    />
                    <Tooltip 
                      formatter={(value, name) => {
                        if (name === 'Ventas') return formatCurrency(value as number);
                        return value;
                      }}
                      labelFormatter={(label) => `Fecha: ${label}`}
                    />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="totalSales"
                      name="Ventas"
                      stroke="#8884d8"
                      yAxisId="left"
                      strokeWidth={2}
                      dot={{ r: 3 }}
                      activeDot={{ r: 5 }}
                    />
                    <Line 
                      type="monotone"
                      dataKey="orderCount" 
                      name="Pedidos" 
                      stroke="#82ca9d" 
                      yAxisId="right" 
                      strokeWidth={2}
                      dot={{ r: 3 }}
                      activeDot={{ r: 5 }}
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Row className="mb-4">
        <Col>
          <Card>
            <Card.Body>
              <h5 className="card-title">Detalle de Ventas por Período</h5>
              <div className="table-responsive">
                <table className="table table-hover">
                  <thead>
                    <tr>
                      <th>Fecha</th>
                      <th>Ventas</th>
                      <th>Pedidos</th>
                      <th>Ticket Medio</th>
                    </tr>
                  </thead>
                  <tbody>
                    {chartData.map((item) => (
                      <tr key={item.period}>
                        <td>{item.formattedPeriod}</td>
                        <td>{formatCurrency(item.totalSales)}</td>
                        <td>{item.orderCount}</td>
                        <td>
                          {formatCurrency(
                            item.orderCount > 0 
                              ? item.totalSales / item.orderCount 
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

export default SalesTrends;
