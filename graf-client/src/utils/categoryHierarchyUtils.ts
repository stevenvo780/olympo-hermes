import { Category } from '@/types';

export interface CategoryWithMetadata extends Category {
  depth?: number;
  isLeaf?: boolean;
  isContainer?: boolean;
  hasDirectProducts?: boolean;
}

export const analyzeCategoryStructure = (categories: Category[]): CategoryWithMetadata[] => {
  const categoryMap = new Map<number, CategoryWithMetadata>();

  categories.forEach(cat => {
    categoryMap.set(cat.id, {
      ...cat,
      depth: 0,
      isLeaf: !cat.children || cat.children.length === 0,
      isContainer: cat.children && cat.children.length > 0,
      hasDirectProducts: undefined
    });
  });

  const calculateDepth = (category: CategoryWithMetadata, currentDepth = 0): number => {
    category.depth = currentDepth;
    let maxChildDepth = currentDepth;
    
    if (category.children) {
      category.children.forEach(child => {
        const childWithMetadata = categoryMap.get(child.id);
        if (childWithMetadata) {
          const childDepth = calculateDepth(childWithMetadata, currentDepth + 1);
          maxChildDepth = Math.max(maxChildDepth, childDepth);
        }
      });
    }
    
    return maxChildDepth;
  };

  categories
    .filter(cat => !cat.parent)
    .forEach(rootCat => {
      const rootWithMetadata = categoryMap.get(rootCat.id);
      if (rootWithMetadata) {
        calculateDepth(rootWithMetadata);
      }
    });

  return Array.from(categoryMap.values());
};

export const getCategoriesForProductLoading = (categories: Category[]): Category[] => {
  return categories.filter(category => {
    if (!category.children || category.children.length === 0) {
      return true;
    }
    return true;
  });
};

export const validateCategoryDepth = (categories: Category[], maxDepth = 6): {
  isValid: boolean;
  maxFoundDepth: number;
  problematicCategories: Array<{
    id: number;
    name: string;
    depth: number;
  }>;
} => {
  const analyzed = analyzeCategoryStructure(categories);
  const maxFoundDepth = Math.max(...analyzed.map(cat => cat.depth || 0));
  const problematicCategories = analyzed.filter(cat => (cat.depth || 0) > maxDepth);
  
  return {
    isValid: maxFoundDepth <= maxDepth,
    maxFoundDepth,
    problematicCategories: problematicCategories.map(cat => ({
      id: cat.id,
      name: cat.name,
      depth: cat.depth || 0
    }))
  };
};

export const getAllDescendants = (category: Category): Category[] => {
  const descendants: Category[] = [];
  
  const collectDescendants = (cat: Category) => {
    if (cat.children) {
      cat.children.forEach(child => {
        descendants.push(child);
        collectDescendants(child);
      });
    }
  };
  
  collectDescendants(category);
  return descendants;
};

export const getCategoryPath = (targetId: number, categories: Category[]): Category[] => {
  const categoryMap = new Map(categories.map(cat => [cat.id, cat]));
  const path: Category[] = [];
  
  const buildPath = (categoryId: number): boolean => {
    const category = categoryMap.get(categoryId);
    if (!category) return false;
    
    path.unshift(category);
    
    if (category.parent) {
      return buildPath(category.parent.id);
    }
    
    return true;
  };
  
  buildPath(targetId);
  return path;
};
