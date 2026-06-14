/* @vitest-environment jsdom */
import React from 'react';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import CategoryTree from '../CategoryTree';

describe('CategoryTree', () => {
  afterEach(() => {
    cleanup();
  });

  const mockCategories = [
    {
      id: 1,
      name: 'Parent 1',
      parent: null,
      children: [
        { id: 11, name: 'Child 1', imageUrl: '', children: [] }
      ]
    },
    { id: 2, name: 'Parent 2', parent: null, children: [] },
  ];

  it('renders nothing if categories are empty', () => {
    const { container } = render(<CategoryTree categories={[]} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders parent categories', () => {
    render(<CategoryTree categories={mockCategories as any} />);
    expect(screen.getByText('Parent 1')).toBeTruthy();
    expect(screen.getByText('Parent 2')).toBeTruthy();
  });

  it('renders child categories recursively', () => {
    render(<CategoryTree categories={mockCategories as any} />);
    expect(screen.getByText('Child 1')).toBeTruthy();
  });

  it('calls onSelectCategory with id when clicked', () => {
    const onSelect = vi.fn();
    render(<CategoryTree categories={mockCategories as any} onSelectCategory={onSelect} />);

    fireEvent.click(screen.getByText('Parent 1'));
    expect(onSelect).toHaveBeenCalledWith('1');
  });

  it('calls onSelectCategory with empty string when clicking already selected', () => {
    const onSelect = vi.fn();
    render(
      <CategoryTree
        categories={mockCategories as any}
        onSelectCategory={onSelect}
        selectedCategoryId="1"
      />
    );

    fireEvent.click(screen.getByText('Parent 1'));
    expect(onSelect).toHaveBeenCalledWith('');
  });

  it('applies active class to selected category', () => {
    render(
      <CategoryTree
        categories={mockCategories as any}
        selectedCategoryId="11"
      />
    );

    const childBtn = screen.getByText('Child 1');
    expect(childBtn.className).toContain('active');

    const parentBtn = screen.getByText('Parent 1');
    expect(parentBtn.className).not.toContain('active');
  });
});
