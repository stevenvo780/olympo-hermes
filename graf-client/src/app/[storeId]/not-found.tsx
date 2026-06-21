import Link from 'next/link';
import { Metadata } from 'next';
import React from 'react';

export const metadata: Metadata = {
  title: 'Página no encontrada',
  description: 'La página que estás buscando no existe',
  robots: { index: false, follow: false }
};

export default function NotFound() {
  return (
    <div className="container d-flex justify-content-center align-items-center" style={{ minHeight: '100vh' }}>
      <div className="card shadow-sm border-0" style={{ maxWidth: '500px' }}>
        <div className="card-body text-center p-5">
          <h1 className="display-1 fw-bold text-primary mb-0">404</h1>
          <h2 className="mb-3 fw-bold">Página no encontrada</h2>
          <p className="text-muted mb-4">
            La página que estás buscando no existe o fue movida.
          </p>
          <Link href="/" className="btn btn-primary px-4 py-2">
            Volver al inicio
          </Link>
        </div>
      </div>
    </div>
  );
}
