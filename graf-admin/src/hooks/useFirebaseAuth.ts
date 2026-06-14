"use client";
import { useEffect, useRef } from "react";
import { useAppDispatch } from "@/redux/hooks";
import { logout } from "../redux/auth";
import { auth } from "../utils/firebase";
import { useSelector } from "react-redux";
import { RootState } from "@/redux/store";
import { addNotification } from "@/redux/ui";

const useFirebaseAuth = () => {
  const dispatch = useAppDispatch();
  const isLoggedIn = useSelector((state: RootState) => state.auth.isLoggedIn);
  const tokenCheckIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Demo mode (api-key auth): there is no real Firebase session, so skip the
    // Firebase session manager entirely to avoid logging out the demo user.
    if (process.env.NEXT_PUBLIC_DEMO_API_KEY) {
      return;
    }
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (!user && isLoggedIn) {
        dispatch(
          addNotification({
            message:
              "Su sesión ha finalizado. Por favor, inicie sesión nuevamente.",
            color: "warning",
          }),
        );
        dispatch(logout());
      }
    });

    const validateToken = async () => {
      const user = auth.currentUser;

      if (user && isLoggedIn) {
        try {
          const tokenResult = await user.getIdTokenResult();
          const expirationTime = new Date(tokenResult.expirationTime).getTime();
          const now = Date.now();
          const fiveMinutes = 5 * 60 * 1000;

          if (expirationTime - now < fiveMinutes) {
            console.log("Renovando token próximo a expirar...");
            await user.getIdToken(true);
            console.log("Token renovado exitosamente");
          }
        } catch (error) {
          console.error("Error validando/renovando token:", error);
          dispatch(
            addNotification({
              message:
                "Su sesión ha expirado. Por favor, inicie sesión nuevamente.",
              color: "warning",
            }),
          );
          dispatch(logout());
        }
      }
    };

    if (isLoggedIn) {
      validateToken();
      tokenCheckIntervalRef.current = setInterval(validateToken, 5 * 60 * 1000);
    }

    return () => {
      unsubscribe();
      if (tokenCheckIntervalRef.current) {
        clearInterval(tokenCheckIntervalRef.current);
      }
    };
  }, [dispatch, isLoggedIn]);

  return null;
};

export default useFirebaseAuth;
