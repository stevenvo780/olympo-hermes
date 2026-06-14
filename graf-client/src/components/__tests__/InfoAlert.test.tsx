/* @vitest-environment jsdom */
import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { act } from 'react';
import { createRoot, Root } from 'react-dom/client';
import InfoAlert from '../InfoAlert';

// Mock dependencies
const dispatchMock = vi.fn();
const useSelectorMock = vi.fn();
vi.mock('react-redux', () => ({
  useDispatch: () => dispatchMock,
  useSelector: (selector: any) => useSelectorMock(selector),
}));

// Mock Actions
vi.mock('@/redux/ui', () => ({
  removeNotification: vi.fn((id) => ({ type: 'ui/removeNotif', payload: id })),
}));
import { removeNotification } from '@/redux/ui';

// Mock React Bootstrap
vi.mock('react-bootstrap', () => ({
  Alert: ({ children, onClose, variant, dismissible, ...props }: any) => (
    <div data-testid="alert" data-variant={variant} {...props}>
      {dismissible && <button onClick={onClose} data-testid="close-btn">Close</button>}
      {children}
    </div>
  ),
}));

let container: HTMLDivElement;
let root: Root;

const renderComponent = async () => {
  await act(async () => {
    root.render(<InfoAlert />);
  });
};

describe('InfoAlert', () => {
  const mockNotifications = [
    { id: '1', color: 'success', message: 'Message 1' },
    { id: '2', color: 'error', message: 'Message 2' }
  ];

  const mockState = {
    ui: {
      notifications: mockNotifications
    }
  };

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);

    dispatchMock.mockReset();
    useSelectorMock.mockImplementation((selector) => selector(mockState));
    vi.useFakeTimers();
  });

  afterEach(() => {
    act(() => {
      root.unmount();
    });
    container.remove();
    vi.useRealTimers();
  });

  it('renders notifications from store', async () => {
    await renderComponent();

    const alerts = container.querySelectorAll('[data-testid="alert"]');
    expect(alerts.length).toBe(2);
    expect(alerts[0].textContent).toContain('Message 1');
    expect(alerts[0].getAttribute('data-variant')).toBe('success');
    expect(alerts[1].textContent).toContain('Message 2');
    expect(alerts[1].getAttribute('data-variant')).toBe('error');
  });

  it('removes notification on close click', async () => {
    await renderComponent();

    const closeBtn = container.querySelector('[data-testid="close-btn"]');
    expect(closeBtn).toBeTruthy();

    act(() => {
      closeBtn?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    expect(dispatchMock).toHaveBeenCalledWith(removeNotification('1'));
  });

  it('removes notification after timeout', async () => {
    await renderComponent();

    act(() => {
      vi.advanceTimersByTime(5000);
    });

    // Wait for re-render if state update happens
    // The AlertComponent calls onDismiss which calls onRemoveNotification prop 
    // which calls dispatch.

    expect(dispatchMock).toHaveBeenCalledWith(removeNotification('1'));
    expect(dispatchMock).toHaveBeenCalledWith(removeNotification('2'));
  });
});
