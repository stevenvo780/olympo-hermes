import React from 'react';
import { Row, Col, Card } from 'react-bootstrap';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts';
import { TopCustomer, GeographicDistribution } from '@/types/dashboard';

interface CustomerMetricsProps {
  topCustomers: TopCustomer[];
  geographicDistribution: GeographicDistribution[];
}

const LOCATION_COLORS = [
  '#8884d8', '#82ca9d', '#ffc658', '#ff8042', '#0088FE', 
  '#00C49F', '#FFBB28', '#FF8042', '#a4de6c'
];

const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

const formatLocation = (location: string): string => {
  try {
    const locationObj = typeof location === 'string' ? JSON.parse(location) : location;
    if (locationObj && typeof locationObj === 'object') {
      const city = locationObj.city || '';
      const department = locationObj.department || '';
      
      if (city && department) {
        return `${city}, ${department}`;
      } else if (city) {
        return city;
      } else if (department) {
        return department;
      }
    }
    return location;
  } catch {
    return location;
  }
};

const CustomerMetrics: React.FC<CustomerMetricsProps> = ({
  topCustomers,
  geographicDistribution,
}) => {
  const formattedGeoDistribution = geographicDistribution.map(item => ({
    ...item,
    formattedLocation: formatLocation(item.location)
  }));
  
  return (
    <>
      <Row className="mb-4">
        <Col lg={7}>
          <Card className="h-100">
            <Card.Body>
              <h5 className="card-title">Clientes Más Valiosos</h5>
              <div style={{ height: 400 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={topCustomers}
                    margin={{
                      top: 5,
                      right: 30,
                      left: 20,
                      bottom: 5,
                    }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="name" 
                      angle={-45} 
                      textAnchor="end" 
                      height={70} 
                      interval={0}
                    />
                    <YAxis tickFormatter={(value) => formatCurrency(value)} />
                    <Tooltip 
                      formatter={(value, name) => {
                        if (name === 'Total Gastado') return formatCurrency(value as number);
                        return value;
                      }}
                    />
                    <Legend />
                    <Bar 
                      dataKey="totalSpent" 
                      name="Total Gastado" 
                      fill="#8884d8" 
                    />
                    <Bar 
                      dataKey="orderCount" 
                      name="Número de Pedidos" 
                      fill="#82ca9d" 
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card.Body>
          </Card>
        </Col>
        
        <Col lg={5}>
          <Card className="h-100">
            <Card.Body>
              <h5 className="card-title">Distribución Geográfica</h5>
              <div style={{ height: 400 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={formattedGeoDistribution}
                      cx="50%"
                      cy="50%"
                      labelLine={true}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="salesAmount"
                      nameKey="formattedLocation"
                      label={({formattedLocation, percent}) => `${formattedLocation}: ${(percent * 100).toFixed(0)}%`}
                    >
                      {formattedGeoDistribution.map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={LOCATION_COLORS[index % LOCATION_COLORS.length]} 
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value, name) => {
                        if (name === 'salesAmount') {
                          return [formatCurrency(value as number), 'Ventas'];
                        }
                        return [value, name];
                      }}
                      labelFormatter={(_, entry) => {
                        const { payload } = entry[0];
                        return `Ubicación: ${payload.formattedLocation}`;
                      }}
                    />
                    <Legend />
                  </PieChart>
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
              <h5 className="card-title">Detalle de Distribución Geográfica</h5>
              <div className="table-responsive">
                <table className="table table-hover">
                  <thead>
                    <tr>
                      <th>Ubicación</th>
                      <th>Pedidos</th>
                      <th>Ventas</th>
                      <th>% del Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {formattedGeoDistribution.map((location) => {
                      const totalSales = formattedGeoDistribution.reduce(
                        (sum, item) => sum + item.salesAmount, 0
                      );
                      const percentage = totalSales > 0 
                        ? (location.salesAmount / totalSales) * 100 
                        : 0;
                      
                      return (
                        <tr key={location.formattedLocation}>
                          <td>{location.formattedLocation}</td>
                          <td>{location.orderCount}</td>
                          <td>{formatCurrency(location.salesAmount)}</td>
                          <td>{percentage.toFixed(1)}%</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Row>
        <Col>
          <Card>
            <Card.Body>
              <h5 className="card-title">Detalles de Clientes Top</h5>
              <div className="table-responsive">
                <table className="table table-hover">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Cliente</th>
                      <th>Número de Pedidos</th>
                      <th>Total Gastado</th>
                      <th>Ticket Medio</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topCustomers.map((customer, index) => (
                      <tr key={customer.userId}>
                        <td>{index + 1}</td>
                        <td>{customer.name}</td>
                        <td>{customer.orderCount}</td>
                        <td>{formatCurrency(customer.totalSpent)}</td>
                        <td>
                          {formatCurrency(
                            customer.orderCount > 0 
                              ? customer.totalSpent / customer.orderCount 
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

export default CustomerMetrics;
