'use client';
import React, { useState, useEffect } from 'react';
import { Button, Form, Spinner, Alert } from 'react-bootstrap';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '@/redux/store';
import { addNotification } from '@/redux/ui';
import { login } from '@/redux/auth';
import { auth } from '@/utils/firebase';
import firebase from 'firebase/compat/app';
import { UserRole } from '@/types';
import { getUserBack } from '@/services/userService';
import { getFirebaseErrorMessage, isEmailAlreadyInUseError } from '@/utils/firebaseErrors';
import { FaLock, FaCheckCircle } from 'react-icons/fa';

interface AuthStepProps {
  onComplete: () => void;
}

const AuthStep: React.FC<AuthStepProps> = ({ onComplete }) => {
  const dispatch = useDispatch();
  const { userData } = useSelector((state: RootState) => state.auth);

  const [mode, setMode] = useState<'login' | 'register' | 'forgot'>('login');
  const [loginData, setLoginData] = useState({ email: '', password: '' });
  const [registerData, setRegisterData] = useState({
    name: '', email: '', password: '', confirmPassword: '',
    acceptPolicies: false, documentNumber: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetSent, setResetSent] = useState(false);

  useEffect(() => {
    if (userData) onComplete();
  }, [userData, onComplete]);

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

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const cred = await auth.signInWithEmailAndPassword(loginData.email, loginData.password);
      if (cred.user?.email) {
        const ud = await getUserBack(cred.user, UserRole.CUSTOMER);
        dispatch(login(ud));
        dispatch(addNotification({ message: 'Bienvenido', color: 'success' }));
      }
    } catch (error: unknown) {
      dispatch(addNotification({ message: getFirebaseErrorMessage(error, 'Error al iniciar sesión'), color: 'danger' }));
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateRegister()) return;
    setIsLoading(true);
    try {
      const cred = await auth.createUserWithEmailAndPassword(registerData.email, registerData.password);
      if (cred.user) {
        await cred.user.updateProfile({ displayName: registerData.name });
        await new Promise(r => setTimeout(r, 1000));
        await cred.user.getIdToken(true);
        const ud = await getUserBack(cred.user, UserRole.CUSTOMER);
        dispatch(login(ud));
        dispatch(addNotification({ message: 'Registro exitoso', color: 'success' }));
      }
    } catch (error: unknown) {
      const msg = getFirebaseErrorMessage(error, 'Error en el registro');
      if (isEmailAlreadyInUseError(error)) {
        setMode('login');
        setLoginData({ email: registerData.email, password: '' });
      }
      dispatch(addNotification({ message: msg, color: 'danger' }));
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetEmail) return;
    setIsLoading(true);
    try {
      await auth.sendPasswordResetEmail(resetEmail);
      setResetSent(true);
      dispatch(addNotification({ message: 'Correo de restablecimiento enviado', color: 'success' }));
    } catch (error: unknown) {
      dispatch(addNotification({ message: getFirebaseErrorMessage(error, 'Error al enviar correo'), color: 'danger' }));
    } finally {
      setIsLoading(false);
    }
  };

  const signInWithGoogle = async () => {
    setIsLoading(true);
    try {
      const result = await auth.signInWithPopup(new firebase.auth.GoogleAuthProvider());
      if (result.user) {
        await new Promise(r => setTimeout(r, 500));
        await result.user.getIdToken(true);
        const ud = await getUserBack(result.user, UserRole.CUSTOMER);
        dispatch(login(ud));
        dispatch(addNotification({ message: 'Inicio con Google exitoso', color: 'success' }));
      }
    } catch (error: unknown) {
      dispatch(addNotification({ message: getFirebaseErrorMessage(error, 'Error con Google'), color: 'danger' }));
    } finally {
      setIsLoading(false);
    }
  };

  if (userData) return null;

  return (
    <div className="wizard-step-card">
      <div className="wizard-step-card__title"><FaLock className="me-2" />Iniciar Sesión o Registrarse</div>
      <p className="wizard-step-card__subtitle">Necesitas una cuenta para continuar con tu pedido.</p>

      {mode === 'login' && (
        <Form onSubmit={handleLogin}>
          <Form.Group className="mb-3">
            <Form.Control type="email" placeholder="Correo electrónico" value={loginData.email}
              onChange={e => setLoginData({ ...loginData, email: e.target.value })} required />
          </Form.Group>
          <Form.Group className="mb-2">
            <Form.Control type="password" placeholder="Contraseña" value={loginData.password}
              onChange={e => setLoginData({ ...loginData, password: e.target.value })} required />
          </Form.Group>
          <div className="text-end mb-3">
            <Button variant="link" className="text-muted p-0" style={{ fontSize: '0.85rem' }}
              onClick={() => { setResetEmail(loginData.email); setResetSent(false); setMode('forgot'); }}>
              ¿Olvidaste tu contraseña?
            </Button>
          </div>
          <Button variant="primary" type="submit" className="w-100" disabled={isLoading}>
            {isLoading ? <Spinner animation="border" size="sm" /> : 'Iniciar Sesión'}
          </Button>
          <Button variant="warning" className="w-100 mt-2" onClick={signInWithGoogle} disabled={isLoading}>
            {isLoading ? <Spinner animation="border" size="sm" /> : 'Continuar con Google'}
          </Button>
          <div className="text-center mt-3">
            <Button variant="link" onClick={() => setMode('register')}>¿No tienes cuenta? Regístrate</Button>
          </div>
        </Form>
      )}

      {mode === 'register' && (
        <Form onSubmit={handleRegister}>
          <Form.Group className="mb-3">
            <Form.Control type="text" placeholder="Nombre *" value={registerData.name}
              onChange={e => setRegisterData({ ...registerData, name: e.target.value })} required />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Control type="text" placeholder="Número de documento (opcional)" value={registerData.documentNumber}
              onChange={e => setRegisterData({ ...registerData, documentNumber: e.target.value })} />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Control type="email" placeholder="Correo electrónico *" value={registerData.email}
              onChange={e => setRegisterData({ ...registerData, email: e.target.value })} required />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Control type="password" placeholder="Contraseña *" value={registerData.password}
              onChange={e => setRegisterData({ ...registerData, password: e.target.value })} required />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Control type="password" placeholder="Confirmar contraseña *" value={registerData.confirmPassword}
              onChange={e => setRegisterData({ ...registerData, confirmPassword: e.target.value })} required />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Check type="checkbox" label={<>He leído y acepto las <a href="/privacyPolicies" target="_blank" rel="noopener noreferrer">políticas de privacidad</a></>}
              checked={registerData.acceptPolicies}
              onChange={e => setRegisterData({ ...registerData, acceptPolicies: e.target.checked })} />
          </Form.Group>
          <Button variant="primary" type="submit" className="w-100" disabled={isLoading}>
            {isLoading ? <Spinner animation="border" size="sm" /> : 'Registrarse'}
          </Button>
          <Button variant="warning" className="w-100 mt-2" onClick={signInWithGoogle} disabled={isLoading}>
            {isLoading ? <Spinner animation="border" size="sm" /> : 'Registrarse con Google'}
          </Button>
          <div className="text-center mt-3">
            <Button variant="link" onClick={() => setMode('login')}>¿Ya tienes cuenta? Inicia Sesión</Button>
          </div>
        </Form>
      )}

      {mode === 'forgot' && (
        <Form onSubmit={handleForgot}>
          {resetSent ? (
            <Alert variant="success">
              <FaCheckCircle className="me-2" />Enlace enviado a <strong>{resetEmail}</strong>. Revisa tu bandeja de entrada.
            </Alert>
          ) : (
            <>
              <p className="text-muted mb-3">Ingresa tu correo para restablecer tu contraseña.</p>
              <Form.Group className="mb-3">
                <Form.Control type="email" placeholder="Correo electrónico" value={resetEmail}
                  onChange={e => setResetEmail(e.target.value)} required />
              </Form.Group>
              <Button variant="primary" type="submit" className="w-100" disabled={isLoading}>
                {isLoading ? <Spinner animation="border" size="sm" /> : 'Enviar enlace'}
              </Button>
            </>
          )}
          <div className="text-center mt-3">
            <Button variant="link" onClick={() => { setMode('login'); setResetSent(false); }}>
              Volver a Iniciar Sesión
            </Button>
          </div>
        </Form>
      )}
    </div>
  );
};

export default AuthStep;
