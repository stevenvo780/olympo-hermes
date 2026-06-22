'use client';
import React, { memo, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Navbar, Nav, Container, Dropdown } from 'react-bootstrap';
import NextImage from 'next/image';
import { useSelector } from 'react-redux';
import { RootState } from '@/redux/store';
import { logout } from '@/redux/auth';
import { useAppDispatch } from '@/redux/hooks';
import { FaHome, FaInfoCircle, FaUserCircle, FaSignOutAlt, FaSignInAlt } from 'react-icons/fa';

const Header: React.FC = () => {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const isLoggedIn = useSelector((state: RootState) => state.auth.isLoggedIn);
  const defaultTitle = 'Hermes';
  const defaultLogo = '/images/logo-hermes.png';
  const routesList = [
    { name: 'Inicio', path: '/', icon: <FaHome aria-hidden="true" /> },
    { name: 'Nosotros', path: '/graf/about', icon: <FaInfoCircle aria-hidden="true" /> },
  ];
  const handleLogout = useCallback(async () => {
    dispatch(logout());
    router.push('/graf/login');
  }, [dispatch, router]);
  const handleLoginRedirect = useCallback(() => {
    router.push('/graf/login');
  }, [router]);

  return (
    <Navbar
      className="navbar-dark"
      fixed="top"
      data-bs-theme="dark"
      style={{
        width: '100%',
        top: 0,
        zIndex: 1000,
        backgroundColor: 'var(--secondary-color)',
      }}
    >
      <Container>
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', textDecoration: 'none' }}>
          <NextImage src={defaultLogo} alt="Hermes logo" width={40} height={40} style={{ objectFit: 'contain' }} />
          <span style={{ color: 'var(--white-color)', fontSize: '1.3rem', fontWeight: 800 }}>{defaultTitle}</span>
        </Link>
        <Nav>
          {routesList.map((route, index) => (
            <Link
              key={index}
              href={route.path}
              style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.3rem', padding: '0.5rem 0.75rem', textDecoration: 'none', color: 'var(--white-color)' }}
            >
              {route.icon} {route.name}
            </Link>
          ))}
          <Dropdown align="end">
            <Dropdown.Toggle
              as="span"
              style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', fontSize: '1.3rem', lineHeight: 1, marginTop: '0.5rem', marginLeft: '0.5rem', color: 'var(--white-color)' }}
            >
              <FaUserCircle aria-label="Cuenta de usuario" />
            </Dropdown.Toggle>
            <Dropdown.Menu
              style={{ backgroundColor: 'var(--primary-color)', color: 'var(--white-color)' }}
            >
              {isLoggedIn ? (
                <Dropdown.Item onClick={handleLogout}>
                  <FaSignOutAlt aria-hidden="true" /> Cerrar sesión
                </Dropdown.Item>
              ) : (
                <Dropdown.Item onClick={handleLoginRedirect}>
                  <FaSignInAlt aria-hidden="true" /> Iniciar sesión
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
