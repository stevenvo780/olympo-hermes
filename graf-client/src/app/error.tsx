'use client';

import { useEffect } from 'react';
import Link from 'next/link';

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function GlobalError({ error, reset }: ErrorProps) {
  useEffect(() => {
    if (typeof console !== 'undefined' && error) {
      console.error('App error boundary:', error);
    }
  }, [error]);

  return (
    <div className="container d-flex justify-content-center align-items-center" style={{ minHeight: '100vh' }}>
      <div className="card shadow-sm border-0" style={{ maxWidth: '500px' }}>
        <div className="card-body text-center p-5">
          <h1 className="display-1 fw-bold text-danger mb-0">!</h1>
          <h2 className="mb-3 fw-bold">Algo salió mal</h2>
          <p className="text-muted mb-4">
            Ocurrió un error inesperado. Intenta de nuevo.
          </p>
          <div className="d-flex gap-2 justify-content-center">
            <button
              type="button"
              className="btn btn-primary px-4 py-2"
              onClick={() => reset()}
            >
              Reintentar
            </button>
            <Link href="/" className="btn btn-outline-secondary px-4 py-2">
              Ir al inicio
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
