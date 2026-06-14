'use client';
import React, { useEffect, useState, useCallback } from 'react';
import { Container, Table, Button, Modal, Form, Spinner } from 'react-bootstrap';
import { useParams } from 'next/navigation';
import { useDispatch } from 'react-redux';
import { addNotification } from '@/redux/ui';
import api from '@/utils/axios';
import { Category } from '@/types';
import ImageUploader from '@/components/ImageUploader';
import { storage } from '@/utils/firebase';
import CategoryExcelHandler from './CategoryExcelHandler';
import Image from 'next/image';

interface CategoryPayload {
  name: string;
  description?: string;
  imageUrl?: string;
  parentId?: number | null;
  position?: number;
}

export default function CategoriesClient() {
  const dispatch = useDispatch();
  const { storeId } = useParams() as { storeId: string };
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [currentCategory, setCurrentCategory] = useState<Category | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [imagesFiles, setImagesFiles] = useState<File[]>([]);
  const [imagesPreviews, setImagesPreviews] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<number | null>(null);
  const [parentId, setParentId] = useState<number | null>(null);
  const [position, setPosition] = useState<number>(0);
  const [showChildrenModal, setShowChildrenModal] = useState(false);
  const [selectedCategoryChildren, setSelectedCategoryChildren] = useState<Category[]>([]);
  const [selectedCategoryName, setSelectedCategoryName] = useState('');

  const categoryHasProducts = useCallback(async (categoryId: number): Promise<boolean> => {
    try {
      const params = new URLSearchParams();
      params.append('category', categoryId.toString());
      params.append('limit', '1');
      params.append('offset', '0');
      const res = await api.get(`/products/${storeId}?${params.toString()}`);
      const list = res.data?.data || res.data?.products || [];
      return Array.isArray(list) && list.length > 0;
    } catch {
      return false;
    }
  }, [storeId]);

  const resetForm = () => {
    setName('');
    setDescription('');
    setImagesFiles([]);
    setImagesPreviews([]);
    setParentId(null);
    setPosition(0);
  };

  const fetchCategories = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await api.get(`/categories/${storeId}`);
      setCategories(res.data || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
    } finally {
      setIsLoading(false);
    }
  }, [storeId]);

  useEffect(() => {
    if (storeId) {
      fetchCategories();
    }
  }, [storeId, fetchCategories]);

  const handleShowModal = (mode: 'create' | 'edit', category?: Category) => {
    setModalMode(mode);
    if (mode === 'edit' && category) {
      setCurrentCategory(category);
      setName(category.name);
      setDescription(category.description || '');
      setParentId(category.parent?.id || null);
      setPosition(category.position || 0);
      if (category.imageUrl) {
        setImagesPreviews([category.imageUrl]);
      } else {
        setImagesPreviews([]);
      }
      setImagesFiles([]);
    } else {
      setCurrentCategory(null);
      resetForm();
    }
    setShowModal(true);
  };

  const handleShowChildrenModal = (category: Category) => {
    setSelectedCategoryName(category.name);
    setSelectedCategoryChildren(category.children || []);
    setShowChildrenModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    resetForm();
    setCurrentCategory(null);
  };

  const uploadImages = async (): Promise<string[]> => {
    const urls = await Promise.all(
      imagesFiles.map(async (file) => {
        const fileRef = storage.ref(`/categories/${storeId}/${file.name}-${Date.now()}`);
        await fileRef.put(file);
        return await fileRef.getDownloadURL();
      })
    );
    return urls;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUploading(true);
    try {
      let finalImageUrl: string | undefined;

      if (imagesFiles.length > 0) {
        const uploadedImages = await uploadImages();
        finalImageUrl = uploadedImages[0];
      } else if (modalMode === 'edit' && currentCategory?.imageUrl && imagesPreviews.length > 0) {
        finalImageUrl = currentCategory.imageUrl;
      }

      const payload: CategoryPayload = {
        name,
        description,
        ...(finalImageUrl && { imageUrl: finalImageUrl }),
        parentId: parentId,
        position: position
      };

      if (modalMode === 'create') {
        await api.post(`/categories/${storeId}`, payload);
        dispatch(addNotification({ message: 'Categoría creada exitosamente', color: 'success' }));
      } else if (modalMode === 'edit' && currentCategory) {
        await api.put(`/categories/${storeId}/${currentCategory.id}`, payload);
        dispatch(addNotification({ message: 'Categoría actualizada exitosamente', color: 'success' }));
      }
      fetchCategories();
      handleCloseModal();
    } catch (error) {
      console.error('Error saving category:', error);
      dispatch(addNotification({ message: 'Error al guardar la categoría', color: 'danger' }));
    } finally {
      setIsUploading(false);
    }
  };

  const handleShowDeleteModal = (id: number) => {
    setCategoryToDelete(id);
    setShowDeleteModal(true);
  };

  const handleCloseDeleteModal = () => {
    setShowDeleteModal(false);
    setCategoryToDelete(null);
  };

  const confirmDelete = async () => {
    if (categoryToDelete) {
      try {

        const hasProducts = await categoryHasProducts(categoryToDelete);
        if (hasProducts) {
          dispatch(addNotification({
            message: 'No se puede eliminar la categoría porque tiene productos asociados. Reasigna o elimina esos productos primero.',
            color: 'danger'
          }));
          handleCloseDeleteModal();
          return;
        }
        await api.delete(`/categories/${storeId}/${categoryToDelete}`);
        dispatch(addNotification({ message: 'Categoría eliminada exitosamente', color: 'success' }));
        fetchCategories();
      } catch (error) {
        console.error('Error deleting category:', error);

        const backendMsg = (error as unknown as { response?: { data?: { message?: string } } })?.response?.data?.message;
        const friendly = backendMsg && /constraint|foreign/i.test(String(backendMsg))
          ? 'No se puede eliminar: la categoría tiene productos o dependencias asociadas.'
          : 'Error al eliminar la categoría';
        dispatch(addNotification({ message: friendly, color: 'danger' }));
      }
      handleCloseDeleteModal();
    }
  };

  if (isLoading) {
    return (
      <div className="text-center p-5">
        <Spinner animation="border" variant="primary" />
      </div>
    );
  }

  return (
    <Container>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h1>Categorías</h1>
        <Button variant="primary" onClick={() => handleShowModal('create')}>
          Nueva Categoría
        </Button>
      </div>
    
      <CategoryExcelHandler 
        storeId={storeId} 
        onImportComplete={fetchCategories} 
      />
      
      <Table striped bordered hover responsive>
        <thead>
          <tr>
            <th>ID</th>
            <th>Nombre</th>
            <th>Posición</th>
            <th>Categoría Padre</th>
            <th>Descripción</th>
            <th>Imagen</th>
            <th>Subcategorías</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {categories.map(cat => (
            <tr key={cat.id}>
              <td>{cat.id}</td>
              <td>{cat.name}</td>
              <td>{cat.position ?? 0}</td>
              <td>{cat.parent ? cat.parent.name : 'Sin categoría padre'}</td>
              <td>{cat.description || 'N/A'}</td>
              <td>{cat.imageUrl ? (
                <Image 
                  src={cat.imageUrl || '/images/no-image.png'} 
                  alt={cat.name} 
                  width={50} 
                  height={50} 
                  quality={30}
                  style={{ objectFit: 'cover' }}
                />
              ) : 'N/A'}</td>
              <td>
                {cat.children && cat.children.length > 0 ? (
                  <Button 
                    variant="link" 
                    size="sm" 
                    onClick={() => handleShowChildrenModal(cat)}
                  >
                    Ver {cat.children.length} subcategorías
                  </Button>
                ) : (
                  'Sin subcategorías'
                )}
              </td>
              <td>
                <Button variant="secondary" size="sm" className="me-2" onClick={() => handleShowModal('edit', cat)}>Editar</Button>
                <Button variant="danger" size="sm" onClick={() => handleShowDeleteModal(cat.id)}>Borrar</Button>
              </td>
            </tr>
          ))}
        </tbody>
      </Table>

      <Modal show={showModal} onHide={handleCloseModal}>
        <Modal.Header closeButton>
          <Modal.Title>
            {modalMode === 'create' ? 'Nueva Categoría' : 'Editar Categoría'}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={handleSubmit}>
            <Form.Group className="mb-3">
              <Form.Label>Categoría Padre</Form.Label>
              <Form.Select
                value={parentId || ''}
                onChange={(e) => setParentId(e.target.value ? Number(e.target.value) : null)}
              >
                <option value="">Sin categoría padre</option>
                {categories.map(cat => (
                  <option
                    key={cat.id}
                    value={cat.id}
                    disabled={modalMode === 'edit' && currentCategory?.id === cat.id}
                  >
                    {cat.name}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Nombre</Form.Label>
              <Form.Control
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Posición</Form.Label>
              <Form.Control
                type="number"
                value={position}
                onChange={(e) => setPosition(parseInt(e.target.value) || 0)}
                min={0}
              />
              <Form.Text className="text-muted">
                Número que determina el orden de visualización. Menor número = aparece primero.
              </Form.Text>
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Descripción</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Icono de la categoría</Form.Label>
              <ImageUploader
                currentImagesUrls={imagesPreviews}
                onImagesChange={(files) => setImagesFiles(files)}
                onPreviewsChange={(previews) => setImagesPreviews(previews)}
                maxImages={1}
              />
            </Form.Group>
            <div className="d-flex justify-content-end">
              <Button
                variant="secondary"
                onClick={handleCloseModal}
                className="me-2"
              >
                Cancelar
              </Button>
              <Button variant="primary" type="submit" disabled={isUploading}>
                {isUploading ? (
                  <Spinner animation="border" size="sm" />
                ) : modalMode === 'create' ? (
                  'Crear'
                ) : (
                  'Actualizar'
                )}
              </Button>
            </div>
          </Form>
        </Modal.Body>
      </Modal>

      <Modal show={showChildrenModal} onHide={() => setShowChildrenModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Subcategorías de {selectedCategoryName}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedCategoryChildren.length > 0 ? (
            <Table striped bordered hover>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Nombre</th>
                  <th>Posición</th>
                </tr>
              </thead>
              <tbody>
                {selectedCategoryChildren.map(child => (
                  <tr key={child.id}>
                    <td>{child.id}</td>
                    <td>{child.name}</td>
                    <td>{child.position}</td>
                  </tr>
                ))}
              </tbody>
            </Table>
          ) : (
            <p className="text-center">Esta categoría no tiene subcategorías.</p>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowChildrenModal(false)}>
            Cerrar
          </Button>
        </Modal.Footer>
      </Modal>

      <Modal show={showDeleteModal} onHide={handleCloseDeleteModal}>
        <Modal.Header closeButton>
          <Modal.Title>Confirmar eliminación</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          ¿Está seguro que desea eliminar esta categoría?
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleCloseDeleteModal}>
            Cancelar
          </Button>
          <Button variant="danger" onClick={confirmDelete}>
            Eliminar
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
}