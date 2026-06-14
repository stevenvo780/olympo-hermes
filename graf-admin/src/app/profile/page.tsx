'use client';
import React, { useState, useEffect } from 'react';
import { Container, Form, Button, Spinner, Row, Col, Alert, Modal } from 'react-bootstrap';
import {
  getAuth,
  verifyBeforeUpdateEmail,
  updatePassword,
  EmailAuthProvider,
  reauthenticateWithCredential
} from 'firebase/auth';
import { useDispatch } from 'react-redux';
import { logout } from '@/redux/auth';
import { AppDispatch } from '@/redux/store';
import api from '@/utils/axios';

const ProfileEditor: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const [account, setAccount] = useState({ email: '', name: '', apiKey: '', oldPassword: '' });
  const [passwordData, setPasswordData] = useState({ password: '', confirmPassword: '', currentPassword: '' });
  const [profile, setProfile] = useState({
    shippingAddress: {
      address: '',
      apartment: '',
      buildingName: '',
      city: '',
      department: '',
      country: '',
      reference: '',
    },
    additionalPhone: '',
  });
  const [loadingAccount, setLoadingAccount] = useState<boolean>(false);
  const [loadingProfile, setLoadingProfile] = useState<boolean>(false);
  const [loadingPassword, setLoadingPassword] = useState<boolean>(false);
  const [errorAccount, setErrorAccount] = useState<string>('');
  const [errorProfile, setErrorProfile] = useState<string>('');
  const [errorPassword, setErrorPassword] = useState<string>('');
  const [successAccount, setSuccessAccount] = useState<string>('');
  const [successProfile, setSuccessProfile] = useState<string>('');
  const [successPassword, setSuccessPassword] = useState<string>('');
  const [showPasswordModal, setShowPasswordModal] = useState<boolean>(false);

  useEffect(() => {
    const fetchData = async (): Promise<void> => {
      setLoadingProfile(true);
      try {
        const resProfile = await api.get('/profile/get/my');
        setProfile({
          shippingAddress: resProfile.data.shippingAddress || {
            address: '',
            apartment: '',
            buildingName: '',
            city: '',
            department: '',
            country: '',
            reference: '',
          },
          additionalPhone: resProfile.data.additionalPhone || '',
        });
      } catch (_error: unknown) {
        console.error(_error);
      }
      setLoadingProfile(false);
      setLoadingAccount(true);
      try {
        const resUser = await api.get('/user/me/data');
        setAccount({
          email: resUser.data.email,
          name: resUser.data.name || '',
          apiKey: resUser.data.apiKey || '',
          oldPassword: ''
        });
      } catch (_error: unknown) {
        console.error(_error);
      }
      setLoadingAccount(false);
    };
    fetchData();
  }, []);

  const handleAccountChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const { name, value } = e.target;
    setAccount((prev) => ({ ...prev, [name]: value }));
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const { name, value } = e.target;
    setPasswordData((prev) => ({ ...prev, [name]: value }));
  };

  const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const { name, value } = e.target;
    if (name in profile.shippingAddress) {
      setProfile((prev) => ({ ...prev, shippingAddress: { ...prev.shippingAddress, [name]: value } }));
    } else {
      setProfile((prev) => ({ ...prev, [name]: value }));
    }
  };

  const submitAccount = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    setLoadingAccount(true);
    setErrorAccount('');
    setSuccessAccount('');
    try {
      const user = getAuth().currentUser;
      if (user) {
        const token = await user.getIdToken(true);
        api.defaults.headers.common.Authorization = `Bearer ${token}`;
      }

      await api.patch('/user/me', { name: account.name, apiKey: account.apiKey });

      if (user && account.email !== user.email) {
        if (!account.oldPassword) {
          setErrorAccount('Se requiere la contraseña actual para cambiar el correo');
          setLoadingAccount(false);
          return;
        }

        const credential = EmailAuthProvider.credential(user.email || '', account.oldPassword);
        await reauthenticateWithCredential(user, credential);

        await api.patch('/user/me/email', { email: account.email });
        
        await verifyBeforeUpdateEmail(user, account.email);

        setSuccessAccount(
          'Correo actualizado. Revisa tu bandeja de entrada para confirmar. La sesión se cerrará en 3 segundos por seguridad.'
        );

        setTimeout(async () => {
          try {
            await dispatch(logout());
            window.location.href = '/login';
          } catch (error) {
            console.error('Error al cerrar sesión:', error);
            window.location.href = '/login';
          }
        }, 3000);
      } else {
        setSuccessAccount('Cuenta actualizada correctamente');
      }
    } catch (error: unknown) {
      console.error('Error en submitAccount:', error);
      const code =
        typeof error === 'object' && error !== null && 'code' in error
          ? (error as { code?: string }).code
          : undefined;
      const message =
        typeof error === 'object' && error !== null && 'message' in error
          ? (error as { message?: string }).message
          : undefined;

      if (code === 'auth/requires-recent-login') {
        setErrorAccount('Por seguridad, vuelve a iniciar sesión y prueba de nuevo.');
      } else {
        setErrorAccount(message || 'Error desconocido al actualizar la cuenta');
      }
    }
    setLoadingAccount(false);
  };

  const submitPassword = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    setLoadingPassword(true);
    setErrorPassword('');
    setSuccessPassword('');

    if (passwordData.password !== passwordData.confirmPassword) {
      setErrorPassword('Las contraseñas no coinciden');
      setLoadingPassword(false);
      return;
    }

    try {
      const auth = getAuth();
      if (auth.currentUser) {
        if (!passwordData.currentPassword) {
          setErrorPassword('Se requiere la contraseña actual');
          setLoadingPassword(false);
          return;
        }

        const credential = EmailAuthProvider.credential(
          auth.currentUser.email || '',
          passwordData.currentPassword
        );

        await reauthenticateWithCredential(auth.currentUser, credential);
        await updatePassword(auth.currentUser, passwordData.password);
        setSuccessPassword('Contraseña actualizada correctamente');
        setPasswordData({ password: '', confirmPassword: '', currentPassword: '' });

        setTimeout(() => {
          setShowPasswordModal(false);
        }, 2000);
      }
    } catch (error: unknown) {
      console.error(error);
      const code =
        typeof error === 'object' && error !== null && 'code' in error
          ? (error as { code?: string }).code
          : undefined;
      const message =
        typeof error === 'object' && error !== null && 'message' in error
          ? (error as { message?: string }).message
          : undefined;

      if (code === 'auth/wrong-password') {
        setErrorPassword('La contraseña actual es incorrecta');
      } else {
        setErrorPassword(`Error al actualizar la contraseña: ${message || 'Error desconocido'}`);
      }
    }
    setLoadingPassword(false);
  };

  const submitProfile = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    setLoadingProfile(true);
    setErrorProfile('');
    setSuccessProfile('');
    try {
      const user = getAuth().currentUser;
      if (user) {
        const token = await user.getIdToken(true);
        api.defaults.headers.common.Authorization = `Bearer ${token}`;
      }
      await api.put('/profile', profile);
      setSuccessProfile('Perfil actualizado correctamente');
    } catch (_error: unknown) {
      console.error(_error);
      setErrorProfile('Error al actualizar el perfil');
    }
    setLoadingProfile(false);
  };

  return (
    <Container className="mt-5">
      <h2>Editar Cuenta</h2>
      <Form onSubmit={submitAccount}>
        <Form.Group controlId="formEmail" className="mb-3">
          <Form.Label>Correo Electrónico</Form.Label>
          <Form.Control type="email" name="email" value={account.email} onChange={handleAccountChange} required />
        </Form.Group>
        <Form.Group controlId="formName" className="mb-3">
          <Form.Label>Nombre</Form.Label>
          <Form.Control type="text" name="name" value={account.name} onChange={handleAccountChange} required />
        </Form.Group>
        <Form.Group controlId="formApiKey" className="mb-3">
          <Form.Label>API Key</Form.Label>
          <Form.Control type="text" name="apiKey" value={account.apiKey} onChange={handleAccountChange} />
        </Form.Group>
        <Form.Group controlId="formOldPassword" className="mb-3">
          <Form.Label>Contraseña Actual (requerida para cambiar correo)</Form.Label>
          <Form.Control
            type="password"
            name="oldPassword"
            value={account.oldPassword}
            onChange={handleAccountChange}
            placeholder="Ingrese su contraseña actual"
          />
        </Form.Group>
        {errorAccount && <Alert variant="danger">{errorAccount}</Alert>}
        {successAccount && <Alert variant="success">{successAccount}</Alert>}
        <div className="d-flex gap-2 mb-4">
          <Button variant="primary" type="submit" disabled={loadingAccount}>
            {loadingAccount ? <Spinner animation="border" size="sm" /> : 'Guardar Cuenta'}
          </Button>
          <Button variant="secondary" onClick={() => setShowPasswordModal(true)}>
            Cambiar Contraseña
          </Button>
        </div>
      </Form>
      <hr />
      <h2>Editar Perfil</h2>
      <Form onSubmit={submitProfile}>
        <Row>
          <Col md={6}>
            <Form.Group controlId="fromAddress" className="mb-3">
              <Form.Label>Dirección</Form.Label>
              <Form.Control type="text" name="address" value={profile.shippingAddress.address} onChange={handleProfileChange} />
            </Form.Group>
          </Col>
          <Col md={6}>
            <Form.Group controlId="formApartment" className="mb-3">
              <Form.Label>Apartamento</Form.Label>
              <Form.Control type="text" name="apartment" value={profile.shippingAddress.apartment} onChange={handleProfileChange} />
            </Form.Group>
          </Col>
        </Row>
        <Form.Group controlId="formBuildingName" className="mb-3">
          <Form.Label>Nombre del Edificio</Form.Label>
          <Form.Control type="text" name="buildingName" value={profile.shippingAddress.buildingName} onChange={handleProfileChange} />
        </Form.Group>
        <Row>
          <Col md={4}>
            <Form.Group controlId="formCity" className="mb-3">
              <Form.Label>Ciudad</Form.Label>
              <Form.Control type="text" name="city" value={profile.shippingAddress.city} onChange={handleProfileChange} />
            </Form.Group>
          </Col>
          <Col md={4}>
            <Form.Group controlId="formDepartment" className="mb-3">
              <Form.Label>Departamento</Form.Label>
              <Form.Control type="text" name="department" value={profile.shippingAddress.department} onChange={handleProfileChange} />
            </Form.Group>
          </Col>
          <Col md={4}>
            <Form.Group controlId="formCountry" className="mb-3">
              <Form.Label>País</Form.Label>
              <Form.Control type="text" name="country" value={profile.shippingAddress.country} onChange={handleProfileChange} />
            </Form.Group>
          </Col>
        </Row>
        <Form.Group controlId="formReference" className="mb-3">
          <Form.Label>Referencia</Form.Label>
          <Form.Control type="text" name="reference" value={profile.shippingAddress.reference} onChange={handleProfileChange} />
        </Form.Group>
        <Form.Group controlId="formAdditionalPhone" className="mb-3">
          <Form.Label>Teléfono Adicional</Form.Label>
          <Form.Control type="text" name="additionalPhone" value={profile.additionalPhone} onChange={handleProfileChange} />
        </Form.Group>
        {errorProfile && <Alert variant="danger">{errorProfile}</Alert>}
        {successProfile && <Alert variant="success">{successProfile}</Alert>}
        <Button variant="primary" type="submit" disabled={loadingProfile}>
          {loadingProfile ? <Spinner animation="border" size="sm" /> : 'Guardar Perfil'}
        </Button>
      </Form>

      <Modal show={showPasswordModal} onHide={() => setShowPasswordModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Cambiar Contraseña</Modal.Title>
        </Modal.Header>
        <Form onSubmit={submitPassword}>
          <Modal.Body>
            <Form.Group controlId="formCurrentPassword" className="mb-3">
              <Form.Label>Contraseña Actual</Form.Label>
              <Form.Control
                type="password"
                name="currentPassword"
                value={passwordData.currentPassword}
                onChange={handlePasswordChange}
                required
              />
            </Form.Group>
            <Form.Group controlId="formNewPassword" className="mb-3">
              <Form.Label>Nueva Contraseña</Form.Label>
              <Form.Control
                type="password"
                name="password"
                value={passwordData.password}
                onChange={handlePasswordChange}
                required
              />
            </Form.Group>
            <Form.Group controlId="formConfirmPassword" className="mb-3">
              <Form.Label>Confirmar Nueva Contraseña</Form.Label>
              <Form.Control
                type="password"
                name="confirmPassword"
                value={passwordData.confirmPassword}
                onChange={handlePasswordChange}
                required
              />
            </Form.Group>
            {errorPassword && <Alert variant="danger">{errorPassword}</Alert>}
            {successPassword && <Alert variant="success">{successPassword}</Alert>}
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowPasswordModal(false)}>
              Cancelar
            </Button>
            <Button variant="primary" type="submit" disabled={loadingPassword}>
              {loadingPassword ? <Spinner animation="border" size="sm" /> : 'Cambiar Contraseña'}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </Container>
  );
};

export default ProfileEditor;
