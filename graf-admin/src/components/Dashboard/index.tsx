'use client';
import React, { useState, useEffect, useCallback } from 'react';
import axios from '@/utils/axios';
import { Container, Row, Col, Card, Nav, Spinner } from 'react-bootstrap';
import { useSelector } from 'react-redux';
import { RootState } from '@/redux/store';
import SalesMetrics from './components/SalesMetrics';
import SalesTrends from './components/SalesTrends';
import ProductMetrics from './components/ProductMetrics';
import CustomerMetrics from './components/CustomerMetrics';
import PeriodSelector from './components/PeriodSelector';
import { DashboardStatistics } from '@/types/dashboard';
import { useParams } from 'next/navigation';
import { useExponentialBackoff } from '@/hooks/useExponentialBackoff';

export default function Dashboard() {
  const { storeId } = useParams() as { storeId: string | null };
  const [statistics, setStatistics] = useState<DashboardStatistics | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [period, setPeriod] = useState<'day' | 'week' | 'month' | 'custom'>('month');
  const [startDate, setStartDate] = useState<string | null>(null);
  const [endDate, setEndDate] = useState<string | null>(null);
  const user = useSelector((state: RootState) => state.auth.userData);
  const [activeTab, setActiveTab] = useState('sales');
  const [periodDescription, setPeriodDescription] = useState<string>('');
  const MAX_RETRIES = 3;
  const { retryCount, countdown, isRetrying, scheduleRetry, reset } = useExponentialBackoff(MAX_RETRIES, 1000);

  const setDefaultDateRange = () => {
    const end = new Date();
    const start = new Date();
    
    start.setDate(start.getDate() - 30);

    const formattedStart = start.toISOString().split('T')[0];
    const formattedEnd = end.toISOString().split('T')[0];

    setStartDate(formattedStart);
    setEndDate(formattedEnd);

    return { formattedStart, formattedEnd };
  };

  const getDateRangeForPeriod = useCallback((selectedPeriod: 'day' | 'week' | 'month' | 'custom') => {
    const now = new Date();
    let start = new Date();
    let end = now;
    
    switch (selectedPeriod) {
      case 'day':
        start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        setPeriodDescription('Datos del día de hoy');
        break;
      case 'week':
        start = new Date();
        start.setDate(start.getDate() - 7);
        setPeriodDescription('Datos de los últimos 7 días');
        break;
      case 'month':
        start = new Date(now.getFullYear(), now.getMonth(), 1);
        setPeriodDescription('Datos del mes actual');
        break;
      case 'custom':
        if (!startDate || !endDate) {
          const dateRange = setDefaultDateRange();
          start = new Date(dateRange.formattedStart);
          end = new Date(dateRange.formattedEnd);
        } else {
          start = new Date(startDate);
          end = new Date(endDate);
        }
        setPeriodDescription(`Período personalizado: ${start.toLocaleDateString()} - ${end.toLocaleDateString()}`);
        break;
    }
    
    return {
      start: start.toISOString().split('T')[0],
      end: end.toISOString().split('T')[0]
    };
  }, [startDate, endDate]);

  const handlePeriodChange = (newPeriod: 'day' | 'week' | 'month' | 'custom') => {
    setPeriod(newPeriod);

    if (newPeriod !== 'custom') {
      const { start, end } = getDateRangeForPeriod(newPeriod);
      setStartDate(start);
      setEndDate(end);
    } else if (newPeriod === 'custom' && (!startDate || !endDate)) {
      setDefaultDateRange();
    }
  };

  const fetchStatistics = useCallback(async () => {
    setLoading(true);
    try {
      let url = `/statistics/dashboard?period=${period}`;

      if (period === 'custom') {
        const { start, end } = getDateRangeForPeriod('custom');
        url += `&startDate=${start}&endDate=${end}`;
      }

      if (storeId) {
        url = url + `&storeId=${storeId}`;
      }

      const { data } = await axios.get<DashboardStatistics>(url);
      setStatistics(data);
      setError(null);
      reset();
    } catch (err) {
      console.error('Error fetching dashboard statistics', err);
      setError('Error al cargar las estadísticas del dashboard');
    } finally {
      setLoading(false);
    }
  }, [period, getDateRangeForPeriod, storeId]);

  useEffect(() => {
    if (!user) return;
    fetchStatistics();
  }, [user, period, startDate, endDate, fetchStatistics]);

  const handleDateRangeChange = (start: string | null, end: string | null) => {
    setStartDate(start);
    setEndDate(end);
    
    if (start && end) {
      const startDate = new Date(start);
      const endDate = new Date(end);
      setPeriodDescription(`Período personalizado: ${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}`);
    }
  };

  if (!user) {
    return (
      <Container className="mt-5">
        <Card>
          <Card.Body className="text-center">
            <h3>Acceso no autorizado</h3>
            <p>Debe iniciar sesión para ver el dashboard</p>
          </Card.Body>
        </Card>
      </Container>
    );
  }

  return (
    <Container fluid className="py-4">
      <Row className="mb-4">
        <Col>
          <h1 className="mb-2">Dashboard</h1>
          <p className="text-muted">
            Vista general de las métricas de su negocio
          </p>
        </Col>
        <Col xs="auto">
          <PeriodSelector
            period={period}
            onChangePeriod={handlePeriodChange}
            startDate={startDate}
            endDate={endDate}
            onChangeDateRange={handleDateRangeChange}
          />
          <div className="text-end mt-2 text-muted small">
            <i className="bi bi-calendar me-1"></i>
            {periodDescription}
          </div>
        </Col>
      </Row>

      {loading ? (
        <div className="d-flex justify-content-center my-5">
          <Spinner animation="border" role="status">
            <span className="visually-hidden">Cargando...</span>
          </Spinner>
        </div>
      ) : error ? (
        <Card className="border-danger">
          <Card.Body className="text-danger">
            <Card.Title>Error</Card.Title>
            <Card.Text>{error}</Card.Text>
            <div className="mt-3">
              {isRetrying ? (
                <p className="small mb-0 text-muted">Reintentando automáticamente en {countdown} segundos...</p>
              ) : retryCount < MAX_RETRIES ? (
                <button
                  className="btn btn-outline-danger btn-sm"
                  onClick={() => {
                    scheduleRetry(fetchStatistics);
                  }}
                  disabled={isRetrying}
                >
                  Reintentar ({retryCount}/{MAX_RETRIES})
                </button>
              ) : (
                <p className="text-muted small mb-0">Se reintentó {MAX_RETRIES} veces. Por favor intenta más tarde.</p>
              )}
            </div>
          </Card.Body>
        </Card>
      ) : statistics ? (
        <>
          <Row className="mb-4">
            <Col>
              <Nav
                variant="tabs"
                activeKey={activeTab}
                onSelect={(k) => k && setActiveTab(k)}
                className="mb-3"
              >
                <Nav.Item>
                  <Nav.Link eventKey="sales">Ventas</Nav.Link>
                </Nav.Item>
                <Nav.Item>
                  <Nav.Link eventKey="products">Productos</Nav.Link>
                </Nav.Item>
                <Nav.Item>
                  <Nav.Link eventKey="customers">Clientes</Nav.Link>
                </Nav.Item>
              </Nav>
            </Col>
          </Row>

          {activeTab === 'sales' && (
            <>
              <SalesMetrics statistics={statistics} />
              <SalesTrends
                salesByPeriod={statistics.salesByPeriod}
                period={period}
              />
            </>
          )}

          {activeTab === 'products' && (
            <ProductMetrics
              topProducts={statistics.topProducts}
              lowStockProducts={statistics.lowStockProducts}
            />
          )}

          {activeTab === 'customers' && (
            <CustomerMetrics
              topCustomers={statistics.topCustomers}
              geographicDistribution={statistics.geographicDistribution}
            />
          )}
        </>
      ) : (
        <Card>
          <Card.Body className="text-center">
            <Card.Text>No hay datos disponibles</Card.Text>
          </Card.Body>
        </Card>
      )}
    </Container>
  );
}
