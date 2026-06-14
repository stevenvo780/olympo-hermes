'use client';
import React, { useEffect } from 'react';
import { useRouter, useParams, usePathname } from 'next/navigation';
import { Image } from 'react-bootstrap';
import { useSelector } from 'react-redux';
import { RootState } from '@/redux/store';
import { useAppDispatch } from '@/redux/hooks';
import { logout } from '@/redux/auth';
import { setMobileSidebarVisible, toggleSidebar } from '@/redux/ui';
import routesConfig from '@/config/routesConfig.json';
import * as CgIcons from "react-icons/cg";
import { FiLogIn, FiLogOut } from "react-icons/fi";
import './styles.scss';
import { UserRole } from '@/types';

type IconKey = keyof typeof CgIcons;

interface RouteItem {
  path: string;
  name: string;
  viewHeader: boolean;
  hidden: boolean;
  icon?: string;
  owner?: boolean;
  seo: {
    title: string;
    description: string;
    keywords: string;
    type: string;
    robots?: string;
  };
}

const Header: React.FC = () => {
  const router = useRouter();
  const pathname = usePathname();
  const dispatch = useAppDispatch();
  const isLoggedIn = useSelector((state: RootState) => state.auth.isLoggedIn);
  const userRole = useSelector((state: RootState) => state.auth.userData?.role);
  const user = useSelector((state: RootState) => state.auth.userData);
  const { storeId } = useParams() as { storeId: string };
  const config = useSelector((state: RootState) => state.config.config);

  const collapsed = useSelector((state: RootState) => state.ui.sidebarCollapsed);
  const showSidebar = useSelector((state: RootState) => state.ui.isMobileSidebarVisible);

  const [isMobile, setIsMobile] = React.useState(false);

  const defaultTitle = "Graf";
  const defaultLogo = "/images/logo.svg";
  const storeName = storeId && config?.store?.name ? config.store.name : defaultTitle;
  const logoSrc = storeId ? (config?.logo || defaultLogo) : defaultLogo;
  const defaultNavbarHeight = 60;
  const minNavbarHeight = 48;
  const maxNavbarHeight = 200;
  const rawNavbarHeight = config?.navbarHeight;
  const configNavbarHeight = typeof rawNavbarHeight === 'number' && Number.isFinite(rawNavbarHeight)
    ? rawNavbarHeight
    : defaultNavbarHeight;
  const navbarHeight = storeId
    ? Math.min(Math.max(configNavbarHeight, minNavbarHeight), maxNavbarHeight)
    : defaultNavbarHeight;
  const showNavbarLogo = storeId ? (config?.showNavbarLogo ?? true) : true;

  useEffect(() => {
    const checkIsMobile = () => {
      const mobile = window.innerWidth < 992;
      setIsMobile(mobile);

      if (!mobile && showSidebar) {
        dispatch(setMobileSidebarVisible(false));
      }
    };

    checkIsMobile();
    window.addEventListener('resize', checkIsMobile);

    return () => {
      window.removeEventListener('resize', checkIsMobile);
    };
  }, [dispatch, showSidebar]);

  useEffect(() => {
    document.body.classList.toggle('sidebar-collapsed', collapsed);
  }, [collapsed]);

  useEffect(() => {
    if (typeof document === 'undefined') return;
    document.documentElement.style.setProperty('--navbar-height', `${navbarHeight}px`);
  }, [navbarHeight]);

  const handleLogout = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      await dispatch(logout());
      router.push('/login');
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    }
  };

  const handleLoginRedirect = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    router.push('/login');
  };

  const handleToggleSidebar = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dispatch(toggleSidebar());
  };

  const handleRoute = (path: string, e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    const id = Array.isArray(storeId) ? storeId[0] : storeId;
    const finalPath = path.includes('[storeId]') && id
      ? path.replace('[storeId]', id)
      : path;
    router.push(finalPath);
    if (isMobile && showSidebar) dispatch(setMobileSidebarVisible(false));
  };

  const renderIcon = (iconName?: string) => {
    if (!iconName) return <CgIcons.CgMenuGridO size={24} />;

    const iconExists = Object.prototype.hasOwnProperty.call(CgIcons, iconName);

    if (iconExists) {
      const Icon = CgIcons[iconName as IconKey];
      return <Icon size={24} />;
    }

    return <CgIcons.CgMenuGridO size={24} />;
  };

  const publicRoutes = routesConfig.publicRoutes as RouteItem[];
  const allRoutes = [] as RouteItem[];
  for (const route of Object.values(UserRole)) {
    if (routesConfig.roleRoutes[route]) {
      allRoutes.push(...routesConfig.roleRoutes[route]);
    }
  }

  const roleRoutes = [] as RouteItem[];

  for (const route of allRoutes) {
    if (routesConfig.roleRoutes[userRole as keyof typeof routesConfig.roleRoutes]) {
      if (route.owner) {
        if (config?.store?.owner?.id === user?.id) {
          roleRoutes.push(route)
        }
      } else {
        roleRoutes.push(route);
      }
    }
  }

  const combinedRoutes = [...publicRoutes, ...roleRoutes];
  const mainRoutes = combinedRoutes.filter(route => !route.hidden && route.viewHeader !== false);

  const filteredMainRoutes = (storeId
    ? mainRoutes
    : mainRoutes.filter(route => !route.path.includes('[storeId]'))
  ).filter(route => {
    // Hide the Distribución menu item unless the feature flag is enabled.
    if (route.path === '/[storeId]/distribucion') {
      return config?.activations?.distributionEnabled === true;
    }
    return true;
  });

  const sidebarClasses = [
    "sidebar",
    collapsed ? "collapsed" : '',
    isMobile && !showSidebar ? "hidden" : ''
  ].filter(Boolean).join(' ');

  return (
    <div className="layout-wrapper">
      <header className="navbar-container">
        <div className="navbar">
          <div className="navbarLeft">
            {isMobile && (
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  dispatch(setMobileSidebarVisible(!showSidebar));
                }}
                className="mobileMenuBtn"
                aria-label="Toggle mobile sidebar"
                type="button"
              >
                <CgIcons.CgMenu size={20} />
              </button>
            )}
            <div
              className={`navbarLogo ${showNavbarLogo ? 'hasLogo' : 'noLogo'}`}
              onClick={(e) => handleRoute('/', e)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && handleRoute('/')}
            >
              {showNavbarLogo && (
                <Image
                  src={logoSrc}
                  alt="Logo"
                  className="navbarLogoImage"
                />
              )}
              <span className="navbarTitle">{storeName}</span>
            </div>
          </div>

          <div className="navbarRight">
            <div className="statusButtons">
              {storeId && !isMobile && (
                <a
                  href={`${process.env.NEXT_PUBLIC_STORE_URL}/${storeId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="statusButton"
                  title="Ver tienda"
                  onClick={(e) => e.stopPropagation()}
                >
                  <CgIcons.CgShoppingBag size={20} />
                  <span className="buttonText">Ir a la tienda</span>
                </a>
              )}
              {!isMobile && (
                <button
                  className="statusButton"
                  onClick={(e) => handleRoute('/pricing', e)}
                  type="button"
                  aria-label="Planes"
                >
                  <CgIcons.CgTag size={20} />
                  <span className="buttonText">Planes</span>
                </button>
              )}
              {!isMobile && (
                <button
                  className="statusButton"
                  onClick={(e) => handleRoute('/about', e)}
                  type="button"
                  aria-label="Soporte"
                >
                  <CgIcons.CgInfo size={20} />
                  <span className="buttonText">Soporte</span>
                </button>
              )}
              {isLoggedIn && !isMobile && (
                <button
                  className="statusButton"
                  onClick={(e) => handleRoute('/profile', e)}
                  type="button"
                  aria-label="Perfil"
                >
                  <CgIcons.CgOptions size={20} />
                  <span className="buttonText">Cuenta</span>
                </button>
              )}
            </div>

            {isLoggedIn ? (
              <button
                onClick={handleLogout}
                className="authButton logoutBtn"
                aria-label="Cerrar sesión"
                type="button"
              >
                <FiLogOut size={20} className="logout-icon" />
                <span className="buttonText">Cerrar sesión</span>
              </button>
            ) : (
              <button
                onClick={handleLoginRedirect}
                className="authButton loginBtn"
                aria-label="Iniciar sesión"
                type="button"
              >
                <FiLogIn size={20} className="login-icon" />
                <span className="buttonText">Iniciar sesión</span>
              </button>
            )}
          </div>
        </div>
      </header>

      <div className="content-wrapper">
        <aside className={sidebarClasses}>
          <nav className="sidebarMenu">
            {isMobile && (
              <>
                {storeId && (
                  <div
                    className="sidebarMenuItem mobileOnly"
                    onClick={() => window.open(`${process.env.NEXT_PUBLIC_STORE_URL}/${storeId}`, '_blank')}
                  >
                    <div className="sidebarIcon">
                      <CgIcons.CgShoppingBag size={24} />
                    </div>
                    <span>Ir a la tienda</span>
                  </div>
                )}
                <div
                  className="sidebarMenuItem mobileOnly"
                  onClick={(e) => handleRoute('/pricing', e)}
                >
                  <div className="sidebarIcon">
                    <CgIcons.CgTag size={24} />
                  </div>
                  <span>Planes</span>
                </div>
                <div
                  className="sidebarMenuItem mobileOnly"
                  onClick={(e) => handleRoute('/about', e)}
                >
                  <div className="sidebarIcon">
                    <CgIcons.CgInfo size={24} />
                  </div>
                  <span>Soporte</span>
                </div>
                {isLoggedIn && (
                  <div
                    className="sidebarMenuItem mobileOnly"
                    onClick={(e) => handleRoute('/profile', e)}
                  >
                    <div className="sidebarIcon">
                      <CgIcons.CgOptions size={24} />
                    </div>
                    <span>Cuenta</span>
                  </div>
                )}
                <div className="sidebarDivider"></div>
              </>
            )}

            {filteredMainRoutes.map((route, index) => {
              const isActive = route.path === '/'
                ? pathname === '/'
                : route.path.split('/').pop() === pathname?.split('/').pop();
              return (
                <div
                  key={index}
                  className={`sidebarMenuItem ${isActive ? "active" : ""}`}
                  onClick={(e) => handleRoute(route.path, e)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => e.key === 'Enter' && handleRoute(route.path)}
                >
                  <div className={`sidebarIcon ${isActive ? "active" : ""}`}>
                    {renderIcon(route.icon)}
                  </div>
                  {(isMobile || !collapsed) && (
                    <span >{route.name}</span>
                  )}
                </div>
              )
            })}
            {isLoggedIn && (
              <div
                onClick={(e) => {
                  e.stopPropagation();
                  const path = storeId
                    ? `/${storeId}/dashboard`
                    : '/dashboard';
                  router.push(path);
                  if (isMobile && showSidebar) dispatch(setMobileSidebarVisible(false));
                }}
                className="sidebarMenuItem"
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    const path = storeId ? `/${storeId}/dashboard` : '/dashboard';
                    router.push(path);
                    if (isMobile && showSidebar) dispatch(setMobileSidebarVisible(false));
                  }
                }}
              >
                <div className="sidebarIcon">
                  <CgIcons.CgBox size={24} />
                </div>
                {(isMobile || !collapsed) && (
                  <span>Dashboard</span>
                )}
              </div>
            )}
          </nav>
          {!isMobile && (
            <div className="sidebarToggleContainer">
              <button
                className="sidebarToggleBtn"
                onClick={handleToggleSidebar}
                type="button"
                aria-label={collapsed ? "Expandir menú" : "Colapsar menú"}
              >
                {collapsed ?
                  <CgIcons.CgChevronRight size={22} /> :
                  <CgIcons.CgChevronLeft size={22} />
                }
              </button>
            </div>
          )}
        </aside>

        {isMobile && showSidebar && (
          <div
            className="overlay"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              dispatch(setMobileSidebarVisible(false));
            }}
            role="button"
            tabIndex={-1}
            aria-label="Cerrar menú"
          />
        )}
      </div>
    </div>
  );
};

export default Header;
