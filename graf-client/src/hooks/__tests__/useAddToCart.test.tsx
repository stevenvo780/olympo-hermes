/* @vitest-environment jsdom */
import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { act } from 'react';
import { createRoot, Root } from 'react-dom/client';
import { useAddToCart } from '../useAddToCart';

// Mock redux hooks
const dispatchMock = vi.fn();
vi.mock('react-redux', () => ({
  useDispatch: () => dispatchMock,
}));

// Mock the action creator
vi.mock('@/redux/cart', () => ({
  addToCartWithHierarchy: vi.fn(),
}));

import { addToCartWithHierarchy } from '@/redux/cart';

let container: HTMLDivElement;
let root: Root;
let addToCartResult: boolean | null = null;

const TestComponent = ({
  product,
  storeId
}: {
  product?: any,
  storeId?: string
}) => {
  const { addToCart } = useAddToCart();

  // Expose function for testing ?? Or just use it in an effect or event
  // Let's attach it to window or use an effect that triggers it
  // Better: Trigger it on mount if props provided

  React.useEffect(() => {
    if (product && storeId) {
      addToCart(product, storeId).then(res => {
        addToCartResult = res;
      });
    }
  }, [product, storeId, addToCart]);

  // Also expose it via a button to trigger manually if needed
  return (
    <button onClick={() => addToCart(product, storeId || '').then(res => addToCartResult = res)}>
      Add
    </button>
  );
};

const renderAndTrigger = async (product: any, storeId: string) => {
  // Reset result
  addToCartResult = null;
  await act(async () => {
    root.render(<TestComponent product={product} storeId={storeId} />);
  });
};

describe('useAddToCart', () => {
  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
    dispatchMock.mockReset();
    vi.clearAllMocks();
  });

  afterEach(() => {
    act(() => {
      root.unmount();
    });
    container.remove();
  });

  it('successfully adds to cart', async () => {
    const unwrapMock = vi.fn().mockResolvedValue('success');
    dispatchMock.mockReturnValue({ unwrap: unwrapMock });

    const product = { id: 'p1', name: 'Product 1' };
    const storeId = 'store1';

    await renderAndTrigger(product, storeId);

    expect(dispatchMock).toHaveBeenCalled();
    expect(addToCartWithHierarchy).toHaveBeenCalledWith({ product, storeId });
    // Wait for promise resolution
    await vi.waitFor(() => expect(addToCartResult).toBe(true));
  });

  it('handles error when adding to cart fails', async () => {
    const unwrapMock = vi.fn().mockRejectedValue(new Error('Failed'));
    dispatchMock.mockReturnValue({ unwrap: unwrapMock });

    const product = { id: 'p1', name: 'Product 1' };
    const storeId = 'store1';

    await renderAndTrigger(product, storeId);

    expect(dispatchMock).toHaveBeenCalled();
    await vi.waitFor(() => expect(addToCartResult).toBe(false));
  });
});
