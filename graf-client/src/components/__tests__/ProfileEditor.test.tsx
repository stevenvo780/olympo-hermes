/* @vitest-environment jsdom */
import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { act } from 'react';
import { createRoot, Root } from 'react-dom/client';
import ProfileEditor from '../ProfileEditor';

// Mock Dependencies
const dispatchMock = vi.fn();
vi.mock('react-redux', () => ({
  useDispatch: () => dispatchMock,
}));

vi.mock('@/redux/auth', () => ({
  logout: vi.fn(() => ({ type: 'auth/logout' })),
}));

// Mock Axios
vi.mock('@/utils/axios', () => ({
  default: {
    get: vi.fn(),
    patch: vi.fn(),
    put: vi.fn(),
    defaults: { headers: { common: {} } }
  },
}));
import api from '@/utils/axios';

// Mock Firebase
const getIdTokenMock = vi.fn().mockResolvedValue('token');
const currentUserMock = {
  email: 'user@test.com',
  getIdToken: getIdTokenMock
};
const getAuthMock = vi.fn(() => ({
  currentUser: currentUserMock
}));
const reauthenticateWithCredentialMock = vi.fn();
const verifyBeforeUpdateEmailMock = vi.fn();
const updatePasswordMock = vi.fn();

vi.mock('firebase/auth', () => ({
  getAuth: () => getAuthMock(),
  verifyBeforeUpdateEmail: (...args: any) => verifyBeforeUpdateEmailMock(...args),
  updatePassword: (...args: any) => updatePasswordMock(...args),
  reauthenticateWithCredential: (...args: any) => reauthenticateWithCredentialMock(...args),
  EmailAuthProvider: { credential: vi.fn() },
}));

// Mock Bootstrap
vi.mock('react-bootstrap', () => {
  return {
    Form: Object.assign(({ children, onSubmit }: any) => <form onSubmit={onSubmit}>{children}</form>, {
      Group: ({ children }: any) => <div>{children}</div>,
      Label: ({ children }: any) => <label>{children}</label>,
      Control: (props: any) => <input {...props} onChange={e => props.onChange && props.onChange(e)} />
    }),
    Button: ({ children, onClick, disabled, type, ...props }: any) => <button onClick={onClick} disabled={disabled} type={type} {...props}>{children}</button>,
    Container: ({ children }: any) => <div>{children}</div>,
    Row: ({ children }: any) => <div>{children}</div>,
    Col: ({ children }: any) => <div>{children}</div>,
    Alert: ({ children, variant }: any) => <div data-testid="alert" data-variant={variant}>{children}</div>,
    Modal: Object.assign(({ children, show }: any) => show ? <div>{children}</div> : null, {
      Header: ({ children }: any) => <div>{children}</div>,
      Title: ({ children }: any) => <div>{children}</div>,
      Body: ({ children }: any) => <div>{children}</div>,
      Footer: ({ children }: any) => <div>{children}</div>
    }),
    Spinner: () => <div>Loading...</div>
  };
});

let container: HTMLDivElement;
let root: Root;

const renderComponent = async () => {
  await act(async () => {
    root.render(<ProfileEditor />);
  });
};

describe('ProfileEditor', () => {
  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);

    dispatchMock.mockReset();
    vi.clearAllMocks();

    // Default GET responses
    (api.get as any).mockImplementation((url: string) => {
      if (url === '/profile/get/my') {
        return Promise.resolve({ data: { shippingAddress: { address: 'street' }, additionalPhone: '123' } });
      }
      if (url === '/user/me/data') {
        return Promise.resolve({ data: { email: 'user@test.com', name: 'User', documentNumber: 'DOC123' } });
      }
      return Promise.reject(new Error('not found'));
    });

    // Default mocks
    getAuthMock.mockReturnValue({ currentUser: currentUserMock });
  });

  afterEach(() => {
    act(() => {
      root.unmount();
    });
    container.remove();
  });

  it('fetches and displays user data on mount', async () => {
    await renderComponent();

    const addressInput = container.querySelector('input[name="address"]') as HTMLInputElement;
    const nameInput = (container.querySelector('input[name="id"]') || container.querySelector('input[name="name"]')) as HTMLInputElement;

    expect(addressInput.value).toBe('street');
    expect(nameInput.value).toBe('User');
  });

  it('submits account update', async () => {
    await renderComponent();

    const nameInput = container.querySelector('input[name="name"]') as HTMLInputElement;
    const saveAccountBtn = Array.from(container.querySelectorAll('button')).find(b => b.textContent === 'Guardar Cuenta');

    act(() => {
      Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')?.set?.call(nameInput, 'User Updated');
      nameInput.dispatchEvent(new Event('change', { bubbles: true }));
    });

    (api.patch as any).mockResolvedValue({});

    await act(async () => {
      saveAccountBtn?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    expect(api.patch).toHaveBeenCalledWith('/user/me', { name: 'User Updated', documentNumber: 'DOC123' });
    const alert = container.querySelector('[data-testid="alert"][data-variant="success"]');
    expect(alert?.textContent).toContain('Cuenta actualizada correctamente');
  });

  it('submits profile update', async () => {
    await renderComponent();

    const addressInput = container.querySelector('input[name="address"]') as HTMLInputElement;
    const saveProfileBtn = Array.from(container.querySelectorAll('button')).find(b => b.textContent === 'Guardar Perfil');

    act(() => {
      Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')?.set?.call(addressInput, 'New Street');
      addressInput.dispatchEvent(new Event('change', { bubbles: true }));
    });

    (api.put as any).mockResolvedValue({});

    await act(async () => {
      saveProfileBtn?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    expect(api.put).toHaveBeenCalledWith('/profile', expect.objectContaining({
      shippingAddress: expect.objectContaining({ address: 'New Street' })
    }));
    const alert = container.querySelector('[data-testid="alert"][data-variant="success"]');
    expect(alert?.textContent).toContain('Perfil actualizado correctamente');
  });

  it('handles password update', async () => {
    await renderComponent();

    const changePassBtn = Array.from(container.querySelectorAll('button')).find(b => b.textContent === 'Cambiar Contraseña');

    await act(async () => {
      changePassBtn?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    const currentPass = container.querySelector('input[name="currentPassword"]') as HTMLInputElement;
    const newPass = container.querySelector('input[name="password"]') as HTMLInputElement;
    const confirmPass = container.querySelector('input[name="confirmPassword"]') as HTMLInputElement;

    act(() => {
      Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')?.set?.call(currentPass, 'old');
      currentPass.dispatchEvent(new Event('change', { bubbles: true }));

      Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')?.set?.call(newPass, 'new');
      newPass.dispatchEvent(new Event('change', { bubbles: true }));

      Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')?.set?.call(confirmPass, 'new');
      confirmPass.dispatchEvent(new Event('change', { bubbles: true }));
    });

    reauthenticateWithCredentialMock.mockResolvedValue({});
    updatePasswordMock.mockResolvedValue({});

    await act(async () => {
      // Find form with current password logic
      const modalForms = container.querySelectorAll('form');
      const passwordForm = Array.from(modalForms).find(f => f.querySelector('input[name="currentPassword"]'));

      passwordForm?.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    });

    expect(reauthenticateWithCredentialMock).toHaveBeenCalled();
    expect(updatePasswordMock).toHaveBeenCalledWith(currentUserMock, 'new');

    const alert = container.querySelector('[data-testid="alert"][data-variant="success"]');
    expect(alert?.textContent).toContain('Contraseña actualizada correctamente');
  });

  it('handles email update with succes', async () => {
    await renderComponent();
    const emailInput = container.querySelector('input[name="email"]') as HTMLInputElement;
    const oldPassInput = container.querySelector('input[name="oldPassword"]') as HTMLInputElement;
    const saveAccountBtn = Array.from(container.querySelectorAll('button')).find(b => b.textContent === 'Guardar Cuenta');

    act(() => {
      Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')?.set?.call(emailInput, 'new@test.com');
      emailInput.dispatchEvent(new Event('change', { bubbles: true }));

      Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')?.set?.call(oldPassInput, 'oldpass');
      oldPassInput.dispatchEvent(new Event('change', { bubbles: true }));
    });

    (api.patch as any).mockResolvedValue({});
    reauthenticateWithCredentialMock.mockResolvedValue({});
    verifyBeforeUpdateEmailMock.mockResolvedValue({});

    // Mock logout and window.location
    delete (window as any).location;
    (window as any).location = { href: '' };

    await act(async () => {
      saveAccountBtn?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    expect(reauthenticateWithCredentialMock).toHaveBeenCalled();
    expect(api.patch).toHaveBeenCalledWith('/user/me/email', { email: 'new@test.com' });
    expect(verifyBeforeUpdateEmailMock).toHaveBeenCalled();

    // Check for success message
    const alert = container.querySelector('[data-testid="alert"][data-variant="success"]');
    expect(alert?.textContent).toContain('Correo actualizado');
  });

  it('handles email update missing old password', async () => {
    await renderComponent();
    const emailInput = container.querySelector('input[name="email"]') as HTMLInputElement;
    const saveAccountBtn = Array.from(container.querySelectorAll('button')).find(b => b.textContent === 'Guardar Cuenta');

    act(() => {
      Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')?.set?.call(emailInput, 'new@test.com');
      emailInput.dispatchEvent(new Event('change', { bubbles: true }));
    });

    await act(async () => {
      saveAccountBtn?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    const alert = container.querySelector('[data-testid="alert"][data-variant="danger"]');
    expect(alert?.textContent).toContain('Se requiere la contraseña actual');
  });

  it('handles password mismatch', async () => {
    await renderComponent();
    const changePassBtn = Array.from(container.querySelectorAll('button')).find(b => b.textContent === 'Cambiar Contraseña');
    await act(async () => {
      changePassBtn?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    const currentPass = container.querySelector('input[name="currentPassword"]') as HTMLInputElement;
    const newPass = container.querySelector('input[name="password"]') as HTMLInputElement;
    const confirmPass = container.querySelector('input[name="confirmPassword"]') as HTMLInputElement;

    act(() => {
      Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')?.set?.call(currentPass, 'old');
      currentPass.dispatchEvent(new Event('change', { bubbles: true }));
      Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')?.set?.call(newPass, 'new');
      newPass.dispatchEvent(new Event('change', { bubbles: true }));
      Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')?.set?.call(confirmPass, 'mismatch');
      confirmPass.dispatchEvent(new Event('change', { bubbles: true }));
    });

    const modalForms = container.querySelectorAll('form');
    const passwordForm = Array.from(modalForms).find(f => f.querySelector('input[name="currentPassword"]'));

    await act(async () => {
      passwordForm?.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    });

    const alert = container.querySelector('[data-testid="alert"][data-variant="danger"]');
    expect(alert?.textContent).toContain('Las contraseñas no coinciden');
  });

  it('handles API errors generally', async () => {
    await renderComponent();
    const saveProfileBtn = Array.from(container.querySelectorAll('button')).find(b => b.textContent === 'Guardar Perfil');
    (api.put as any).mockRejectedValue(new Error('API Error'));

    await act(async () => {
      saveProfileBtn?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    const alert = container.querySelector('[data-testid="alert"][data-variant="danger"]');
    expect(alert?.textContent).toContain('Error al actualizar el perfil');
  });

  it('handles auth/requires-recent-login error', async () => {
    await renderComponent();
    const emailInput = container.querySelector('input[name="email"]') as HTMLInputElement;
    const oldPassInput = container.querySelector('input[name="oldPassword"]') as HTMLInputElement;
    const saveAccountBtn = Array.from(container.querySelectorAll('button')).find(b => b.textContent === 'Guardar Cuenta');

    act(() => {
      Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')?.set?.call(emailInput, 'new@test.com');
      emailInput.dispatchEvent(new Event('change', { bubbles: true }));
      Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')?.set?.call(oldPassInput, 'old');
      oldPassInput.dispatchEvent(new Event('change', { bubbles: true }));
    });

    const error = new Error('Auth Error') as any;
    error.code = 'auth/requires-recent-login';
    (api.patch as any).mockResolvedValue({});
    reauthenticateWithCredentialMock.mockRejectedValue(error);

    await act(async () => {
      saveAccountBtn?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    const alert = container.querySelector('[data-testid="alert"][data-variant="danger"]');
    expect(alert?.textContent).toContain('Por seguridad, vuelve a iniciar sesión');
  });

  it('handles additional phone update', async () => {
    await renderComponent();
    const phoneInput = container.querySelector('input[name="additionalPhone"]') as HTMLInputElement;
    act(() => {
      Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')?.set?.call(phoneInput, '999');
      phoneInput.dispatchEvent(new Event('change', { bubbles: true }));
    });
    expect(phoneInput.value).toBe('999');
  });

  it('handles fetch errors gracefully', async () => {
    (api.get as any).mockImplementation(() => {
      return Promise.reject(new Error('Fetch Error'));
    });

    await renderComponent();
    // Should render without crashing, just empty values
    const addressInput = container.querySelector('input[name="address"]') as HTMLInputElement;
    expect(addressInput.value).toBe('');
  });

  it('handles logout error after email change', async () => {
    (getAuthMock as any).mockReturnValue({ currentUser: null });
    await renderComponent();
    const emailInput = container.querySelector('input[name="email"]') as HTMLInputElement;
    const oldPassInput = container.querySelector('input[name="oldPassword"]') as HTMLInputElement;
    const saveAccountBtn = Array.from(container.querySelectorAll('button')).find(b => b.textContent === 'Guardar Cuenta');

    act(() => {
      Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')?.set?.call(emailInput, 'new@test.com');
      emailInput.dispatchEvent(new Event('change', { bubbles: true }));
      Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')?.set?.call(oldPassInput, 'oldpass');
      oldPassInput.dispatchEvent(new Event('change', { bubbles: true }));
    });

    (api.patch as any).mockResolvedValue({});
    reauthenticateWithCredentialMock.mockResolvedValue({});
    verifyBeforeUpdateEmailMock.mockResolvedValue({});
    (dispatchMock as any).mockRejectedValue(new Error('Logout Failed'));

    // Mock setTimeout to run immediately
    vi.useFakeTimers();

    await act(async () => {
      saveAccountBtn?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    await act(async () => {
      vi.runAllTimers();
    });

    vi.useRealTimers();
    const alert = container.querySelector('[data-testid="alert"][data-variant="success"]');
    expect(alert).toBeTruthy();
  });

  it('handles shipping address update', async () => {
    await renderComponent();
    const addressInput = container.querySelector('input[name="address"]') as HTMLInputElement;

    act(() => {
      Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')?.set?.call(addressInput, 'New Address');
      addressInput.dispatchEvent(new Event('change', { bubbles: true }));
    });

    const saveBtn = Array.from(container.querySelectorAll('button')).find(b => b.textContent === 'Guardar Perfil');
    (api.put as any).mockResolvedValue({});

    await act(async () => {
      saveBtn?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    expect(api.put).toHaveBeenCalledWith('/profile', expect.objectContaining({ shippingAddress: expect.objectContaining({ address: 'New Address' }) }));
  });

  it('handles password change flow', async () => {
    await renderComponent();
    // Open modal
    const openBtn = Array.from(container.querySelectorAll('button')).find(b => b.textContent === 'Cambiar Contraseña');
    await act(async () => {
      openBtn?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    const currentPassInput = container.querySelector('input[name="currentPassword"]');
    expect(currentPassInput).toBeTruthy();

    const currentPass = currentPassInput as HTMLInputElement;
    const newPass = container.querySelector('input[name="password"]') as HTMLInputElement;
    const confirmPass = container.querySelector('input[name="confirmPassword"]') as HTMLInputElement;

    act(() => {
      Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')?.set?.call(currentPass, 'wrong');
      currentPass.dispatchEvent(new Event('change', { bubbles: true }));
      Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')?.set?.call(newPass, 'newpass');
      newPass.dispatchEvent(new Event('change', { bubbles: true }));
      Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')?.set?.call(confirmPass, 'newpass');
      confirmPass.dispatchEvent(new Event('change', { bubbles: true }));
    });

    const submitBtn = Array.from(container.querySelectorAll('button')).find(b => b.textContent === 'Cambiar Contraseña' && b.type === 'submit');

    reauthenticateWithCredentialMock.mockRejectedValue({ code: 'auth/wrong-password', message: 'Wrong' });

    await act(async () => {
      submitBtn?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    expect(container.textContent).toContain('La contraseña actual es incorrecta');

    // Submit mismatch
    act(() => {
      Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')?.set?.call(confirmPass, 'mismatch');
      confirmPass.dispatchEvent(new Event('change', { bubbles: true }));
    });
    await act(async () => {
      submitBtn?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });
    expect(container.textContent).toContain('Las contraseñas no coinciden');
  });

  it('handles profile load error gracefully', async () => {
    // Mock both failing
    (api.get as any).mockImplementation(() => {
      return Promise.reject(new Error('Load Error'));
    });

    await renderComponent();

    const inputs = container.querySelectorAll('input');
    expect(inputs.length).toBeGreaterThan(0);
    // It should just load with empty states
  });

  it('closes password modal after success', async () => {
    await renderComponent();

    // Open modal
    const openBtn = Array.from(container.querySelectorAll('button')).find(b => b.textContent === 'Cambiar Contraseña');
    await act(async () => {
      openBtn?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    const submitBtn = Array.from(container.querySelectorAll('button')).find(b => b.textContent === 'Cambiar Contraseña' && b.type === 'submit');
    const currentPass = container.querySelector('input[name="currentPassword"]') as HTMLInputElement;
    const newPass = container.querySelector('input[name="password"]') as HTMLInputElement;
    const confirmPass = container.querySelector('input[name="confirmPassword"]') as HTMLInputElement;

    act(() => {
      Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')?.set?.call(currentPass, 'old');
      currentPass.dispatchEvent(new Event('change', { bubbles: true }));
      Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')?.set?.call(newPass, 'new');
      newPass.dispatchEvent(new Event('change', { bubbles: true }));
      Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')?.set?.call(confirmPass, 'new');
      confirmPass.dispatchEvent(new Event('change', { bubbles: true }));
    });

    reauthenticateWithCredentialMock.mockResolvedValue({});
    updatePasswordMock.mockResolvedValue({});

    vi.useFakeTimers();
    await act(async () => {
      submitBtn?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    // Fast forward to close modal
    await act(async () => {
      vi.runAllTimers();
    });
    vi.useRealTimers();

    expect(updatePasswordMock).toHaveBeenCalled();
  });

  it('handles general error in password update', async () => {
    await renderComponent();
    const openBtn = Array.from(container.querySelectorAll('button')).find(b => b.textContent === 'Cambiar Contraseña');
    await act(async () => {
      openBtn?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    const submitBtn = Array.from(container.querySelectorAll('button')).find(b => b.textContent === 'Cambiar Contraseña' && b.type === 'submit');
    const currentPass = container.querySelector('input[name="currentPassword"]') as HTMLInputElement;
    const newPass = container.querySelector('input[name="password"]') as HTMLInputElement;
    const confirmPass = container.querySelector('input[name="confirmPassword"]') as HTMLInputElement;

    act(() => {
      Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')?.set?.call(currentPass, 'old');
      currentPass.dispatchEvent(new Event('change', { bubbles: true }));
      Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')?.set?.call(newPass, 'new');
      newPass.dispatchEvent(new Event('change', { bubbles: true }));
      Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')?.set?.call(confirmPass, 'new');
      confirmPass.dispatchEvent(new Event('change', { bubbles: true }));
    });

    reauthenticateWithCredentialMock.mockRejectedValue(new Error('Unknown Error'));

    await act(async () => {
      submitBtn?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    expect(container.textContent).toContain('Error al actualizar la contraseña');
  });

  it('handles field update not in shippingAddress', async () => {
    await renderComponent();
    const phoneInput = container.querySelector('input[name="additionalPhone"]') as HTMLInputElement;
    act(() => {
      Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')?.set?.call(phoneInput, '123456');
      phoneInput.dispatchEvent(new Event('change', { bubbles: true }));
    });
    // This triggers the ELSE branch of handleProfileChange
    expect(phoneInput.value).toBe('123456');
  });

  it('handles submit without current user (rare edge case)', async () => {
    (getAuthMock as any).mockReturnValue({ currentUser: null });
    await renderComponent();

    const saveAccountBtn = Array.from(container.querySelectorAll('button')).find(b => b.textContent === 'Guardar Cuenta');
    (api.patch as any).mockResolvedValue({});

    await act(async () => {
      saveAccountBtn?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });
    // Should succeed but without auth header logic

    const saveProfileBtn = Array.from(container.querySelectorAll('button')).find(b => b.textContent === 'Guardar Perfil');
    (api.put as any).mockResolvedValue({});
    await act(async () => {
      saveProfileBtn?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    // Reset mock
    getAuthMock.mockReturnValue({ currentUser: currentUserMock });
  });
});
