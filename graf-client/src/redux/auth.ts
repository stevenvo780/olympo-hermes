'use client';
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Profile, User } from '@/types';
import { signOutUser } from '../utils/firebaseHelper';
import { AppDispatch } from './store';
import { clearAxiosState } from '../utils/axios';

interface AuthState {
  isLoggedIn: boolean;
  userData: { user: User; profile: Profile } | null;
}

const initialState: AuthState = {
  isLoggedIn: false,
  userData: null,
};

const auth = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    login(state, action: PayloadAction<{ user: User; profile: Profile }>) {
      state.isLoggedIn = true;
      state.userData = action.payload;
      if (typeof window !== 'undefined') {
        localStorage.setItem('userData', JSON.stringify(action.payload));
      }
    },
    initializeAuth(state) {
      if (typeof window !== 'undefined') {
        const userData = localStorage.getItem('userData');
        if (userData) {
          try {
            state.userData = JSON.parse(userData);
            state.isLoggedIn = true;
          } catch (e) {
            console.error('Error parsing userData from localStorage:', e);
            localStorage.removeItem('userData');
            state.isLoggedIn = false;
            state.userData = null;
          }
        }
      }
    },
    logoutReducer(state) {
      state.isLoggedIn = false;
      state.userData = null;
    },
  },
});

export const { login, initializeAuth, logoutReducer } = auth.actions;

export const logout = () => async (dispatch: AppDispatch) => {
  try {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('userData');
    }
    
    dispatch(logoutReducer());
    
    await signOutUser();
    
    clearAxiosState();
    
  } catch {
    clearAxiosState();
  }
};

export default auth.reducer;
