/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import React from 'react';
import { createRoot, Root } from 'react-dom/client';
import { act } from 'react';

// Mock @react-google-maps/api
vi.mock('@react-google-maps/api', () => ({
  useLoadScript: vi.fn(() => ({ isLoaded: true })),
  GoogleMap: ({ children }: { children?: React.ReactNode }) => <div data-testid="google-map">{children}</div>,
  Marker: () => <div data-testid="marker" />,
}));

vi.mock('react-bootstrap', () => ({
  Spinner: ({ children }: { children?: React.ReactNode }) => <div data-testid="spinner">{children}</div>,
}));

import GoogleMapComponent from '../GoogleMap';
import { useLoadScript } from '@react-google-maps/api';

describe('GoogleMapComponent', () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
  });

  it('renders google map when loaded', async () => {
    vi.mocked(useLoadScript).mockReturnValue({ isLoaded: true } as any);

    await act(async () => {
      root.render(<GoogleMapComponent location={{ lat: 4.6097, lng: -74.0817 }} />);
    });

    expect(container.querySelector('[data-testid="google-map"]')).toBeTruthy();
  });

  it('renders spinner when not loaded', async () => {
    vi.mocked(useLoadScript).mockReturnValue({ isLoaded: false } as any);

    await act(async () => {
      root.render(<GoogleMapComponent location={{ lat: 4.6097, lng: -74.0817 }} />);
    });

    expect(container.querySelector('[data-testid="spinner"]')).toBeTruthy();
  });

  it('renders marker at location', async () => {
    vi.mocked(useLoadScript).mockReturnValue({ isLoaded: true } as any);

    await act(async () => {
      root.render(<GoogleMapComponent location={{ lat: 4.6097, lng: -74.0817 }} />);
    });

    expect(container.querySelector('[data-testid="marker"]')).toBeTruthy();
  });

  it('accepts custom zoom and height', async () => {
    vi.mocked(useLoadScript).mockReturnValue({ isLoaded: true } as any);

    await act(async () => {
      root.render(<GoogleMapComponent location={{ lat: 4.6097, lng: -74.0817 }} zoom={10} height="500px" />);
    });

    expect(container.querySelector('[data-testid="google-map"]')).toBeTruthy();
  });
});
