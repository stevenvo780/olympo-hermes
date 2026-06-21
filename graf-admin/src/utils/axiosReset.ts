'use client';
/**
 * Tiny module with zero imports — holds the axios state-reset callback.
 *
 * Exists solely to break the circular dependency:
 *   utils/axios  →  redux/store  →  rootReducer  →  redux/auth  →  utils/axios
 *
 * Both utils/axios and redux/auth import from here; neither imports the other.
 */

type ResetFn = () => void;
let _clearFn: ResetFn | null = null;

/** Called once from utils/axios to register its internal clear function. */
export const registerClearAxiosState = (fn: ResetFn): void => {
  _clearFn = fn;
};

/** Called by redux/auth on logout to reset the axios interceptor state. */
export const clearAxiosState = (): void => {
  _clearFn?.();
};
