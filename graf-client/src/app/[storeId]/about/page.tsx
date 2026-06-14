'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import { useSelector } from 'react-redux';
import { Container, Row, Col, Card, Button } from 'react-bootstrap';
import {
  FaMapMarkerAlt,
  FaEnvelope,
  FaFacebookSquare,
  FaInstagram,
  FaTwitterSquare,
  FaWhatsapp,
  FaShoppingCart,
  FaYoutube,
  FaLinkedin,
  FaPinterest,
  FaTiktok,
  FaSnapchatGhost,
  FaTelegram,
  FaReddit,
  FaTwitch,
  FaDiscord,
  FaSpotify,
  FaSoundcloud,
  FaMedium,
  FaTumblr,
  FaVimeo,
  FaDribbble,
  FaBehance
} from 'react-icons/fa';
import { RootState } from '@/redux/store';
import { Store, Config } from '@/types';
import GoogleMapComponent from './GoogleMap';
import SafeHtmlRenderer from '@/components/SafeHtmlRenderer';
import './styles.scss';

const AboutPage: React.FC = () => {
  const [mapLocation, setMapLocation] = useState<{ lat: number; lng: number } | null>(null);
  const store: Store | null = useSelector((state: RootState) => state.ui.store);
  const config: Config | undefined = useSelector((state: RootState) => state.ui.store?.configuration);

  useEffect(() => {
    if (config?.seo?.metaTitle) {
      document.title = config.seo.metaTitle;
    } else if (store?.name) {
      document.title = `Acerca de ${store.name}`;
    }
  }, [config, store]);

  useEffect(() => {
    if (config?.coordinates && config.coordinates.lat && config.coordinates.lng) {
      setMapLocation({
        lat: config.coordinates.lat,
        lng: config.coordinates.lng
      });
    }
  }, [config]);

  if (!store || !config) {
    return (
      <div className="d-flex flex-column align-items-center justify-content-center min-vh-75 py-5">
        <div className="spinner-border text-primary mb-3" role="status">
          <span className="visually-hidden">Cargando...</span>
        </div>
        <h3>Cargando información...</h3>
      </div>
    );
  }

  const getSocialIcon = (networkName: string) => {
    const name = networkName.toLowerCase();
    if (name.includes('facebook')) return <FaFacebookSquare size={24} className="facebook-icon" />;
    if (name.includes('instagram')) return <FaInstagram size={24} className="instagram-icon" />;
    if (name.includes('twitter')) return <FaTwitterSquare size={24} className="twitter-icon" />;
    if (name.includes('whatsapp')) return <FaWhatsapp size={24} className="whatsapp-icon" />;
    if (name.includes('youtube')) return <FaYoutube size={24} className="youtube-icon" />;
    if (name.includes('linkedin')) return <FaLinkedin size={24} className="linkedin-icon" />;
    if (name.includes('pinterest')) return <FaPinterest size={24} className="pinterest-icon" />;
    if (name.includes('tiktok')) return <FaTiktok size={24} className="tiktok-icon" />;
    if (name.includes('snapchat')) return <FaSnapchatGhost size={24} className="snapchat-icon" />;
    if (name.includes('telegram')) return <FaTelegram size={24} className="telegram-icon" />;
    if (name.includes('reddit')) return <FaReddit size={24} className="reddit-icon" />;
    if (name.includes('twitch')) return <FaTwitch size={24} className="twitch-icon" />;
    if (name.includes('discord')) return <FaDiscord size={24} className="discord-icon" />;
    if (name.includes('spotify')) return <FaSpotify size={24} className="spotify-icon" />;
    if (name.includes('soundcloud')) return <FaSoundcloud size={24} className="soundcloud-icon" />;
    if (name.includes('medium')) return <FaMedium size={24} className="medium-icon" />;
    if (name.includes('tumblr')) return <FaTumblr size={24} className="tumblr-icon" />;
    if (name.includes('vimeo')) return <FaVimeo size={24} className="vimeo-icon" />;
    if (name.includes('dribbble')) return <FaDribbble size={24} className="dribbble-icon" />;
    if (name.includes('behance')) return <FaBehance size={24} className="behance-icon" />;
    return <FaEnvelope size={24} />;
  };

  return (
    <div style={{ backgroundColor: 'var(--bg-color)' }}>
      <section className="py-5" style={{
        background: `linear-gradient(120deg, var(--primary-hover), var(--primary-color))`,
        color: 'var(--primary-text)',
        position: 'relative'
      }}>
        <div className="position-absolute top-0 start-0 w-100 h-100" style={{
          backgroundColor: 'rgba(0,0,0,0.2)',
          zIndex: 1
        }}></div>

        <Container className="position-relative" style={{ zIndex: 2 }}>
          <Row className="align-items-center">
            <Col lg={6} md={12} className="text-center text-lg-start">
              <div className="d-flex flex-column flex-lg-row align-items-center align-items-lg-start">
                {config.logo && (
                  <Image
                    src={config.logo}
                    alt={`${store.name} logo`}
                    width={150}
                    height={150}
                    className="rounded-circle border border-4 border-white shadow mb-3 mb-lg-0 me-lg-4"
                    style={{ backgroundColor: 'white' }}
                    priority
                  />
                )}
                <h1 className="display-4 fw-bold">{store.name}</h1>
              </div>
            </Col>
            {config.seo?.metaDescription && (
              <Col lg={6} md={12} className="text-center text-lg-start mt-4 mt-lg-0">
                <div className="d-flex flex-column align-items-center align-items-lg-start">
                  <p className="lead mb-4">{config.seo.metaDescription}</p>
                  <Button
                    href={`/${store.id}`}
                    className="btn btn-lg"
                    variant="secondary"
                  >
                    <FaShoppingCart className="me-2 me-lg-2 text-white" />
                    <span className="fw-bold text-uppercase text-white">
                      ¡Realiza tu pedido ahora!
                    </span>
                  </Button>
                </div>
              </Col>
            )}
          </Row>
        </Container>
      </section>

      <Container className="py-5">
        <Row className="mb-5 g-4">
          {config.about && (
            <Col lg={mapLocation ? 6 : 12} md={12}>
              <Card className="border-0 shadow-sm h-100 card-hover">
                <Card.Header className="text-white" style={{ backgroundColor: 'var(--primary-color)' }}>
                  <h2 className="h4 mb-0">Quienes somos</h2>
                </Card.Header>
                <Card.Body>
                  <SafeHtmlRenderer html={config.about} />
                </Card.Body>
              </Card>
            </Col>
          )}

          {mapLocation && (
            <Col lg={config.about ? 6 : 12} md={12}>
              <Card className="border-0 shadow-sm h-100 card-hover">
                <Card.Header className="text-white" style={{ backgroundColor: 'var(--primary-color)' }}>
                  <h2 className="h4 mb-0">Nuestra Ubicación</h2>
                </Card.Header>
                <Card.Body>
                  <div className="rounded overflow-hidden mb-3">
                    <GoogleMapComponent location={mapLocation} height="400px" />
                  </div>
                  <div className="d-flex justify-content-between align-items-center flex-wrap">
                    {config.storeAddress && (
                      <p className="mb-0">
                        <FaMapMarkerAlt className="me-2" style={{ color: 'var(--secondary-color)' }} />
                        {config.storeAddress}
                      </p>
                    )}
                    <Button
                      href={`https://www.google.com/maps/dir/?api=1&destination=${mapLocation.lat},${mapLocation.lng}`}
                      target="_blank"
                      variant="outline-primary"
                    >
                      Cómo llegar
                    </Button>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          )}
        </Row>

        {config.socialNetworks && config.socialNetworks.length > 0 && (
          <div className="mb-5">
            <h2 className="text-center mb-4" style={{ color: 'var(--primary-color)' }}>Encuentranos</h2>
            <div className="d-flex flex-wrap justify-content-center gap-3">
              {config.socialNetworks.map((network, index) => {
                const iconColor =
                  network.name.toLowerCase().includes('facebook') ? '#3b5998' :
                    network.name.toLowerCase().includes('instagram') ? '#e1306c' :
                      network.name.toLowerCase().includes('twitter') ? '#1da1f2' :
                        network.name.toLowerCase().includes('whatsapp') ? '#25d366' :
                          network.name.toLowerCase().includes('youtube') ? '#ff0000' :
                            network.name.toLowerCase().includes('linkedin') ? '#0077b5' :
                              network.name.toLowerCase().includes('pinterest') ? '#bd081c' :
                                network.name.toLowerCase().includes('tiktok') ? '#000000' :
                                  network.name.toLowerCase().includes('snapchat') ? '#fffc00' :
                                    network.name.toLowerCase().includes('telegram') ? '#0088cc' :
                                      network.name.toLowerCase().includes('reddit') ? '#ff4500' :
                                        network.name.toLowerCase().includes('twitch') ? '#6441a5' :
                                          network.name.toLowerCase().includes('discord') ? '#7289da' :
                                            network.name.toLowerCase().includes('spotify') ? '#1db954' :
                                              network.name.toLowerCase().includes('soundcloud') ? '#ff8800' :
                                                network.name.toLowerCase().includes('medium') ? '#00ab6c' :
                                                  network.name.toLowerCase().includes('tumblr') ? '#35465c' :
                                                    network.name.toLowerCase().includes('vimeo') ? '#1ab7ea' :
                                                      network.name.toLowerCase().includes('dribbble') ? '#ea4c89' :
                                                        network.name.toLowerCase().includes('behance') ? '#1769ff' :
                                                          'var(--primary-color)';

                return (
                  <Button
                    key={index}
                    href={network.url}
                    target="_blank"
                    variant="light"
                    className="border shadow-sm d-flex align-items-center"
                  >
                    <div style={{ color: iconColor }}>
                      {getSocialIcon(network.name)}
                    </div>
                    <span className="ms-2">{network.name}</span>
                  </Button>
                );
              })}
            </div>
          </div>
        )}

        {(config.legal?.legalNotice || config.legal?.termsOfServiceLink || config.legal?.disclaimer) && (
          <div className="mb-5">
            <h2 className="text-center mb-4" style={{ color: 'var(--primary-color)' }}>Información Legal</h2>
            <Row className="g-4">
              {config.legal?.legalNotice && (
                <Col xs={12}>
                  <Card className="border-0 shadow-sm card-hover">
                    <Card.Header className="text-white" style={{ backgroundColor: 'var(--primary-color)' }}>
                      <h3 className="h5 mb-0">Aviso Legal</h3>
                    </Card.Header>
                    <Card.Body>
                      <SafeHtmlRenderer html={config.legal.legalNotice} />
                    </Card.Body>
                  </Card>
                </Col>
              )}

              <Row className="g-4 w-100 mx-0">
                {config.legal?.termsOfServiceLink && (
                  <Col xs={12} md={config.legal?.disclaimer ? 6 : 12}>
                    <Card className="border-0 shadow-sm text-center h-100 card-hover">
                      <Card.Body>
                        <Card.Title className="mb-4">Términos de Servicio</Card.Title>
                        <Button
                          href={config.legal.termsOfServiceLink}
                          target="_blank"
                          variant="outline-primary"
                        >
                          Ver Términos de Servicio
                        </Button>
                      </Card.Body>
                    </Card>
                  </Col>
                )}

                {config.legal?.disclaimer && (
                  <Col xs={12} md={config.legal?.termsOfServiceLink ? 6 : 12}>
                    <Card className="border-0 shadow-sm h-100 card-hover">
                      <Card.Header className="text-white" style={{ backgroundColor: 'var(--primary-color)' }}>
                        <h3 className="h5 mb-0">Aviso Importante</h3>
                      </Card.Header>
                      <Card.Body>
                        <SafeHtmlRenderer html={config.legal.disclaimer} />
                      </Card.Body>
                    </Card>
                  </Col>
                )}
              </Row>
            </Row>
          </div>
        )}

      </Container>
    </div>
  );
};

export default AboutPage;
