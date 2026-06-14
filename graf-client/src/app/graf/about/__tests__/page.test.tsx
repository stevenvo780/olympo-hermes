/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import React from 'react';
import { createRoot, Root } from 'react-dom/client';
import { act } from 'react';

// Mock react-bootstrap
vi.mock('react-bootstrap', () => {
  const MockComponent = ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) => (
    <div {...props}>{children}</div>
  );
  return {
    Container: MockComponent,
    Row: MockComponent,
    Col: MockComponent,
    Card: Object.assign(MockComponent, { Body: MockComponent, Title: MockComponent, Text: MockComponent }),
    Button: MockComponent,
    Form: Object.assign(MockComponent, {
      Group: MockComponent,
      Label: MockComponent,
      Control: MockComponent,
    }),
  };
});

// Mock next/image
vi.mock('next/image', () => ({
  default: (props: React.ImgHTMLAttributes<HTMLImageElement>) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img alt="" {...props} />
  ),
}));

// Mock react-icons
vi.mock('react-icons/cg', () => ({
  CgPhone: () => <span>Phone</span>,
  CgMail: () => <span>Mail</span>,
  CgGlobe: () => <span>Globe</span>,
  CgFacebook: () => <span>Facebook</span>,
  CgInstagram: () => <span>Instagram</span>,
  CgChevronRight: () => <span>ChevronRight</span>,
}));

vi.mock('react-icons/fa', () => ({
  FaWhatsapp: () => <span>WhatsApp</span>,
}));

// Import after mocks
import AboutPage from '../page';

describe('AboutPage', () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => {
      root.unmount();
    });
    container.remove();
  });

  it('renders the about page with hero section', async () => {
    await act(async () => {
      root.render(<AboutPage />);
    });

    expect(container.querySelector('.about-page')).toBeTruthy();
    expect(container.textContent).toContain('Cauce');
    expect(container.textContent).toContain('Tecnología al servicio de tu crecimiento');
  });

  it('renders the services section', async () => {
    await act(async () => {
      root.render(<AboutPage />);
    });

    expect(container.textContent).toContain('Nuestros Servicios');
    expect(container.textContent).toContain('Desarrollo de Software a Medida');
    expect(container.textContent).toContain('Sistemas de Gestión');
    expect(container.textContent).toContain('Plataformas de E-Commerce');
    expect(container.textContent).toContain('Soporte Técnico');
  });

  it('renders the values section', async () => {
    await act(async () => {
      root.render(<AboutPage />);
    });

    expect(container.textContent).toContain('Valores que nos definen');
    expect(container.textContent).toContain('Innovación');
    expect(container.textContent).toContain('Calidad');
    expect(container.textContent).toContain('Compromiso');
    expect(container.textContent).toContain('Simplicidad');
  });

  it('renders the contact section', async () => {
    await act(async () => {
      root.render(<AboutPage />);
    });

    expect(container.textContent).toContain('Contáctanos');
    expect(container.textContent).toContain('+57 3246780067');
    expect(container.textContent).toContain('sales@humanizar.co');
  });

  it('renders the footer', async () => {
    await act(async () => {
      root.render(<AboutPage />);
    });

    expect(container.textContent).toContain('Cauce. Todos los derechos reservados.');
  });
});
