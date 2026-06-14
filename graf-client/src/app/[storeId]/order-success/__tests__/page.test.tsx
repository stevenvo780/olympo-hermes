/* @vitest-environment jsdom */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import React, { act } from 'react';
import { createRoot, Root } from 'react-dom/client';
import OrderSuccessPage from '../page';
import { useDispatch } from 'react-redux';
import { useSearchParams, useParams, useRouter } from 'next/navigation';
import { addNotification } from '@/redux/ui';

// Mocks
vi.mock('react-redux', () => ({
  useDispatch: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  useRouter: vi.fn(),
  useParams: vi.fn(),
  useSearchParams: vi.fn(),
}));

vi.mock('@/redux/ui', () => ({
  addNotification: vi.fn(),
}));

// Mock react-bootstrap
vi.mock('react-bootstrap', () => {
  const MockComponent = ({ children, ...props }: { children?: React.ReactNode;[key: string]: unknown }) => <div {...props}>{children}</div>;
  MockComponent.displayName = 'MockComponent';

  const MockCard = ({ children, ...props }: { children?: React.ReactNode;[key: string]: unknown }) => <div {...props}>{children}</div>;
  MockCard.displayName = 'MockCard';
  const MockCardBody = ({ children, ...props }: { children?: React.ReactNode;[key: string]: unknown }) => <div {...props}>{children}</div>;
  MockCardBody.displayName = 'MockCardBody';

  return {
    Container: MockComponent,
    Card: Object.assign(MockCard, { Body: MockCardBody }),
    Button: MockComponent,
    Spinner: MockComponent,
    Badge: MockComponent,
  };
});

// Mock Icons
vi.mock('react-icons/fa', () => {
  const MockFaCheckCircle = () => <div data-testid="icon-success" />;
  MockFaCheckCircle.displayName = 'MockFaCheckCircle';

  const MockFaHome = () => <div data-testid="icon-home" />;
  MockFaHome.displayName = 'MockFaHome';

  const MockFaClock = () => <div data-testid="icon-clock" />;
  MockFaClock.displayName = 'MockFaClock';

  const MockFaExclamationTriangle = () => <div data-testid="icon-error" />;
  MockFaExclamationTriangle.displayName = 'MockFaExclamationTriangle';

  return {
    FaCheckCircle: MockFaCheckCircle,
    FaHome: MockFaHome,
    FaClock: MockFaClock,
    FaExclamationTriangle: MockFaExclamationTriangle,
  };
});

describe('OrderSuccessPage', () => {
  let container: HTMLDivElement;
  let root: Root;
  const mockDispatch = vi.fn();
  const mockRouter = { push: vi.fn() };
  const mockSearchParams = new URLSearchParams();

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);

    vi.clearAllMocks();
    (useDispatch as unknown as ReturnType<typeof vi.fn>).mockReturnValue(mockDispatch);
    (useRouter as ReturnType<typeof vi.fn>).mockReturnValue(mockRouter);
    (useParams as ReturnType<typeof vi.fn>).mockReturnValue({ storeId: '123' });
    (useSearchParams as ReturnType<typeof vi.fn>).mockReturnValue(mockSearchParams);
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
    mockSearchParams.delete('status'); // Clean up params
    mockSearchParams.delete('orderId');
  });

  it('renders success status by default', async () => {
    // No status param -> default success
    await act(async () => {
      root.render(<OrderSuccessPage />);
    });

    // In this test environment, effect runs immediately or very fast
    await act(async () => { await new Promise(r => setTimeout(r, 0)); });

    expect(container.textContent).toContain('¡Pago Exitoso!');
  });

  it('renders approved parameter status', async () => {
    (useSearchParams as ReturnType<typeof vi.fn>).mockReturnValue(new URLSearchParams('status=approved&orderId=999'));

    await act(async () => {
      root.render(<OrderSuccessPage />);
    });
    await act(async () => { await new Promise(r => setTimeout(r, 0)); });

    expect(container.textContent).toContain('¡Pago Exitoso!');
    expect(container.textContent).toContain('# 999');
    expect(addNotification).toHaveBeenCalledWith(expect.objectContaining({ message: 'Pago procesado exitosamente', color: 'success' }));
  });

  it('renders failure status', async () => {
    (useSearchParams as ReturnType<typeof vi.fn>).mockReturnValue(new URLSearchParams('status=failed'));

    await act(async () => {
      root.render(<OrderSuccessPage />);
    });
    await act(async () => { await new Promise(r => setTimeout(r, 0)); });

    expect(container.textContent).toContain('Error en el Pago');
    expect(addNotification).toHaveBeenCalledWith(expect.objectContaining({ message: 'Error en el procesamiento del pago', color: 'danger' }));
  });

  it('renders pending status', async () => {
    (useSearchParams as ReturnType<typeof vi.fn>).mockReturnValue(new URLSearchParams('status=pending'));

    await act(async () => {
      root.render(<OrderSuccessPage />);
    });
    await act(async () => { await new Promise(r => setTimeout(r, 0)); });

    expect(container.textContent).toContain('Pago Pendiente');
    expect(addNotification).toHaveBeenCalledWith(expect.objectContaining({ message: 'Pago pendiente de confirmación', color: 'warning' }));
  });

  it('handles user interactions', async () => {
    (useSearchParams as ReturnType<typeof vi.fn>).mockReturnValue(new URLSearchParams('status=success'));
    await act(async () => {
      root.render(<OrderSuccessPage />);
    });
    await act(async () => { await new Promise(r => setTimeout(r, 0)); });

    await act(async () => {
      const el = container.querySelector('.primary-button');
      el?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });
    expect(mockRouter.push).toHaveBeenCalledWith('/123');
  });

  it('handles retry interaction on failure', async () => {
    (useSearchParams as ReturnType<typeof vi.fn>).mockReturnValue(new URLSearchParams('status=failed'));
    await act(async () => {
      root.render(<OrderSuccessPage />);
    });
    await act(async () => { await new Promise(r => setTimeout(r, 0)); });

    await act(async () => {
      const retryBtn = container.querySelector('.secondary-button');
      retryBtn?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });
    expect(mockRouter.push).toHaveBeenCalledWith('/123/checkout');
  });
});
