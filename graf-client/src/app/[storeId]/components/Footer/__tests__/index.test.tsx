/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import React from 'react';
import { createRoot, Root } from 'react-dom/client';
import { act } from 'react';

// Mock Redux store
vi.mock('react-redux', () => ({
  useSelector: vi.fn((selector) => {
    const mockState = {
      ui: {
        store: {
          configuration: {
            footer: {
              email: 'test@test.com',
              showSchedule: true,
              info: 'Store info',
            },
            store: { name: 'Test Store' },
            contactNumbers: ['+573001234567'],
            storeAddress: '123 Main St',
            schedule: [
              { day: 'monday', isOpen: true, openTime: '09:00', closeTime: '18:00' },
            ],
            socialNetworks: [{ name: 'facebook', url: 'https://fb.com' }],
            logo: '/logo.png',
          },
          owner: { subscription: { planType: 'free' } },
        },
      },
    };
    return selector(mockState);
  }),
}));

vi.mock('next/link', () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

vi.mock('react-bootstrap', () => {
  const MockComponent = ({ children }: { children?: React.ReactNode }) => <div>{children}</div>;
  return {
    Container: MockComponent,
    Row: MockComponent,
    Col: MockComponent,
    // eslint-disable-next-line @next/next/no-img-element
    Image: ({ src, alt }: { src: string; alt: string }) => <img src={src} alt={alt} />,
    Accordion: Object.assign(MockComponent, { Collapse: MockComponent }),
    Card: Object.assign(MockComponent, { Header: MockComponent, Body: MockComponent }),
    useAccordionButton: () => vi.fn(),
  };
});

vi.mock('react-icons/fa', () => ({
  FaFacebook: () => <span data-testid="fb">fb</span>,
  FaInstagram: () => <span>ig</span>,
  FaTwitter: () => <span>tw</span>,
  FaGlobe: () => <span>globe</span>,
  FaMapMarkerAlt: () => <span>map</span>,
  FaPhone: () => <span>phone</span>,
  FaEnvelope: () => <span>email</span>,
  FaChevronDown: () => <span>down</span>,
}));

vi.mock('@/redux/store', () => ({}));
vi.mock('@/types', () => ({ PlanType: { PRO: 'pro', ENTERPRISE: 'enterprise', FREE: 'free' } }));
vi.mock('./Footer.scss', () => ({}));

import Footer from '../index';

describe('Footer', () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
    Object.defineProperty(window, 'innerWidth', { value: 1024, writable: true });
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
  });

  it('renders footer element', async () => {
    await act(async () => root.render(<Footer />));
    expect(container.querySelector('footer')).toBeTruthy();
  });

  it('displays store name in footer', async () => {
    await act(async () => root.render(<Footer />));
    expect(container.textContent).toContain('Test Store');
  });

  it('renders contact section', async () => {
    await act(async () => root.render(<Footer />));
    expect(container.textContent).toContain('Contacto');
  });

  it('renders phone number', async () => {
    await act(async () => root.render(<Footer />));
    expect(container.textContent).toContain('573001234567');
  });

  it('renders email address', async () => {
    await act(async () => root.render(<Footer />));
    expect(container.textContent).toContain('test@test.com');
  });

  it('renders schedule section', async () => {
    await act(async () => root.render(<Footer />));
    expect(container.textContent).toContain('Horarios');
  });

  it('renders Graf logo for non-premium', async () => {
    await act(async () => root.render(<Footer />));
    expect(container.textContent).toContain('Graf');
  });
});
