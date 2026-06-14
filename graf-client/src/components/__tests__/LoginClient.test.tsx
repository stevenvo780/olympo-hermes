/* @vitest-environment jsdom */
import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { act } from 'react';
import { createRoot, Root } from 'react-dom/client';
import LoginClient from '../LoginClient';

// Mock Dependencies
const dispatchMock = vi.fn();
const useSelectorMock = vi.fn();
const routerPushMock = vi.fn();

interface ReduxState {
  ui: {
    store: unknown;
  };
}

vi.mock('react-redux', () => ({
  useDispatch: () => dispatchMock,
  useSelector: (selector: (state: ReduxState) => unknown) => useSelectorMock(selector),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: routerPushMock }),
}));

// Mock Actions
vi.mock('@/redux/auth', () => ({
  login: vi.fn((user) => ({ type: 'auth/login', payload: user })),
}));
import { login } from '@/redux/auth';

vi.mock('@/redux/ui', () => ({
  addNotification: vi.fn((payload) => ({ type: 'ui/notif', payload })),
}));
import { addNotification } from '@/redux/ui';

// Mock Firebase
const signInWithEmailAndPasswordMock = vi.fn();
const signInWithPopupMock = vi.fn();
const sendPasswordResetEmailMock = vi.fn();
const signOutMock = vi.fn();

vi.mock('@/utils/firebase', () => ({
  auth: {
    signInWithEmailAndPassword: (e: string, p: string) => signInWithEmailAndPasswordMock(e, p),
    signInWithPopup: (p: unknown) => signInWithPopupMock(p),
    sendPasswordResetEmail: (e: string) => sendPasswordResetEmailMock(e),
    signOut: () => signOutMock(),
  },
}));

vi.mock('firebase/compat/app', () => ({
  default: {
    auth: {
      GoogleAuthProvider: vi.fn(),
      UserCredential: vi.fn()
    }
  }
}));

// Mock Services
vi.mock('@/services/userService', () => ({
  getUserBack: vi.fn(),
}));
import { getUserBack } from '@/services/userService';

// Mock Bootstrap
vi.mock('react-bootstrap', () => {
  interface FormProps {
    children: React.ReactNode;
    onSubmit?: (e: React.FormEvent) => void;
  }
  interface ChildrenProps {
    children: React.ReactNode;
  }
  interface ControlProps extends React.InputHTMLAttributes<HTMLInputElement> {
    onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  }
  interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    children: React.ReactNode;
  }
  interface ModalProps {
    children: React.ReactNode;
    show: boolean;
  }

  const FormComponent = function Form({ children, onSubmit }: FormProps) {
    return <form onSubmit={onSubmit}>{children}</form>;
  };
  (FormComponent as any).displayName = 'Form';
  FormComponent.Group = function FormGroup({ children }: ChildrenProps) {
    return <div>{children}</div>;
  };
  (FormComponent.Group as any).displayName = 'FormGroup';
  FormComponent.Label = function FormLabel({ children }: ChildrenProps) {
    return <label>{children}</label>;
  };
  (FormComponent.Label as any).displayName = 'FormLabel';
  FormComponent.Control = function FormControl(props: ControlProps) {
    return <input {...props} onChange={e => props.onChange && props.onChange(e)} />;
  };
  (FormComponent.Control as any).displayName = 'FormControl';

  const ButtonComponent = function Button({ children, onClick, disabled, type, ...props }: ButtonProps) {
    return <button onClick={onClick} disabled={disabled} type={type} {...props}>{children}</button>;
  };
  ButtonComponent.displayName = 'Button';

  const ContainerComponent = function Container({ children }: ChildrenProps) {
    return <div>{children}</div>;
  };
  ContainerComponent.displayName = 'Container';

  const RowComponent = function Row({ children }: ChildrenProps) {
    return <div>{children}</div>;
  };
  RowComponent.displayName = 'Row';

  const ColComponent = function Col({ children }: ChildrenProps) {
    return <div>{children}</div>;
  };
  ColComponent.displayName = 'Col';

  const CardComponent = function Card({ children }: ChildrenProps) {
    return <div>{children}</div>;
  };
  (CardComponent as any).displayName = 'Card';
  CardComponent.Body = function CardBody({ children }: ChildrenProps) {
    return <div>{children}</div>;
  };
  (CardComponent.Body as any).displayName = 'CardBody';
  CardComponent.Footer = function CardFooter({ children }: ChildrenProps) {
    return <div>{children}</div>;
  };
  (CardComponent.Footer as any).displayName = 'CardFooter';

  const ModalComponent = function Modal({ children, show }: ModalProps) {
    return show ? <div>{children}</div> : null;
  };
  (ModalComponent as any).displayName = 'Modal';
  ModalComponent.Header = function ModalHeader({ children }: ChildrenProps) {
    return <div>{children}</div>;
  };
  (ModalComponent.Header as any).displayName = 'ModalHeader';
  ModalComponent.Title = function ModalTitle({ children }: ChildrenProps) {
    return <div>{children}</div>;
  };
  (ModalComponent.Title as any).displayName = 'ModalTitle';
  ModalComponent.Body = function ModalBody({ children }: ChildrenProps) {
    return <div>{children}</div>;
  };
  (ModalComponent.Body as any).displayName = 'ModalBody';
  ModalComponent.Footer = function ModalFooter({ children }: ChildrenProps) {
    return <div>{children}</div>;
  };
  (ModalComponent.Footer as any).displayName = 'ModalFooter';

  const ImageComponent = function Image(props: React.ImgHTMLAttributes<HTMLImageElement>) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img {...props} alt={props.alt || ''} />;
  };
  ImageComponent.displayName = 'Image';

  return {
    Form: FormComponent,
    Button: ButtonComponent,
    Container: ContainerComponent,
    Row: RowComponent,
    Col: ColComponent,
    Card: CardComponent,
    Modal: ModalComponent,
    Image: ImageComponent
  };
});

let container: HTMLDivElement;
let root: Root;

const renderComponent = async (storeId?: string) => {
  await act(async () => {
    root.render(<LoginClient storeId={storeId} />);
  });
};

describe('LoginClient', () => {
  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);

    dispatchMock.mockReset();
    useSelectorMock.mockImplementation((selector) => selector({
      ui: { store: null }
    }));
    routerPushMock.mockReset();
    signInWithEmailAndPasswordMock.mockReset();
    signInWithPopupMock.mockReset();
    sendPasswordResetEmailMock.mockReset();
    vi.mocked(getUserBack).mockReset();
    vi.clearAllMocks();
  });

  afterEach(() => {
    act(() => {
      root.unmount();
    });
    container.remove();
  });

  it('handles email/password login success', async () => {
    await renderComponent();

    const emailInput = container.querySelector('input[type="email"]');
    const passwordInput = container.querySelector('input[type="password"]');
    const submitBtn = container.querySelector('button[type="submit"]');

    act(() => {
      Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')?.set?.call(emailInput, 'test@test.com');
      emailInput?.dispatchEvent(new Event('change', { bubbles: true }));

      Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')?.set?.call(passwordInput, 'password');
      passwordInput?.dispatchEvent(new Event('change', { bubbles: true }));
    });

    const userMock = { email: 'test@test.com' };
    signInWithEmailAndPasswordMock.mockResolvedValue({ user: userMock });
    vi.mocked(getUserBack).mockResolvedValue({ id: 'u1', email: 'test@test.com' } as any);

    await act(async () => {
      submitBtn?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    expect(signInWithEmailAndPasswordMock).toHaveBeenCalledWith('test@test.com', 'password');
    expect(getUserBack).toHaveBeenCalledWith(userMock, 'business_owner');
    expect(dispatchMock).toHaveBeenCalledWith(login({ id: 'u1', email: 'test@test.com' } as any));
    expect(routerPushMock).toHaveBeenCalledWith('/');
  });

  it('handles email/password login failure', async () => {
    await renderComponent();
    const submitBtn = container.querySelector('button[type="submit"]');

    signInWithEmailAndPasswordMock.mockRejectedValue(new Error('Auth failed'));

    await act(async () => {
      submitBtn?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    expect(dispatchMock).toHaveBeenCalledWith(addNotification({ message: 'Error al iniciar sesión', color: 'danger' }));
  });

  it('handles google login success', async () => {
    await renderComponent('store1');

    const buttons = container.querySelectorAll('button');
    const googleBtn = Array.from(buttons).find(b => b.textContent?.includes('Google'));

    const userMock = { email: 'test@gmail.com' };
    signInWithPopupMock.mockResolvedValue({ user: userMock });
    vi.mocked(getUserBack).mockResolvedValue({ id: 'u2', email: 'test@gmail.com' } as any);

    await act(async () => {
      googleBtn?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    expect(signInWithPopupMock).toHaveBeenCalled();
    expect(routerPushMock).toHaveBeenCalledWith('/store1');
  });

  it('handles forgot password', async () => {
    await renderComponent();

    const forgotLink = container.querySelector('button.text-muted'); // variant='link' mapped to button
    expect(forgotLink).toBeTruthy();

    await act(async () => {
      forgotLink?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    // Modal should be open. Check for inputs in modal.
    // Since mock renders directly, it should be in doc.
    const modalInputs = container.querySelectorAll('input');
    const resetEmailInput = modalInputs[modalInputs.length - 1]; // Last input

    act(() => {
      Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')?.set?.call(resetEmailInput, 'reset@test.com');
      resetEmailInput.dispatchEvent(new Event('change', { bubbles: true }));
    });

    const sendBtn = Array.from(container.querySelectorAll('button')).find(b => b.textContent === 'Enviar correo');

    sendPasswordResetEmailMock.mockResolvedValue(undefined);

    await act(async () => {
      sendBtn?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    expect(sendPasswordResetEmailMock).toHaveBeenCalledWith('reset@test.com');
    expect(dispatchMock).toHaveBeenCalledWith(addNotification({ message: 'Se ha enviado un correo para restablecer tu contraseña', color: 'success' }));
  });

  it('handles google login failure', async () => {
    await renderComponent('store1');

    const buttons = container.querySelectorAll('button');
    const googleBtn = Array.from(buttons).find(b => b.textContent?.includes('Google'));

    signInWithPopupMock.mockRejectedValue(new Error('Google Auth failed'));

    await act(async () => {
      googleBtn?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    expect(dispatchMock).toHaveBeenCalledWith(addNotification({ message: 'Error al iniciar sesión con Google', color: 'danger' }));
  });

  it('handles getUserBack error', async () => {
    await renderComponent();

    const emailInput = container.querySelector('input[type="email"]');
    const passwordInput = container.querySelector('input[type="password"]');
    const submitBtn = container.querySelector('button[type="submit"]');

    act(() => {
      Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')?.set?.call(emailInput, 'test@test.com');
      emailInput?.dispatchEvent(new Event('change', { bubbles: true }));

      Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')?.set?.call(passwordInput, 'password');
      passwordInput?.dispatchEvent(new Event('change', { bubbles: true }));
    });

    const userMock = { email: 'test@test.com' };
    signInWithEmailAndPasswordMock.mockResolvedValue({ user: userMock });
    vi.mocked(getUserBack).mockRejectedValue(new Error('Backend error'));

    await act(async () => {
      submitBtn?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    expect(dispatchMock).toHaveBeenCalledWith(addNotification({ message: 'Error al obtener usuario', color: 'danger' }));
    expect(signOutMock).toHaveBeenCalled();
  });

  it('handles forgot password failure', async () => {
    await renderComponent();

    const forgotLink = container.querySelector('button.text-muted');

    await act(async () => {
      forgotLink?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    const modalInputs = container.querySelectorAll('input');
    const resetEmailInput = modalInputs[modalInputs.length - 1];

    act(() => {
      Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')?.set?.call(resetEmailInput, 'reset@test.com');
      resetEmailInput.dispatchEvent(new Event('change', { bubbles: true }));
    });

    const sendBtn = Array.from(container.querySelectorAll('button')).find(b => b.textContent === 'Enviar correo');

    sendPasswordResetEmailMock.mockRejectedValue(new Error('Email error'));

    await act(async () => {
      sendBtn?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    expect(dispatchMock).toHaveBeenCalledWith(addNotification({ message: 'Error al enviar el correo de restablecimiento', color: 'danger' }));
  });

  it('navigates to register page without storeId', async () => {
    await renderComponent();

    const buttons = container.querySelectorAll('button');
    const registerBtn = Array.from(buttons).find(b => b.textContent?.includes('Crear una cuenta'));

    await act(async () => {
      registerBtn?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    expect(routerPushMock).toHaveBeenCalledWith('/register');
  });

  it('navigates to register page with storeId', async () => {
    await renderComponent('mystore');

    const buttons = container.querySelectorAll('button');
    const registerBtn = Array.from(buttons).find(b => b.textContent?.includes('Crear una cuenta'));

    await act(async () => {
      registerBtn?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    expect(routerPushMock).toHaveBeenCalledWith('/mystore/register');
  });

  it('uses custom store name and logo when storeId provided with config', async () => {
    useSelectorMock.mockImplementation((selector) => selector({
      ui: { store: { configuration: { store: { name: 'Custom Store' }, logo: '/custom-logo.png' } } }
    }));

    await renderComponent('customstore');

    expect(container.textContent).toContain('Custom Store');
    const img = container.querySelector('img');
    expect(img?.getAttribute('src')).toBe('/custom-logo.png');
  });

  it('uses default title and logo when no storeId', async () => {
    await renderComponent();

    expect(container.textContent).toContain('Graf');
    const img = container.querySelector('img');
    expect(img?.getAttribute('src')).toBe('/images/logo.svg');
  });
});

