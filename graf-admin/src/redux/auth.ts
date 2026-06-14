'use client';
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { User, Subscription } from '../types';
import { signOutUser } from '../utils/firebaseHelper';
import { AppDispatch } from './store';
import { resetAppState, RESET_APP_STATE } from './actions';
import { clearAxiosState } from '../utils/axios';

interface AuthState {
  isLoggedIn: boolean;
  userData: User | null;
}

const initialState: AuthState = {
  isLoggedIn: false,
  userData: null,
};

const auth = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    login(state, action: PayloadAction<User>) {
      state.isLoggedIn = true;
      state.userData = action.payload;
      if (typeof window !== 'undefined') {
        localStorage.setItem('userData', JSON.stringify(action.payload));
      }
    },
    setSuscription(state, action: PayloadAction<Subscription>) {
      if (state.userData) {
        state.userData.subscription = action.payload;
      }
    },
    logout(state) {
      state.isLoggedIn = false;
      state.userData = null;
      if (typeof window !== 'undefined') {
        localStorage.removeItem('userData');
      }
      signOutUser();
    },
    initializeAuth(state) {
      if (typeof window !== 'undefined') {
        const userData = localStorage.getItem('userData');
        if (userData) {
          state.userData = JSON.parse(userData);
          state.isLoggedIn = true;
        }
      }
    },
  },
  extraReducers: (builder) => {
    builder.addCase(RESET_APP_STATE, () => initialState);
  }
});

export const { login, setSuscription, initializeAuth } = auth.actions;
export const logout = () => async (dispatch: AppDispatch) => {
  try {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('userData');
    }
    
    dispatch(resetAppState());
    
    await signOutUser();
    
    clearAxiosState();
    
  } catch (error) {
    console.error('Error during logout:', error);
    clearAxiosState();
  }
};

export default auth.reducer;

