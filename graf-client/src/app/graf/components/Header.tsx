'use client';
import React, { memo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Navbar, Nav, Container, Dropdown, Image } from 'react-bootstrap';
import { useSelector } from 'react-redux';
import { RootState } from '@/redux/store';
import { logout } from '@/redux/auth';
import { useAppDispatch } from '@/redux/hooks';
import { FaHome, FaInfoCircle, FaUserCircle, FaSignOutAlt, FaSignInAlt } from 'react-icons/fa';

const Header: React.FC = () => {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const isLoggedIn = useSelector((state: RootState) => state.auth.isLoggedIn);
  const defaultTitle = "Graf";
  const defaultLogo = "/images/logo.svg";
  const routesList = [
    { name: 'Inicio', path: '/', icon: <FaHome /> },
    { name: 'Nosotros', path: '/graf/about', icon: <FaInfoCircle /> }
  ];
  const handleLogout = useCallback(async () => {
    dispatch(logout());
    router.push('/login');
  }, [dispatch, router]);
  const handleLoginRedirect = useCallback(() => {
    router.push('/login');
  }, [router]);
  const handleLogoClick = useCallback(() => {
    router.push('/');
  }, [router]);
  const handleRoute = useCallback((path: string) => {
    router.push(path);
  }, [router]);

  return (
    <Navbar
      className="navbar-dark"
      fixed="top"
      bg="secondary"
      data-bs-theme="dark"
      style={{ width: '100%', top: 0, zIndex: 1000 }}
    >
      <Container>
        <div
          onClick={handleLogoClick}
          style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', gap: '0.5rem' }}
        >
          <Image src={defaultLogo} alt="Logo"  width={50} height={50} />
          <span style={{ color: 'var(--white-color)', fontSize: '1.3rem', fontWeight:'800' }}>{defaultTitle}</span>
        </div>
        <Nav>
          {routesList.map((route, index) => (
            <Nav.Link
              key={index}
              onClick={() => handleRoute(route.path)}
              style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.3rem' }}
            >
              <span style={{ color: 'var(--white-color)' }}>{route.icon} {route.name}</span>
            </Nav.Link>
          ))}
          <Dropdown align="end">
            <Dropdown.Toggle
              as="span"
              style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', fontSize: '1.3rem', lineHeight: 1, marginTop: '0.5rem', marginLeft: '0.5rem', color: 'var(--white-color)' }}            >
              <FaUserCircle />
            </Dropdown.Toggle>
            <Dropdown.Menu
              style={{ backgroundColor: 'var(--primary-color)', color: 'var(--white-color)' }}
            >
              {isLoggedIn ? (
                <Dropdown.Item onClick={handleLogout}>
                  <FaSignOutAlt /> Cerrar sesión
                </Dropdown.Item>
              ) : (
                <Dropdown.Item onClick={handleLoginRedirect}>
                  <FaSignInAlt /> Iniciar sesión
                </Dropdown.Item>
              )}
            </Dropdown.Menu>
          </Dropdown>
        </Nav>
      </Container>
    </Navbar>
  );
};

export default memo(Header);
