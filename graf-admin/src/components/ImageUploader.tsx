import React, { useMemo, useState, useEffect } from 'react';
import { Form, Button } from 'react-bootstrap';
import { useDispatch } from 'react-redux';
import { addNotification } from '@/redux/ui';
import Image from 'next/image';

const DEFAULT_IMAGE = '/images/no-image.png';
const MAX_FILE_SIZE = 10 * 1024 * 1024;

export const getValidImageUrl = (url: string | undefined | null): string => {
  if (!url || typeof url !== 'string') return DEFAULT_IMAGE;
  const trimmed = url.trim();
  return trimmed || DEFAULT_IMAGE;
};

export const extractFirstValidImageUrl = (images: string | string[] | undefined | null): string => {
  if (!images) return DEFAULT_IMAGE;
  
  if (typeof images === 'string') {
    return getValidImageUrl(images);
  }
  
  if (Array.isArray(images)) {
    for (const url of images) {
      const validUrl = getValidImageUrl(url);
      if (validUrl !== DEFAULT_IMAGE) {
        return validUrl;
      }
    }
  }
  
  return DEFAULT_IMAGE;
};

interface ImageUploaderProps {
  currentImagesUrls?: string[];
  onImagesChange: (files: File[]) => void;
  onPreviewsChange: (previews: string[]) => void;
  maxImages?: number;
}

const ImageUploader: React.FC<ImageUploaderProps> = ({
  currentImagesUrls,
  onImagesChange,
  onPreviewsChange,
  maxImages = Infinity
}) => {
  const dispatch = useDispatch();
  const normalizedImages = useMemo(() => currentImagesUrls ?? [], [currentImagesUrls]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [files, setFiles] = useState<File[]>([]);

  useEffect(() => {
    const validUrls = normalizedImages.filter((url): url is string =>
      typeof url === 'string' && url.trim() !== ''
    );
    setPreviews(validUrls);
  }, [normalizedImages]);
  
  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    
    const allFiles = Array.from(e.target.files);
    const validFiles = allFiles.filter(file => file.size <= MAX_FILE_SIZE);
    
    if (validFiles.length < allFiles.length) {
      dispatch(addNotification({ 
        message: "Algunos archivos exceden 10MB", 
        color: 'warning' 
      }));
    }
    
    const totalImages = previews.length + validFiles.length;
    if (totalImages > maxImages) {
      dispatch(addNotification({ 
        message: `Máximo ${maxImages} imágenes`, 
        color: 'warning' 
      }));
      
      const remainingSlots = maxImages - previews.length;
      if (remainingSlots <= 0) return;
      
      const newFiles = validFiles.slice(0, remainingSlots);
      const updatedFiles = [...files, ...newFiles];
      setFiles(updatedFiles);
      onImagesChange(updatedFiles);
      
      const readers = newFiles.map(file => {
        return new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => {
            const result = reader.result;
            resolve(typeof result === 'string' ? result : '');
          };
          reader.readAsDataURL(file);
        });
      });
      
      const newPreviews = await Promise.all(readers);
      const updatedPreviews = [...previews, ...newPreviews];
      setPreviews(updatedPreviews);
      onPreviewsChange(updatedPreviews);
    } else {
      const updatedFiles = [...files, ...validFiles];
      setFiles(updatedFiles);
      onImagesChange(updatedFiles);
      
      const readers = validFiles.map(file => {
        return new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => {
            const result = reader.result;
            resolve(typeof result === 'string' ? result : '');
          };
          reader.readAsDataURL(file);
        });
      });
      
      const newPreviews = await Promise.all(readers);
      const updatedPreviews = [...previews, ...newPreviews];
      setPreviews(updatedPreviews);
      onPreviewsChange(updatedPreviews);
    }
    
    e.target.value = '';
  };

  const handleDeleteImage = (index: number) => {
    const updatedPreviews = previews.filter((_, i) => i !== index);
    setPreviews(updatedPreviews);
    onPreviewsChange(updatedPreviews);
    
    const storedUrlsCount = normalizedImages.length;

    if (index >= storedUrlsCount) {
      const fileIndex = index - storedUrlsCount;
      const updatedFiles = files.filter((_, i) => i !== fileIndex);
      setFiles(updatedFiles);
      onImagesChange(updatedFiles);
    }
  };

  return (
    <Form.Group>
      {previews.length > 0 && (
        <div className="mb-3 d-flex flex-wrap gap-2">
          {previews.map((url, index) => (
            <div key={index} style={{ position: 'relative' }}>
              <Image
                src={getValidImageUrl(url)}
                alt={`Imagen ${index + 1}`}
                width={100}
                height={100}
                style={{ objectFit: 'cover', borderRadius: '8px' }}
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = DEFAULT_IMAGE;
                }}
              />
              <Button
                variant="danger"
                size="sm"
                style={{
                  position: 'absolute',
                  top: '2px',
                  right: '2px',
                  width: '20px',
                  height: '20px',
                  padding: '0',
                  borderRadius: '50%',
                  fontSize: '12px'
                }}
                onClick={() => handleDeleteImage(index)}
              >
                ×
              </Button>
              {index >= normalizedImages.length && (
                <div style={{
                  position: 'absolute',
                  bottom: '2px',
                  left: '2px',
                  background: 'rgba(0,123,255,0.8)',
                  color: 'white',
                  fontSize: '10px',
                  padding: '1px 4px',
                  borderRadius: '3px'
                }}>
                  Nuevo
                </div>
              )}
            </div>
          ))}
        </div>
      )}
      
      <div className="mb-2">
        <small className="text-muted">
          {previews.length}/{maxImages} imágenes
        </small>
      </div>
      
      <Form.Control
        type="file"
        accept="image/*"
        multiple={maxImages > 1}
        onChange={handleImageChange}
        className="bg-dark text-light border-secondary"
        disabled={previews.length >= maxImages}
      />
    </Form.Group>
  );
};

export default ImageUploader;
