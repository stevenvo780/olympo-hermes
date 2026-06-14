import { auth } from "../utils/firebase";

/**
 * Obtiene el token del usuario actual, renovándolo si está próximo a expirar
 * @param forceRefresh - Fuerza la renovación del token
 * @returns Token válido o null si no hay usuario autenticado
 */
export const getCurrentUserToken = async (
  forceRefresh = false,
): Promise<string | null> => {
  return new Promise((resolve) => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        try {
          const tokenResult = await user.getIdTokenResult();
          const expirationTime = new Date(tokenResult.expirationTime).getTime();
          const now = Date.now();
          const fiveMinutes = 5 * 60 * 1000;

          const shouldRefresh =
            forceRefresh ||
            expirationTime - now < fiveMinutes ||
            expirationTime <= now;

          const token = await user.getIdToken(shouldRefresh);
          resolve(token);
        } catch (error) {
          console.error("Error getting user token:", error);
          resolve(null);
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
      const token = await user.getIdToken(true);
      return token;
    } catch (error) {
      console.error("Error refreshing user token:", error);
      return null;
    }
  } else {
    return null;
  }
};

export const signOutUser = async () => {
  try {
    await auth.signOut();
  } catch (error) {
    console.error("Error signing out:", error);
  }
};
