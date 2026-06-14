/* @vitest-environment jsdom */
import React from 'react';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import { useSelector } from 'react-redux';
import CategorySlider from '../index';
import CategorySliderWithModal from '../CategorySliderWithModal';
import SubcategoryModal from '../SubcategoryModal';

// Mock Dependencies
vi.mock('react-redux', () => ({
  useSelector: vi.fn(),
}));

vi.mock('next/image', () => ({
  default: ({ src, alt }: any) => (
    <span data-testid="next-image" data-src={src} data-alt={alt} />
  )
}));

vi.mock('@/app/[storeId]/components/HorizontalSlider', () => ({
  default: ({ children }: any) => <div data-testid="horizontal-slider">{children}</div>
}));

describe('CategorySlider Components', () => {
  const mockCategories = [
    { id: 1, name: 'Parent 1', parent: null, children: [{ id: 11, name: 'Child 1', imageUrl: '/child1.jpg' }] },
    { id: 2, name: 'Parent 2', parent: null, children: [] },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    (useSelector as unknown as ReturnType<typeof vi.fn>).mockImplementation((cb) => cb({
      categories: { categories: mockCategories, loading: false }
    }));
  });

  afterEach(() => {
    cleanup();
  });

  describe('CategorySlider', () => {
    it('renders categories', () => {
      const onSelect = vi.fn();
      render(<CategorySlider onSelectCategory={onSelect} />);

      expect(screen.getByText('Parent 1')).toBeTruthy();
      expect(screen.getByText('Parent 2')).toBeTruthy();
    });

    it('handles category selection', () => {
      const onSelect = vi.fn();
      render(<CategorySlider onSelectCategory={onSelect} />);

      fireEvent.click(screen.getByText('Parent 1'));
      expect(onSelect).toHaveBeenCalledWith('1');
    });

    it('toggles selection', () => {
      const onSelect = vi.fn();
      render(<CategorySlider onSelectCategory={onSelect} selectedCategoryId="1" />);

      fireEvent.click(screen.getByText('Parent 1'));
      expect(onSelect).toHaveBeenCalledWith('');
    });
  });

  describe('CategorySliderWithModal', () => {
    it('renders categories and indicator', () => {
      const onSelect = vi.fn();
      render(<CategorySliderWithModal onSelectCategory={onSelect} />);

      expect(screen.getByText('Parent 1')).toBeTruthy();
      expect(screen.getByText('+1')).toBeTruthy(); // Indicator for children
    });

    // Note: Testing hover interaction in JSDOM can be tricky due to timeout and layout
    // We will verify the modal structure separately
  });

  describe('SubcategoryModal', () => {
    const mockRef = { current: document.createElement('div') };
    const mockCategory = mockCategories[0];

    it('renders nothing when not visible', () => {
      render(
        <SubcategoryModal
          category={mockCategory as any}
          isVisible={false}
          onSelectSubcategory={vi.fn()}
          onClose={vi.fn()}
          triggerRef={mockRef}
        />
      );
      expect(screen.queryByText('Subcategorías de Parent 1')).toBeNull();
    });

    it('renders subcategories when visible', () => {
      render(
        <SubcategoryModal
          category={mockCategory as any}
          isVisible={true}
          onSelectSubcategory={vi.fn()}
          onClose={vi.fn()}
          triggerRef={mockRef}
        />
      );
      expect(screen.getByText('Subcategorías de Parent 1')).toBeTruthy();
      expect(screen.getByText('Child 1')).toBeTruthy();
    });

    it('calls onSelectSubcategory on click', () => {
      const onSelect = vi.fn();
      const onClose = vi.fn();
      render(
        <SubcategoryModal
          category={mockCategory as any}
          isVisible={true}
          onSelectSubcategory={onSelect}
          onClose={onClose}
          triggerRef={mockRef}
        />
      );

      fireEvent.click(screen.getByText('Child 1'));
      expect(onSelect).toHaveBeenCalledWith('11');
      expect(onClose).toHaveBeenCalled();
    });
  });
});
