/* @vitest-environment jsdom */
import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { act } from 'react';
import { createRoot, Root } from 'react-dom/client';
import { useStoreConfig } from '../useStoreConfig';

// Mock dependencies
const dispatchMock = vi.fn();
vi.mock('react-redux', () => ({
  useDispatch: () => dispatchMock,
}));

// Mock actions
vi.mock('@/redux/ui', () => ({
  setStore: vi.fn((store) => ({ type: 'ui/setStore', payload: store })),
}));

vi.mock('@/redux/config', () => ({
  setConfig: vi.fn((config) => ({ type: 'config/setConfig', payload: config })),
}));

// Mock utils
const applyPaletteMock = vi.fn();
vi.mock('@/utils/theme', () => ({
  applyPalette: (palette: any) => applyPaletteMock(palette),
}));

vi.mock('@/utils/defaultPalette', () => ({
  defaultPalette: { primary: 'default' },
}));

// Mock Axios
import api from '@/utils/axios';
vi.mock('@/utils/axios', () => ({
  default: {
    get: vi.fn(),
  },
}));

import { setStore } from '@/redux/ui';
import { setConfig } from '@/redux/config';
import { defaultPalette } from '@/utils/defaultPalette';

let container: HTMLDivElement;
let root: Root;
let currentResult: any = {};

const TestComponent = ({ storeId }: { storeId: string | null }) => {
  const result = useStoreConfig(storeId);
  React.useEffect(() => {
    currentResult = result;
  }, [result]);
  return null;
};

const renderHook = async (storeId: string | null) => {
  currentResult = {};
  await act(async () => {
    root.render(<TestComponent storeId={storeId} />);
  });
};

describe('useStoreConfig', () => {
  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
    dispatchMock.mockReset();
    applyPaletteMock.mockReset();
    vi.clearAllMocks();
  });

  afterEach(() => {
    act(() => {
      root.unmount();
    });
    container.remove();
  });

  it('applies default palette if no storeId', async () => {
    await renderHook(null);
    expect(applyPaletteMock).toHaveBeenCalledWith(defaultPalette);
    expect(currentResult.loading).toBe(false);
    expect(currentResult.error).toBe(null);
  });

  it('fetches store and applies config if storeId provided', async () => {
    const storeData = {
      id: 'store1',
      configuration: {
        palette: { primary: 'custom' },
        otherConfig: 'val'
      }
    };
    (api.get as any).mockResolvedValue({ data: storeData });

    await renderHook('store1');

    await vi.waitFor(() => expect(currentResult.loading).toBe(false));

    expect(api.get).toHaveBeenCalledWith('/store/store1');
    expect(dispatchMock).toHaveBeenCalled();
    expect(setStore).toHaveBeenCalledWith(storeData);
    expect(setConfig).toHaveBeenCalledWith(storeData.configuration);
    expect(applyPaletteMock).toHaveBeenCalledWith(storeData.configuration.palette);
  });

  it('applies default palette if store has no configuration', async () => {
    const storeData = { id: 'store1' }; // No config
    (api.get as any).mockResolvedValue({ data: storeData });

    await renderHook('store1');

    await vi.waitFor(() => expect(currentResult.loading).toBe(false));

    expect(applyPaletteMock).toHaveBeenCalledWith(defaultPalette);
  });

  it('applies default palette if store has config but no palette', async () => {
    const storeData = { id: 'store1', configuration: {} };
    (api.get as any).mockResolvedValue({ data: storeData });

    await renderHook('store1');

    await vi.waitFor(() => expect(currentResult.loading).toBe(false));

    expect(applyPaletteMock).toHaveBeenCalledWith(defaultPalette);
  });

  it('handles fetch error', async () => {
    const error = new Error('Network error');
    (api.get as any).mockRejectedValue(error);

    await renderHook('store1');

    await vi.waitFor(() => expect(currentResult.loading).toBe(false));

    expect(currentResult.error).toEqual(error);
    expect(applyPaletteMock).toHaveBeenCalledWith(defaultPalette);
  });

  it('handles non-error rejections', async () => {
    (api.get as any).mockRejectedValue('boom');

    await renderHook('store1');

    await vi.waitFor(() => expect(currentResult.loading).toBe(false));

    expect(currentResult.error).toBeInstanceOf(Error);
    expect(currentResult.error?.message).toBe('Unknown error');
    expect(applyPaletteMock).toHaveBeenCalledWith(defaultPalette);
  });
});
