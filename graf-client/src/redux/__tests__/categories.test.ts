import { describe, expect, it } from 'vitest';
import categoriesReducer, {
  setCategories,
  setCategoriesHierarchy,
  setLoadingCategories,
  setRootCategories,
} from '@/redux/categories';
import { makeCategory } from '@/utils/__tests__/fixtures';

describe('categories slice', () => {
  it('sets categories, hierarchy, and root categories', () => {
    const categoryA = makeCategory({ id: 1 });
    const categoryB = makeCategory({ id: 2 });

    let state = categoriesReducer(undefined, { type: 'init' });
    state = categoriesReducer(state, setCategories([categoryA, categoryB]));
    state = categoriesReducer(state, setCategoriesHierarchy([categoryA]));
    state = categoriesReducer(state, setRootCategories([categoryB]));

    expect(state.categories).toEqual([categoryA, categoryB]);
    expect(state.categoriesHierarchy).toEqual([categoryA]);
    expect(state.rootCategories).toEqual([categoryB]);
  });

  it('toggles loading flag', () => {
    let state = categoriesReducer(undefined, { type: 'init' });
    state = categoriesReducer(state, setLoadingCategories(true));

    expect(state.loading).toBe(true);
  });
});
