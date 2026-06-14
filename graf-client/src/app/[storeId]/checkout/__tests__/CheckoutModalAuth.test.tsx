/* @vitest-environment jsdom */
import React from 'react';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import CheckoutModalAuth from '../CheckoutModalAuth';
import { useSelector, useDispatch } from 'react-redux';

// Mock Redux
vi.mock('react-redux', () => ({
  useDispatch: vi.fn(),
  useSelector: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  useParams: () => ({ storeId: '1' }),
  useRouter: () => ({ push: vi.fn() })
}));

// Mock Firebase
const mockSignInWithEmailAndPassword = vi.fn();
const mockCreateUserWithEmailAndPassword = vi.fn();
const mockSignInWithPopup = vi.fn();

vi.mock('@/utils/firebase', () => ({
  auth: {
    signInWithEmailAndPassword: (...args: any[]) => mockSignInWithEmailAndPassword(...args),
    createUserWithEmailAndPassword: (...args: any[]) => mockCreateUserWithEmailAndPassword(...args),
    signInWithPopup: (...args: any[]) => mockSignInWithPopup(...args),
    currentUser: null
  }
}));

vi.mock('firebase/compat/app', () => ({
  default: {
    auth: {
      GoogleAuthProvider: class { }
    }
  }
}));

// Mock Services & Actions
vi.mock('@/services/userService', () => ({
  getUserBack: vi.fn()
}));
import * as userService from '@/services/userService';

vi.mock('@/redux/auth', () => ({
  login: vi.fn((data) => ({ type: 'login', payload: data }))
}));

vi.mock('@/redux/ui', () => ({
  addNotification: vi.fn((data) => ({ type: 'notification', payload: data }))
}));

// Mock react-bootstrap
vi.mock('react-bootstrap', () => {
  function ModalHeader({ children }: any) { return <div>{children}</div>; }
  ModalHeader.displayName = 'ModalHeader';
  function ModalTitle({ children }: any) { return <div>{children}</div>; }
  ModalTitle.displayName = 'ModalTitle';
  function ModalBody({ children }: any) { return <div>{children}</div>; }
  ModalBody.displayName = 'ModalBody';
  function ModalFooter({ children }: any) { return <div>{children}</div>; }
  ModalFooter.displayName = 'ModalFooter';

  function Modal({ show, children }: any) { return show ? <div data-testid="modal">{children}</div> : null; }
  Modal.displayName = 'Modal';
  Modal.Header = ModalHeader;
  Modal.Title = ModalTitle;
  Modal.Body = ModalBody;
  Modal.Footer = ModalFooter;

  function FormGroup({ children }: any) { return <div>{children}</div>; }
  FormGroup.displayName = 'FormGroup';
  function FormLabel({ children }: any) { return <label>{children}</label>; }
  FormLabel.displayName = 'FormLabel';
  function FormControl(props: any) { return <input {...props} />; }
  FormControl.displayName = 'FormControl';
  function FormCheck(props: any) { return <input type="checkbox" {...props} />; }
  FormCheck.displayName = 'FormCheck';

  function FormMock({ children, onSubmit }: any) { return <form onSubmit={onSubmit}>{children}</form>; }
  FormMock.displayName = 'Form';
  FormMock.Group = FormGroup;
  FormMock.Label = FormLabel;
  FormMock.Control = FormControl;
  FormMock.Check = FormCheck;

  function ButtonMock({ children, onClick, disabled }: any) { return <button onClick={onClick} disabled={disabled}>{children}</button>; }
  ButtonMock.displayName = 'Button';
  function RowMock({ children }: any) { return <div>{children}</div>; }
  RowMock.displayName = 'Row';
  function ColMock({ children }: any) { return <div>{children}</div>; }
  ColMock.displayName = 'Col';
  function SpinnerMock() { return <div>Loading...</div>; }
  SpinnerMock.displayName = 'Spinner';

  return {
    Modal,
    Button: ButtonMock,
    Form: FormMock,
    Row: RowMock,
    Col: ColMock,
    Spinner: SpinnerMock
  };
});

describe('CheckoutModalAuth', () => {
  const dispatch = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    (useDispatch as unknown as ReturnType<typeof vi.fn>).mockReturnValue(dispatch);
    (useSelector as unknown as ReturnType<typeof vi.fn>).mockImplementation((cb) => cb({
      auth: { userData: null }
    }));
  });

  afterEach(() => {
    cleanup();
  });

  const renderModal = () => {
    return render(<CheckoutModalAuth show={true} onHide={vi.fn()} />);
  };

  it('renders login form by default', () => {
    renderModal();
    // Use getAllByText because title and button have same text
    expect(screen.getAllByText('Iniciar Sesión')).toHaveLength(2);
    expect(screen.getByPlaceholderText('Correo electrónico')).toBeTruthy();
  });

  it('switches to register mode', async () => {
    renderModal();
    fireEvent.click(screen.getByText(/Regístrate/i));

    await waitFor(() => {
      expect(screen.getAllByText('Registrarse')).toHaveLength(2);
      expect(screen.getByPlaceholderText('Nombre')).toBeTruthy();
    });
  });

  it('handles login form submission success', async () => {
    // Mock user with email property
    const mockUser = { uid: '123', email: 'test@example.com' };
    mockSignInWithEmailAndPassword.mockResolvedValue({ user: mockUser });
    (userService.getUserBack as any).mockResolvedValue({ id: '123', name: 'Test User' });

    renderModal();

    fireEvent.change(screen.getByPlaceholderText('Correo electrónico'), { target: { value: 'test@example.com' } });
    fireEvent.change(screen.getByPlaceholderText('Contraseña'), { target: { value: 'password' } });

    const loginButtons = screen.getAllByText('Iniciar Sesión');
    const loginBtn = loginButtons.find(el => el.tagName === 'BUTTON');
    if (loginBtn) fireEvent.click(loginBtn);

    await waitFor(() => {
      expect(mockSignInWithEmailAndPassword).toHaveBeenCalledWith('test@example.com', 'password');
      expect(dispatch).toHaveBeenCalled();
    });
  });

  it('handles register submission success', async () => {
    // Mock user with updateProfile
    const mockUser = {
      uid: '123',
      email: 'new@example.com',
      updateProfile: vi.fn().mockResolvedValue(true)
    };
    mockCreateUserWithEmailAndPassword.mockResolvedValue({ user: mockUser });

    renderModal();
    fireEvent.click(screen.getByText(/Regístrate/i));

    fireEvent.change(screen.getByPlaceholderText('Nombre'), { target: { value: 'New User' } });
    fireEvent.change(screen.getByPlaceholderText('Correo electrónico'), { target: { value: 'new@example.com' } });
    fireEvent.change(screen.getByPlaceholderText('Contraseña'), { target: { value: 'password123' } });
    fireEvent.change(screen.getByPlaceholderText('Confirmar contraseña'), { target: { value: 'password123' } });

    // Checkbox "He leído y acepto..."
    const checkbox = screen.getByRole('checkbox');
    fireEvent.click(checkbox);

    const registerButtons = screen.getAllByText('Registrarse');
    const registerBtn = registerButtons.find(el => el.tagName === 'BUTTON');
    if (registerBtn) fireEvent.click(registerBtn);

    await waitFor(() => {
      expect(mockCreateUserWithEmailAndPassword).toHaveBeenCalledWith('new@example.com', 'password123');
      expect(dispatch).toHaveBeenCalled();
    });
  });

  it('handles google login', async () => {
    mockSignInWithPopup.mockResolvedValue({ user: { uid: 'google-user' } });
    (userService.getUserBack as any).mockResolvedValue({ id: 'google-user', name: 'Google User' });

    renderModal();

    fireEvent.click(screen.getByText('Iniciar Sesión con Google'));

    await waitFor(() => {
      expect(mockSignInWithPopup).toHaveBeenCalled();
      expect(dispatch).toHaveBeenCalled();
    });
  });
});
