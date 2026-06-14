/* @vitest-environment jsdom */
/* eslint-disable @next/next/no-img-element */
import React from 'react';
import { render, screen, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import AboutPage from '../page';
import { useSelector } from 'react-redux';

// Mock Dependencies
vi.mock('react-redux', () => ({
  useSelector: vi.fn(),
  useDispatch: vi.fn(),
}));

vi.mock('next/image', () => ({
  default: ({ src, alt }: any) => <img src={src} alt={alt} />
}));

vi.mock('../GoogleMap', () => ({
  default: ({ location }: any) => <div data-testid="google-map">Map: {location.lat}, {location.lng}</div>
}));

vi.mock('@/components/SafeHtmlRenderer', () => ({
  default: ({ html }: any) => <div data-testid="html-renderer" dangerouslySetInnerHTML={{ __html: html }} />
}));

describe('AboutPage', () => {
  const storeData = {
    name: 'Test Store',
    id: 'test-store',
    configuration: {
      seo: { metaTitle: 'SEO Title', metaDescription: 'SEO Desc' },
      logo: '/logo.png',
      about: '<p>About Us</p>',
      coordinates: { lat: 10, lng: 20 },
      storeAddress: '123 Test St',
      socialNetworks: [{ name: 'Facebook', url: 'http://fb.com' }],
      legal: {
        legalNotice: '<p>Legal Notice</p>',
        termsOfServiceLink: 'http://terms.com',
        disclaimer: '<p>Disclaimer</p>'
      }
    }
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (useSelector as unknown as ReturnType<typeof vi.fn>).mockImplementation((cb) => cb({
      ui: { store: storeData }
    }));
  });

  afterEach(() => {
    cleanup();
  });

  it('renders loading state when store is missing', () => {
    (useSelector as unknown as ReturnType<typeof vi.fn>).mockImplementation((cb) => cb({
      ui: { store: null }
    }));
    render(<AboutPage />);
    expect(screen.getByText('Cargando información...')).toBeTruthy();
  });

  it('renders store info and SEO description', () => {
    render(<AboutPage />);
    expect(screen.getByText('Test Store')).toBeTruthy();
    expect(screen.getByText('SEO Desc')).toBeTruthy();
    expect(screen.getByAltText('Test Store logo')).toBeTruthy();
  });

  it('updates document title', () => {
    render(<AboutPage />);
    expect(document.title).toBe('SEO Title');
  });

  it('renders about section', () => {
    render(<AboutPage />);
    expect(screen.getByText('Quienes somos')).toBeTruthy();
    expect(screen.getByText('About Us')).toBeTruthy();
  });

  it('renders location section with map', () => {
    render(<AboutPage />);
    expect(screen.getByText('Nuestra Ubicación')).toBeTruthy();
    const map = screen.getByTestId('google-map');
    expect(map.textContent).toContain('Map: 10, 20');
    expect(screen.getByText('123 Test St')).toBeTruthy();
  });

  it('renders social networks', () => {
    render(<AboutPage />);
    expect(screen.getByText('Encuentranos')).toBeTruthy();
    expect(screen.getByText('Facebook')).toBeTruthy();
  });

  it('renders legal info', () => {
    render(<AboutPage />);
    expect(screen.getByText('Información Legal')).toBeTruthy();
    expect(screen.getByText('Aviso Legal')).toBeTruthy();
    expect(screen.getByText('Legal Notice')).toBeTruthy();
    expect(screen.getByText('Términos de Servicio')).toBeTruthy();
    expect(screen.getByText('Aviso Importante')).toBeTruthy(); // Disclaimer header
  });
});
