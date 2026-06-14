/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi } from 'vitest';

// Mock react-redux
vi.mock('react-redux', () => ({
  useDispatch: vi.fn(() => vi.fn()),
  useSelector: vi.fn((selector) => selector({})),
}));

// Mock the store types
vi.mock('./store', () => ({
  // These are just type aliases, they don't need runtime values
}));

import { useAppDispatch, useAppSelector } from '../hooks';

describe('redux hooks', () => {
  it('exports useAppDispatch', () => {
    expect(useAppDispatch).toBeDefined();
    expect(typeof useAppDispatch).toBe('function');
  });

  it('exports useAppSelector', () => {
    expect(useAppSelector).toBeDefined();
    expect(typeof useAppSelector).toBe('function');
  });

  it('useAppDispatch returns a function', () => {
    const dispatch = useAppDispatch();
    expect(typeof dispatch).toBe('function');
  });

  it('useAppSelector can call a selector', () => {
    const result = useAppSelector((state) => state);
    expect(result).toBeDefined();
  });
});
