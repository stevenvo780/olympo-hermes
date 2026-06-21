'use client';

interface GlobalErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function GlobalError({ error, reset }: GlobalErrorProps) {
  return (
    <html lang="es">
      <body>
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1rem',
          fontFamily: 'system-ui, -apple-system, sans-serif'
        }}>
          <div style={{ maxWidth: '500px', textAlign: 'center' }}>
            <h1 style={{ fontSize: '4rem', color: '#dc3545', margin: 0 }}>500</h1>
            <h2 style={{ marginTop: '1rem' }}>Error del servidor</h2>
            <p style={{ color: '#6c757d', margin: '1rem 0 1.5rem' }}>
              Ocurrió un error inesperado. Por favor intenta de nuevo.
            </p>
            <button
              type="button"
              onClick={() => reset()}
              style={{
                padding: '0.5rem 1.5rem',
                backgroundColor: '#0d6efd',
                color: 'white',
                border: 'none',
                borderRadius: '0.25rem',
                cursor: 'pointer',
                fontSize: '1rem'
              }}
            >
              Reintentar
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
