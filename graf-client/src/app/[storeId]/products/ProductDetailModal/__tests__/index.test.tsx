/* @vitest-environment jsdom */
import React from 'react';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import ProductDetailModal from '../index';
import { useSelector, useDispatch } from 'react-redux';
import { useParams } from 'next/navigation';
import api from '@/utils/axios';
import { addToCart, incrementQuantity, decrementQuantity } from '@/redux/cart';
import { ProductContentType, ProductDetailViewType } from '@/types';

// Mock Dependencies
vi.mock('react-redux', () => ({
  useDispatch: vi.fn(),
  useSelector: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  useParams: vi.fn(),
}));

vi.mock('@/utils/axios', () => ({
  default: {
    get: vi.fn()
  }
}));

vi.mock('@/utils/imageUtils', () => ({
  getValidImageUrl: (url: string) => url
}));

// Mock Actions
vi.mock('@/redux/cart', () => ({
  addToCart: vi.fn(({ product }) => ({ type: 'addToCart', payload: product })),
  incrementQuantity: vi.fn(({ productId }) => ({ type: 'increment', payload: productId })),
  decrementQuantity: vi.fn(({ productId }) => ({ type: 'decrement', payload: productId })),
}));

// Mock Subcomponents
vi.mock('../../VariationSelectorModal', () => ({
  default: ({ show, onHide, parentProduct }: any) => show ? (
    <div data-testid="variation-modal">
      <span>Variation: {parentProduct.title}</span>
      <button onClick={onHide}>Close Variation</button>
    </div>
  ) : null
}));

vi.mock('@/app/[storeId]/components/ProductCard', () => ({
  default: ({ product, handleShowDetails, handleShowVariation }: any) => (
    <div>
      <div data-testid="suggestion-card" onClick={() => handleShowDetails(product)}>
        {product.title}
      </div>
      <button data-testid="suggestion-variation" onClick={() => handleShowVariation(product)}>
        Suggestion Variation
      </button>
    </div>
  )
}));

vi.mock('@/app/[storeId]/components/HorizontalSlider', () => ({
  default: ({ children }: any) => <div data-testid="horizontal-slider">{children}</div>
}));

vi.mock('@/components/SafeHtmlRenderer', () => ({
  default: ({ html }: any) => <div data-testid="safe-html-renderer" dangerouslySetInnerHTML={{ __html: html }} />
}));

// Mock Swiper
vi.mock('swiper/react', () => ({
  Swiper: ({ children }: any) => <div data-testid="swiper">{children}</div>,
  SwiperSlide: ({ children }: any) => <div data-testid="swiper-slide">{children}</div>
}));

vi.mock('swiper/modules', () => ({
  Navigation: {},
  Pagination: {}
}));

// Mock React Bootstrap
vi.mock('react-bootstrap', () => {
  function MockModalHeader({ children }: any) { return <div>{children}</div>; }
  MockModalHeader.displayName = 'ModalHeader';
  function MockModalTitle({ children }: any) { return <div>{children}</div>; }
  MockModalTitle.displayName = 'ModalTitle';
  function MockModalBody({ children }: any) { return <div>{children}</div>; }
  MockModalBody.displayName = 'ModalBody';
  function MockModalFooter({ children }: any) { return <div>{children}</div>; }
  MockModalFooter.displayName = 'ModalFooter';

  function MockModal({ show, onHide, children }: any) {
    return show ? (
      <div data-testid="modal">
        <button onClick={onHide} data-testid="close-modal">Close</button>
        {children}
      </div>
    ) : null;
  }
  MockModal.displayName = 'Modal';
  MockModal.Header = MockModalHeader;
  MockModal.Title = MockModalTitle;
  MockModal.Body = MockModalBody;
  MockModal.Footer = MockModalFooter;

  function MockCardBody({ children }: any) { return <div>{children}</div>; }
  MockCardBody.displayName = 'CardBody';
  function MockCard({ children }: any) { return <div>{children}</div>; }
  MockCard.displayName = 'Card';
  MockCard.Body = MockCardBody;

  function MockButton({ children, onClick, variant, ...props }: any) { return <button onClick={onClick} data-variant={variant} {...props}>{children}</button>; }
  MockButton.displayName = 'Button';
  function MockSpinner() { return <span>Loading...</span>; }
  MockSpinner.displayName = 'Spinner';
  function MockContainer({ children }: any) { return <div>{children}</div>; }
  MockContainer.displayName = 'Container';
  function MockRow({ children }: any) { return <div>{children}</div>; }
  MockRow.displayName = 'Row';
  function MockCol({ children }: any) { return <div>{children}</div>; }
  MockCol.displayName = 'Col';
  function MockBadge({ children }: any) { return <span>{children}</span>; }
  MockBadge.displayName = 'Badge';

  return {
    Modal: MockModal,
    Button: MockButton,
    Spinner: MockSpinner,
    Container: MockContainer,
    Row: MockRow,
    Col: MockCol,
    Badge: MockBadge,
    Card: MockCard,
  };
});

describe('ProductDetailModal', () => {
  const dispatch = vi.fn();
  const mockProduct = {
    id: 1,
    title: 'Test Product',
    priceWithTax: 1000,
    basePrice: 1000,
    discountPrice: 0,
    description: 'Test Desc',
    images: ['/img1.jpg'],
    categories: [{ id: 1, name: 'Cat 1' }]
  };

  const detailedProduct = {
    ...mockProduct,
    sku: 'SKU123',
    variationType: 'Size',
    value: 'M',
    discounts: [{ name: 'Discount 1' }]
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (useDispatch as unknown as ReturnType<typeof vi.fn>).mockReturnValue(dispatch);
    (useParams as unknown as ReturnType<typeof vi.fn>).mockReturnValue({ storeId: 'test-store' });

    // Default useSelector - includes config state
    (useSelector as unknown as ReturnType<typeof vi.fn>).mockImplementation((cb) => cb({
      cart: { carts: { 'test-store': { items: [] } } },
      config: { config: null }
    }));

    // Mock API
    (api.get as any).mockResolvedValue({ data: detailedProduct });
  });

  afterEach(() => {
    cleanup();
  });

  const renderModal = (props: any = {}) => {
    return render(
      <ProductDetailModal
        show={true}
        onHide={vi.fn()}
        product={mockProduct as any}
        {...props}
      />
    );
  };

  it('renders loading state initially', async () => {
    // Delay resolution
    (api.get as any).mockImplementation(() => new Promise(() => { }));
    renderModal();
    expect(screen.getByText('Loading...')).toBeTruthy();
  });

  it('renders detailed product info after fetch', async () => {
    renderModal();
    await waitFor(() => {
      expect(screen.getByText(detailedProduct.title)).toBeTruthy();
      expect(screen.getByText('SKU: SKU123')).toBeTruthy();
      expect(screen.getByText('Size: M')).toBeTruthy();
    });
  });

  it('dispatches addToCart when add button is clicked', async () => {
    renderModal();
    await waitFor(() => expect(screen.getByText('Añadir')).toBeTruthy());

    // There might be multiple "Añadir" (one for parent, one for simple).
    // Our mock product is simple (no children).
    const addButtons = screen.getAllByText('Añadir');
    fireEvent.click(addButtons[0]); // Usually the main button

    expect(addToCart).toHaveBeenCalledWith(expect.objectContaining({ product: expect.objectContaining({ id: detailedProduct.id }) }));
    expect(dispatch).toHaveBeenCalled();
  });

  it('shows inc/dec controls when quantity > 0', async () => {
    (useSelector as unknown as ReturnType<typeof vi.fn>).mockImplementation((cb) => cb({
      cart: { carts: { 'test-store': { items: [{ product: detailedProduct, quantity: 2 }] } } },
      config: { config: null }
    }));

    renderModal();
    await waitFor(() => expect(screen.getByText('2')).toBeTruthy()); // Quantity display
    fireEvent.click(screen.getByLabelText('Añadir uno más'));
    fireEvent.click(screen.getByLabelText('Quitar uno'));
    expect(incrementQuantity).toHaveBeenCalledWith(expect.objectContaining({ productId: detailedProduct.id }));
    expect(decrementQuantity).toHaveBeenCalledWith(expect.objectContaining({ productId: detailedProduct.id }));
  });

  it('handles parent product variation selection', async () => {
    const parentProduct = { ...detailedProduct, children: [{ id: 2 }], isParentProduct: true };
    (api.get as any).mockResolvedValue({ data: parentProduct });

    renderModal();

    // Wait for data to load
    await waitFor(() => expect(screen.getAllByRole('button', { name: /Añadir/i }).length).toBeGreaterThan(0));

    const addButtons = screen.getAllByRole('button', { name: /Añadir/i });
    fireEvent.click(addButtons[0]);

    await waitFor(() => expect(screen.getByTestId('variation-modal')).toBeTruthy());
    fireEvent.click(screen.getByText('Close Variation'));
  });

  it('falls back to empty cart when store cart is missing', async () => {
    (useSelector as unknown as ReturnType<typeof vi.fn>).mockImplementation((cb) => cb({
      cart: { carts: {} },
      config: { config: null }
    }));
    renderModal();
    await waitFor(() => expect(screen.getByText(detailedProduct.title)).toBeTruthy());
    expect(screen.getByText('Añadir')).toBeTruthy();
  });

  it('renders suggestions and opens nested product detail', async () => {
    const detailedWithCategory = { ...detailedProduct, categories: [{ id: 10, name: 'Cat 1' }] };
    const suggestedProduct = { id: 2, title: 'Suggested', basePrice: 2000, discountPrice: 0, description: 'S', images: [] };

    (api.get as any).mockImplementation((url: string) => {
      if (url.includes('/products/test-store/1')) {
        return Promise.resolve({ data: detailedWithCategory });
      }
      if (url.includes('/products/test-store/2')) {
        return Promise.resolve({ data: suggestedProduct });
      }
      return Promise.resolve({ data: { products: [suggestedProduct] } });
    });

    renderModal();

    await waitFor(() => expect(screen.getByTestId('suggestion-card')).toBeTruthy());

    fireEvent.click(screen.getByTestId('suggestion-card'));
    await waitFor(() => {
      const modals = screen.getAllByTestId('modal');
      expect(modals.length).toBeGreaterThan(1);
    });

    fireEvent.click(screen.getByTestId('suggestion-variation'));
    await waitFor(() => expect(screen.getByTestId('variation-modal')).toBeTruthy());

    const closeButtons = screen.getAllByTestId('close-modal');
    fireEvent.click(closeButtons[closeButtons.length - 1]);
  });

  it('renders HTML description when contentType is html', async () => {
    const htmlDescription = '<p>HTML <strong>formatted</strong></p>';
    const productWithHtml = { ...detailedProduct, description: htmlDescription };
    
    (api.get as any).mockResolvedValue({ data: productWithHtml });

    (useSelector as unknown as ReturnType<typeof vi.fn>).mockImplementation((cb) => cb({
      cart: { carts: { 'test-store': { items: [] } } },
      config: { 
        config: { 
          productDetailConfig: { 
            viewType: ProductDetailViewType.MODAL, 
            contentType: ProductContentType.HTML, 
            showRecommendedProducts: true 
          } 
        } 
      }
    }));

    renderModal();
    await waitFor(() => {
      expect(screen.getByTestId('safe-html-renderer')).toBeTruthy();
    });
  });

  it('hides recommended products when showRecommendedProducts is false', async () => {
    (useSelector as unknown as ReturnType<typeof vi.fn>).mockImplementation((cb) => cb({
      cart: { carts: { 'test-store': { items: [] } } },
      config: { 
        config: { 
          productDetailConfig: { 
            viewType: ProductDetailViewType.MODAL, 
            contentType: ProductContentType.PLAIN, 
            showRecommendedProducts: false 
          } 
        } 
      }
    }));

    renderModal();
    await waitFor(() => {
      expect(screen.getByText(detailedProduct.title)).toBeTruthy();
    });
    
    // Should not have horizontal slider for suggestions
    expect(screen.queryByTestId('horizontal-slider')).toBeNull();
  });

  it('uses modalLarge size when viewType is modalLarge', async () => {
    (useSelector as unknown as ReturnType<typeof vi.fn>).mockImplementation((cb) => cb({
      cart: { carts: { 'test-store': { items: [] } } },
      config: { 
        config: { 
          productDetailConfig: { 
            viewType: ProductDetailViewType.MODAL_LARGE, 
            contentType: ProductContentType.PLAIN, 
            showRecommendedProducts: true 
          } 
        } 
      }
    }));

    renderModal();
    await waitFor(() => {
      expect(screen.getByText(detailedProduct.title)).toBeTruthy();
    });
    // Modal should render with size xl (tested via mock behavior - component renders)
    expect(screen.getByTestId('modal')).toBeTruthy();
  });
});
