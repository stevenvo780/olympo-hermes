'use client';
import React, { useState, useRef, useEffect } from 'react';
import { Category } from '@/types';
import Image from 'next/image';
import './subcategory-modal.scss';

interface SubcategoryModalProps {
  category: Category;
  isVisible: boolean;
  onSelectSubcategory: (categoryId: string) => void;
  onClose: () => void;
  triggerRef: React.RefObject<HTMLDivElement>;
}

const SubcategoryModal: React.FC<SubcategoryModalProps> = ({
  category,
  isVisible,
  onSelectSubcategory,
  onClose,
  triggerRef
}) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ top: 0, left: 0 });

  useEffect(() => {
    if (isVisible && triggerRef.current && modalRef.current) {
      const triggerRect = triggerRef.current.getBoundingClientRect();
      const modalRect = modalRef.current.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      
      let left = triggerRect.left + triggerRect.width / 2 - modalRect.width / 2;

      if (left < 10) left = 10;
      if (left + modalRect.width > viewportWidth - 10) {
        left = viewportWidth - modalRect.width - 10;
      }
      
      setPosition({
        top: triggerRect.bottom + window.scrollY + 8,
        left: left + window.scrollX
      });
    }
  }, [isVisible, triggerRef]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node) &&
          triggerRef.current && !triggerRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    if (isVisible) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isVisible, onClose, triggerRef]);

  if (!isVisible || !category.children || category.children.length === 0) {
    return null;
  }

  const handleSubcategoryClick = (subcategoryId: string) => {
    onSelectSubcategory(subcategoryId);
    onClose();
  };

  return (
    <div
      ref={modalRef}
      className="subcategory-modal"
      style={{
        position: 'absolute',
        top: position.top,
        left: position.left,
        zIndex: 1000
      }}
    >
      <div className="subcategory-modal-content">
        <div className="subcategory-modal-header">
          <h6>Subcategorías de {category.name}</h6>
        </div>
        <div className="subcategory-list">
          {category.children.map((subcategory) => {
            const initial = subcategory.name.charAt(0).toUpperCase();
            return (
              <div
                key={subcategory.id}
                className="subcategory-item"
                onClick={() => handleSubcategoryClick(subcategory.id.toString())}
              >
                <div className="subcategory-icon">
                  {subcategory.imageUrl ? (
                    <Image
                      src={subcategory.imageUrl}
                      alt={subcategory.name}
                      width={32}
                      height={32}
                      style={{ objectFit: 'cover' }}
                    />
                  ) : (
                    <span className="subcategory-initial">{initial}</span>
                  )}
                </div>
                <span className="subcategory-name">{subcategory.name}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default SubcategoryModal;
