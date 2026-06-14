'use client';
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Container } from 'react-bootstrap';
import { useParams, useSearchParams, usePathname, useRouter } from 'next/navigation';
import { useSelector, useDispatch } from 'react-redux';
import api from '@/utils/axios';
import { RootState } from '@/redux/store';
import { setLoadingCategories, setCategories, setCategoriesHierarchy, setRootCategories } from '@/redux/categories';
import type { AppDispatch } from '@/redux/store';
import { Product, Category, ProductDetailViewType } from '@/types';
import ProductSlider from '../props/ProductSlider';
import ProductFilters from '../ProductFilters';
import CategorySlider from '../CategorySlider';
import CompactCategorySlider from '../CompactCategorySlider';
import CategorySection from '../CategorySection';
import ProductDetailModal from '../ProductDetailModal';
import { setFilters, setCategoryViewMode, setProductsByCategory } from '@/redux/products';
import { addNotification, toggleFilterSidebar } from '@/redux/ui';
import './styles.scss';
import NoProductsMessage from '../props/NoProductsMessage';
import { useProducts } from '@/hooks/useProducts';
import VariationSelectorModal from '../VariationSelectorModal';
import { validateCategoryDepth } from '@/utils/categoryHierarchyUtils';
import { sortProductsByCategoryOrder } from '@/utils/productOrder';

interface ProductsMainProps {
  categoriesSSR?: Category[];
  hierarchySSR?: Category[];
  rootCategoriesSSR?: Category[];
  productsSSR?: Record<number, {
    products: Product[];
    hasNextPage: boolean;
    currentPage: number;
  }>;
}

const ProductsClient: React.FC<ProductsMainProps> = ({
  categoriesSSR,
  hierarchySSR,
  rootCategoriesSSR,
  productsSSR
}) => {
  const { storeId } = useParams() as { storeId: string };
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();
  const { reloadAllProductsByCategory } = useProducts(storeId);
  const config = useSelector((state: RootState) => state.ui.store?.configuration);
  const productDetailConfig = useSelector((state: RootState) => state.ui.store?.configuration?.productDetailConfig);
  const categories = useSelector((state: RootState) => state.categories.categories);
  const categoryRoots = useSelector((state: RootState) => state.categories.rootCategories);
  const searchText = useSelector((state: RootState) => state.ui.searchText);
  const filters = useSelector((state: RootState) => state.products.filters);
  const isLoadingCategories = useSelector((state: RootState) => state.categories.loading);
  const showFilterSidebar = useSelector((state: RootState) => state.ui.showFilterSidebar);
  const productsByCategory = useSelector((state: RootState) => state.products.productsByCategory);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showCompactSlider, setShowCompactSlider] = useState(false);
  const [visibleCategories, setVisibleCategories] = useState<Set<number>>(new Set());
  const observerRef = useRef<IntersectionObserver | null>(null);
  const categoryPlaceholderRefs = useRef<Map<number, HTMLDivElement>>(new Map());
  const [initialDataLoaded, setInitialDataLoaded] = useState(false);
  const [variationParent, setVariationParent] = useState<Product | null>(null);
  const [showVariationSelector, setShowVariationSelector] = useState(false);

  const pathname = usePathname();
  const searchParams = useSearchParams();

  const prevSearchTextRef = useRef<string | null>(null);

  const handleCloseFilterSidebar = useCallback(() => {
    dispatch(toggleFilterSidebar(false));
  }, [dispatch]);

  useEffect(() => {
    const handleScroll = () => {
      const show = window.scrollY > 150;
      setShowCompactSlider(show);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleSelectCategory = useCallback((catId: string) => {
    const newCategory = catId === filters.category ? '' : catId;
    dispatch(setFilters({ ...filters, category: newCategory }));
    if (newCategory) {
      dispatch(setCategoryViewMode({ categoryId: parseInt(newCategory, 10), viewMode: 'grid' }));
    }
  }, [filters, dispatch]);

  const handleShowDetails = useCallback((product: Product) => {
    const viewType = productDetailConfig?.viewType || ProductDetailViewType.MODAL;
    
    if (viewType === ProductDetailViewType.PAGE) {
      router.push(`/${storeId}/products/${product.id}`);
    } else {
      setSelectedProduct(product);
      setShowDetailModal(true);
    }
  }, [productDetailConfig?.viewType, router, storeId]);

  const handleShowVariation = useCallback((product: Product) => {
    if (product.children && product.children.length > 0) {
      setVariationParent(product);
      setShowVariationSelector(true);
    }
  }, []);

  const handleCloseDetailModal = useCallback(() => {
    setShowDetailModal(false);
    setSelectedProduct(null);
  }, []);

  useEffect(() => {
    if (!initialDataLoaded) {
      if (categoriesSSR && categoriesSSR.length > 0) {
        dispatch(setCategories(categoriesSSR));
        if (hierarchySSR) dispatch(setCategoriesHierarchy(hierarchySSR));
        if (rootCategoriesSSR) dispatch(setRootCategories(rootCategoriesSSR));
        dispatch(setLoadingCategories(false));

        const hierarchyValidation = validateCategoryDepth(categoriesSSR);
        if (!hierarchyValidation.isValid) {
          dispatch(addNotification({ 
            message: `Se encontraron categorías con jerarquía profunda (${hierarchyValidation.maxFoundDepth} niveles)`, 
            color: 'warning' 
          }));
        }
      }

      if (productsSSR && Object.keys(productsSSR).length > 0) {
        Object.entries(productsSSR).forEach(([catId, data]) => {
          const ordered = sortProductsByCategoryOrder(data.products);
          dispatch(setProductsByCategory({
            categoryId: Number(catId),
            products: ordered,
            hasMore: data.hasNextPage,
            offset: data.currentPage
          }));
        });
      }

      setInitialDataLoaded(true);
    }
  }, [categoriesSSR, hierarchySSR, rootCategoriesSSR, productsSSR, dispatch, initialDataLoaded]);

  useEffect(() => {
    if (storeId && !initialDataLoaded && (!categoriesSSR || categoriesSSR.length === 0)) {
      const fetchCategories = async () => {
        dispatch(setLoadingCategories(true));
        try {
          const [flatResponse, hierarchyResponse, rootsResponse] = await Promise.all([
            api.get(`/categories/${storeId}`),
            api.get(`/categories/${storeId}/hierarchical`),
            api.get(`/categories/${storeId}/get/roots`)
          ]);
          dispatch(setCategories(flatResponse.data));
          dispatch(setCategoriesHierarchy(hierarchyResponse.data));
          dispatch(setRootCategories(rootsResponse.data));
        } catch {
          dispatch(addNotification({ message: 'Error al cargar categorías', color: 'error' }));
        } finally {
          dispatch(setLoadingCategories(false));
        }
      };
      fetchCategories();
    }
  }, [storeId, dispatch, categoriesSSR, initialDataLoaded]);

  useEffect(() => {
    if (storeId) {
      const urlCategory = searchParams.get('category');
      if (!filters.category && !urlCategory) {
        dispatch(setFilters({
          category: '',
          minPrice: 0,
          maxPrice: 0,
          discount: '',
        }));
      }
    }
  }, [storeId, searchParams, filters.category, dispatch]);

  useEffect(() => {
    if (!isLoadingCategories && categories.length > 0) {
      window.dispatchEvent(new Event('resize'));
    }
  }, [isLoadingCategories, categories]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (categories.length > 0 && (searchText === '' || searchText.length >= 3)) {
        if (searchText !== prevSearchTextRef.current || (!productsSSR && initialDataLoaded)) {
          prevSearchTextRef.current = searchText;
          reloadAllProductsByCategory();
        }
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [searchText, categories.length, reloadAllProductsByCategory, productsSSR, initialDataLoaded]);

  const noProductsInAnyCategory = useMemo(() =>
    Object.values(productsByCategory).every(
      (category) => category.products.length === 0
    ),
    [productsByCategory]);

  useEffect(() => {
    const discount = searchParams.get('discount') || '';
    const category = searchParams.get('category') || '';
    const minPrice = parseInt(searchParams.get('minPrice') || '0', 10);
    const maxPrice = parseInt(searchParams.get('maxPrice') || '0', 10);

    if (discount || category || minPrice || maxPrice) {
      dispatch(setFilters({ category, discount, minPrice, maxPrice }));
      if (category) {
        dispatch(setCategoryViewMode({ categoryId: parseInt(category, 10), viewMode: 'grid' }));
      }
    }
  }, [searchParams, dispatch]);

  useEffect(() => {
    const query = new URLSearchParams();
    if (filters.discount) query.set('discount', filters.discount);
    if (filters.category) query.set('category', filters.category);
    if (filters.minPrice) query.set('minPrice', String(filters.minPrice));
    if (filters.maxPrice) query.set('maxPrice', String(filters.maxPrice));

    window.history.replaceState({}, '', `${pathname}?${query.toString()}`);
  }, [filters, pathname]);

  useEffect(() => {
    if (categoryRoots.length > 0) {

      const getAllCategoryIds = (categories: Category[]): number[] => {
        const ids: number[] = [];
        categories.forEach(cat => {
          ids.push(cat.id);
          if (cat.children && cat.children.length > 0) {
            ids.push(...getAllCategoryIds(cat.children));
          }
        });
        return ids;
      };

      const allCategoryIds = getAllCategoryIds(categoryRoots);
      setVisibleCategories(new Set(allCategoryIds));

      if (observerRef.current) {
        observerRef.current.disconnect();
      }

      observerRef.current = new IntersectionObserver(
        (entries) => {
          setVisibleCategories((prevVisible) => {
            const newVisibleCategories = new Set(prevVisible);
            let hasChanges = false;

            entries.forEach((entry) => {
              const categoryId = parseInt(entry.target.id.replace('category-placeholder-', ''), 10);
              if (entry.isIntersecting) {
                if (!newVisibleCategories.has(categoryId)) {
                  newVisibleCategories.add(categoryId);
                  hasChanges = true;
                }
              }
            });

            return hasChanges ? newVisibleCategories : prevVisible;
          });
        },
        {
          rootMargin: '300px 0px',
          threshold: 0.1,
        }
      );

      categoryPlaceholderRefs.current.forEach((ref) => {
        if (observerRef.current) {
          observerRef.current.observe(ref);
        }
      });

      return () => {
        if (observerRef.current) {
          observerRef.current.disconnect();
        }
      };
    }
  }, [categoryRoots]);

  useEffect(() => {
    if (filters.category) {
      const selectedCategoryId = parseInt(filters.category, 10);
      setVisibleCategories((prev) => new Set([...prev, selectedCategoryId]));
    }
  }, [filters.category]);

  const setPlaceholderRef = useCallback((categoryId: number) => (node: HTMLDivElement | null) => {
    if (node) {
      categoryPlaceholderRefs.current.set(categoryId, node);
    }
  }, []);

  const renderCategories = useMemo(() => {
    return categoryRoots.map((category) => {
      const isVisible = visibleCategories.has(category.id);

      return (
        <div key={`category-container-${category.id}`}>
          <div
            id={`category-placeholder-${category.id}`}
            ref={setPlaceholderRef(category.id)}
            style={{ minHeight: isVisible ? 0 : '100px' }}
          />

          {isVisible && (
            <CategorySection
              key={`category-section-${category.id}`}
              id={`category-${category.id}`}
              category={category}
              handleShowDetails={handleShowDetails}
              handleShowVariation={handleShowVariation}
            />
          )}
        </div>
      );
    });
  }, [categoryRoots, handleShowDetails, visibleCategories, setPlaceholderRef, handleShowVariation]);

  const scrollToSelectedCategory = useCallback((categoryId: string) => {
    if (!categoryId) return;

    const attemptScroll = () => {
      const element = document.getElementById(`category-${categoryId}`);
      if (!element) {
        setTimeout(attemptScroll, 300);
        return;
      }

      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - 120;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    };

    setTimeout(attemptScroll, 100);
  }, []);

  useEffect(() => {
    if (filters.category) {
      scrollToSelectedCategory(filters.category);
    }
  }, [filters.category, scrollToSelectedCategory]);

  useEffect(() => {
    const urlCategory = searchParams.get('category');
    if (urlCategory && !isLoadingCategories && categoryRoots.length > 0) {
      setTimeout(() => {
        scrollToSelectedCategory(urlCategory);
      }, 500);
    }
  }, [searchParams, isLoadingCategories, categoryRoots.length, scrollToSelectedCategory]);

  return (
    <>
      {config?.banners && config.banners.length > 0 && (
        <ProductSlider banners={config.banners} />
      )}
      {categories.length > 0 && (
        <>
          <CategorySlider
            onSelectCategory={handleSelectCategory}
            selectedCategoryId={filters.category}
          />
          <CompactCategorySlider
            onSelectCategory={handleSelectCategory}
            selectedCategoryId={filters.category}
            isVisible={showCompactSlider}
          />
        </>
      )}

      {showFilterSidebar && (
        <div className="sidebar-overlay" onClick={handleCloseFilterSidebar}></div>
      )}

      <div className={`filters-sidebar ${showFilterSidebar ? 'show' : ''}`}>
        <div className="filters-sidebar-header">
          <h4>Filtros</h4>
          <button className="close-button" onClick={handleCloseFilterSidebar}>×</button>
        </div>
        <div className="filters-sidebar-body">
          <ProductFilters />
        </div>
      </div>

      <Container className="mt-4 custom-container">
        <div className="products-column-content">
          {noProductsInAnyCategory && (
            <NoProductsMessage />
          )}
          {renderCategories}
        </div>
      </Container>

      {variationParent && (
        <VariationSelectorModal
          show={showVariationSelector}
          onHide={() => setShowVariationSelector(false)}
          parentProduct={variationParent}
          handleShowDetails={handleShowDetails}
          dispatch={dispatch}
          storeId={storeId}
        />
      )}

      {selectedProduct && (
        <ProductDetailModal
          show={showDetailModal}
          onHide={handleCloseDetailModal}
          product={selectedProduct}
        />
      )}
    </>
  );
};

export default ProductsClient;
