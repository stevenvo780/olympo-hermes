'use client';

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="es">
      <body
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          margin: 0,
          padding: '2rem',
          textAlign: 'center',
          fontFamily: 'system-ui, sans-serif',
        }}
      >
        <h1 style={{ fontSize: '3rem', margin: 0, fontWeight: 700 }}>Error</h1>
        <p style={{ maxWidth: 480, color: '#6b7280' }}>
          Algo salió mal. Intenta de nuevo o vuelve al inicio.
        </p>
        <button
          onClick={() => reset()}
          style={{
            marginTop: '1.5rem',
            padding: '0.5rem 1.25rem',
            border: 'none',
            borderRadius: 6,
            background: '#0B8A8F',
            color: '#fff',
            cursor: 'pointer',
            fontSize: '1rem',
          }}
        >
          Reintentar
        </button>
      </body>
    </html>
  );
}
