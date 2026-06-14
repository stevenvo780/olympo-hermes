/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import React from 'react';
import { createRoot, Root } from 'react-dom/client';
import { act } from 'react';

// Mock hooks
const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
  useParams: () => ({ storeId: 'store1' }),
  usePathname: () => '/store1',
}));

vi.mock('react-redux', () => ({
  useSelector: vi.fn((selector) => {
    const mockState = {
      auth: { isLoggedIn: false },
      ui: {
        store: {
          configuration: {
            store: { name: 'Test Store' },
            logo: '/logo.png',
            showNavbarLogo: true,
            showNavbarTitle: true,
            navbarHeight: 60,
          },
        },
        searchText: '',
      },
    };
    return selector(mockState);
  }),
}));

vi.mock('@/redux/hooks', () => ({
  useAppDispatch: () => vi.fn(),
}));

vi.mock('@/redux/auth', () => ({ logout: vi.fn() }));
vi.mock('@/redux/ui', () => ({ setSearchText: vi.fn() }));
vi.mock('@/redux/products', () => ({ setFilters: vi.fn() }));
vi.mock('@/redux/store', () => ({}));

vi.mock('react-bootstrap', () => {
  const MockComponent = ({ children }: { children?: React.ReactNode }) => <div>{children}</div>;
  return {
    Navbar: MockComponent,
    Nav: Object.assign(MockComponent, { Link: MockComponent }),
    Container: MockComponent,
    Dropdown: Object.assign(MockComponent, {
      Toggle: MockComponent,
      Menu: MockComponent,
      Item: ({ children, onClick }: { children: React.ReactNode; onClick?: () => void }) => (
        <button onClick={onClick}>{children}</button>
      ),
    }),
    // eslint-disable-next-line @next/next/no-img-element
    Image: ({ src, alt }: { src: string; alt: string }) => <img src={src} alt={alt} />,
    Offcanvas: Object.assign(MockComponent, {
      Header: MockComponent,
      Title: MockComponent,
      Body: MockComponent,
    }),
  };
});

vi.mock('react-icons/fa', () => ({
  FaSearch: () => <span data-testid="search">search</span>,
  FaUser: () => <span data-testid="user">user</span>,
  FaHome: () => <span>home</span>,
  FaInfoCircle: () => <span>info</span>,
  FaShoppingBag: () => <span>bag</span>,
  FaUserEdit: () => <span>edit</span>,
  FaBars: () => <span data-testid="menu">menu</span>,
}));

vi.mock('react-icons/cg', () => ({
  CgMenuGridO: () => <span>grid</span>,
}));

vi.mock('./styles.scss', () => ({}));

import Header from '../index';

describe('Header', () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
    mockPush.mockClear();
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
  });

  it('renders header navbar', async () => {
    await act(async () => root.render(<Header />));
    expect(container.innerHTML.length).toBeGreaterThan(0);
  });

  it('displays store name', async () => {
    await act(async () => root.render(<Header />));
    expect(container.textContent).toContain('Test Store');
  });

  it('renders search icon', async () => {
    await act(async () => root.render(<Header />));
    expect(container.querySelector('[data-testid="search"]')).toBeTruthy();
  });

  it('renders menu toggle', async () => {
    await act(async () => root.render(<Header />));
    expect(container.querySelector('[data-testid="menu"]')).toBeTruthy();
  });

  it('renders navigation items', async () => {
    await act(async () => root.render(<Header />));
    expect(container.textContent).toContain('Inicio');
    expect(container.textContent).toContain('Nosotros');
  });

  it('renders login option for non-authenticated user', async () => {
    await act(async () => root.render(<Header />));
    expect(container.textContent).toContain('Iniciar sesión');
  });
});
