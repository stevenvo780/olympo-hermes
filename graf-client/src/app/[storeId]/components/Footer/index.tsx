'use client';
import React, { useEffect, useState } from 'react';
import { Container, Row, Col, Image, Accordion, Card, useAccordionButton } from 'react-bootstrap';
import { useSelector } from 'react-redux';
import { RootState } from '@/redux/store';
import { FaFacebook, FaInstagram, FaTwitter } from 'react-icons/fa';
import { FaMapMarkerAlt, FaPhone, FaEnvelope, FaGlobe, FaChevronDown } from 'react-icons/fa';
import Link from 'next/link';
import { PlanType } from '@/types';
import './Footer.scss';

const daysOfWeek = [
  { id: 'monday', label: 'Lunes' },
  { id: 'tuesday', label: 'Martes' },
  { id: 'wednesday', label: 'Miércoles' },
  { id: 'thursday', label: 'Jueves' },
  { id: 'friday', label: 'Viernes' },
  { id: 'saturday', label: 'Sábado' },
  { id: 'sunday', label: 'Domingo' },
];

const CustomToggle = ({ children, eventKey, isMobile }: { children: React.ReactNode, eventKey: string, isMobile: boolean }) => {
  const [isOpen, setIsOpen] = useState(false);
  const decoratedOnClick = useAccordionButton(eventKey, () => setIsOpen(!isOpen));

  if (!isMobile) {
    return <h5 className="section-title">{children}</h5>;
  }

  return (
    <button
      type="button"
      className="mobile-accordion-button"
      onClick={decoratedOnClick}
      style={{ backgroundColor: 'var(--bg-color)' }}
    >
      {children}
      <FaChevronDown className="accordion-icon" style={{
        transform: isOpen ? 'rotate(180deg)' : 'rotate(0)',
      }} />
    </button>
  );
};

const Footer: React.FC = () => {
  const config = useSelector((state: RootState) => state.ui.store?.configuration);

  const footerData = config?.footer;
  const legalData = config?.legal as Record<string, string | undefined> | undefined;

  // Merge: footer fields take priority, fallback to legacy legal fields
  const legalNotice = footerData?.legalNotice || legalData?.legalNotice;
  const termsOfServiceLink = footerData?.termsOfServiceLink || legalData?.termsOfServiceLink;
  const sitemapLink = footerData?.sitemapLink || legalData?.sitemapLink;
  const disclaimer = footerData?.disclaimer || legalData?.disclaimer;

  const storeName = config?.store?.name || '';
  const storeAddress = config?.storeAddress || config?.store?.address || '';
  const phoneNumbers = config?.contactNumbers?.length ? config.contactNumbers : [];
  const subscriptionStore = useSelector((state: RootState) => state.ui.store?.owner?.subscription);

  const [isMobile, setIsMobile] = useState<boolean>(false);

  const isPremiumUser = subscriptionStore?.planType === PlanType.PRO ||
    subscriptionStore?.planType === PlanType.ENTERPRISE;

  const hasContactInfo = Boolean(storeAddress || phoneNumbers.length > 0 || footerData?.email);
  const hasScheduleInfo = Boolean(config?.schedule && config.schedule.length > 0);
  const hasSocialNetworks = Boolean(config?.socialNetworks && config.socialNetworks.length > 0);
  const hasInfoSection = Boolean(
    legalNotice || 
    footerData?.extraText || 
    config?.about || 
    config?.store?.description || 
    termsOfServiceLink || 
    sitemapLink
  );

  const availableSections = [
    hasContactInfo,
    hasScheduleInfo || hasSocialNetworks,
    hasInfoSection
  ].filter(Boolean).length;

  const getColumnWidth = () => {
    switch(availableSections) {
      case 1: return { lg: 12, md: 12, sm: 12 };
      case 2: return { lg: 6, md: 6, sm: 12 };
      case 3: return { lg: 4, md: 4, sm: 12 };
      default: return { lg: 4, md: 6, sm: 12 };
    }
  };

  const colWidth = getColumnWidth();

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const getSocialIcon = (name: string) => {
    switch (name.toLowerCase()) {
      case 'facebook': return <FaFacebook className="icon" />;
      case 'instagram': return <FaInstagram className="icon" />;
      case 'twitter': return <FaTwitter className="icon" />;
      case 'website': return <FaGlobe className="icon" />;
      default: return <FaGlobe className="icon" />;
    }
  };

  const renderSchedule = () => {
    if (!config?.schedule || config.schedule.length === 0) return null;
    return (
      <ul className="list-unstyled">
        {config.schedule.map((day, index) => (
          <li key={index} className="mb-1">
            <strong>{capitalizeFirstLetter(day.day)}: </strong>
            {day.isOpen
              ? `${day.openTime} - ${day.closeTime}`
              : 'Cerrado'}
          </li>
        ))}
      </ul>
    );
  };

  const capitalizeFirstLetter = (string: string) => {
    return daysOfWeek.find(day => day.id === string)?.label || string;
  };

  const renderDesktopFooter = () => (
    <>
      <Row className="mb-4">
        <Col xs={12} className="text-center mb-4">
          {config?.logo && (
            <Image
              src={config.logo}
              alt={storeName}
              className="logo"
              fluid
            />
          )}
          {storeName && <h3>{storeName}</h3>}
          {config?.footer?.info && (
            <p className="mt-2">{config.footer?.info}</p>
          )}
        </Col>
      </Row>
      <Row>
        {hasContactInfo && (
          <Col lg={colWidth.lg} md={colWidth.md} sm={colWidth.sm} className="mb-4">
            <h5 className="section-title">Contacto</h5>
            <ul className="list-unstyled">
              {storeAddress && (
                <li className="mb-2">
                  <a href={`https://maps.google.com/?q=${storeAddress}`} className="social-link" target="_blank" rel="noreferrer">
                    <FaMapMarkerAlt className="icon" />
                    <span className="contact-text">{storeAddress}</span>
                  </a>
                </li>
              )}
              {phoneNumbers.map((phone, index) => (
                <li key={index} className="mb-2">
                  <a href={`tel:${phone}`} className="social-link">
                    <FaPhone className="icon" />
                    <span className="contact-text">{phone}</span>
                  </a>
                </li>
              ))}
              {footerData?.email && (
                <li className="mb-2">
                  <a href={`mailto:${footerData.email}`} className="social-link">
                    <FaEnvelope className="icon" />
                    <span className="contact-text">{footerData.email}</span>
                  </a>
                </li>
              )}
            </ul>
            {storeAddress && (
              <p className="mt-2">
                <strong>Dirección:</strong> {storeAddress}
              </p>
            )}
            {(config?.coordinates && config?.coordinates?.lat > 0 && config?.coordinates?.lng) && (
              <div className="mt-3">
                <a
                  href={`https://maps.google.com/?q=${config.coordinates.lat},${config.coordinates.lng}`}
                  className="btn btn-outline-secondary"
                  style={{
                    color: 'var(--secondary-text) !important',
                  }}
                  target="_blank"
                  rel="noreferrer"
                >
                  Ver ubicación en el mapa
                </a>
              </div>
            )}
          </Col>
        )}
        
        {(hasScheduleInfo || hasSocialNetworks) && (
          <Col lg={colWidth.lg} md={colWidth.md} sm={colWidth.sm} className="mb-4">
            {hasScheduleInfo ? (
              <>
                <h5 className="section-title">Horarios</h5>
                {renderSchedule()}
              </>
            ) : hasSocialNetworks ? (
              <>
                <h5 className="section-title">Redes Sociales</h5>
                <ul className="list-unstyled">
                  {config?.socialNetworks?.map((social, index) => (
                    <li key={index} className="mb-2">
                      <a href={social.url} target="_blank" rel="noreferrer" className="social-link">
                        {getSocialIcon(social.name)}
                        {social.name}
                      </a>
                    </li>
                  ))}
                </ul>
              </>
            ) : null}
          </Col>
        )}
        
        {hasInfoSection && (
          <Col lg={colWidth.lg} md={colWidth.md} sm={colWidth.sm} className="mb-4">
            <h5 className="section-title">Información</h5>
            <div>
              {legalNotice && (
                <p className="mb-2">{legalNotice}</p>
              )}
              {footerData?.extraText ? (
                <p>{footerData.extraText}</p>
              ) : config?.about ? (
                <p>{config.about}</p>
              ) : config?.store?.description ? (
                <p>{config.store.description}</p>
              ) : null}
              {termsOfServiceLink && (
                <p className="mt-3 mb-0">
                  <a href={termsOfServiceLink} className="link" target="_blank" rel="noreferrer">
                    Términos y condiciones
                  </a>
                </p>
              )}
              {sitemapLink && (
                <p className="mb-0">
                  <a href={sitemapLink} className="link" target="_blank" rel="noreferrer">
                    Mapa del sitio
                  </a>
                </p>
              )}
            </div>
          </Col>
        )}
      </Row>
    </>
  );

  const renderMobileFooter = () => (
    <>
      <Row className="mb-3">
        <Col xs={12} className="text-center">
          {config?.logo && (
            <Image
              src={config.logo}
              alt={storeName}
              className="logo"
              style={{ maxHeight: '50px' }}
              fluid
            />
          )}
          {storeName && <h4 className="mt-2">{storeName}</h4>}
        </Col>
      </Row>
      <Row>
        <Col xs={12}>
          <Accordion defaultActiveKey="0" flush className="mb-3" style={{ backgroundColor: 'var(--bg-color)' }}>
            {hasContactInfo && (
              <Card style={{ border: 'none', backgroundColor: 'var(--bg-color)', marginBottom: 0 }}>
                <Card.Header style={{ backgroundColor: 'var(--bg-color)', padding: 0, border: 'none' }}>
                  <CustomToggle eventKey="0" isMobile={true}>Contacto</CustomToggle>
                </Card.Header>
                <Accordion.Collapse eventKey="0" style={{ backgroundColor: 'var(--bg-color)' }}>
                  <Card.Body style={{ backgroundColor: 'var(--bg-color)', padding: '0' }}>
                    <ul className="list-unstyled" style={{ backgroundColor: 'var(--bg-color)', marginBottom: 0 }}>
                      {storeAddress && (
                        <li className="mb-2" style={{ backgroundColor: 'var(--bg-color)' }}>
                          <a href={`https://maps.google.com/?q=${storeAddress}`} className="social-link" target="_blank" rel="noreferrer">
                            <FaMapMarkerAlt className="icon" />
                            <span className="contact-text" style={{ fontSize: '0.95rem', wordBreak: 'break-word' }}>{storeAddress}</span>
                          </a>
                        </li>
                      )}
                      {phoneNumbers.map((phone, index) => (
                        <li key={index} className={index === phoneNumbers.length - 1 && !footerData?.email ? '' : 'mb-2'} style={{ backgroundColor: 'var(--bg-color)' }}>
                          <a href={`tel:${phone}`} className="social-link">
                            <FaPhone className="icon" />
                            <span className="contact-text">{phone}</span>
                          </a>
                        </li>
                      ))}
                      {footerData?.email && (
                        <li style={{ backgroundColor: 'var(--bg-color)' }}>
                          <a href={`mailto:${footerData.email}`} className="social-link">
                            <FaEnvelope className="icon" />
                            <span className="contact-text" style={{ fontSize: '0.95rem', wordBreak: 'break-word' }}>{footerData.email}</span>
                          </a>
                        </li>
                      )}
                    </ul>
                    {config?.coordinates && (
                      <div className="mt-2" style={{ backgroundColor: 'var(--bg-color)' }}>
                        <a
                          href={`https://maps.google.com/?q=${config.coordinates.lat},${config.coordinates.lng}`}
                          className="btn btn-sm btn-outline-secondary"
                          style={{ fontSize: '0.85rem' }}
                          target="_blank"
                          rel="noreferrer"
                        >
                          Ver ubicación en el mapa
                        </a>
                      </div>
                    )}
                  </Card.Body>
                </Accordion.Collapse>
              </Card>
            )}

            {hasScheduleInfo && (
              <Card style={{ border: 'none', backgroundColor: 'var(--bg-color)', marginBottom: 0 }}>
                <Card.Header style={{ backgroundColor: 'var(--bg-color)', padding: 0, border: 'none' }}>
                  <CustomToggle eventKey={hasContactInfo ? "1" : "0"} isMobile={true}>Horarios</CustomToggle>
                </Card.Header>
                <Accordion.Collapse eventKey={hasContactInfo ? "1" : "0"} style={{ backgroundColor: 'var(--bg-color)' }}>
                  <Card.Body style={{ backgroundColor: 'var(--bg-color)', padding: '0' }}>
                    {renderSchedule()}
                  </Card.Body>
                </Accordion.Collapse>
              </Card>
            )}
            
            {!hasScheduleInfo && hasSocialNetworks && (
              <Card style={{ border: 'none', backgroundColor: 'var(--bg-color)', marginBottom: 0 }}>
                <Card.Header style={{ backgroundColor: 'var(--bg-color)', padding: 0, border: 'none' }}>
                  <CustomToggle eventKey={hasContactInfo ? "1" : "0"} isMobile={true}>Redes Sociales</CustomToggle>
                </Card.Header>
                <Accordion.Collapse eventKey={hasContactInfo ? "1" : "0"} style={{ backgroundColor: 'var(--bg-color)' }}>
                  <Card.Body style={{ backgroundColor: 'var(--bg-color)', padding: '0' }}>
                    <ul className="list-unstyled" style={{ backgroundColor: 'var(--bg-color)', marginBottom: 0 }}>
                      {config?.socialNetworks?.map((social, index) => (
                        <li key={index} className={index === config?.socialNetworks?.length - 1 ? '' : 'mb-2'} style={{ backgroundColor: 'var(--bg-color)' }}>
                          <a href={social.url} target="_blank" rel="noreferrer" className="social-link">
                            {getSocialIcon(social.name)}
                            {social.name}
                          </a>
                        </li>
                      ))}
                    </ul>
                  </Card.Body>
                </Accordion.Collapse>
              </Card>
            )}

            {hasInfoSection && (
              <Card style={{ border: 'none', backgroundColor: 'var(--bg-color)', marginBottom: 0 }}>
                <Card.Header style={{ backgroundColor: 'var(--bg-color)', padding: 0, border: 'none' }}>
                  <CustomToggle 
                    eventKey={hasContactInfo && (hasScheduleInfo || hasSocialNetworks) ? "2" : hasContactInfo || hasScheduleInfo || hasSocialNetworks ? "1" : "0"} 
                    isMobile={true}
                  >
                    Información
                  </CustomToggle>
                </Card.Header>
                <Accordion.Collapse 
                  eventKey={hasContactInfo && (hasScheduleInfo || hasSocialNetworks) ? "2" : hasContactInfo || hasScheduleInfo || hasSocialNetworks ? "1" : "0"} 
                  style={{ backgroundColor: 'var(--bg-color)' }}
                >
                  <Card.Body style={{ backgroundColor: 'var(--bg-color)', padding: '0' }}>
                    {legalNotice && (
                      <p className="mb-2 small" style={{ backgroundColor: 'var(--bg-color)' }}>{legalNotice}</p>
                    )}
                    {footerData?.extraText ? (
                      <p className="small" style={{ backgroundColor: 'var(--bg-color)', marginBottom: 0 }}>{footerData.extraText}</p>
                    ) : config?.about ? (
                      <p className="small" style={{ backgroundColor: 'var(--bg-color)', marginBottom: 0 }}>{config.about}</p>
                    ) : config?.store?.description ? (
                      <p className="small" style={{ backgroundColor: 'var(--bg-color)', marginBottom: 0 }}>{config.store.description}</p>
                    ) : null}
                    {(termsOfServiceLink || sitemapLink) && (
                      <div className="mt-3" style={{ backgroundColor: 'var(--bg-color)' }}>
                        {termsOfServiceLink && (
                          <p className={sitemapLink ? 'mb-1' : 'mb-0'} style={{ backgroundColor: 'var(--bg-color)' }}>
                            <a href={termsOfServiceLink} className="link" target="_blank" rel="noreferrer">
                              Términos y condiciones
                            </a>
                          </p>
                        )}
                        {sitemapLink && (
                          <p className="mb-0" style={{ backgroundColor: 'var(--bg-color)' }}>
                            <a href={sitemapLink} className="link" target="_blank" rel="noreferrer">
                              Mapa del sitio
                            </a>
                          </p>
                        )}
                      </div>
                    )}
                  </Card.Body>
                </Accordion.Collapse>
              </Card>
            )}
          </Accordion>
        </Col>
      </Row>
    </>
  );

  return (
    <footer className="footer">
      <Container>
        {isMobile ? renderMobileFooter() : renderDesktopFooter()}
        <Row>
          {!isPremiumUser && (
            <>
              <Col md={6} className="mt-4 mt-md-0">
                <div className="text-center">
                  <Link
                    href="/"
                    className="btn btn-secondary"
                    style={{
                      borderRadius: '4px',
                      fontWeight: '500',
                      transition: 'all 0.3s ease'
                    }}
                  >
                    <span className="me-2 text-white">
                      ¡Explora mas tiendas!
                    </span>
                  </Link>
                </div>
              </Col>
              <Col md={6} className="mt-4 mt-md-0">
                <div className="text-center">
                  <Link
                    href={process.env.NEXT_PUBLIC_ADMIN_URL || '/'}
                    className="btn btn-secondary"
                    style={{
                      borderRadius: '4px',
                      fontWeight: '500',
                      transition: 'all 0.3s ease'
                    }}
                  >
                    <span className="me-2 text-white">
                      ¡Crea tu propia tienda!
                    </span>
                  </Link>
                </div>
              </Col>
            </>
          )}
          <Col className="text-center mt-4 pt-3 border-top">
            {!isPremiumUser && (
              <div className="powered-by-container">
                <div className="d-flex justify-content-center align-items-center">
                  <Image
                    src="/images/logo.svg"
                    alt="Hermes"
                    height={30}
                    width={30}
                    className="me-2"
                  />
                  <span className="hermes-text">Hermes</span>
                </div>
                <small className="d-block mt-1">Powered by Prizma</small>
              </div>
            )}
            {storeName && (
                <small>
                &copy; {new Date().getFullYear()} {storeName}. {disclaimer || 'Todos los derechos reservados.'}
              </small>
            )}
          </Col>
          <Col className="text-center border-top mt-4 pt-3" style={{ borderTop: '1px solid var(--border-color-light)' }}>
            <small>&copy; Powered by <a href="https://www.prizma.co/" style={{ color: 'var(--link-color)', textDecoration: 'none' }} target="_blank" rel="noreferrer">Prizma</a></small>
          </Col>
        </Row>
      </Container>
    </footer>
  );
};

export default Footer;
