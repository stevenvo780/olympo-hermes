/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import React from 'react';
import { createRoot, Root } from 'react-dom/client';
import { act } from 'react';

vi.mock('react-select', () => ({
  default: ({ options, onChange, placeholder }: { options: any[]; onChange: (opt: any) => void; placeholder?: string }) => (
    <select data-testid="react-select" onChange={(e) => {
      const opt = options.find(o => o.value.toString() === e.target.value);
      if (opt) onChange(opt);
    }}>
      <option value="">{placeholder}</option>
      {options.map(o => (
        <option key={o.value} value={o.value}>{o.label}</option>
      ))}
    </select>
  ),
}));

vi.mock('react-bootstrap', () => {
  const MockComponent = ({ children, show }: { children?: React.ReactNode; show?: boolean }) => (
    show !== false ? <div>{children}</div> : null
  );
  return {
    Modal: Object.assign(MockComponent, {
      Header: MockComponent,
      Title: MockComponent,
      Body: MockComponent,
      Footer: MockComponent,
    }),
    Button: ({ children, onClick, disabled }: { children: React.ReactNode; onClick?: () => void; disabled?: boolean }) => (
      <button onClick={onClick} disabled={disabled}>{children}</button>
    ),
  };
});

vi.mock('@/types', () => ({ DeliveryZone: {} }));

import DeliveryZoneModal from '../DeliveryZoneModal';

describe('DeliveryZoneModal', () => {
  let container: HTMLDivElement;
  let root: Root;
  const onHide = vi.fn();
  const onSelectZone = vi.fn();

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
    vi.clearAllMocks();
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
  });

  it('renders modal title', async () => {
    await act(async () => {
      root.render(
        <DeliveryZoneModal
          show={true}
          onHide={onHide}
          deliveryZones={[]}
          onSelectZone={onSelectZone}
        />
      );
    });
    expect(container.textContent).toContain('Selecciona tu zona de entrega');
  });

  it('shows empty message when no zones', async () => {
    await act(async () => {
      root.render(
        <DeliveryZoneModal
          show={true}
          onHide={onHide}
          deliveryZones={[]}
          onSelectZone={onSelectZone}
        />
      );
    });
    expect(container.textContent).toContain('No hay zonas de entrega');
  });

  it('renders zones in select', async () => {
    const zones = [
      { id: 1, zone: 'Zone A', price: 5000 },
      { id: 2, zone: 'Zone B', price: 8000 },
    ];
    await act(async () => {
      root.render(
        <DeliveryZoneModal
          show={true}
          onHide={onHide}
          deliveryZones={zones as any}
          onSelectZone={onSelectZone}
        />
      );
    });
    expect(container.textContent).toContain('Zone A');
    expect(container.textContent).toContain('Zone B');
  });

  it('calls onHide when cancel clicked', async () => {
    await act(async () => {
      root.render(
        <DeliveryZoneModal
          show={true}
          onHide={onHide}
          deliveryZones={[]}
          onSelectZone={onSelectZone}
        />
      );
    });
    const cancelBtn = Array.from(container.querySelectorAll('button')).find(b => b.textContent === 'Cancelar');
    await act(async () => {
      cancelBtn?.click();
    });
    expect(onHide).toHaveBeenCalled();
  });

  it('disables confirm when no zone selected', async () => {
    await act(async () => {
      root.render(
        <DeliveryZoneModal
          show={true}
          onHide={onHide}
          deliveryZones={[{ id: 1, zone: 'Zone A', price: 5000 }] as any}
          onSelectZone={onSelectZone}
        />
      );
    });
    const confirmBtn = Array.from(container.querySelectorAll('button')).find(b => b.textContent === 'Confirmar');
    expect(confirmBtn?.disabled).toBe(true);
  });
});
