import { auth } from '../utils/firebase';
import { clearAxiosState } from './axios';

export const getCurrentUserToken = (): Promise<string | null> => {
  return new Promise((resolve, reject) => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        try {
          const token = await user.getIdToken();
          resolve(token);
        } catch {
          reject(new Error('Error obteniendo token'));
        }
      } else {
        resolve(null);
      }
      unsubscribe();
    });
  });
};

export const refreshUserToken = async (): Promise<string | null> => {
  const user = auth.currentUser;
  if (user) {
    try {
      return await user.getIdToken(true);
    } catch {
      return null;
    }
  }
  return null;
};

export const signOutUser = async () => {
  try {
    if (typeof window !== 'undefined') {
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith('firebase:') || key.includes('firebase') || key.includes('token')) {
          localStorage.removeItem(key);
        }
      });
      
      Object.keys(sessionStorage).forEach(key => {
        if (key.startsWith('firebase:') || key.includes('firebase') || key.includes('token')) {
          sessionStorage.removeItem(key);
        }
      });
    }
    
    clearAxiosState();
    
    await auth.signOut();
  
  } catch {
  }
};
