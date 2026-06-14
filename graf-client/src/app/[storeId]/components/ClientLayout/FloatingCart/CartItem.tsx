'use client';
import React, { memo } from 'react';
import { ListGroup, Button, Form } from 'react-bootstrap';
import { FaMinus, FaPlus, FaTrashAlt, FaSync } from 'react-icons/fa';
import Image from 'next/image';
import { formatNumberWithCommas } from '@/utils/formatters';
import { extractFirstValidImageUrl } from '@/utils/imageUtils';
import { Product } from '@/types';
import { useDispatch } from 'react-redux';
import { AppDispatch } from '@/redux/store';
import { updateCartItemWithHierarchy } from '@/redux/cart';

interface CartItemProps {
  item: {
    product: Product;
    quantity: number;
    finalPrice: number;
  };
  storeId: string;
  handleDecrement: (productId: number) => void;
  handleIncrement: (productId: number) => void;
  handleRemoveItem: (productId: number) => void;
}

const CartItem: React.FC<CartItemProps> = ({ 
  item, 
  storeId,
  handleDecrement, 
  handleIncrement, 
  handleRemoveItem 
}) => {
  const dispatch = useDispatch<AppDispatch>();
  const priceWithTax = Number(item.product.priceWithTax);
  const discountPrice = Number(item.product.discountPrice);
  
  const unitPrice = item.product.totalPrice;
  
  const totalItemPrice = unitPrice * item.quantity;

  React.useEffect(() => {

    const isLikelyVariation = (

      item.product.title.length <= 3 ||

      (item.product.sku && item.product.sku.includes('-')) ||

      (item.product.variationType && !item.product.parent) ||

      (item.product.categories && item.product.categories.length > 0 && item.product.title.length <= 8)
    );
    
    const needsUpdate = !item.product.parent && 
                       isLikelyVariation &&
                       !item.product.isParentProduct;
    
    if (needsUpdate) {

      const timer = setTimeout(() => {
        dispatch(updateCartItemWithHierarchy({
          productId: item.product.id,
          storeId: storeId
        })).catch(() => {

        });
      }, 100);
      
      return () => clearTimeout(timer);
    }
  }, [item.product.id, item.product.parent, item.product.title, item.product.sku, item.product.variationType, item.product.categories, item.product.isParentProduct, dispatch, storeId]);

  const getProductHierarchy = (product: Product): string => {
    const buildHierarchyChain = (current: Product): string[] => {
      if (current.parent) {
        const parentChain = buildHierarchyChain(current.parent);
        return [...parentChain, current.title];
      }

      return [current.title];
    };

    if (product.parent) {
      const hierarchy = buildHierarchyChain(product);
      return hierarchy.join(' - ');
    }

    if (product.title.length <= 8 && product.sku) {

      const skuParts = product.sku.split('-').filter(part => part.length > 0);
      if (skuParts.length > 1) {

        return skuParts.join(' - ');
      }
    }

    if (product.variationType && product.value && product.title.length <= 8) {
      const baseCategory = product.categories?.[0]?.name || 'Producto';
      return `${baseCategory} - ${product.variationType}: ${product.value}`;
    }

    let displayName = product.title;

    if (product.title.length <= 8 && product.categories && product.categories.length > 0) {
      displayName = `${product.categories[0].name} - ${product.title}`;
    }

    if (product.title.length <= 8 && product.description && product.description.length > 10) {
      const shortDescription = product.description.substring(0, 30).trim();
      if (shortDescription !== product.title) {
        displayName = `${shortDescription} (${product.title})`;
      }
    }
    
    return displayName;
  };

  const handleUpdateWithHierarchy = async () => {
    try {
      await dispatch(updateCartItemWithHierarchy({
        productId: item.product.id,
        storeId: storeId
      }));
    } catch {

    }
  };

  const needsHierarchyUpdate = !item.product.parent && 
                              (item.product.title.length <= 8 || 
                               (item.product.sku && item.product.sku.includes('-')) ||
                               item.product.variationType ||
                               (item.product.categories && item.product.categories.length > 0)) && 
                              !item.product.isParentProduct;
  
  const displayTitle = getProductHierarchy(item.product);

  return (
    <ListGroup.Item
      className="py-3 border-bottom"
      style={{ backgroundColor: 'var(--card-color)' }}
    >
      <div className="d-flex align-items-start">
        <div className="flex-grow-1">
          <h5
            className="mb-1"
            style={{ fontWeight: 'bold', color: 'var(--card-title-color)' }}
          >
            {displayTitle}
          </h5>
          <div className="mb-2">
            {discountPrice > 0 ? (
              <>
                <span style={{ textDecoration: 'line-through', marginRight: '0.5rem', color: 'var(--text-muted)' }}>
                  ${formatNumberWithCommas(priceWithTax)}
                </span>
                <span style={{ color: 'var(--danger-color)', fontWeight: 'bold' }}>
                  ${formatNumberWithCommas(unitPrice)}
                </span>
                <span style={{ color: 'var(--text-muted)', marginLeft: '0.5rem' }}>
                  x {item.quantity} = ${formatNumberWithCommas(totalItemPrice)}
                </span>
              </>
            ) : (
              <>
                <span style={{ fontWeight: 'bold', color: 'var(--card-text)' }}>
                  ${formatNumberWithCommas(priceWithTax)}
                </span>
                <span style={{ color: 'var(--text-muted)', marginLeft: '0.5rem' }}>
                  x {item.quantity} = ${formatNumberWithCommas(totalItemPrice)}
                </span>
              </>
            )}
          </div>
          <div className="d-flex align-items-center mt-2">
            <div className="input-group input-group-sm me-2" style={{ width: "120px" }}>
              <Button
                variant="outline-secondary"
                onClick={() => handleDecrement(item.product.id)}
                className="d-flex align-items-center justify-content-center"
                style={{ borderColor: 'var(--border-color)' }}
              >
                <FaMinus size={12} />
              </Button>
              <Form.Control
                type="text"
                readOnly
                value={item.quantity}
                className="text-center"
                style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--white-color)' }}
              />
              <Button
                variant="outline-secondary"
                onClick={() => handleIncrement(item.product.id)}
                className="d-flex align-items-center justify-content-center"
                style={{ borderColor: 'var(--border-color)' }}
              >
                <FaPlus size={12} />
              </Button>
            </div>
            {needsHierarchyUpdate && (
              <Button
                variant="outline-warning"
                size="sm"
                onClick={handleUpdateWithHierarchy}
                className="d-flex align-items-center justify-content-center me-2"
                title="Actualizar jerarquía"
              >
                <FaSync />
              </Button>
            )}
            <Button
              variant="outline-danger"
              size="sm"
              onClick={() => handleRemoveItem(item.product.id)}
              className="d-flex align-items-center justify-content-center"
            >
              <FaTrashAlt />
            </Button>
          </div>
        </div>
        {item.product.images && item.product.images.length > 0 && (
          <div className="ms-3" style={{ position: 'relative', width: '60px', height: '60px' }}>
            <Image
              src={extractFirstValidImageUrl(item.product.images)}
              alt={item.product.title}
              fill
              sizes="60px"
              className="rounded"
              style={{ objectFit: 'cover' }}
            />
          </div>
        )}
      </div>
    </ListGroup.Item>
  );
};

export default memo(CartItem, (prev, next) => {
  return prev.item.quantity === next.item.quantity &&
         prev.item.finalPrice === next.item.finalPrice;
});
