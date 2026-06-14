import React, { useState, useEffect } from 'react';
import { Form, Row, Col } from 'react-bootstrap';
import ImageUploader from '@/components/ImageUploader';
import { Config } from '@/types';

type ImageConfigSectionProps = {
  formData: Config & { banners: string[]; logo?: string };
  bannerFiles: File[];
  setBannerFile: React.Dispatch<React.SetStateAction<File[]>>;
  setLogoFile: React.Dispatch<React.SetStateAction<File[]>>;
  onUpdateBanners: (banners: string[]) => void;
  onConfigChange: (changes: Partial<Config>) => void;
};

const ImageConfigSection: React.FC<ImageConfigSectionProps> = ({
  formData,
  bannerFiles,
  setBannerFile,
  setLogoFile,
  onUpdateBanners,
  onConfigChange
}) => {
  const [bannerPreviews, setBannerPreviews] = useState<string[]>([]);
  const [logoPreviews, setLogoPreviews] = useState<string[]>([]);
  const defaultNavbarHeight = 60;
  const minNavbarHeight = 48;
  const maxNavbarHeight = 200;

  useEffect(() => {
    const storedUrls = formData.banners || [];
    
    const fileUrls = bannerFiles.map(file => URL.createObjectURL(file));
    
    setBannerPreviews([...storedUrls, ...fileUrls]);
    
    return () => {
      fileUrls.forEach(url => URL.revokeObjectURL(url));
    };
  }, [formData.banners, bannerFiles]);
  
  useEffect(() => {
    const previews: string[] = [];
    if (formData.logo) {
      previews.push(formData.logo);
    }
    setLogoPreviews(previews);
  }, [formData.logo]);

  const handleBannerPreviewsChange = (previews: string[]) => {
    const storedBanners = previews.filter(url => 
      typeof url === 'string' && (url.startsWith('http://') || url.startsWith('https://'))
    );
    
    onUpdateBanners(storedBanners);
  };
  
  const navbarHeightValue = formData.navbarHeight ?? defaultNavbarHeight;

  return (
    <fieldset className="mb-4">
      <legend>Imágenes</legend>
      <Row>
        <Col md={6}>
          <Form.Group className="mb-3">
            <Form.Label>Banners</Form.Label>
            <ImageUploader
              currentImagesUrls={bannerPreviews}
              onImagesChange={setBannerFile}
              onPreviewsChange={handleBannerPreviewsChange}
              maxImages={5}
            />
          </Form.Group>
        </Col>
        <Col md={6}>
          <Form.Group className="mb-3">
            <Form.Label>Logo</Form.Label>
            <ImageUploader
              currentImagesUrls={logoPreviews}
              onImagesChange={setLogoFile}
              onPreviewsChange={() => {}}
              maxImages={1}
            />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Check
              type="switch"
              id="show-navbar-logo"
              label="Mostrar logo en el header"
              checked={formData.showNavbarLogo ?? true}
              onChange={(e) => onConfigChange({ showNavbarLogo: e.target.checked })}
            />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Check
              type="switch"
              id="show-navbar-title"
              label="Mostrar nombre de la tienda"
              checked={formData.showNavbarTitle ?? true}
              onChange={(e) => onConfigChange({ showNavbarTitle: e.target.checked })}
            />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Altura de la navbar (px)</Form.Label>
            <Form.Control
              type="number"
              min={48}
              max={200}
              step={2}
              value={navbarHeightValue}
              onChange={(e) => {
                const value = Number.parseInt(e.target.value, 10);
                const clampedValue = Number.isFinite(value)
                  ? Math.min(Math.max(value, minNavbarHeight), maxNavbarHeight)
                  : defaultNavbarHeight;
                onConfigChange({
                  navbarHeight: clampedValue
                });
              }}
            />
            <Form.Text className="text-muted">
              Ajusta la altura si el logo es grande.
            </Form.Text>
          </Form.Group>
        </Col>
      </Row>
    </fieldset>
  );
};

export default ImageConfigSection;
