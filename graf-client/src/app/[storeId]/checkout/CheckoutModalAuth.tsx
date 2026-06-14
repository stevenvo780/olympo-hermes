import React, { useState, useEffect } from 'react';
import { Modal, Button, Form, Spinner, Alert } from 'react-bootstrap';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '@/redux/store';
import { addNotification } from '@/redux/ui';
import { login } from '@/redux/auth';
import { auth } from '@/utils/firebase';
import firebase from 'firebase/compat/app';
import { UserRole } from '@/types';
import { getUserBack } from '@/services/userService';
import { useParams, useRouter } from 'next/navigation';
import { getFirebaseErrorMessage, isEmailAlreadyInUseError } from '@/utils/firebaseErrors';
import { FaCheckCircle } from 'react-icons/fa';

interface CheckoutModalAuthProps {
  show: boolean;
  onHide: () => void;
}

interface LoginFormData {
  email: string;
  password: string;
}

interface RegisterFormData {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  acceptPolicies: boolean;
  documentNumber?: string;
}

const CheckoutModalAuth: React.FC<CheckoutModalAuthProps> = ({ show, onHide }) => {
  const dispatch = useDispatch();
  const { userData } = useSelector((state: RootState) => state.auth);
  const router = useRouter();
  const { storeId } = useParams();

  useEffect(() => {
    if (userData && show) {
      onHide();
    }
  }, [userData, show, onHide]);

  const [mode, setMode] = useState<'login' | 'register' | 'forgot'>('login');
  const [loginData, setLoginData] = useState<LoginFormData>({ email: '', password: '' });
  const [registerData, setRegisterData] = useState<RegisterFormData>({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    acceptPolicies: false,
    documentNumber: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetSent, setResetSent] = useState(false);

  const validateRegister = (): boolean => {
    if (!/\S+@\S+\.\S+/.test(registerData.email)) {
      dispatch(addNotification({ message: 'Formato de correo inválido', color: 'danger' }));
      return false;
    }
    if (registerData.password.length < 8) {
      dispatch(addNotification({ message: 'La contraseña debe tener al menos 8 caracteres', color: 'danger' }));
      return false;
    }
    if (registerData.password !== registerData.confirmPassword) {
      dispatch(addNotification({ message: 'Las contraseñas no coinciden', color: 'danger' }));
      return false;
    }
    if (!registerData.name) {
      dispatch(addNotification({ message: 'El nombre es obligatorio', color: 'danger' }));
      return false;
    }
    if (!registerData.acceptPolicies) {
      dispatch(addNotification({ message: 'Debes aceptar las políticas de privacidad', color: 'danger' }));
      return false;
    }
    return true;
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const userCredential = await auth.signInWithEmailAndPassword(loginData.email, loginData.password);
      const user = userCredential.user;
      if (user && user.email) {
        const userData = await getUserBack(user, UserRole.CUSTOMER);
        dispatch(login(userData));
        dispatch(addNotification({ message: 'Bienvenido', color: 'success' }));
        onHide();
      }
    } catch (error: unknown) {
      const errMsg = getFirebaseErrorMessage(error, 'Error al iniciar sesión');
      dispatch(addNotification({ message: errMsg, color: 'danger' }));
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateRegister()) return;
    setIsLoading(true);
    try {
      const userCredential = await auth.createUserWithEmailAndPassword(registerData.email, registerData.password);
      const user = userCredential.user;
      if (user) {
        await user.updateProfile({ displayName: registerData.name });

        await new Promise(resolve => setTimeout(resolve, 1000));
        await user.getIdToken(true);

        const userData = await getUserBack(user, UserRole.CUSTOMER);
        dispatch(login(userData));
        dispatch(addNotification({ message: 'Registro exitoso. Completa tus datos de envío para finalizar tu pedido.', color: 'success' }));
        onHide();
      }
    } catch (error: unknown) {
      const errMsg = getFirebaseErrorMessage(error, 'Error en el registro');
      if (isEmailAlreadyInUseError(error)) {
        setMode('login');
        setLoginData({ email: registerData.email, password: '' });
      }
      dispatch(addNotification({ message: errMsg, color: 'danger' }));
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetEmail) {
      dispatch(addNotification({ message: 'Ingresa tu correo electrónico', color: 'warning' }));
      return;
    }
    setIsLoading(true);
    try {
      await auth.sendPasswordResetEmail(resetEmail);
      setResetSent(true);
      dispatch(addNotification({ message: 'Se ha enviado un correo para restablecer tu contraseña', color: 'success' }));
    } catch (error: unknown) {
      const errMsg = getFirebaseErrorMessage(error, 'Error al enviar el correo de restablecimiento');
      dispatch(addNotification({ message: errMsg, color: 'danger' }));
    } finally {
      setIsLoading(false);
    }
  };

  const signInWithGoogle = async () => {
    setIsLoading(true);
    const provider = new firebase.auth.GoogleAuthProvider();
    try {
      const result = await auth.signInWithPopup(provider);
      if (result.user) {
        await new Promise(resolve => setTimeout(resolve, 500));
        await result.user.getIdToken(true);

        const userData = await getUserBack(result.user, UserRole.CUSTOMER);
        dispatch(login(userData));
        dispatch(addNotification({ message: mode === 'login' ? 'Inicio de sesión exitoso' : 'Registro con Google exitoso', color: 'success' }));
        onHide();
      }
    } catch (error: unknown) {
      const errMsg = getFirebaseErrorMessage(error, 'Error con Google');
      dispatch(addNotification({ message: errMsg, color: 'danger' }));
    } finally {
      setIsLoading(false);
    }
  };

  const handleVolver = () => {
    router.push(`/${storeId}`);
  };

  const getModalTitle = () => {
    if (mode === 'login') return 'Iniciar Sesión';
    if (mode === 'register') return 'Registrarse';
    return 'Restablecer Contraseña';
  };

  return (
    <Modal
      show={show}
      onHide={onHide}
      backdrop="static"
      keyboard={false}
      centered
    >
      <Modal.Header closeButton={userData !== null}>
        <Modal.Title>{getModalTitle()}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {mode !== 'forgot' && (
          <p className="text-center text-danger mb-3">
            Debes iniciar sesión para poder completar tu orden
          </p>
        )}
        {mode === 'login' && (
          <Form onSubmit={handleLoginSubmit}>
            <Form.Group controlId="loginEmail">
              <Form.Control
                type="email"
                placeholder="Correo electrónico"
                value={loginData.email}
                onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
              />
            </Form.Group>
            <br />
            <Form.Group controlId="loginPassword">
              <Form.Control
                type="password"
                placeholder="Contraseña"
                value={loginData.password}
                onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
              />
            </Form.Group>
            <div className="text-end mt-1">
              <Button
                variant="link"
                className="text-muted p-0"
                style={{ fontSize: '0.85rem', boxShadow: 'none' }}
                onClick={() => {
                  setResetEmail(loginData.email);
                  setResetSent(false);
                  setMode('forgot');
                }}
                disabled={isLoading}
              >
                ¿Olvidaste tu contraseña?
              </Button>
            </div>
            <br />
            <Button variant="primary" type="submit" className="w-100" disabled={isLoading}>
              {isLoading ? <Spinner animation="border" size="sm" /> : 'Iniciar Sesión'}
            </Button>
            <Button
              variant="warning"
              className="w-100 mt-2"
              onClick={signInWithGoogle}
              disabled={isLoading}
            >
              {isLoading ? <Spinner animation="border" size="sm" /> : 'Iniciar Sesión con Google'}
            </Button>
          </Form>
        )}
        {mode === 'register' && (
          <Form onSubmit={handleRegisterSubmit}>
            <Form.Group controlId="registerName">
              <Form.Control
                type="text"
                placeholder="Nombre"
                value={registerData.name}
                onChange={(e) => setRegisterData({ ...registerData, name: e.target.value })}
              />
            </Form.Group>
            <br />
            <Form.Group controlId="registerDocumentNumber">
              <Form.Control
                type="text"
                placeholder="Número de documento (opcional)"
                value={registerData.documentNumber}
                onChange={(e) => setRegisterData({ ...registerData, documentNumber: e.target.value })}
              />
            </Form.Group>
            <br />
            <Form.Group controlId="registerEmail">
              <Form.Control
                type="email"
                placeholder="Correo electrónico"
                value={registerData.email}
                onChange={(e) => setRegisterData({ ...registerData, email: e.target.value })}
              />
            </Form.Group>
            <br />
            <Form.Group controlId="registerPassword">
              <Form.Control
                type="password"
                placeholder="Contraseña"
                value={registerData.password}
                onChange={(e) => setRegisterData({ ...registerData, password: e.target.value })}
              />
            </Form.Group>
            <br />
            <Form.Group controlId="registerConfirmPassword">
              <Form.Control
                type="password"
                placeholder="Confirmar contraseña"
                value={registerData.confirmPassword}
                onChange={(e) => setRegisterData({ ...registerData, confirmPassword: e.target.value })}
              />
            </Form.Group>
            <br />
            <Form.Group controlId="registerAcceptPolicies">
              <Form.Check
                type="checkbox"
                label={
                  <>
                    He leído y acepto las{' '}
                    <a href="/privacyPolicies" target="_blank" rel="noopener noreferrer">
                      políticas de privacidad
                    </a>
                  </>
                }
                checked={registerData.acceptPolicies}
                onChange={(e) => setRegisterData({ ...registerData, acceptPolicies: e.target.checked })}
              />
            </Form.Group>
            <br />
            <Button variant="primary" type="submit" className="w-100" disabled={isLoading}>
              {isLoading ? <Spinner animation="border" size="sm" /> : 'Registrarse'}
            </Button>
            <Button
              variant="warning"
              className="w-100 mt-2"
              onClick={signInWithGoogle}
              disabled={isLoading}
            >
              {isLoading ? <Spinner animation="border" size="sm" /> : 'Registrarse con Google'}
            </Button>
          </Form>
        )}
        {mode === 'forgot' && (
          <Form onSubmit={handleForgotPassword}>
            {resetSent ? (
              <Alert variant="success">
                <FaCheckCircle className="me-2" />Se ha enviado un enlace de restablecimiento a <strong>{resetEmail}</strong>. 
                Revisa tu bandeja de entrada (y la carpeta de spam).
              </Alert>
            ) : (
              <>
                <p className="text-muted mb-3">
                  Ingresa tu correo electrónico y te enviaremos un enlace para restablecer tu contraseña.
                </p>
                <Form.Group controlId="resetEmail">
                  <Form.Control
                    type="email"
                    placeholder="Correo electrónico"
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                  />
                </Form.Group>
                <br />
                <Button variant="primary" type="submit" className="w-100" disabled={isLoading}>
                  {isLoading ? <Spinner animation="border" size="sm" /> : 'Enviar enlace de restablecimiento'}
                </Button>
              </>
            )}
          </Form>
        )}
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={handleVolver} disabled={isLoading}>
          Volver
        </Button>
        {mode === 'forgot' ? (
          <Button variant="info" onClick={() => { setMode('login'); setResetSent(false); }} disabled={isLoading}>
            Volver a Iniciar Sesión
          </Button>
        ) : (
          <Button variant="info" onClick={() => setMode(mode === 'login' ? 'register' : 'login')} disabled={isLoading}>
            {mode === 'login' ? '¿No tienes cuenta? Regístrate' : '¿Ya tienes cuenta? Inicia Sesión'}
          </Button>
        )}
      </Modal.Footer>
    </Modal>
  );
};

export default CheckoutModalAuth;
