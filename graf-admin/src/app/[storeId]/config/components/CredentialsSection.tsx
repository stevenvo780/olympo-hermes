'use client';
import React, { useEffect, useState } from 'react';
import { Form, Button, Spinner, Alert, Row, Col } from 'react-bootstrap';
import api from '@/utils/axios';
import { useDispatch } from 'react-redux';
import { addNotification } from '@/redux/ui';
import { useParams } from 'next/navigation';
import { env } from '@/utils/env';

const CredentialsSection: React.FC = () => {
  const dispatch = useDispatch();
  const { storeId } = useParams() as { storeId: string };
  const [publicKey, setPublicKey] = useState('');
  const [privateKey, setPrivateKey] = useState('');
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const [showPrivate, setShowPrivate] = useState(false);
  const webhookUrl = `${env.NEXT_PUBLIC_API_URL}/payments/${storeId}/webhook`;

  useEffect(() => {
    setLoading(true);
    api.get(`/credentials/wompi/${storeId}`)
      .then(res => {
        setPublicKey(res.data.publicKey || '');
        setPrivateKey(res.data.privateKey ? '••••••' : '');
        setSaved(!!res.data.publicKey);
      })
      .catch(() => {
        // No credentials configured yet — this is normal, not an error.
        // Could be 404 (not found), 401 (auth timing), or 500 (secret not configured).
        setSaved(false);
      })
      .finally(() => setLoading(false));
  }, [storeId]);

  const handleSave = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    if (privateKey === '••••••') {
      setError('No hay cambios que guardar. Si deseas cambiar la clave privada, haz clic en "Cambiar clave privada"');
      setLoading(false);
      return;
    }
    
    if (!publicKey || !privateKey) {
      setError('Debes ingresar ambas claves');
      setLoading(false);
      return;
    }
    
    try {
      const method = saved ? 'put' : 'post';
      await api[method](`/credentials/wompi/${storeId}`, { type: 'wompi', storeId, publicKey, privateKey });
      setSaved(true);
      setPrivateKey('••••••');
      dispatch(addNotification({ message: 'Credenciales guardadas correctamente', color: 'success' }));
    } catch {
      setError('Error al guardar las credenciales');
      dispatch(addNotification({ message: 'Error al guardar las credenciales', color: 'danger' }));
    } finally {
      setLoading(false);
    }
  };

  const handlePrivateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPrivateKey(e.target.value);
    setSaved(false);
  };

  return (
    <fieldset className="mb-4">
      <legend>Credenciales Wompi</legend>

      <p className="small text-muted mb-3">
        URL de webhook: <code>{webhookUrl}</code>
      </p>

      <Form.Group className="mb-3">
        <Form.Label>Clave pública</Form.Label>
        <Form.Control
          type="text"
          value={publicKey}
          onChange={e => setPublicKey(e.target.value)}
          placeholder="Ingresa tu clave pública"
          autoComplete="off"
        />
      </Form.Group>
      <Form.Group className="mb-3">
        <Form.Label>Clave privada</Form.Label>
        <Row>
          <Col xs={10}>
            <Form.Control
              type={showPrivate ? 'text' : 'password'}
              value={privateKey}
              onChange={handlePrivateChange}
              placeholder="Ingresa tu clave privada"
              autoComplete="off"
              disabled={privateKey === '••••••'}
            />
          </Col>
          <Col xs={2} className="d-flex align-items-center">
            <Button
              variant="outline-secondary"
              size="sm"
              type="button"
              onClick={() => setShowPrivate(v => !v)}
              tabIndex={-1}
            >
              {showPrivate ? 'Ocultar' : 'Ver'}
            </Button>
          </Col>
        </Row>
        {privateKey === '••••••' && (
          <Button variant="link" size="sm" className="mt-1 px-0" type="button" onClick={() => setPrivateKey('')}>
            Cambiar clave privada
          </Button>
        )}
      </Form.Group>
      {error && <Alert variant="danger">{error}</Alert>}

      <Button type="button" onClick={handleSave} variant="primary" disabled={loading}>
        {loading ? <Spinner animation="border" size="sm" /> : 'Guardar'}
      </Button>
    </fieldset>
  );
};

export default CredentialsSection;
