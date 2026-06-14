'use client';
import React, { useEffect, useState, useCallback } from 'react';
import { Container, Table, Button, Modal, Form, Spinner, Alert, Card, Badge, Row } from 'react-bootstrap';
import { useParams } from 'next/navigation';
import { useDispatch, useSelector } from 'react-redux';
import { addNotification } from '@/redux/ui';
import api from '@/utils/axios';
import { User } from '@/types';
import { FaUserPlus, FaUserMinus, FaInfoCircle, FaUserShield, FaEnvelope, FaUserCircle } from 'react-icons/fa';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { getAuth } from 'firebase/auth';
import { RootState } from '@/redux/store';

export default function TeamManagementClient() {
  const dispatch = useDispatch();
  const { storeId } = useParams() as { storeId: string };

  const [teamMembers, setTeamMembers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [memberToDelete, setMemberToDelete] = useState<User | null>(null);
  const [isOwner, setIsOwner] = useState(false);
  const user = useSelector((state: RootState) => state.auth.userData);
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [emailTouched, setEmailTouched] = useState(false);

  const getApiErrorMessage = (error: unknown, fallback: string) => {
    if (error && typeof error === 'object' && 'response' in error) {
      const response = (error as { response?: { data?: { message?: string } } }).response;
      const message = response?.data?.message;
      if (typeof message === 'string' && message.trim()) {
        return message;
      }
    }
    return fallback;
  };

  const fetchTeamMembers = useCallback(async () => {
    setIsLoading(true);
    try {
      const storeResponse = await api.get(`/store/${storeId}`);
      const store = storeResponse.data;
      const isStoreOwner = store.owner.id === user?.id;
      setIsOwner(isStoreOwner);

      if (!isStoreOwner) {
        return;
      }

      const response = await api.get(`/store/${storeId}/team`);
      setTeamMembers(response.data || []);
    } catch (error) {
      console.error('Error fetching team members:', error);
      dispatch(addNotification({
        message: 'Error al cargar los miembros del equipo',
        color: 'danger'
      }));
    } finally {
      setIsLoading(false);
    }
  }, [storeId, user?.id, dispatch]);

  useEffect(() => {
    fetchTeamMembers();
  }, [fetchTeamMembers]);

  const validateEmail = (email: string) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  };

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    setEmailTouched(true);

    if (!email) {
      setEmailError('El email es obligatorio');
      return;
    }

    if (!validateEmail(email)) {
      setEmailError('Por favor ingresa un email válido');
      return;
    }

    setEmailError('');
    setIsProcessing(true);

    try {
      const authUser = getAuth().currentUser;
      if (authUser) {
        const userToken = await authUser.getIdToken(true);
        api.defaults.headers.common.Authorization = `Bearer ${userToken}`;
      }

      await api.post(`/store/${storeId}/team/add`, { email });

      await fetchTeamMembers();

      dispatch(addNotification({
        message: 'Miembro añadido al equipo exitosamente',
        color: 'success'
      }));

      setEmail('');
      setEmailTouched(false);
      setShowAddModal(false);
    } catch (error: unknown) {
      const errorMessage = getApiErrorMessage(
        error,
        'Error al añadir miembro al equipo'
      );
      dispatch(
        addNotification({
          message: errorMessage,
          color: 'danger',
        })
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDeleteMember = async () => {
    if (!memberToDelete || !storeId) return;

    setIsProcessing(true);
    try {
      const authUser = getAuth().currentUser;
      if (authUser) {
        const userToken = await authUser.getIdToken(true);
        api.defaults.headers.common.Authorization = `Bearer ${userToken}`;
      }

      await api.delete(`/store/${storeId}/team/remove/${memberToDelete.id}`);

      await fetchTeamMembers();

      dispatch(addNotification({
        message: 'Miembro eliminado del equipo exitosamente',
        color: 'success'
      }));

      setMemberToDelete(null);
      setShowDeleteModal(false);
    } catch (error: unknown) {
      const errorMessage = getApiErrorMessage(
        error,
        'Error al eliminar miembro del equipo'
      );
      dispatch(
        addNotification({
          message: errorMessage,
          color: 'danger',
        })
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return format(date, "d 'de' MMMM, yyyy", { locale: es });
    } catch {
      return 'Fecha desconocida';
    }
  };

  if (!isLoading && !isOwner) {
    return (
      <Container className="py-5">
        <Alert variant="danger">
          <Alert.Heading>Acceso Denegado</Alert.Heading>
          <p>
            No tienes permisos para acceder a la gestión de equipos. Esta sección está disponible solo
            para propietarios de tiendas.
          </p>
        </Alert>
      </Container>
    );
  }

  if (isLoading) {
    return (
      <div className="text-center p-5">
        <Spinner animation="border" variant="primary" />
        <p className="mt-3">Cargando información del equipo...</p>
      </div>
    );
  }

  return (
    <Container>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1 className="mb-0">
          <FaUserShield className="me-2" />
          Gestión de Equipo
        </h1>
        <Button variant="primary" onClick={() => setShowAddModal(true)}>
          <FaUserPlus className="me-2" />
          Añadir Miembro
        </Button>
      </div>

      <Row className="mb-4">
        <Card>
          <Card.Header className="bg-light">
            <h4 className="mb-0">Miembros del Equipo</h4>
          </Card.Header>
          <Card.Body>
            {teamMembers.length === 0 ? (
              <Alert variant="info">
                <FaInfoCircle className="me-2" />
                No hay miembros en el equipo actualmente. Añade colaboradores para que puedan ayudarte con la gestión de tu tienda.
              </Alert>
            ) : (
              <Table responsive hover>
                <thead>
                  <tr>
                    <th>Usuario</th>
                    <th>Email</th>
                    <th>Fecha de incorporación</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {teamMembers.map(member => (
                    <tr key={member.id}>
                      <td>
                        <div className="d-flex align-items-center">

                          <FaUserCircle size={40} className="text-secondary me-2" />
                          <div>
                            <div className="fw-bold">{member.name || 'Usuario sin nombre'}</div>
                            <Badge bg="info" className="text-white">Colaborador</Badge>
                          </div>
                        </div>
                      </td>
                      <td>{member.email}</td>
                      <td>{member.createdAt ? formatDate(member.createdAt) : 'Fecha desconocida'}</td>
                      <td>
                        <Button
                          variant="outline-danger"
                          size="sm"
                          onClick={() => {
                            setMemberToDelete(member);
                            setShowDeleteModal(true);
                          }}
                        >
                          <FaUserMinus /> Eliminar
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            )}
          </Card.Body>
        </Card>
      </Row>

      <Modal show={showAddModal} onHide={() => setShowAddModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Añadir Miembro al Equipo</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={handleAddMember}>
            {emailError && emailTouched && <Alert variant="danger">{emailError}</Alert>}

            <p className="text-muted mb-3">
              Ingresa el correo electrónico del usuario que deseas añadir como miembro del equipo.
              Si el usuario no existe en el sistema, recibirá una invitación para registrarse.
            </p>

            <Form.Group className="mb-3">
              <Form.Label>Email del colaborador</Form.Label>
              <div className="input-group">
                <span className="input-group-text">
                  <FaEnvelope />
                </span>
                <Form.Control
                  type="email"
                  placeholder="colaborador@ejemplo.com"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (emailTouched) {
                      if (!e.target.value) {
                        setEmailError('El email es obligatorio');
                      } else if (!validateEmail(e.target.value)) {
                        setEmailError('Por favor ingresa un email válido');
                      } else {
                        setEmailError('');
                      }
                    }
                  }}
                  onBlur={() => setEmailTouched(true)}
                  required
                  disabled={isProcessing}
                />
              </div>
              <Form.Text className="text-muted">
                El usuario debe tener una cuenta en la plataforma o se le enviará una invitación.
              </Form.Text>
            </Form.Group>

            <div className="d-flex justify-content-end mt-4">
              <Button
                variant="secondary"
                onClick={() => setShowAddModal(false)}
                disabled={isProcessing}
                className="me-2"
              >
                Cancelar
              </Button>
              <Button
                variant="primary"
                type="submit"
                disabled={isProcessing || !email}
              >
                {isProcessing ? (
                  <>
                    <Spinner animation="border" size="sm" className="me-2" />
                    Añadiendo...
                  </>
                ) : (
                  <>
                    <FaUserPlus className="me-2" />
                    Añadir al Equipo
                  </>
                )}
              </Button>
            </div>
          </Form>
        </Modal.Body>
      </Modal>

      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Confirmar eliminación</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {memberToDelete && (
            <p>
              ¿Estás seguro que deseas eliminar a <strong>{memberToDelete.name || memberToDelete.email}</strong> del equipo?
              Esta acción revocará su acceso a la administración de tu tienda.
            </p>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
            Cancelar
          </Button>
          <Button
            variant="danger"
            onClick={handleDeleteMember}
            disabled={isProcessing}
          >
            {isProcessing ? <Spinner animation="border" size="sm" /> : <FaUserMinus className="me-2" />}
            Eliminar
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
}
