"use client";
import { BrowserRouter, useLocation, Navigate } from "react-router-dom";
import Header from "../Header";
import InfoAlert from "../InfoAlert";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import api from "@/utils/axios";
import { setConfig } from "@/redux/config";
import { RootState } from "@/redux/store";
import { applyPalette } from "@/utils/theme";
import { defaultPalette } from "@/utils/defaultPalette";
import { logout } from "@/redux/auth";
import { addNotification } from "@/redux/ui";
import { useAppDispatch } from "@/redux/hooks";
import "./styles.scss";

interface ClientLayoutProps {
  children: React.ReactNode;
}

const ClientContent: React.FC<ClientLayoutProps> = ({ children }) => {
  const { storeId } = useParams() as { storeId: string };
  const dispatch = useAppDispatch();
  const config = useSelector((state: RootState) => state.config.config);
  const user = useSelector((state: RootState) => state.auth.userData);
  const isLoggedIn = useSelector((state: RootState) => state.auth.isLoggedIn);
  const collapsed = useSelector(
    (state: RootState) => state.ui.sidebarCollapsed,
  );
  const [isMobile, setIsMobile] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  const location = useLocation();

  const publicRoutes = ["/login", "/register", "/about", "/privacyPolicies", "/pricing"];
  const isPublicRoute = publicRoutes.some((route) =>
    location.pathname.startsWith(route),
  );

  useEffect(() => {
    const checkAuth = () => {
      if (user && !isLoggedIn) {
        console.warn(
          "Estado de autenticación inconsistente detectado, limpiando...",
        );
        dispatch(logout());
      }
      setAuthChecked(true);
    };

    checkAuth();
  }, [user, isLoggedIn, dispatch]);

  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth < 992);
    };

    checkIsMobile();
    window.addEventListener("resize", checkIsMobile);

    return () => {
      window.removeEventListener("resize", checkIsMobile);
    };
  }, []);

  useEffect(() => {
    if (storeId) {
      const fetchConfig = async () => {
        try {
          const response = await api.get(`/config/${storeId}`);
          dispatch(setConfig(response.data));
        } catch (error) {
          console.error("Error fetching client config:", error);
          const axiosError = error as { response?: { status?: number; data?: { message?: string } } };
          if (axiosError?.response?.status === 401) {
            return;
          }
          dispatch(addNotification({
            message: "Error al cargar configuración de tienda",
            color: "warning"
          }));
          applyPalette(defaultPalette);
        }
      };
      fetchConfig();
    } else {
      applyPalette(defaultPalette);
    }
  }, [storeId, dispatch]);

  useEffect(() => {
    if (config && config.palette) {
      applyPalette(config.palette);
    } else {
      applyPalette(defaultPalette);
    }
  }, [config]);

  const mainContentClass = isMobile
    ? "mainContent mainContentMobile"
    : collapsed
      ? "mainContent mainContentCollapsed"
      : "mainContent mainContentExpanded";

  if (!authChecked) {
    return null;
  }

  if (!isLoggedIn && !isPublicRoute) {
    if (typeof window !== "undefined") {
      const hasNotifiedLogout = sessionStorage.getItem("logout-notified");
      if (!hasNotifiedLogout) {
        dispatch(
          addNotification({
            message: "Por favor, inicie sesión para continuar.",
            color: "info",
          }),
        );
        sessionStorage.setItem("logout-notified", "true");
      }
    }
    return <Navigate to="/login" replace />;
  }

  if (isPublicRoute && typeof window !== "undefined") {
    sessionStorage.removeItem("logout-notified");
  }

  return (
    <>
      <Header />
      <div className="appLayout">
        <main className={mainContentClass}>
          {children}
          <InfoAlert />
        </main>
      </div>
    </>
  );
};

const ClientLayout: React.FC<ClientLayoutProps> = ({ children }) => {
  return (
    <BrowserRouter>
      <ClientContent>{children}</ClientContent>
    </BrowserRouter>
  );
};

export default ClientLayout;
