'use client';

export default function ErrorPage({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '60vh',
        padding: '2rem',
        textAlign: 'center',
      }}
    >
      <h1 style={{ fontSize: '3rem', margin: 0, fontWeight: 700 }}>Error</h1>
      <p style={{ maxWidth: 480, color: 'var(--c-fg-muted, #6b7280)' }}>
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
    </div>
  );
}
