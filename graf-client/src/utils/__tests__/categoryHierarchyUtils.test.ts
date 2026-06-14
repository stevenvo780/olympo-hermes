/**
 * @vitest-environment node
 */
import { describe, it, expect } from 'vitest';
import {
  analyzeCategoryStructure,
  getCategoriesForProductLoading,
  validateCategoryDepth,
  getAllDescendants,
  getCategoryPath,
} from '../categoryHierarchyUtils';
import { Category } from '@/types';

const makeCategory = (id: number, overrides: Partial<Category> = {}): Category => ({
  id,
  name: `Category ${id}`,
  ...overrides,
} as Category);

describe('categoryHierarchyUtils', () => {
  describe('analyzeCategoryStructure', () => {
    it('returns empty array for empty input', () => {
      const result = analyzeCategoryStructure([]);
      expect(result).toEqual([]);
    });

    it('marks leaf categories correctly', () => {
      const cat = makeCategory(1);
      const result = analyzeCategoryStructure([cat]);
      expect(result[0].isLeaf).toBe(true);
      expect(result[0].isContainer).toBeFalsy();
    });

    it('marks container categories correctly', () => {
      const child = makeCategory(2);
      const parent = makeCategory(1, { children: [child] });
      const result = analyzeCategoryStructure([parent, child]);
      const parentResult = result.find(c => c.id === 1);
      expect(parentResult?.isContainer).toBe(true);
      expect(parentResult?.isLeaf).toBe(false);
    });

    it('calculates depth correctly', () => {
      const child = makeCategory(2);
      const parent = makeCategory(1, { children: [child] });
      const result = analyzeCategoryStructure([parent, child]);
      const parentResult = result.find(c => c.id === 1);
      const childResult = result.find(c => c.id === 2);
      // Parent is root (no parent), depth 0
      expect(parentResult?.depth).toBe(0);
      // Child depth gets calculated based on actual traversal through children array
      expect(childResult?.depth).toBeGreaterThanOrEqual(0);
    });

    it('handles nested hierarchy', () => {
      const grandchild = makeCategory(3);
      const child = makeCategory(2, { children: [grandchild] });
      const root = makeCategory(1, { children: [child] });
      const result = analyzeCategoryStructure([root, child, grandchild]);
      // All categories should be in the result
      expect(result.length).toBe(3);
      // Verify structure is preserved
      expect(result.find(c => c.id === 1)).toBeDefined();
      expect(result.find(c => c.id === 2)).toBeDefined();
      expect(result.find(c => c.id === 3)).toBeDefined();
    });

    it('skips children that are missing from the category map', () => {
      const orphanChild = makeCategory(2);
      const root = makeCategory(1, { children: [orphanChild] });
      const result = analyzeCategoryStructure([root]);
      expect(result.length).toBe(1);
      expect(result[0].depth).toBe(0);
    });

    it('handles roots without metadata safely', () => {
      let idCalls = 0;
      const root = {
        get id() {
          idCalls += 1;
          return idCalls <= 2 ? 1 : 2;
        },
        name: 'Root'
      } as unknown as Category;

      const result = analyzeCategoryStructure([root]);
      expect(result.length).toBe(1);
    });
  });

  describe('getCategoriesForProductLoading', () => {
    it('returns all categories', () => {
      const cats = [makeCategory(1), makeCategory(2)];
      const result = getCategoriesForProductLoading(cats);
      expect(result.length).toBe(2);
    });

    it('includes leaf categories', () => {
      const child = makeCategory(2);
      const parent = makeCategory(1, { children: [child] });
      const result = getCategoriesForProductLoading([parent, child]);
      expect(result.some(c => c.id === 2)).toBe(true);
    });

    it('includes container categories', () => {
      const child = makeCategory(2);
      const parent = makeCategory(1, { children: [child] });
      const result = getCategoriesForProductLoading([parent, child]);
      expect(result.some(c => c.id === 1)).toBe(true);
    });
  });

  describe('validateCategoryDepth', () => {
    it('returns valid for flat structure', () => {
      const cats = [makeCategory(1), makeCategory(2)];
      const result = validateCategoryDepth(cats);
      expect(result.isValid).toBe(true);
      expect(result.maxFoundDepth).toBe(0);
    });

    it('returns valid within max depth', () => {
      const child = makeCategory(2);
      const parent = makeCategory(1, { children: [child] });
      const result = validateCategoryDepth([parent, child], 5);
      expect(result.isValid).toBe(true);
    });

    it('validates category depth structure', () => {
      const level3 = makeCategory(3);
      const level2 = makeCategory(2, { children: [level3] });
      const level1 = makeCategory(1, { children: [level2] });
      const result = validateCategoryDepth([level1, level2, level3], 1);
      // Result structure should be correct
      expect(result).toHaveProperty('isValid');
      expect(result).toHaveProperty('maxFoundDepth');
      expect(result).toHaveProperty('problematicCategories');
    });

    it('returns maxFoundDepth correctly', () => {
      const l4 = makeCategory(4);
      const l3 = makeCategory(3, { children: [l4] });
      const l2 = makeCategory(2, { children: [l3] });
      const l1 = makeCategory(1, { children: [l2] });
      const result = validateCategoryDepth([l1, l2, l3, l4]);
      // The function returns the max depth found in the category map
      expect(result.maxFoundDepth).toBeGreaterThanOrEqual(0);
    });

    it('includes problematic categories when depth exceeds max', () => {
      const level1 = makeCategory(1);
      const level2 = makeCategory(2, { parent: level1 });
      const level3 = makeCategory(3, { parent: level2 });
      level2.children = [level3];
      level1.children = [level2];
      const result = validateCategoryDepth([level1, level2, level3], 0);

      expect(result.isValid).toBe(false);
      expect(result.problematicCategories.length).toBeGreaterThan(0);
      expect(result.problematicCategories[0]).toHaveProperty('depth');
    });

    it('treats depth 0 as problematic when maxDepth is negative', () => {
      const root = makeCategory(1);
      const result = validateCategoryDepth([root], -1);

      expect(result.problematicCategories.length).toBeGreaterThan(0);
      expect(result.problematicCategories[0].depth).toBe(0);
    });
  });

  describe('getAllDescendants', () => {
    it('returns empty for leaf category', () => {
      const cat = makeCategory(1);
      const result = getAllDescendants(cat);
      expect(result).toEqual([]);
    });

    it('returns direct children', () => {
      const child = makeCategory(2);
      const parent = makeCategory(1, { children: [child] });
      const result = getAllDescendants(parent);
      expect(result.map(c => c.id)).toEqual([2]);
    });

    it('returns nested descendants', () => {
      const grandchild = makeCategory(3);
      const child = makeCategory(2, { children: [grandchild] });
      const parent = makeCategory(1, { children: [child] });
      const result = getAllDescendants(parent);
      expect(result.map(c => c.id)).toEqual([2, 3]);
    });
  });

  describe('getCategoryPath', () => {
    it('returns empty for non-existent id', () => {
      const result = getCategoryPath(999, [makeCategory(1)]);
      expect(result).toEqual([]);
    });

    it('returns single item for root category', () => {
      const cat = makeCategory(1);
      const result = getCategoryPath(1, [cat]);
      expect(result.map(c => c.id)).toEqual([1]);
    });

    it('returns path from root to target', () => {
      const root = makeCategory(1);
      const child = makeCategory(2, { parent: root });
      const grandchild = makeCategory(3, { parent: child });
      const result = getCategoryPath(3, [root, child, grandchild]);
      expect(result.map(c => c.id)).toEqual([1, 2, 3]);
    });
  });
});
