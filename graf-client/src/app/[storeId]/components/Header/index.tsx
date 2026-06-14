'use client';
import React, { useState, useCallback, useMemo, memo, useEffect, forwardRef, useRef } from 'react';
import { useRouter, useParams, usePathname } from 'next/navigation';
import { Navbar, Nav, Container, Dropdown, Image, Offcanvas } from 'react-bootstrap';
import { useSelector } from 'react-redux';
import { logout } from '@/redux/auth';
import { useAppDispatch } from '@/redux/hooks';
import { FaSearch, FaUser, FaHome, FaInfoCircle, FaShoppingBag, FaUserEdit, FaBars, FaClipboardList } from 'react-icons/fa';
import { CgMenuGridO } from 'react-icons/cg';
import { setSearchText } from '@/redux/ui';
import { setFilters } from '@/redux/products';
import './styles.scss';
import { RootState } from '@/redux/store';

const SearchInput = forwardRef<HTMLInputElement, {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onKeyPress: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  placeholder?: string;
}>(({
  value,
  onChange,
  onKeyPress,
  placeholder = 'Buscar productos'
}, ref) => (
  <div className="search-input-container">
    <FaSearch className="search-icon" />
    <input
      ref={ref}
      type="text"
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      onKeyPress={onKeyPress}
      className="search-input"
    />
  </div>
));

SearchInput.displayName = 'SearchInput';

const Header: React.FC = () => {
  const router = useRouter();
  const pathname = usePathname();
  const dispatch = useAppDispatch();
  const { storeId } = useParams() as { storeId: string };

  const isLoggedIn = useSelector((state: RootState) => state.auth.isLoggedIn);
  const config = useSelector((state: RootState) => state.ui.store?.configuration);
  const searchText = useSelector((state: RootState) => state.ui.searchText);

  const [showSidebar, setShowSidebar] = useState(false);

  const searchRef = useRef<HTMLInputElement>(null);

  const storeName = config?.store?.name || 'Graf';
  const logoSrc = config?.logo || '/images/logo.svg';
  const defaultNavbarHeight = 60;
  const minNavbarHeight = 48;
  const maxNavbarHeight = 200;
  const rawNavbarHeight = config?.navbarHeight;
  const navbarHeight = typeof rawNavbarHeight === 'number' && Number.isFinite(rawNavbarHeight)
    ? Math.min(Math.max(rawNavbarHeight, minNavbarHeight), maxNavbarHeight)
    : defaultNavbarHeight;
  const showNavbarLogo = config?.showNavbarLogo ?? true;
  const showNavbarTitle = config?.showNavbarTitle ?? true;

  const distributionEnabled = config?.activations?.distributionEnabled === true;
  const publicRoutes = useMemo(() => [
    { path: `/${storeId}`, name: 'Inicio', icon: <FaHome style={{ color: 'var(--navbar-text)' }} /> },
    { path: `/${storeId}/about`, name: 'Nosotros', icon: <FaInfoCircle style={{ color: 'var(--navbar-text)' }} /> },
    // The seller capture view is only visible for tenants with the
    // distribution feature enabled (J4).
    ...(distributionEnabled
      ? [{ path: `/${storeId}/vendedor`, name: 'Vendedor', icon: <FaClipboardList style={{ color: 'var(--navbar-text)' }} /> }]
      : []),
  ], [storeId, distributionEnabled]);

  const userRoutes = useMemo(() => [
    { path: `/${storeId}/orders`, name: 'Órdenes', icon: <FaShoppingBag style={{ color: 'var(--navbar-text)' }} /> }
  ], [storeId]);

  const routes = useMemo(() =>
    isLoggedIn ? [...publicRoutes, ...userRoutes] : publicRoutes,
    [isLoggedIn, publicRoutes, userRoutes]
  );

  const isRouteActive = useCallback((path: string) => {
    if (path === `/${storeId}`) {
      return pathname === `/${storeId}` || pathname === '/';
    }

    return pathname === path ||
      (pathname.startsWith(path) &&
        pathname.slice(path.length).match(/^(\/[^\/]+)?$/));
  }, [pathname, storeId]);

  const handleLogout = useCallback(() => {
    dispatch(logout());
    router.push(`/${storeId}/login`);
    setShowSidebar(false);
  }, [dispatch, router, storeId]);

  const handleLoginRedirect = useCallback(() => {
    router.push(`/${storeId}/login`);
    setShowSidebar(false);
  }, [router, storeId]);

  const handleLogoClick = useCallback(() => {
    router.push(`/${storeId}`);
  }, [router, storeId]);

  const handleToggleSidebar = useCallback(() => setShowSidebar(prev => !prev), []);

  const handleRoute = useCallback((path: string) => {
    searchRef.current?.blur();
    router.push(path);
    setShowSidebar(false);
  }, [router]);

  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    dispatch(setSearchText(value));
    if (value === '') {
      dispatch(setFilters({ category: '', minPrice: 0, maxPrice: 0, discount: '' }));
    }
  }, [dispatch]);

  const handleSearchKeyPress = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && searchText.length >= 3) {
      e.preventDefault();
      router.push(`/${storeId}`);
    }
  }, [searchText, router, storeId]);

  useEffect(() => {
    if (searchText.length >= 3 && !pathname.includes('/products')) {
      const timer = setTimeout(() => {
        router.push(`/${storeId}`);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [searchText, pathname, router, storeId]);

  useEffect(() => {
    if (typeof document === 'undefined') return;
    document.documentElement.style.setProperty('--navbar-height', `${navbarHeight}px`);
  }, [navbarHeight]);

  const handleProfileRedirect = useCallback(() => {
    router.push(`/${storeId}/profile`);
    setShowSidebar(false);
  }, [router, storeId]);

  const renderSearchInput = useCallback((containerClass: string) => (
    <div className={containerClass}>
      <SearchInput
        ref={searchRef}
        value={searchText}
        onChange={handleSearchChange}
        onKeyPress={handleSearchKeyPress}
      />
    </div>
  ), [searchText, handleSearchChange, handleSearchKeyPress]);

  const renderedMainRoutes = useMemo(() => (
    routes.map((route, index) => (
      <div
        key={index}
        onClick={() => handleRoute(route.path)}
        className={`nav-link custom-nav-link ${isRouteActive(route.path) ? 'active-route' : ''}`}
      >
        <span className="nav-link-icon">{route.icon}</span>
        <p className="nav-link-text">{route.name}</p>
      </div>
    ))
  ), [routes, handleRoute, isRouteActive]);

  const renderedSidebar = useMemo(() => (
    <Offcanvas
      show={showSidebar}
      onHide={handleToggleSidebar}
      placement="end"
      className="sidebar-menu"
      backdrop={false}
    >
      <Offcanvas.Header closeButton className="sidebar-header">
        <Offcanvas.Title>Menú</Offcanvas.Title>
      </Offcanvas.Header>
      <Offcanvas.Body>
        <Nav className="flex-column">
          {routes.map((route, index) => (
            <div
              key={index}
              onClick={() => handleRoute(route.path)}
              className={`nav-link custom-nav-link ${isRouteActive(route.path) ? 'active-route' : ''}`}
            >
              <span className="nav-link-icon me-2 s">{route.icon}</span>
              {route.name}
            </div>
          ))}
          {isLoggedIn ? (
            <>
              <Nav.Link onClick={handleProfileRedirect} className="sidebar-button">
                <div className="sidebar-button-content">
                  <FaUserEdit className="sidebar-button-icon" />
                  <span className="sidebar-button-text">Editar Perfil</span>
                </div>
              </Nav.Link>
              <Nav.Link onClick={handleLogout} className="sidebar-button">
                <div className="sidebar-button-content">
                  <FaUser className="sidebar-button-icon" />
                  <span className="sidebar-button-text">Cerrar sesión</span>
                </div>
              </Nav.Link>
            </>
          ) : (
            <Nav.Link onClick={handleLoginRedirect} className="sidebar-button">
              <div className="sidebar-button-content">
                <FaUser className="sidebar-button-icon" />
                Iniciar sesión
              </div>
            </Nav.Link>
          )}
        </Nav>
      </Offcanvas.Body>
    </Offcanvas>
  ), [showSidebar, handleToggleSidebar, routes, isLoggedIn, handleRoute, handleLogout, handleLoginRedirect, isRouteActive, handleProfileRedirect]);

  return (
    <>
      <Navbar expand="lg" className="navbar-dark header-navbar" style={{ backgroundColor: 'var(--navbar-color)' }}>
        <Container fluid className="pl-4 pr-4 d-flex justify-content-between">
          <div className={`header-logo-container ${showNavbarLogo ? 'has-logo' : 'no-logo'} ${showNavbarTitle ? 'has-title' : 'no-title'}`}>
            {(showNavbarLogo || showNavbarTitle) && (
            <div onClick={handleLogoClick} className="d-flex align-items-center header-logo">
              {showNavbarLogo && (
                <Image src={logoSrc} alt="Logo" className="header-logo-image" />
              )}
              {showNavbarTitle && (
                <div className="d-none d-lg-block store-name-wrapper" style={{ minWidth: '300px' }}>
                  <span style={{
                    fontSize: '1.5rem',
                    fontWeight: 'bold',
                    color: 'var(--navbar-text)',
                    display: 'inline-block'
                  }}>
                    {storeName}
                  </span>
                </div>
              )}
            </div>
            )}
          </div>

          {renderSearchInput('header-search-container d-none d-lg-flex')}
          {renderSearchInput('header-search-container-mobile d-flex d-lg-none')}

          <div className="header-nav-container d-none d-lg-flex">
            <Nav className="align-items-center">
              {renderedMainRoutes}
              <Dropdown align="end">
                <Dropdown.Toggle as="span" id="dropdown-basic" className="header-menu-toggle">
                  {isLoggedIn ? <FaUser size={20} className="custom-icon" /> : <CgMenuGridO size={20} className="custom-icon" />}
                </Dropdown.Toggle>
                <Dropdown.Menu>
                  {isLoggedIn ? (
                    <>
                      <Dropdown.Item onClick={handleProfileRedirect}>Editar Perfil</Dropdown.Item>
                      <Dropdown.Item onClick={handleLogout}>Cerrar sesión</Dropdown.Item>
                    </>
                  ) : (
                    <Dropdown.Item onClick={handleLoginRedirect}>Iniciar sesión</Dropdown.Item>
                  )}
                </Dropdown.Menu>
              </Dropdown>
            </Nav>
          </div>

          <div className="d-flex d-lg-none align-items-center">
            <button
              className="navbar-toggler"
              type="button"
              onClick={handleToggleSidebar}
              aria-label="Toggle navigation"
            >
              <FaBars
                size={22}
                className="toggle-menu-icon"
                style={{
                  color: 'var(--navbar-text)',
                  fill: 'var(--navbar-text)',
                  stroke: 'var(--navbar-text)',
                }}
              />
            </button>
          </div>
        </Container>
      </Navbar>
      {renderedSidebar}
    </>
  );
};

export default memo(Header);
