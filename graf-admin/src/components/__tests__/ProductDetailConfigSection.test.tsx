/* @vitest-environment jsdom */
import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen, fireEvent } from '@testing-library/react';
import ProductDetailConfigSection from '../../app/[storeId]/config/components/ProductDetailConfigSection';
import { ProductDetailViewType, ProductContentType, ProductDetailConfig } from '@/types';

// Mock react-bootstrap
vi.mock('react-bootstrap', () => ({
  Form: {
    Label: ({ children, ...props }: { children: React.ReactNode }) => <label {...props}>{children}</label>,
    Group: ({ children, ...props }: { children: React.ReactNode }) => <div {...props}>{children}</div>,
    Text: ({ children, ...props }: { children: React.ReactNode }) => <small {...props}>{children}</small>,
  },
  Row: ({ children }: { children: React.ReactNode }) => <div className="row">{children}</div>,
  Col: ({ children }: { children: React.ReactNode }) => <div className="col">{children}</div>,
  Card: Object.assign(
    ({ children, onClick, style, className }: { children: React.ReactNode; onClick?: () => void; style?: React.CSSProperties; className?: string }) => (
      <div className={className} style={style} onClick={onClick} data-testid="card">
        {children}
      </div>
    ),
    {
      Body: ({ children, className }: { children: React.ReactNode; className?: string }) => (
        <div className={className}>{children}</div>
      ),
    }
  ),
}));

// Mock react-icons
vi.mock('react-icons/fa', () => ({
  FaDesktop: () => <span data-testid="icon-desktop">Desktop</span>,
  FaExpand: () => <span data-testid="icon-expand">Expand</span>,
  FaFile: () => <span data-testid="icon-file">File</span>,
  FaCode: () => <span data-testid="icon-code">Code</span>,
  FaAlignLeft: () => <span data-testid="icon-align">Align</span>,
  FaThumbsUp: () => <span data-testid="icon-thumbs">Thumbs</span>,
  FaTshirt: () => <span data-testid="icon-tshirt">Tshirt</span>,
  FaTh: () => <span data-testid="icon-th">Th</span>,
  FaCompress: () => <span data-testid="icon-compress">Compress</span>,
  FaStar: () => <span data-testid="icon-star">Star</span>,
}));

vi.mock('react-icons/md', () => ({
  MdViewCarousel: () => <span data-testid="icon-carousel">Carousel</span>,
}));

vi.mock('react-icons/bs', () => ({
  BsGrid3X3Gap: () => <span data-testid="icon-grid">Grid</span>,
  BsViewList: () => <span data-testid="icon-list">List</span>,
  BsCardList: () => <span data-testid="icon-cardlist">CardList</span>,
}));

describe('ProductDetailConfigSection', () => {
  const defaultConfig: ProductDetailConfig = {
    viewType: ProductDetailViewType.MODAL,
    contentType: ProductContentType.PLAIN,
    showRecommendedProducts: true,
    recommendedCardType: 'carousel',
    recommendedDisplayMode: 'carousel',
  };

  const handleNestedChange = vi.fn();

  afterEach(() => {
    cleanup();
    handleNestedChange.mockClear();
  });

  it('renders all view type options', () => {
    render(
      <ProductDetailConfigSection
        productDetailConfig={defaultConfig}
        handleNestedChange={handleNestedChange}
      />
    );

    expect(screen.getByText('Modal Estándar')).toBeTruthy();
    expect(screen.getByText('Modal Grande')).toBeTruthy();
    expect(screen.getByText('Página Completa')).toBeTruthy();
  });

  it('renders all content type options', () => {
    render(
      <ProductDetailConfigSection
        productDetailConfig={defaultConfig}
        handleNestedChange={handleNestedChange}
      />
    );

    expect(screen.getByText('Texto Plano')).toBeTruthy();
    expect(screen.getByText('HTML Enriquecido')).toBeTruthy();
  });

  it('renders recommended products toggle', () => {
    render(
      <ProductDetailConfigSection
        productDetailConfig={defaultConfig}
        handleNestedChange={handleNestedChange}
      />
    );

    expect(screen.getByText('Mostrar productos recomendados')).toBeTruthy();
    const checkbox = screen.getByRole('checkbox');
    expect(checkbox).toBeTruthy();
  });

  it('calls handleNestedChange when view type card is clicked', () => {
    render(
      <ProductDetailConfigSection
        productDetailConfig={defaultConfig}
        handleNestedChange={handleNestedChange}
      />
    );

    const cards = screen.getAllByTestId('card');
    // Click on "Modal Grande" card (second view type card)
    fireEvent.click(cards[1]);

    expect(handleNestedChange).toHaveBeenCalledWith(
      'productDetailConfig',
      'viewType',
      ProductDetailViewType.MODAL_LARGE
    );
  });

  it('calls handleNestedChange when content type card is clicked', () => {
    render(
      <ProductDetailConfigSection
        productDetailConfig={defaultConfig}
        handleNestedChange={handleNestedChange}
      />
    );

    const cards = screen.getAllByTestId('card');
    // Content type cards are after view type cards (3 view types + 2 content types)
    // Click on HTML card (index 4, second content type)
    fireEvent.click(cards[4]);

    expect(handleNestedChange).toHaveBeenCalledWith(
      'productDetailConfig',
      'contentType',
      ProductContentType.HTML
    );
  });

  it('calls handleNestedChange when recommended products checkbox is toggled', () => {
    render(
      <ProductDetailConfigSection
        productDetailConfig={defaultConfig}
        handleNestedChange={handleNestedChange}
      />
    );

    const checkbox = screen.getByRole('checkbox');
    fireEvent.click(checkbox);

    expect(handleNestedChange).toHaveBeenCalledWith(
      'productDetailConfig',
      'showRecommendedProducts',
      false
    );
  });

  it('shows checkbox as checked when showRecommendedProducts is true', () => {
    render(
      <ProductDetailConfigSection
        productDetailConfig={defaultConfig}
        handleNestedChange={handleNestedChange}
      />
    );

    const checkbox = screen.getByRole('checkbox') as HTMLInputElement;
    expect(checkbox.checked).toBe(true);
  });

  it('shows checkbox as unchecked when showRecommendedProducts is false', () => {
    const configWithDisabledRecommended: ProductDetailConfig = {
      ...defaultConfig,
      showRecommendedProducts: false,
    };

    render(
      <ProductDetailConfigSection
        productDetailConfig={configWithDisabledRecommended}
        handleNestedChange={handleNestedChange}
      />
    );

    const checkbox = screen.getByRole('checkbox') as HTMLInputElement;
    expect(checkbox.checked).toBe(false);
  });

  it('shows "Seleccionado" badge for the currently selected view type', () => {
    render(
      <ProductDetailConfigSection
        productDetailConfig={defaultConfig}
        handleNestedChange={handleNestedChange}
      />
    );

    // Modal Estándar should have "Seleccionado" badge since it's the default
    expect(screen.getByText('Seleccionado')).toBeTruthy();
  });

  it('renders with modalLarge view type selected', () => {
    const configWithLargeModal: ProductDetailConfig = {
      viewType: ProductDetailViewType.MODAL_LARGE,
      contentType: ProductContentType.PLAIN,
      showRecommendedProducts: true,
      recommendedCardType: 'carousel',
      recommendedDisplayMode: 'carousel',
    };

    render(
      <ProductDetailConfigSection
        productDetailConfig={configWithLargeModal}
        handleNestedChange={handleNestedChange}
      />
    );

    expect(screen.getByText('Modal Grande')).toBeTruthy();
    expect(screen.getByText('Seleccionado')).toBeTruthy();
  });

  it('renders with page view type selected', () => {
    const configWithPage: ProductDetailConfig = {
      viewType: ProductDetailViewType.PAGE,
      contentType: ProductContentType.HTML,
      showRecommendedProducts: false,
      recommendedCardType: 'grid',
      recommendedDisplayMode: 'grid',
    };

    render(
      <ProductDetailConfigSection
        productDetailConfig={configWithPage}
        handleNestedChange={handleNestedChange}
      />
    );

    expect(screen.getByText('Página Completa')).toBeTruthy();
  });
});
