import firebase from 'firebase/compat/app';
import { User, UserRole } from '@/types';
import api from '@/utils/axios';
export const getUserBack = async (
  user: firebase.User,
  role: UserRole = UserRole.BUSINESS_OWNER
): Promise<User> => {
  try {
    const token = await user.getIdToken();

    try {
      const getResponse = await api.get<User>('/user/me/data', { 
        headers: { Authorization: `Bearer ${token}` } 
      });
      if (Object.keys(getResponse.data).length > 0) {
        return getResponse.data;
      }
    } catch (err: unknown) {
      const status = (err as { status?: number })?.status;
      if (status && status !== 404) {
        
      }
    }

    const postData = {
      id: user.uid,
      email: user.email,
      name: user.displayName || 'Usuario sin nombre',
      role,
    };
    
    const userNew = await api.post('/auth/register', postData, {
      headers: { Authorization: `Bearer ${token}` },
    });
    
    return userNew.data;
  } catch (err: unknown) {
    console.error('Error en getUserBack:', err);
    throw err;
  }
};
