/* @vitest-environment jsdom */
import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act } from 'react';
import { createRoot, Root } from 'react-dom/client';
import Header from '../Header';

const mocks = vi.hoisted(() => ({
  isLoggedIn: false,
  dispatch: vi.fn(),
  push: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mocks.push }),
}));

vi.mock('react-redux', () => ({
  useSelector: (selector: (state: { auth: { isLoggedIn: boolean } }) => unknown) =>
    selector({ auth: { isLoggedIn: mocks.isLoggedIn } }),
}));

vi.mock('@/redux/hooks', () => ({
  useAppDispatch: () => mocks.dispatch,
}));

vi.mock('@/redux/auth', () => ({
  logout: () => ({ type: 'auth/logout' }),
}));

vi.mock('react-bootstrap', () => {
  const Navbar = ({ children, ...props }: React.PropsWithChildren<React.HTMLAttributes<HTMLElement>>) => (
    <header {...props}>{children}</header>
  );
  const Nav = Object.assign(
    ({ children, ...props }: React.PropsWithChildren<React.HTMLAttributes<HTMLElement>>) => (
      <nav {...props}>{children}</nav>
    ),
    {
      Link: ({ children, ...props }: React.PropsWithChildren<React.ButtonHTMLAttributes<HTMLButtonElement>>) => (
        <button type="button" {...props}>
          {children}
        </button>
      ),
    }
  );
  const Container = ({ children, ...props }: React.PropsWithChildren<React.HTMLAttributes<HTMLDivElement>>) => (
    <div {...props}>{children}</div>
  );
  const Dropdown = Object.assign(
    ({ children, ...props }: React.PropsWithChildren<React.HTMLAttributes<HTMLDivElement>>) => (
      <div {...props}>{children}</div>
    ),
    {
      Toggle: ({ children, ...props }: React.PropsWithChildren<React.ButtonHTMLAttributes<HTMLButtonElement>>) => (
        <button type="button" {...props}>
          {children}
        </button>
      ),
      Menu: ({ children, ...props }: React.PropsWithChildren<React.HTMLAttributes<HTMLDivElement>>) => (
        <div {...props}>{children}</div>
      ),
      Item: ({ children, ...props }: React.PropsWithChildren<React.ButtonHTMLAttributes<HTMLButtonElement>>) => (
        <button type="button" {...props}>
          {children}
        </button>
      ),
    }
  );
  // eslint-disable-next-line @next/next/no-img-element
  const Image = (props: React.ImgHTMLAttributes<HTMLImageElement>) => <img {...props} alt={props.alt || ''} />;

  return { Navbar, Nav, Container, Dropdown, Image };
});

let container: HTMLDivElement;
let root: Root;

const renderHeader = async () => {
  await act(async () => {
    root.render(<Header />);
  });
};

const findButtonByText = (text: string) =>
  Array.from(container.querySelectorAll('button')).find((button) =>
    button.textContent?.includes(text)
  );

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
  mocks.dispatch.mockReset();
  mocks.push.mockReset();
  mocks.isLoggedIn = false;
});

describe('Hermes Header', () => {
  it('renders navigation links and redirects to login when logged out', async () => {
    mocks.isLoggedIn = false;
    await renderHeader();

    expect(container.textContent).toContain('Hermes');
    expect(container.textContent).toContain('Inicio');
    expect(container.textContent).toContain('Nosotros');

    const loginButton = findButtonByText('Iniciar sesi');
    expect(loginButton).toBeTruthy();

    act(() => {
      loginButton?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    expect(mocks.push).toHaveBeenCalledWith('/login');
  });

  it('dispatches logout and redirects when logged in', async () => {
    mocks.isLoggedIn = true;
    await renderHeader();

    const logoutButton = findButtonByText('Cerrar sesi');
    expect(logoutButton).toBeTruthy();

    act(() => {
      logoutButton?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    expect(mocks.dispatch).toHaveBeenCalledWith({ type: 'auth/logout' });
    expect(mocks.push).toHaveBeenCalledWith('/login');
  });
  it('navigates to home when logo is clicked', async () => {
    await renderHeader();

    // The logo is inside a div with handleLogoClick. 
    // We can find it by the image alt text "Logo" and getting the parent.
    const logoImage = container.querySelector('img[alt="Logo"]');
    const logoContainer = logoImage?.closest('div');

    expect(logoContainer).toBeTruthy();

    act(() => {
      logoContainer?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    expect(mocks.push).toHaveBeenCalledWith('/');
  });

  it('navigates to routes when nav links are clicked', async () => {
    await renderHeader();

    // Find "Inicio" link button
    const inicioBtn = findButtonByText('Inicio');
    expect(inicioBtn).toBeTruthy();

    act(() => {
      inicioBtn?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });
    expect(mocks.push).toHaveBeenCalledWith('/');

    // Find "Nosotros" link button
    const nosotrosBtn = findButtonByText('Nosotros');
    expect(nosotrosBtn).toBeTruthy();

    act(() => {
      nosotrosBtn?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });
    expect(mocks.push).toHaveBeenCalledWith('/hermes/about');
  });
});
