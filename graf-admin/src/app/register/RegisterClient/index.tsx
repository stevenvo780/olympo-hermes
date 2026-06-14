'use client';
import React, { useState } from 'react';
import { Form, Button, Container, Row, Col, Card, InputGroup, Spinner } from 'react-bootstrap';
import { useDispatch } from 'react-redux';
import { useRouter } from 'next/navigation';
import { addNotification } from '@/redux/ui';
import { auth } from '@/utils/firebase';
import firebase from 'firebase/compat/app';
import { UserRole } from '@/types';
import { getUserBack } from '@/services/userService';
import { login } from '@/redux/auth';
import './RegisterClient.scss';

interface FormErrors {
  email: string;
  password: string;
  confirmPassword: string;
  name: string;
  acceptPolicies: string;
}

const RegisterClient: React.FC = () => {
  const dispatch = useDispatch();
  const router = useRouter();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    name: '',
    acceptPolicies: false,
    documentNumber: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({ 
    email: '', 
    password: '', 
    confirmPassword: '', 
    name: '', 
    acceptPolicies: '' 
  });

  const validateEmail = (email: string) => {
    const re = /\S+@\S+\.\S+/;
    return re.test(email);
  };

  const validateForm = () => {
    const formErrors = { ...errors };
    let isValid = true;

    if (!validateEmail(formData.email)) {
      formErrors.email = 'Formato de correo electrónico inválido';
      isValid = false;
    }

    if (formData.password.length < 8) {
      formErrors.password = 'La contraseña debe tener al menos 8 caracteres';
      isValid = false;
    }

    if (formData.password !== formData.confirmPassword) {
      formErrors.confirmPassword = 'Las contraseñas no coinciden';
      isValid = false;
    }

    if (!formData.name) {
      formErrors.name = 'El nombre es obligatorio';
      isValid = false;
    }

    if (!formData.acceptPolicies) {
      formErrors.acceptPolicies = 'Debes aceptar las políticas de privacidad';
      isValid = false;
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
        const userData = await getUserBack(user, UserRole.BUSINESS_OWNER);
        dispatch(login(userData));
        dispatch(addNotification({ message: 'Registro exitoso', color: 'success' }));
        router.push('/');
      }
    } catch (error: unknown) {
      const message =
        error instanceof Error || (typeof error === 'object' && error && 'message' in error)
          ? (error as { message?: string }).message
          : undefined;
      dispatch(addNotification({ 
        message: message || 'El registro ha fallado', 
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
      if (result.user) {
        const userData = await getUserBack(result.user, UserRole.BUSINESS_OWNER);
        dispatch(login(userData));
        dispatch(addNotification({ message: 'Registro con Google exitoso', color: 'success' }));
        router.push('/');
      }
    } catch {
      dispatch(addNotification({ 
        message: 'Error al registrarse con Google', 
        color: 'danger' 
      }));
    } finally {
      setIsLoading(false);
    }
  };

  const checkboxStyle = {
    width: "20px",
    height: "20px",
    marginRight: "10px",
    accentColor: "var(--bs-primary, #0d6efd)"
  };

  return (
    <Container fluid className="register-container px-3">
      <Row className="w-100 justify-content-center">
        <Col xs={12} md={10} lg={8} xl={6}>
          <h1 className="text-center register-title">
            Regístrate
          </h1>
          <Card className="register-card shadow-lg">
            <Card.Body>
              <Form onSubmit={handleSubmit}>
                <Form.Group controlId="formBasicName" className="mb-3">
                  <InputGroup>
                    <Form.Control
                      type="text"
                      placeholder="Nombre"
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      isInvalid={!!errors.name}
                    />
                    <Form.Control.Feedback type="invalid">
                      {errors.name}
                    </Form.Control.Feedback>
                  </InputGroup>
                </Form.Group>

                <Form.Group controlId="formBasicDocumentNumber" className="mb-3">
                  <InputGroup>
                    <Form.Control
                      type="text"
                      placeholder="Número de documento (opcional)"
                      value={formData.documentNumber}
                      onChange={(e) => setFormData({...formData, documentNumber: e.target.value})}
                    />
                  </InputGroup>
                </Form.Group>

                <Form.Group controlId="formBasicEmail" className="mb-3">
                  <InputGroup>
                    <Form.Control
                      type="email"
                      placeholder="Correo electrónico"
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                      isInvalid={!!errors.email}
                    />
                    <Form.Control.Feedback type="invalid">
                      {errors.email}
                    </Form.Control.Feedback>
                  </InputGroup>
                </Form.Group>

                <Form.Group controlId="formBasicPassword" className="mb-3">
                  <InputGroup>
                    <Form.Control
                      type="password"
                      placeholder="Contraseña"
                      value={formData.password}
                      onChange={(e) => setFormData({...formData, password: e.target.value})}
                      isInvalid={!!errors.password}
                    />
                    <Form.Control.Feedback type="invalid">
                      {errors.password}
                    </Form.Control.Feedback>
                  </InputGroup>
                </Form.Group>

                <Form.Group controlId="formBasicConfirmPassword" className="mb-3">
                  <InputGroup>
                    <Form.Control
                      type="password"
                      placeholder="Confirmar contraseña"
                      value={formData.confirmPassword}
                      onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
                      isInvalid={!!errors.confirmPassword}
                    />
                    <Form.Control.Feedback type="invalid">
                      {errors.confirmPassword}
                    </Form.Control.Feedback>
                  </InputGroup>
                </Form.Group>

                <Form.Group controlId="formBasicCheckbox" className="mb-3">
                  <div className="d-flex align-items-center">
                    <input 
                      type="checkbox" 
                      id="accept-policies" 
                      checked={formData.acceptPolicies}
                      onChange={(e) => setFormData({...formData, acceptPolicies: e.target.checked})}
                      style={checkboxStyle}
                    />
                    <label htmlFor="accept-policies" className="policy-text ms-2">
                      He leído y acepto las{' '}
                      <a href="/privacyPolicies" target="_blank" rel="noopener noreferrer">
                        políticas de privacidad
                      </a>
                    </label>
                  </div>
                  {errors.acceptPolicies && (
                    <Form.Text className="text-danger">
                      {errors.acceptPolicies}
                    </Form.Text>
                  )}
                </Form.Group>

                <div className="register-buttons">
                  <Button 
                    variant="primary" 
                    type="submit" 
                    className="w-100" 
                    disabled={isLoading}
                  >
                    {isLoading ? <Spinner animation="border" size="sm" /> : 'Registrar'}
                  </Button>

                  <Button 
                    variant="secondary" 
                    className="w-100 mt-2" 
                    onClick={signInWithGoogle} 
                    disabled={isLoading}
                  >
                    {isLoading ? <Spinner animation="border" size="sm" /> : 'Registrar con Google'}
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
