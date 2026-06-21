'use client';
import React, { useEffect, useState } from 'react';
import { Container, Row, Col, Accordion, useAccordionButton } from 'react-bootstrap';
import { FaMapMarkerAlt, FaPhone, FaEnvelope, FaGlobe, FaChevronDown } from 'react-icons/fa';

const DefaultFooter: React.FC = () => {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  const mobileAccordionButton = { background: 'none', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', padding: '0', color: 'inherit', fontWeight: 600, cursor: 'pointer' };
  const sectionTitleStyle = { borderBottom: '2px solid var(--accent-color)', paddingBottom: '8px', marginBottom: '15px', fontWeight: 600 };
  const socialLinkStyle = { color: 'var(--link-color)', textDecoration: 'none', transition: 'color 0.3s ease', display: 'flex', alignItems: 'center', marginBottom: '10px' };
  const iconStyle = { marginRight: '10px', fontSize: '18px' };
  const defaultName = 'Prizma';
  const defaultLocation = 'Colombia';
  const defaultPhone = '57 3246780067';
  const defaultEmail = 'stevenvallejo780@gmail.com';
  const defaultSlogan = 'Prizma: el prizma de tu negocio. Tecnología al servicio de tu crecimiento';
  const defaultDescription = 'Enfócate hacer lo que te gusta, que los sistemas se encarguen del resto';
  const defaultSocialNetworks = [{ name: 'Website', url: 'https://www.prizma.co/' }];
  const CustomToggle = ({ children, eventKey }: { children: React.ReactNode; eventKey: string }) => {
    const [isOpen, setIsOpen] = useState(false);
    const decoratedOnClick = useAccordionButton(eventKey, () => setIsOpen(!isOpen));
    return (
      <button type="button" style={{ ...mobileAccordionButton, borderBottom: '1px solid var(--border-color)', marginBottom: '15px', paddingBottom: '8px' }} onClick={decoratedOnClick}>
        {children}
        <FaChevronDown style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform 0.3s ease' }} />
      </button>
    );
  };
  const renderDesktopFooter = () => (
    <>
      <Row className="mb-4">
        <Col xs={12} className="text-center mb-4">
          <h3>{defaultName}</h3>
          <p className="mt-2">{defaultSlogan}</p>
        </Col>
      </Row>
      <Row>
        <Col lg={4} md={6} sm={12} className="mb-4">
          <h5 style={sectionTitleStyle}>Contacto</h5>
          <ul className="list-unstyled">
            <li className="mb-2">
              <a href={`https://maps.google.com/?q=${defaultLocation}`} style={socialLinkStyle} target="_blank" rel="noreferrer">
                <FaMapMarkerAlt style={iconStyle} />
                {defaultLocation}
              </a>
            </li>
            <li className="mb-2">
              <a href={`tel:${defaultPhone}`} style={socialLinkStyle}>
                <FaPhone style={iconStyle} />
                {defaultPhone}
              </a>
            </li>
            <li className="mb-2">
              <a href={`mailto:${defaultEmail}`} style={socialLinkStyle}>
                <FaEnvelope style={iconStyle} />
                {defaultEmail}
              </a>
            </li>
          </ul>
        </Col>
        <Col lg={4} md={6} sm={12} className="mb-4">
          <h5 style={sectionTitleStyle}>Redes Sociales</h5>
          <ul className="list-unstyled">
            {defaultSocialNetworks.map((social, index) => (
              <li key={index} className="mb-2">
                <a href={social.url} target="_blank" rel="noreferrer" style={socialLinkStyle}>
                  <FaGlobe style={iconStyle} />
                  {social.name}
                </a>
              </li>
            ))}
          </ul>
        </Col>
        <Col lg={4} md={12} sm={12} className="mb-4">
          <h5 style={sectionTitleStyle}>Información</h5>
          <div>
            <p className="mb-2">{defaultSlogan}</p>
            <p>{defaultDescription}</p>
          </div>
        </Col>
      </Row>
      <Row>
        <Col className="text-center mt-4 pt-3" style={{ borderTop: '1px solid var(--border-color-light)' }}>
          <small>&copy; {new Date().getFullYear()} {defaultName}. Todos los derechos reservados.</small>
        </Col>
      </Row>
    </>
  );
  const renderMobileFooter = () => (
    <>
      <Row className="mb-3">
        <Col xs={12} className="text-center">
          <h4>{defaultName}</h4>
        </Col>
      </Row>
      <Row>
        <Col xs={12}>
          <Accordion defaultActiveKey="0" className="mb-3">
            <div className="mb-3">
              <CustomToggle eventKey="0">Contacto</CustomToggle>
              <Accordion.Collapse eventKey="0">
                <div className="pt-2">
                  <ul className="list-unstyled">
                    <li className="mb-2">
                      <a href={`https://maps.google.com/?q=${defaultLocation}`} style={socialLinkStyle} target="_blank" rel="noreferrer">
                        <FaMapMarkerAlt style={iconStyle} />
                        {defaultLocation}
                      </a>
                    </li>
                    <li className="mb-2">
                      <a href={`tel:${defaultPhone}`} style={socialLinkStyle}>
                        <FaPhone style={iconStyle} />
                        {defaultPhone}
                      </a>
                    </li>
                    <li className="mb-2">
                      <a href={`mailto:${defaultEmail}`} style={socialLinkStyle}>
                        <FaEnvelope style={iconStyle} />
                        {defaultEmail}
                      </a>
                    </li>
                  </ul>
                </div>
              </Accordion.Collapse>
            </div>
            <div className="mb-3">
              <CustomToggle eventKey="1">Redes Sociales</CustomToggle>
              <Accordion.Collapse eventKey="1">
                <div className="pt-2">
                  <ul className="list-unstyled">
                    {defaultSocialNetworks.map((social, index) => (
                      <li key={index} className="mb-2">
                        <a href={social.url} target="_blank" rel="noreferrer" style={socialLinkStyle}>
                          <FaGlobe style={iconStyle} />
                          {social.name}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              </Accordion.Collapse>
            </div>
            <div className="mb-3">
              <CustomToggle eventKey="2">Información</CustomToggle>
              <Accordion.Collapse eventKey="2">
                <div className="pt-2">
                  <p className="mb-2">{defaultSlogan}</p>
                  <p>{defaultDescription}</p>
                </div>
              </Accordion.Collapse>
            </div>
          </Accordion>
        </Col>
      </Row>
      <Row>
        <Col className="text-center mt-4 pt-3" style={{ borderTop: '1px solid var(--border-color-light)' }}>
          <small>&copy; {new Date().getFullYear()} {defaultName}. Todos los derechos reservados.</small>
        </Col>
      </Row>
    </>
  );
  return (
    <footer style={{ backgroundColor: 'var(--bg-color)', padding: '40px 0 20px', color: 'var(--font-color)', marginTop: '20px', borderTop: '1px solid var(--border-color)' }} className="footer">
      <Container>{isMobile ? renderMobileFooter() : renderDesktopFooter()}</Container>
    </footer>
  );
};
export default DefaultFooter;
