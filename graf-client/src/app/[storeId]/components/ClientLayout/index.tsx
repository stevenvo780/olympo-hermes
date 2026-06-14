'use client';
import React, { useEffect, useMemo, useCallback, memo } from 'react';
import { BrowserRouter } from 'react-router-dom';
import Header from '../Header';
import Footer from '../Footer';
import InfoAlert from '@/components/InfoAlert';
import { useParams, usePathname } from 'next/navigation';
import { useSelector } from 'react-redux';
import { toggleFilterSidebar } from '@/redux/ui';
import { RootState } from '@/redux/store';
import './styles.scss';
import { checkProfileComplete } from '@/services/orderService';
import Spinner from 'react-bootstrap/Spinner';
import { useStoreConfig } from '@/hooks/useStoreConfig';
import { useDispatch } from 'react-redux';
import BottomBar from './BottomBar';
import FloatingCart from './FloatingCart';
import { Store } from '@/types';
import { setStore } from '@/redux/ui';

interface ClientLayoutProps {
  children: React.ReactNode;
  initialStore: Store;
}

const LoadingSpinner = memo(() => (
  <div className="spinner-container" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '80vh' }}>
    <Spinner animation="border" role="status" style={{ width: '4rem', height: '4rem' }}>
      <span className="visually-hidden">Cargando...</span>
    </Spinner>
    <p style={{ marginTop: '1rem', fontStyle: 'italic' }}>¡Un momento, que universos se están alineando!</p>
  </div>
));

LoadingSpinner.displayName = 'LoadingSpinner';

const ClientLayout: React.FC<ClientLayoutProps> = ({ children, initialStore }) => {
  const { storeId } = useParams() as { storeId: string };
  const dispatch = useDispatch();

  const { loading: configLoading } = useStoreConfig(storeId || null);
  const store = useSelector((state: RootState) => state.ui.store);

  const finalConfig = store || initialStore;

  const pathname = usePathname();

  const userData = useSelector((state: RootState) => state.auth.userData);

  const isProductsPage = useMemo(() => {
    if (!pathname) return false;
    
    const parts = pathname.slice(1).split('/');
    
    return parts.length === 1;
  }, [pathname]);

  const isProfileComplete = useMemo(() =>
    checkProfileComplete(userData),
    [userData]
  );

  useEffect(() => {
    if (!store) {
      dispatch(setStore(initialStore));
    }
  }, [dispatch, store, initialStore]);

  useEffect(() => {
    const setViewportHeight = () => {
      const vh = window.innerHeight * 0.01;
      document.documentElement.style.setProperty('--vh', `${vh}px`);
    };

    setViewportHeight();
    window.addEventListener('resize', setViewportHeight);
    return () => window.removeEventListener('resize', setViewportHeight);
  }, []);

  const handleWhatsAppClick = useCallback(() => {
    const raw = `${finalConfig?.phonePrefix ?? ''}${finalConfig?.phoneNumber ?? ''}`;
    const digits = raw.replace(/\D/g, '');

    if (digits) {
      const message = encodeURIComponent('Hola, me gustaría hacer un pedido');
      window.open(`https://wa.me/${digits}?text=${message}`, '_blank');
    }
  }, [finalConfig]);

  const handleOpenFilters = useCallback(() => {
    dispatch(toggleFilterSidebar());
  }, [dispatch]);

  if (configLoading) {
    return <LoadingSpinner />;
  }

  return (
    <BrowserRouter>
      <Header />
      <main className="main-content">{children}</main>
      <InfoAlert />
      <Footer />
      <BottomBar
        storeId={storeId}
        isProductsPage={isProductsPage}
        handleOpenFilters={handleOpenFilters}
        handleWhatsAppClick={handleWhatsAppClick}
        paymentLink={finalConfig?.configuration.paymentLink}
      />
      <FloatingCart
        isProfileComplete={isProfileComplete}
      />
    </BrowserRouter>
  );
};

export default memo(ClientLayout);
