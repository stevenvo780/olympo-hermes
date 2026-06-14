'use client';
import { AppDispatch } from './store';
import { clearAxiosState } from '../utils/axios';

export const RESET_APP_STATE = 'app/reset';

export const resetAppStateAction = () => ({
  type: RESET_APP_STATE
});

export const resetAppState = () => async (dispatch: AppDispatch) => {
  dispatch(resetAppStateAction());
  
  clearAxiosState();
  
  try {
    const { persistor } = await import('./store');
    await persistor.purge();
  } catch (error) {
    console.error('Error al purgar el persistor:', error);
  }
};
