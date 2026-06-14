'use client';
import React, { memo } from 'react';
import { BrowserRouter } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';
import InfoAlert from '@/components/InfoAlert';
import Spinner from 'react-bootstrap/Spinner';
import { applyPalette } from '@/utils/theme';
import { defaultPalette } from '@/utils/defaultPalette';

interface ClientLayoutProps {
  children: React.ReactNode;
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

const ClientLayout: React.FC<ClientLayoutProps> = ({ children }) => {
  applyPalette(defaultPalette);

  return (
    <BrowserRouter>
      <Header />
      <div style={{
        marginTop: '4.1rem',
      }} />
      <main className="main-content">{children}</main>
      <InfoAlert />
      <Footer />
    </BrowserRouter>
  );
};

export default memo(ClientLayout);
