import React, { useState, useEffect, useMemo, useDeferredValue, useCallback } from 'react';
import {
  DndContext,
  closestCenter,
  DragEndEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Table, Button, Badge } from 'react-bootstrap';
import { Product } from '@/types';
import { FaGripVertical, FaEdit, FaTrash, FaPlus, FaImage } from 'react-icons/fa';
import Image from 'next/image';
import { formatNumberWithCommas } from '@/utils/formatters';
import { extractFirstValidImageUrl } from '@/components/ImageUploader';
import { getPriceRange } from '@/utils/productPrice';

interface DraggableRowProps {
  product: Product;
  onEdit: (product: Product) => void;
  onDelete: (productId: number) => void;
  onCreateVariation: (product: Product) => void;
  stockEdits: { [id: number]: string };
  onStockChange: (productId: number, value: string) => void;
  onStockBlur: (product: Product) => void;
  children?: React.ReactNode;
  /** Posición visual (índice + 1) cuando se muestra orden por categoría */
  visualOrder?: number;
}

const DraggableRow = React.memo(function DraggableRow(props: DraggableRowProps) {
  const { product, onEdit, onDelete, onCreateVariation, stockEdits, onStockChange, onStockBlur, children, visualOrder } = props;
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: product.id.toString() });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  } as React.CSSProperties;
  const indent = product.parent ? 20 : 0;

  const getCategoryNames = (product: Product): string => {
    if (!product.categories || product.categories.length === 0) return 'Sin categoría';
    return product.categories.map(cat => cat.name).join(', ');
  };

  const getDiscountNames = (product: Product): string => {
    if (!product.discounts || product.discounts.length === 0) return 'Sin descuento';
    return product.discounts.map(disc => disc.name).join(', ');
  };

  const getProductSku = (product: Product): string => {
    return product.sku || `PROD-${product.id}`;
  };

  return (
    <>
      <tr ref={setNodeRef} style={style}>
        <td style={{ paddingLeft: `${indent}px` }}>
          <div
            style={{ display: 'flex', alignItems: 'center', cursor: 'grab', userSelect: 'none', WebkitUserSelect: 'none' }}
            {...attributes}
            {...listeners}
            onMouseDown={(e) => e.preventDefault()}
          >
            {product.parent && '↳ '}
            <FaGripVertical className="me-2" />
            <div className="d-flex flex-column" style={{ userSelect: 'none' }}>
              <small className="text-muted">ID: {product.id}</small>
              <code style={{ userSelect: 'none' }}>{getProductSku(product)}</code>
            </div>
          </div>
        </td>
        <td style={{ width: '70px' }}>
          <Badge bg="secondary" className="fs-6">{visualOrder ?? '-'}</Badge>
        </td>
        <td style={{ width: '80px', textAlign: 'center' }}>
          {product.images && product.images.length > 0 ? (
            <Image 
              src={extractFirstValidImageUrl(product.images)} 
              alt={product.title} 
              width={50}
              height={50}
              style={{ objectFit: 'contain' }}
            />
          ) : (
            <span className="text-muted">
              <FaImage size={30} />
            </span>
          )}
        </td>
        <td>{product.title}</td>
        <td>
          {product.children && product.children.length > 0 ? (
            (() => {
              const { min, max } = getPriceRange(product);
              return min === max
                ? `$${formatNumberWithCommas(min, 0)}`
                : `$${formatNumberWithCommas(min, 0)} - $${formatNumberWithCommas(max, 0)}`;
            })()
          ) : (
            `$${formatNumberWithCommas(typeof product.basePrice === 'string' ? parseFloat(product.basePrice) || 0 : (product.basePrice || 0), 0)}`
          )}
        </td>
        <td>
          <input
            type="number"
            value={stockEdits[product.id] ?? product.stock ?? ''}
            onChange={(e) => onStockChange(product.id, e.target.value)}
            onBlur={() => onStockBlur(product)}
            style={{ width: '80px' }}
          />
        </td>
        <td>
          <small className="text-muted">{getCategoryNames(product)}</small>
        </td>
        <td>
          <small className="text-muted">
            {getDiscountNames(product)}
          </small>
        </td>
        <td>
          <div className="d-flex gap-1">
            <Button size="sm" variant="outline-primary" onClick={() => onEdit(product)}>
              <FaEdit />
            </Button>
            {!product.parent && (
              <Button size="sm" variant="outline-success" onClick={() => onCreateVariation(product)}>
                <FaPlus />
              </Button>
            )}
            <Button size="sm" variant="outline-danger" onClick={() => onDelete(product.id)}>
              <FaTrash />
            </Button>
          </div>
        </td>
      </tr>
      {children}
    </>
  );
}, (prev, next) => {
  if (prev.product.id !== next.product.id || 
      prev.product.title !== next.product.title ||
      prev.product.basePrice !== next.product.basePrice ||
      prev.product.stock !== next.product.stock ||
      prev.visualOrder !== next.visualOrder ||
      prev.stockEdits[prev.product.id] !== next.stockEdits[next.product.id]) {
    return false;
  }

  const prevImages = (prev.product.images || []).join(',');
  const nextImages = (next.product.images || []).join(',');
  if (prevImages !== nextImages) return false;

  const prevTaxes = prev.product.taxes?.map(t => t.id).sort().join(',') || '';
  const nextTaxes = next.product.taxes?.map(t => t.id).sort().join(',') || '';
  if (prevTaxes !== nextTaxes) return false;
  
  const prevDiscounts = prev.product.discounts?.map(d => d.id).sort().join(',') || '';
  const nextDiscounts = next.product.discounts?.map(d => d.id).sort().join(',') || '';
  if (prevDiscounts !== nextDiscounts) return false;
  
  const prevCategories = prev.product.categories?.map(c => c.id).sort().join(',') || '';
  const nextCategories = next.product.categories?.map(c => c.id).sort().join(',') || '';
  if (prevCategories !== nextCategories) return false;
  
  return true;
});

interface DraggableProductTableProps {
  products: Product[];
  onEdit: (product: Product) => void;
  onDelete: (productId: number) => void;
  onCreateVariation: (product: Product) => void;
  onUpdateCategoryOrder: (productId: number, newOrder: number) => Promise<void>;
  stockEdits: { [id: number]: string };
  onStockChange: (productId: number, value: string) => void;
  onStockBlur: (product: Product) => void;
  /** Si está habilitado el reordenamiento (solo cuando se filtra por categoría) */
  reorderEnabled?: boolean;
  /** Nombre de la categoría activa para mostrar en la UI */
  activeCategoryName?: string;
}

export default function DraggableProductTable(props: DraggableProductTableProps) {
  const { 
    products, 
    onEdit, 
    onDelete, 
    onCreateVariation, 
    onUpdateCategoryOrder, 
    stockEdits, 
    onStockChange, 
    onStockBlur,
    reorderEnabled = false,
  } = props;
  const [items, setItems] = useState(products);
  const [isUpdating, setIsUpdating] = useState(false);
  const sensors = useSensors(
    useSensor(PointerSensor)
  );

  useEffect(() => { setItems(products); }, [products]);

  const flatProducts = useMemo(() => {
    if (!items.length) return [] as Product[];
    if (reorderEnabled) {
      return items.filter(p => !p.parent);
    }
    const parents: Product[] = [];
    const childrenByParent: Record<number, Product[]> = {};
    for (const p of items) {
      if (p.parent) (childrenByParent[p.parent.id] ||= []).push(p);
      else parents.push(p);
    }
    parents.sort((a, b) => a.id - b.id);
    Object.values(childrenByParent).forEach(arr => arr.sort((a, b) => a.id - b.id));
    const result: Product[] = [];
    for (const parent of parents) {
      result.push(parent);
      const kids = childrenByParent[parent.id];
      if (kids) result.push(...kids);
    }
    return result;
  }, [items, reorderEnabled]);

  const deferredFlat = useDeferredValue(flatProducts);

  const handleDragEnd = useCallback(async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    setIsUpdating(true);
    try {
      const flat = flatProducts;
      const oldIndex = flat.findIndex(i => i.id.toString() === active.id);
      const newIndex = flat.findIndex(i => i.id.toString() === over.id);
      if (oldIndex === -1 || newIndex === -1) return;
      if (oldIndex !== newIndex) {
        const newFlat = [...flat];
        const [moved] = newFlat.splice(oldIndex, 1);
        newFlat.splice(newIndex, 0, moved);
        setItems(newFlat);
      }
      await onUpdateCategoryOrder(flat[oldIndex].id, newIndex + 1);
    } finally { setIsUpdating(false); }
  }, [flatProducts, onUpdateCategoryOrder]);

  const renderTableRows = useCallback(() => deferredFlat.map((product, index) => (
    <DraggableRow
      key={product.id}
      product={product}
      onEdit={onEdit}
      onDelete={onDelete}
      onCreateVariation={onCreateVariation}
      stockEdits={stockEdits}
      onStockChange={onStockChange}
      onStockBlur={onStockBlur}
      visualOrder={reorderEnabled ? index + 1 : undefined}
    />
  )), [deferredFlat, onEdit, onDelete, onCreateVariation, stockEdits, onStockChange, onStockBlur, reorderEnabled]);

  const renderStaticRows = useCallback(() => deferredFlat.map(product => {
    const indent = product.parent ? 20 : 0;
    const getCategoryNames = (p: Product): string => {
      if (!p.categories || p.categories.length === 0) return 'Sin categoría';
      return p.categories.map(cat => cat.name).join(', ');
    };
    const getDiscountNames = (p: Product): string => {
      if (!p.discounts || p.discounts.length === 0) return 'Sin descuento';
      return p.discounts.map(disc => disc.name).join(', ');
    };
    const getProductSku = (p: Product): string => p.sku || `PROD-${p.id}`;
    
    return (
      <tr key={product.id}>
        <td style={{ paddingLeft: `${indent}px` }}>
          <div className="d-flex flex-column">
            {product.parent && '↳ '}
            <small className="text-muted">ID: {product.id}</small>
            <code>{getProductSku(product)}</code>
          </div>
        </td>
        <td style={{ width: '70px' }}>
          <Badge bg="secondary" className="fs-6">-</Badge>
        </td>
        <td style={{ width: '80px', textAlign: 'center' }}>
          {product.images && product.images.length > 0 ? (
            <Image 
              src={extractFirstValidImageUrl(product.images)} 
              alt={product.title} 
              width={50}
              height={50}
              style={{ objectFit: 'contain' }}
            />
          ) : (
            <span className="text-muted">
              <FaImage size={30} />
            </span>
          )}
        </td>
        <td>{product.title}</td>
        <td>
          {product.children && product.children.length > 0 ? (
            (() => {
              const { min, max } = getPriceRange(product);
              return min === max
                ? `$${formatNumberWithCommas(min, 0)}`
                : `$${formatNumberWithCommas(min, 0)} - $${formatNumberWithCommas(max, 0)}`;
            })()
          ) : (
            `$${formatNumberWithCommas(typeof product.basePrice === 'string' ? parseFloat(product.basePrice) || 0 : (product.basePrice || 0), 0)}`
          )}
        </td>
        <td>
          <input
            type="number"
            value={stockEdits[product.id] ?? product.stock ?? ''}
            onChange={(e) => onStockChange(product.id, e.target.value)}
            onBlur={() => onStockBlur(product)}
            style={{ width: '80px' }}
          />
        </td>
        <td>
          <small className="text-muted">{getCategoryNames(product)}</small>
        </td>
        <td>
          <small className="text-muted">{getDiscountNames(product)}</small>
        </td>
        <td>
          <div className="d-flex gap-1">
            <Button size="sm" variant="outline-primary" onClick={() => onEdit(product)}>
              <FaEdit />
            </Button>
            {!product.parent && (
              <Button size="sm" variant="outline-success" onClick={() => onCreateVariation(product)}>
                <FaPlus />
              </Button>
            )}
            <Button size="sm" variant="outline-danger" onClick={() => onDelete(product.id)}>
              <FaTrash />
            </Button>
          </div>
        </td>
      </tr>
    );
  }), [deferredFlat, onEdit, onDelete, onCreateVariation, stockEdits, onStockChange, onStockBlur]);

  return (
    <div className="position-relative" style={{ userSelect: 'none' }}>
      {isUpdating && (
        <div className="position-absolute top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center" style={{ background: 'rgba(255,255,255,0.6)', zIndex: 10 }}>
          <div className="text-center small">
            <div className="spinner-border text-primary" role="status" />
            <div className="mt-2 fw-semibold">Actualizando...</div>
          </div>
        </div>
      )}
      {reorderEnabled ? (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <Table striped bordered hover responsive>
            <thead>
              <tr>
                <th style={{ width: '220px' }}>
                  <span className="d-flex align-items-center gap-2">
                    ID / SKU
                    <Badge bg="success" pill style={{ fontSize: '0.65rem' }}>
                      ↕ Orden por categoría
                    </Badge>
                  </span>
                </th>
                <th style={{ width: '110px' }}>Orden categoría</th>
                <th style={{ width: '90px' }}>Imagen</th>
                <th>Título</th>
                <th style={{ width: '120px' }}>Precio</th>
                <th style={{ width: '110px' }}>Stock</th>
                <th>Categorías</th>
                <th>Descuentos</th>
                <th style={{ width: '140px' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              <SortableContext items={flatProducts.map(p => p.id.toString())} strategy={verticalListSortingStrategy}>
                {renderTableRows()}
              </SortableContext>
            </tbody>
          </Table>
        </DndContext>
      ) : (
        <Table striped bordered hover responsive>
          <thead>
            <tr>
              <th style={{ width: '220px' }}>ID / SKU</th>
              <th style={{ width: '110px' }}>Orden categoría</th>
              <th style={{ width: '90px' }}>Imagen</th>
              <th>Título</th>
              <th style={{ width: '120px' }}>Precio</th>
              <th style={{ width: '110px' }}>Stock</th>
              <th>Categorías</th>
              <th>Descuentos</th>
              <th style={{ width: '140px' }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {renderStaticRows()}
          </tbody>
        </Table>
      )}
    </div>
  );
}
