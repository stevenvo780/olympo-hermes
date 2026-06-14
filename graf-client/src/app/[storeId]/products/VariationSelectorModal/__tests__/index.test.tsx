/* @vitest-environment jsdom */
import React from 'react';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import VariationSelectorModal from '../index';
import { useDispatch } from 'react-redux';
import api from '@/utils/axios';

// Mock Dependencies
vi.mock('react-redux', () => ({
  useDispatch: vi.fn(),
  useSelector: vi.fn(),
}));

vi.mock('@/utils/axios', () => ({
  default: {
    get: vi.fn()
  }
}));

// Mock Subcomponents
vi.mock('../VariationSelectorModalBody', () => ({
  default: ({ loading, variations, handleShowDetails, handleShowVariation }: any) => (
    <div data-testid="modal-body">
      {loading ? 'Loading...' : 'Loaded'}
      {variations.map((v: any) => (
        <div key={v.id} data-testid={`variation-${v.id}`}>
          {v.title}
          <button onClick={() => handleShowDetails(v)}>Details</button>
          <button onClick={() => handleShowVariation(v)}>Recursive</button>
        </div>
      ))}
    </div>
  )
}));

vi.mock('../../ProductDetailModal', () => ({
  default: ({ show, onHide, product }: any) => show ? (
    <div data-testid="detail-modal">
      Detail: {product.title}
      <button onClick={onHide}>Close Detail</button>
    </div>
  ) : null
}));

// Mock React Bootstrap
vi.mock('react-bootstrap', () => {
  function MockModalHeader({ children }: any) { return <div>{children}</div>; }
  MockModalHeader.displayName = 'ModalHeader';
  function MockModalTitle({ children }: any) { return <div>{children}</div>; }
  MockModalTitle.displayName = 'ModalTitle';
  function MockModalBody({ children }: any) { return <div>{children}</div>; }
  MockModalBody.displayName = 'ModalBody';

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

  return {
    Modal: MockModal,
  };
});

describe('VariationSelectorModal', () => {
  const dispatch = vi.fn();
  const parentProduct = { id: 1, title: 'Parent', children: [] };
  const detailedProduct = {
    ...parentProduct,
    children: [
      { id: 2, title: 'Var 1' },
      { id: 3, title: 'Var 2' }
    ]
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (useDispatch as unknown as ReturnType<typeof vi.fn>).mockReturnValue(dispatch);
    (api.get as any).mockResolvedValue({ data: detailedProduct });
  });

  afterEach(() => {
    cleanup();
  });

  const renderModal = (props: any = {}) => {
    return render(
      <VariationSelectorModal
        show={true}
        onHide={vi.fn()}
        parentProduct={parentProduct as any}
        dispatch={dispatch}
        storeId="test-store"
        {...props}
      />
    );
  };

  it('fetches detailed product on mount and passes variations to body', async () => {
    renderModal();

    await waitFor(() => expect(screen.getByTestId('modal-body').textContent).toContain('Loaded'));
    expect(api.get).toHaveBeenCalledWith('/products/test-store/1');
    expect(screen.getByTestId('variation-2')).toBeTruthy();
    expect(screen.getByTestId('variation-3')).toBeTruthy();
  });

  it('opens detail modal when details button clicked', async () => {
    renderModal();
    await waitFor(() => expect(screen.getByTestId('variation-2')).toBeTruthy());

    fireEvent.click(screen.getByText('Details', { selector: '[data-testid="variation-2"] button' }));

    expect(screen.getByTestId('detail-modal')).toBeTruthy();
    expect(screen.getByText('Detail: Var 1')).toBeTruthy();
  });

  it('closes detail modal', async () => {
    renderModal();
    await waitFor(() => expect(screen.getByTestId('variation-2')).toBeTruthy());

    fireEvent.click(screen.getByText('Details', { selector: '[data-testid="variation-2"] button' }));
    expect(screen.getByTestId('detail-modal')).toBeTruthy();

    fireEvent.click(screen.getByText('Close Detail'));
    expect(screen.queryByTestId('detail-modal')).toBeNull();
  });

  it('handles recursive variation selection', async () => {
    // We need to verify that it sets the state to render another VariationSelectorModal
    // But since we are rendering the component itself, we can check if another modal appears?
    // Or we check if `VariationSelectorModal` is rendered again.
    // Since `VariationSelectorModal` recursively renders itself, we can check for nested structure if we mocked it properly.
    // However, in the test we are testing the component, so the recursive child is the REAL component unless we mock it.
    // But we didn't mock `VariationSelectorModal` (the default export).
    // Wait, if it imports itself, it refers to the same component definition we are testing.
    // So checking for another "modal" testid might work if they stack.

    renderModal();
    await waitFor(() => expect(screen.getByTestId('variation-2')).toBeTruthy());

    // Mock the API response for the recursive call to avoid infinite loop or error
    (api.get as any).mockResolvedValueOnce({ data: { id: 2, title: 'Var 1', children: [] } });

    fireEvent.click(screen.getByText('Recursive', { selector: '[data-testid="variation-2"] button' }));

    // We expect another modal to appear
    await waitFor(() => {
      const modals = screen.getAllByTestId('modal');
      expect(modals.length).toBeGreaterThan(1);
    });
  });

});
