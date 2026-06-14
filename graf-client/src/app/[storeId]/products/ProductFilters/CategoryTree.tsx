import React, { memo, useCallback } from 'react';
import { Category } from '@/types';
import { IoCaretForward, IoEllipse } from 'react-icons/io5';

interface CategoryTreeProps {
  categories: Category[];
  onSelectCategory?: (categoryId: string) => void;
  selectedCategoryId?: string;
}

const CategoryTree: React.FC<CategoryTreeProps> = ({ 
  categories, 
  onSelectCategory, 
  selectedCategoryId 
}) => {
  const handleSelect = useCallback((id: number) => {
    if (id.toString() === selectedCategoryId) {
      onSelectCategory?.('');
    } else {
      onSelectCategory?.(id.toString());
    }
  }, [onSelectCategory, selectedCategoryId]);

  if (!categories || categories.length === 0) return null;

  return (
    <ul className="category-tree">
      {categories.map((cat) => (
        <li key={cat.id}>
          <div className="category-item">
            {cat.children && cat.children.length > 0 ? (
              <IoCaretForward size={14} className="category-icon" />
            ) : (
              <IoEllipse size={8} className="category-icon" />
            )}
            <button
              type="button"
              className={`category-button ${cat.id.toString() === selectedCategoryId ? 'active' : ''}`}
              onClick={() => handleSelect(cat.id)}
            >
              {cat.name}
            </button>
          </div>
          {cat.children && cat.children.length > 0 && (
            <CategoryTree 
              categories={cat.children} 
              onSelectCategory={onSelectCategory}
              selectedCategoryId={selectedCategoryId}
            />
          )}
        </li>
      ))}
      <style jsx>{`
        .category-tree {
          list-style: none;
          padding-left: 0.5rem;
          margin: 0;
        }
        .category-item {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.25rem 0;
        }
        .category-icon {
          color: var(--font-color, #6c757d);
          opacity: 0.6;
          margin-top: 2px;
        }
        .category-button {
          background: none;
          border: none;
          padding: 0.25rem 0.5rem;
          cursor: pointer;
          color: var(--font-color, #495057);
          font-size: 0.9rem;
          text-align: left;
          transition: all 0.2s ease;
          border-radius: 4px;
          flex: 1;
        }
        .category-button:hover {
          background-color: var(--primary-color, #f8f9fa);
          color: var(--primary-text, #000);
        }
        .category-button.active {
          background-color: var(--primary-color, #e9ecef);
          color: var(--primary-text, #0d6efd);
          font-weight: 500;
        }
      `}</style>
    </ul>
  );
};

export default memo(CategoryTree, (prev, next) => {
  return (
    prev.selectedCategoryId === next.selectedCategoryId && 
    prev.categories === next.categories
  );
});
