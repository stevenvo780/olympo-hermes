import firebase from 'firebase/compat/app';
import { User, UserRole, Profile } from '@/types';
import api from '@/utils/axios';
export const getUserBack = async (
  user: firebase.User,
  role: UserRole = UserRole.CUSTOMER
): Promise<{
  user: User;
  profile: Profile;
}> => {
  try {
    const token = await user.getIdToken();
    
    try {
      const getResponse = await api.get<User>('/user/me/data', {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (getResponse.data && Object.keys(getResponse.data).length > 0 && getResponse.data.id) {
        const profileData = await api.get('/profile/get/my');
        return {
          user: getResponse.data,
          profile: profileData.data,
        }
      }
    } catch (err: unknown) {
      const status =
        typeof err === 'object' && err !== null && 'status' in err
          ? (err as { status?: number }).status
          : undefined;
      if (status && status !== 404) {
        console.error('Error fetching user data:', err);
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
    
    try {
      const profileData = await api.get('/profile/get/my');
      return {
        user: userNew.data,
        profile: profileData.data,
      }
    } catch {
      return {
        user: userNew.data,
        profile: {} as Profile,
      }
    }
  } catch (err: unknown) {
    throw err;
  }
};
