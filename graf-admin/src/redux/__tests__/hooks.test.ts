import { describe, expect, it, vi } from 'vitest';

vi.mock('react-redux', () => ({
  useDispatch: vi.fn(),
  useSelector: vi.fn(),
}));

import { useDispatch, useSelector } from 'react-redux';
import { useAppDispatch, useAppSelector } from '../hooks';

describe('redux hooks', () => {
  it('re-exports typed hooks', () => {
    expect(useAppDispatch).toBe(useDispatch);
    expect(useAppSelector).toBe(useSelector);
  });
});
