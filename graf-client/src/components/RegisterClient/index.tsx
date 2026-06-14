'use client';
import React, { useState } from 'react';
import { Form, Button, Container, Row, Col, Card, Spinner, Image } from 'react-bootstrap';
import { useDispatch, useSelector } from 'react-redux';
import { useRouter } from 'next/navigation';
import { addNotification } from '@/redux/ui';
import { auth } from '@/utils/firebase';
import firebase from 'firebase/compat/app';
import { UserRole } from '@/types';
import { getUserBack } from '@/services/userService';
import { login } from '@/redux/auth';
import { getFirebaseErrorMessage } from '@/utils/firebaseErrors';
import { RootState } from '@/redux/store';
import { FaUser, FaIdCard, FaEnvelope, FaLock, FaGoogle, FaShieldAlt } from 'react-icons/fa';

interface FormErrors {
  email: string;
  password: string;
  confirmPassword: string;
  name: string;
  acceptPolicies: string;
}

interface RegisterClientProps {
  storeId?: string;
}

const RegisterClient: React.FC<RegisterClientProps> = ({ storeId }) => {
  const dispatch = useDispatch();
  const router = useRouter();
  const config = useSelector((state: RootState) => state.ui.store?.configuration);
  const storeName = storeId ? (config?.store?.name || 'Graf') : 'Graf';
  const logoSrc = storeId ? (config?.logo || '/images/logo.svg') : '/images/logo.svg';

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    name: '',
    acceptPolicies: false,
    documentNumber: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({
    email: '',
    password: '',
    confirmPassword: '',
    name: '',
    acceptPolicies: '',
  });

  const validateEmail = (email: string) => /\S+@\S+\.\S+/.test(email);

  const validateForm = () => {
    const formErrors = { ...errors };
    let isValid = true;

    if (!validateEmail(formData.email)) {
      formErrors.email = 'Formato de correo inválido';
      isValid = false;
    } else {
      formErrors.email = '';
    }

    if (formData.password.length < 8) {
      formErrors.password = 'Mínimo 8 caracteres';
      isValid = false;
    } else {
      formErrors.password = '';
    }

    if (formData.password !== formData.confirmPassword) {
      formErrors.confirmPassword = 'Las contraseñas no coinciden';
      isValid = false;
    } else {
      formErrors.confirmPassword = '';
    }

    if (!formData.name.trim()) {
      formErrors.name = 'El nombre es obligatorio';
      isValid = false;
    } else {
      formErrors.name = '';
    }

    if (!formData.acceptPolicies) {
      formErrors.acceptPolicies = 'Debes aceptar las políticas de privacidad';
      isValid = false;
    } else {
      formErrors.acceptPolicies = '';
    }

    setErrors(formErrors);
    return isValid;
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!validateForm()) return;
    setIsLoading(true);
    try {
      const userCredential = await auth.createUserWithEmailAndPassword(
        formData.email,
        formData.password
      );
      const user = userCredential.user;
      if (user) {
        await user.updateProfile({ displayName: formData.name });
        await new Promise((resolve) => setTimeout(resolve, 1000));
        await user.getIdToken(true);
        const userData = await getUserBack(user, UserRole.CUSTOMER);
        dispatch(login(userData));
        dispatch(addNotification({ message: 'Registro exitoso', color: 'success' }));
        router.push(storeId ? `/${storeId}` : '/');
      }
    } catch (error: unknown) {
      const errMsg = getFirebaseErrorMessage(error, 'El registro ha fallado');
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
        await new Promise((resolve) => setTimeout(resolve, 500));
        await result.user.getIdToken(true);
        const userData = await getUserBack(result.user, UserRole.CUSTOMER);
        dispatch(login(userData));
        dispatch(addNotification({ message: 'Registro con Google exitoso', color: 'success' }));
        router.push(storeId ? `/${storeId}` : '/');
      }
    } catch (error: unknown) {
      const errMsg = getFirebaseErrorMessage(error, 'Error al registrarse con Google');
      dispatch(addNotification({ message: errMsg, color: 'danger' }));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Container className="py-4">
      <Row className="justify-content-center">
        <Col xs={12} className="text-center mb-4">
          <div className="d-flex align-items-center justify-content-center">
            <Image
              src={logoSrc}
              alt="Logo"
              width={60}
              height={60}
              className="img-fluid"
            />
            <h1 className="display-5 fw-bold mb-0 ms-2">{storeName}</h1>
          </div>
        </Col>
        <Col xs={12} sm={10} md={8} lg={6}>
          <Card className="shadow-sm">
            <Card.Body className="p-4">
              <h3 className="text-center mb-4">Crear cuenta</h3>
              <Form onSubmit={handleSubmit}>
                <Form.Group className="mb-3" controlId="regName">
                  <Form.Label>Nombre completo</Form.Label>
                  <div className="input-group">
                    <span className="input-group-text"><FaUser /></span>
                    <Form.Control
                      type="text"
                      placeholder="Tu nombre"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      isInvalid={!!errors.name}
                    />
                    <Form.Control.Feedback type="invalid">{errors.name}</Form.Control.Feedback>
                  </div>
                </Form.Group>

                <Form.Group className="mb-3" controlId="regDocumentNumber">
                  <Form.Label>
                    Número de documento{' '}
                    <span className="text-muted fw-normal" style={{ fontSize: '0.85em' }}>(opcional)</span>
                  </Form.Label>
                  <div className="input-group">
                    <span className="input-group-text"><FaIdCard /></span>
                    <Form.Control
                      type="text"
                      placeholder="Cédula o pasaporte"
                      value={formData.documentNumber}
                      onChange={(e) => setFormData({ ...formData, documentNumber: e.target.value })}
                    />
                  </div>
                </Form.Group>

                <Form.Group className="mb-3" controlId="regEmail">
                  <Form.Label>Correo electrónico</Form.Label>
                  <div className="input-group">
                    <span className="input-group-text"><FaEnvelope /></span>
                    <Form.Control
                      type="email"
                      placeholder="correo@ejemplo.com"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      isInvalid={!!errors.email}
                    />
                    <Form.Control.Feedback type="invalid">{errors.email}</Form.Control.Feedback>
                  </div>
                </Form.Group>

                <Form.Group className="mb-3" controlId="regPassword">
                  <Form.Label>Contraseña</Form.Label>
                  <div className="input-group">
                    <span className="input-group-text"><FaLock /></span>
                    <Form.Control
                      type="password"
                      placeholder="Mínimo 8 caracteres"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      isInvalid={!!errors.password}
                    />
                    <Form.Control.Feedback type="invalid">{errors.password}</Form.Control.Feedback>
                  </div>
                </Form.Group>

                <Form.Group className="mb-3" controlId="regConfirmPassword">
                  <Form.Label>Confirmar contraseña</Form.Label>
                  <div className="input-group">
                    <span className="input-group-text"><FaLock /></span>
                    <Form.Control
                      type="password"
                      placeholder="Repite tu contraseña"
                      value={formData.confirmPassword}
                      onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                      isInvalid={!!errors.confirmPassword}
                    />
                    <Form.Control.Feedback type="invalid">{errors.confirmPassword}</Form.Control.Feedback>
                  </div>
                </Form.Group>

                <label
                  htmlFor="regPolicies"
                  className={`mb-4 p-3 rounded border d-flex align-items-start gap-3 ${
                    errors.acceptPolicies
                      ? 'border-danger bg-danger bg-opacity-10'
                      : formData.acceptPolicies
                        ? 'border-success bg-success bg-opacity-10'
                        : 'border-warning bg-warning bg-opacity-10'
                  }`}
                  style={{ cursor: 'pointer' }}
                >
                  {/* Checkbox grande nativo */}
                  <input
                    id="regPolicies"
                    type="checkbox"
                    checked={formData.acceptPolicies}
                    onChange={(e) =>
                      setFormData({ ...formData, acceptPolicies: e.target.checked })
                    }
                    style={{
                      width: '22px',
                      height: '22px',
                      minWidth: '22px',
                      cursor: 'pointer',
                      marginTop: '2px',
                      accentColor: formData.acceptPolicies ? '#198754' : undefined,
                    }}
                  />
                  {/* Texto */}
                  <div className="flex-grow-1">
                    <div className="d-flex align-items-center gap-2 mb-1">
                      <FaShieldAlt
                        className={formData.acceptPolicies ? 'text-success' : 'text-warning'}
                        size={16}
                      />
                      <span className="fw-semibold" style={{ fontSize: '0.9rem' }}>
                        Tratamiento de datos personales
                      </span>
                    </div>
                    <span style={{ fontSize: '0.85rem' }}>
                      He leído y acepto el{' '}
                      <a
                        href="/graf/privacyPolicies"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="fw-semibold"
                        onClick={(e) => e.stopPropagation()}
                      >
                        tratamiento de mis datos personales
                      </a>{' '}
                      según la Ley 1581 de 2012.
                    </span>
                    {errors.acceptPolicies && (
                      <div className="text-danger mt-1" style={{ fontSize: '0.8rem' }}>
                        <strong>⚠ Obligatorio:</strong> {errors.acceptPolicies}
                      </div>
                    )}
                  </div>
                </label>

                <Button className="w-100 mb-3" variant="primary" type="submit" disabled={isLoading}>
                  {isLoading ? <Spinner animation="border" size="sm" /> : 'Crear cuenta'}
                </Button>

                <Button
                  className="w-100 mb-3"
                  variant="outline-secondary"
                  style={{ backgroundColor: 'white', color: 'black' }}
                  onClick={signInWithGoogle}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <Spinner animation="border" size="sm" />
                  ) : (
                    <><FaGoogle className="me-2" />Registrarse con Google</>
                  )}
                </Button>

                <div className="text-center mt-2">
                  <Button
                    variant="link"
                    className="text-muted p-0"
                    style={{ fontSize: '0.9rem', boxShadow: 'none' }}
                    onClick={() => router.push(storeId ? `/${storeId}/login` : '/login')}
                  >
                    ¿Ya tienes cuenta? Inicia sesión
                  </Button>
                </div>
              </Form>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default RegisterClient;
