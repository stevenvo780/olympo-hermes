'use client';
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Form, Button, Container, Card, Row, Col, Modal, Image } from 'react-bootstrap';
import { useDispatch } from 'react-redux';
import { login } from '@/redux/auth';
import { addNotification } from '@/redux/ui';
import { auth } from '@/utils/firebase';
import firebase from 'firebase/compat/app';
import { UserRole } from '@/types';
import { getUserBack } from '@/services/userService';

const LoginClient: React.FC = () => {
  const dispatch = useDispatch();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetEmail, setResetEmail] = useState('');

  const handleLogin = async (userCredential: firebase.auth.UserCredential) => {
    const user = userCredential.user;
    if (user && user.email) {
      try {
        const userData = await getUserBack(user, UserRole.BUSINESS_OWNER);
        dispatch(login(userData));
        dispatch(addNotification({ message: 'Bienvenido', color: 'success' }));
        router.push('/');
      } catch (error: unknown) {
        const message =
          error instanceof Error || (typeof error === 'object' && error && 'message' in error)
            ? (error as { message?: string }).message
            : undefined;
        console.error(message);
        dispatch(addNotification({
          message: 'Error al obtener usuario',
          color: 'danger'
        }));
        await auth.signOut();
      }
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsLoading(true);
    try {
      const userCredential = await auth.signInWithEmailAndPassword(email, password);
      await handleLogin(userCredential);
    } catch (error: unknown) {
      const message =
        error instanceof Error || (typeof error === 'object' && error && 'message' in error)
          ? (error as { message?: string }).message
          : undefined;
      console.error(message);
      dispatch(addNotification({
        message: 'Error al iniciar sesión',
        color: 'danger'
      }));
    } finally {
      setIsLoading(false);
    }
  };

  const signInWithGoogle = async () => {
    setIsLoading(true);
    const provider = new firebase.auth.GoogleAuthProvider();
    try {
      const result = await auth.signInWithPopup(provider);
      await handleLogin(result);
    } catch (error: unknown) {
      const message =
        error instanceof Error || (typeof error === 'object' && error && 'message' in error)
          ? (error as { message?: string }).message
          : undefined;
      console.error(message);
      dispatch(addNotification({
        message: 'Error al iniciar sesión con Google',
        color: 'danger'
      }));
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async () => {
    setIsLoading(true);
    try {
      await auth.sendPasswordResetEmail(resetEmail);
      dispatch(addNotification({
        message: 'Se ha enviado un correo para restablecer tu contraseña',
        color: 'success'
      }));
      setShowResetModal(false);
    } catch (error: unknown) {
      const message =
        error instanceof Error || (typeof error === 'object' && error && 'message' in error)
          ? (error as { message?: string }).message
          : undefined;
      console.error(message);
      dispatch(addNotification({
        message: 'Error al enviar el correo de restablecimiento',
        color: 'danger'
      }));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Container className="py-4">
      <Row className="justify-content-center">
        <Col xs={12} className="text-center mb-4">
          <Image
            src="/images/logo.svg"
            alt="Logo"
            width={70}
            height={70}
            className="d-inline-block"
          />
          <h1 className="display-4 fw-bold mb-0 ms-2 d-inline-block">
            Graf
          </h1>
        </Col>
        <Col xs={12} sm={10} md={8} lg={6} xl={5}>
          <Card className="shadow-sm">
            <Card.Body className="p-4">
              <h3 className="text-center mb-4">Iniciar Sesión</h3>
              <Form onSubmit={handleSubmit}>
                <Form.Group className="mb-3" controlId="formBasicEmail">
                  <Form.Label>Correo Electrónico</Form.Label>
                  <Form.Control
                    type="email"
                    placeholder="Ingresa tu correo electrónico"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </Form.Group>
                <Form.Group className="mb-4" controlId="formBasicPassword">
                  <Form.Label>Contraseña</Form.Label>
                  <Form.Control
                    type="password"
                    placeholder="Ingresa tu contraseña"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </Form.Group>
                <Button className="w-100 mb-3" variant="primary" type="submit" disabled={isLoading}>
                  {isLoading ? 'Cargando...' : 'Iniciar Sesión'}
                </Button>
                <Button
                  className="w-100 mb-3"
                  variant="outline-secondary"
                  style={{ backgroundColor: 'white', color: 'black' }}
                  onClick={signInWithGoogle}
                  disabled={isLoading}
                >
                  {isLoading ? 'Cargando...' : 'Iniciar Sesión con Google'}
                </Button>
                <div className="d-grid mt-4">
                  <Button
                    variant="secondary"
                    onClick={() => router.push('/register')}
                  >
                    Crear una cuenta nueva
                  </Button>
                </div>
              </Form>
            </Card.Body>
            <Card.Footer className="text-center bg-transparent border-0 pb-3">
              <Button
                variant="link"
                className="text-muted p-0"
                style={{ fontSize: '0.9rem', boxShadow: 'none' }}
                onClick={() => setShowResetModal(true)}
              >
                ¿Olvidaste tu contraseña?
              </Button>
            </Card.Footer>
          </Card>
        </Col>
      </Row>

      <Modal show={showResetModal} onHide={() => setShowResetModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Restablecer Contraseña</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form.Group controlId="formBasicResetEmail">
            <Form.Label>Correo Electrónico</Form.Label>
            <Form.Control
              type="email"
              placeholder="Ingresa tu correo electrónico"
              value={resetEmail}
              onChange={(e) => setResetEmail(e.target.value)}
            />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowResetModal(false)}>
            Cancelar
          </Button>
          <Button variant="primary" onClick={handleResetPassword} disabled={isLoading}>
            {isLoading ? 'Enviando...' : 'Enviar correo'}
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default LoginClient;
