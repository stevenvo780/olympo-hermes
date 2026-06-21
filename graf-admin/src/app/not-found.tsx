'use client';

import Link from 'next/link';
import { Button } from 'prizma-ui';

export default function NotFound() {
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
      <h1 style={{ fontSize: '4rem', margin: 0, fontWeight: 700 }}>404</h1>
      <h2 style={{ marginTop: '0.5rem' }}>Página no encontrada</h2>
      <p style={{ maxWidth: 480, color: 'var(--c-fg-muted, #6b7280)' }}>
        La ruta que buscas no existe o fue movida. Verifica la URL o vuelve al panel principal.
      </p>
      <Link href="/" style={{ marginTop: '1.5rem' }}>
        <Button variant="primary">Volver al inicio</Button>
      </Link>
    </div>
  );
}
