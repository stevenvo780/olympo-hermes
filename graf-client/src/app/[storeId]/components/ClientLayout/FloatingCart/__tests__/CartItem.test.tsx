/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import React from 'react';
import { createRoot, Root } from 'react-dom/client';
import { act } from 'react';

// Mock dependencies
vi.mock('react-redux', () => ({
  useDispatch: () => vi.fn().mockReturnValue(Promise.resolve()),
}));

vi.mock('next/image', () => ({
  // eslint-disable-next-line @next/next/no-img-element
  default: ({ src, alt }: { src: string; alt: string }) => <img src={src} alt={alt} />,
}));

vi.mock('react-bootstrap', () => {
  const MockListGroup = ({ children }: { children: React.ReactNode }) => <div>{children}</div>;
  MockListGroup.displayName = 'MockListGroup';
  const MockListGroupItem = ({ children }: { children: React.ReactNode }) => <div data-testid="list-item">{children}</div>;
  MockListGroupItem.displayName = 'MockListGroupItem';
  MockListGroup.Item = MockListGroupItem;
  return {
    ListGroup: MockListGroup,
    Button: ({ children, onClick }: { children: React.ReactNode; onClick?: () => void }) => (
      <button onClick={onClick}>{children}</button>
    ),
    Form: {
      Control: ({ value }: { value: number }) => <input readOnly value={value} />,
    },
  };
});

vi.mock('react-icons/fa', () => ({
  FaMinus: () => <span>-</span>,
  FaPlus: () => <span>+</span>,
  FaTrashAlt: () => <span>trash</span>,
  FaSync: () => <span>sync</span>,
}));

vi.mock('@/utils/formatters', () => ({
  formatNumberWithCommas: (n: number) => n.toLocaleString(),
}));

vi.mock('@/utils/imageUtils', () => ({
  extractFirstValidImageUrl: (imgs: string[]) => imgs[0] || '',
}));

vi.mock('@/redux/cart', () => ({
  updateCartItemWithHierarchy: vi.fn(() => ({ type: 'cart/update' })),
}));

import CartItem from '../CartItem';

describe('CartItem', () => {
  let container: HTMLDivElement;
  let root: Root;
  const handleDecrement = vi.fn();
  const handleIncrement = vi.fn();
  const handleRemoveItem = vi.fn();

  const mockItem = {
    product: {
      id: 1,
      title: 'Test Product',
      basePrice: 100,
      priceWithTax: 119,
      discountPrice: 0,
      totalPrice: 119,
      images: ['https://example.com/img.jpg'],
    },
    quantity: 2,
    finalPrice: 238,
  };

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
    vi.clearAllMocks();
  });

  afterEach(() => {
    act(() => {
      root.unmount();
    });
    container.remove();
  });

  it('renders cart item correctly', async () => {
    await act(async () => {
      root.render(
        <CartItem
          item={mockItem as any}
          storeId="store1"
          handleDecrement={handleDecrement}
          handleIncrement={handleIncrement}
          handleRemoveItem={handleRemoveItem}
        />
      );
    });

    expect(container.textContent).toContain('Test Product');
    expect(container.textContent).toContain('119');
  });

  it('calls handleIncrement when plus button clicked', async () => {
    await act(async () => {
      root.render(
        <CartItem
          item={mockItem as any}
          storeId="store1"
          handleDecrement={handleDecrement}
          handleIncrement={handleIncrement}
          handleRemoveItem={handleRemoveItem}
        />
      );
    });

    const buttons = container.querySelectorAll('button');
    const plusBtn = Array.from(buttons).find(b => b.textContent?.includes('+'));

    await act(async () => {
      plusBtn?.click();
    });

    expect(handleIncrement).toHaveBeenCalledWith(1);
  });

  it('calls handleDecrement when minus button clicked', async () => {
    await act(async () => {
      root.render(
        <CartItem
          item={mockItem as any}
          storeId="store1"
          handleDecrement={handleDecrement}
          handleIncrement={handleIncrement}
          handleRemoveItem={handleRemoveItem}
        />
      );
    });

    const buttons = container.querySelectorAll('button');
    const minusBtn = Array.from(buttons).find(b => b.textContent?.includes('-'));

    await act(async () => {
      minusBtn?.click();
    });

    expect(handleDecrement).toHaveBeenCalledWith(1);
  });

  it('calls handleRemoveItem when trash button clicked', async () => {
    await act(async () => {
      root.render(
        <CartItem
          item={mockItem as any}
          storeId="store1"
          handleDecrement={handleDecrement}
          handleIncrement={handleIncrement}
          handleRemoveItem={handleRemoveItem}
        />
      );
    });

    const buttons = container.querySelectorAll('button');
    const trashBtn = Array.from(buttons).find(b => b.textContent?.includes('trash'));

    await act(async () => {
      trashBtn?.click();
    });

    expect(handleRemoveItem).toHaveBeenCalledWith(1);
  });

  it('renders discount price when applicable', async () => {
    const discountItem = {
      ...mockItem,
      product: {
        ...mockItem.product,
        discountPrice: 10,
        totalPrice: 109,
      },
    };

    await act(async () => {
      root.render(
        <CartItem
          item={discountItem as any}
          storeId="store1"
          handleDecrement={handleDecrement}
          handleIncrement={handleIncrement}
          handleRemoveItem={handleRemoveItem}
        />
      );
    });

    expect(container.textContent).toContain('109');
  });

  it('renders product image', async () => {
    await act(async () => {
      root.render(
        <CartItem
          item={mockItem as any}
          storeId="store1"
          handleDecrement={handleDecrement}
          handleIncrement={handleIncrement}
          handleRemoveItem={handleRemoveItem}
        />
      );
    });

    const img = container.querySelector('img');
    expect(img).toBeTruthy();
  });

  it('handles product with parent', async () => {
    const itemWithParent = {
      ...mockItem,
      product: {
        ...mockItem.product,
        parent: { id: 0, title: 'Parent Product' },
      },
    };

    await act(async () => {
      root.render(
        <CartItem
          item={itemWithParent as any}
          storeId="store1"
          handleDecrement={handleDecrement}
          handleIncrement={handleIncrement}
          handleRemoveItem={handleRemoveItem}
        />
      );
    });

    expect(container.textContent).toContain('Parent Product');
    expect(container.textContent).toContain('Test Product');
  });
});
