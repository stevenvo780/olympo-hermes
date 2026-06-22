'use client';

import React, { useState } from 'react';
import { Container, Row, Col, Card, Button, Form } from 'react-bootstrap';
import Image from 'next/image';
import { CgPhone, CgMail, CgGlobe, CgFacebook, CgInstagram, CgChevronRight } from 'react-icons/cg';
import { FaWhatsapp } from 'react-icons/fa';

const AboutPage: React.FC = () => {
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const handleContactSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    const form = e.currentTarget;
    const nombre = (form.elements.namedItem('nombre') as HTMLInputElement)?.value?.trim();
    const email = (form.elements.namedItem('email') as HTMLInputElement)?.value?.trim();
    const asunto = (form.elements.namedItem('asunto') as HTMLInputElement)?.value?.trim();
    const mensaje = (form.elements.namedItem('mensaje') as HTMLTextAreaElement)?.value?.trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const errors: Record<string, string> = {};

    if (!nombre) errors.nombre = 'El nombre es obligatorio';
    if (!email) errors.email = 'El email es obligatorio';
    else if (!emailRegex.test(email)) errors.email = 'Ingresa un email válido';
    if (!asunto) errors.asunto = 'El asunto es obligatorio';
    if (!mensaje) errors.mensaje = 'El mensaje es obligatorio';

    if (Object.keys(errors).length > 0) {
      e.preventDefault();
      setFormErrors(errors);
      return;
    }
    setFormErrors({});
  };

  return (
    <div className="about-page">
      <section className="hero-section text-center py-5 mb-5" style={{
        background: 'linear-gradient(135deg, var(--primary-color) 0%, var(--secondary-color) 100%)',
        color: 'white',
        borderRadius: '0 0 50px 50px',
        padding: '80px 20px'
      }}>
        <Container>
          <div className="d-flex justify-content-center mb-4">
            <Image
              src="/images/prizma-symbol.svg"
              alt="Prizma"
              width={180}
              height={180}
              style={{ objectFit: 'contain' }}
            />
          </div>
          <h1 className="display-4 fw-bold">Prizma</h1>
          <p className="lead mb-4">Tecnología al servicio de tu crecimiento</p>
          <p className="mb-5 w-75 mx-auto">Enfócate en hacer lo que te gusta, que los sistemas se encarguen del resto</p>
          <Button
            variant="light"
            size="lg"
            href="https://wa.me/573246780067?text=Hola,%20estoy%20interesado%20en%20los%20servicios%20de%20Hermes%20Prizma"
            target="_blank"
            rel="noreferrer"
            className="px-4 py-2"
            style={{ color: 'var(--primary-color)' }}
          >
            Contáctanos hoy
          </Button>
        </Container>
      </section>

      <section className="services-section py-5 mb-5">
        <Container>
          <h2 className="text-center mb-5">Nuestros Servicios</h2>
          <Row className="g-4">
            {[
              {
                title: 'Desarrollo de Software a Medida',
                desc: 'Creamos soluciones tecnológicas personalizadas que se adaptan perfectamente a tu negocio.',
                icon: '💻'
              },
              {
                title: 'Sistemas de Gestión',
                desc: 'Optimiza tus procesos con nuestras herramientas de administración empresarial.',
                icon: '📊'
              },
              {
                title: 'Plataformas de E-Commerce',
                desc: 'Incrementa tus ventas con tiendas online potentes y fáciles de usar.',
                icon: '🛒'
              },
              {
                title: 'Soporte Técnico',
                desc: 'Te acompañamos en todo momento para garantizar el funcionamiento óptimo de tus sistemas.',
                icon: '🔧'
              }
            ].map((service, index) => (
              <Col md={6} lg={3} key={index}>
                <Card className="h-100 border-0 shadow-sm text-center p-3 hover-card">
                  <Card.Body>
                    <div className="fs-1 mb-3">{service.icon}</div>
                    <Card.Title>{service.title}</Card.Title>
                    <Card.Text>{service.desc}</Card.Text>
                  </Card.Body>
                </Card>
              </Col>
            ))}
          </Row>
          <div className="text-center mt-4">
            <Button
              variant="primary"
              href="https://prisma-enterprise.cloud"
              target="_blank"
              style={{ padding: '10px 20px', fontSize: '1.1rem', color: 'white', backgroundColor: '#FF5A2B', borderColor: '#FF5A2B' }}
            >
              <span style={{ color: 'white' }}>Explora más de nuestros servicios</span>
            </Button>
          </div>
        </Container>
      </section>

      <section className="about-section py-5 mb-5" style={{ backgroundColor: 'var(--bg-alternative)' }}>
        <Container>
          <Row className="align-items-center">
            <Col lg={6}>
              <h2 className="mb-4">Sobre Prizma</h2>
              <p>
                En Prizma estamos comprometidos con la transformación digital de las empresas,
                ofreciendo soluciones tecnológicas que simplifican procesos y maximizan resultados.
              </p>
              <p>
                Nuestro equipo de profesionales combina experiencia y pasión por la innovación para
                crear productos que realmente impactan de manera positiva en el crecimiento de tu negocio.
              </p>
              <p>
                Creemos que la tecnología debe ser accesible y fácil de usar, por eso desarrollamos
                herramientas intuitivas que cualquiera puede implementar sin complicaciones técnicas.
              </p>
            </Col>
            <Col lg={6} className="mt-4 mt-lg-0">
              <Card className="border-0 shadow">
                <Card.Body className="p-4">
                  <h3 className="mb-4">Valores que nos definen</h3>
                  {[
                    { value: 'Innovación', desc: 'Buscamos constantemente nuevas formas de resolver problemas.' },
                    { value: 'Calidad', desc: 'Nos comprometemos con la excelencia en cada producto que desarrollamos.' },
                    { value: 'Compromiso', desc: 'Tu éxito es nuestro éxito. Trabajamos para superar expectativas.' },
                    { value: 'Simplicidad', desc: 'Transformamos lo complejo en soluciones fáciles de implementar.' }
                  ].map((item, index) => (
                    <div key={index} className="mb-3">
                      <div className="d-flex align-items-center">
                        <CgChevronRight style={{ color: 'var(--primary-color)', minWidth: '20px' }} />
                        <strong className="ms-2">{item.value}:</strong>
                      </div>
                      <p className="ms-4 mb-2">{item.desc}</p>
                    </div>
                  ))}
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Container>
      </section>

      <section className="contact-section py-5">
        <Container>
          <Row>
            <Col lg={5} className="mb-4 mb-lg-0">
              <h2 className="mb-4">Contáctanos</h2>
              <p className="mb-4">
                Estamos aquí para ayudarte. Si tienes alguna pregunta o necesitas soporte técnico,
                no dudes en ponerte en contacto con nosotros.
              </p>

              <div className="contact-info">
                <div className="d-flex align-items-center mb-3">
                  <div style={{
                    backgroundColor: 'var(--primary-color)',
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginRight: '15px',
                    color: 'white'
                  }}>
                    <CgPhone size={20} />
                  </div>
                  <div>
                    <h5 className="mb-0">Teléfono</h5>
                    <p className="mb-0">+57 324 678 0067</p>
                  </div>
                </div>

                <div className="d-flex align-items-center mb-3">
                  <div style={{
                    backgroundColor: 'var(--primary-color)',
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginRight: '15px',
                    color: 'white'
                  }}>
                    <CgMail size={20} />
                  </div>
                  <div>
                    <h5 className="mb-0">Email</h5>
                    <p className="mb-0">contacto@prisma-enterprise.cloud</p>
                  </div>
                </div>

                <div className="d-flex align-items-center mb-4">
                  <div style={{
                    backgroundColor: 'var(--primary-color)',
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginRight: '15px',
                    color: 'white'
                  }}>
                    <CgGlobe size={20} />
                  </div>
                  <div>
                    <h5 className="mb-0">Sitio Web</h5>
                    <p className="mb-0">stevenvallejo.dev</p>
                  </div>
                </div>

                <div className="social-links mt-4">
                  <h5 className="mb-3">Síguenos en redes</h5>
                  <div className="d-flex">
                    {[
                      { icon: <CgGlobe size={24} />, url: 'https://stevenvallejo.dev', label: 'Web' },
                      { icon: <CgFacebook size={24} />, url: 'https://www.facebook.com/profile.php?id=100093808513344', label: 'Facebook' },
                      { icon: <CgInstagram size={24} />, url: 'https://www.instagram.com/stevenvallejo/', label: 'Instagram' },
                    ].map((social, index) => (
                      <a
                        key={index}
                        href={social.url}
                        target="_blank"
                        rel="noreferrer"
                        className="me-3"
                        style={{
                          backgroundColor: 'var(--bg-alternative)',
                          width: '45px',
                          height: '45px',
                          borderRadius: '50%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'var(--primary-color)',
                          transition: 'all 0.3s'
                        }}
                        aria-label={social.label}
                      >
                        {social.icon}
                      </a>
                    ))}
                  </div>
                </div>
              </div>
            </Col>

            <Col lg={7}>
              <Card className="border-0 shadow">
                <Card.Body className="p-4">
                  <h3 className="mb-4">Envíanos un mensaje</h3>
                  <Form
                    action="https://formsubmit.co/contacto@prisma-enterprise.cloud"
                    method="POST"
                    onSubmit={handleContactSubmit}
                    noValidate
                  >
                    <input type="hidden" name="_captcha" value="false" />
                    <input type="hidden" name="_next" value={typeof window !== 'undefined' ? window.location.href : ''} />
                    <input type="hidden" name="_subject" value="Nuevo mensaje desde el sitio web" />

                    <Row>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>Nombre</Form.Label>
                          <Form.Control name="nombre" type="text" placeholder="Tu nombre" isInvalid={!!formErrors.nombre} />
                          <Form.Control.Feedback type="invalid">{formErrors.nombre}</Form.Control.Feedback>
                        </Form.Group>
                      </Col>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>Email</Form.Label>
                          <Form.Control name="email" type="email" placeholder="tu@email.com" isInvalid={!!formErrors.email} />
                          <Form.Control.Feedback type="invalid">{formErrors.email}</Form.Control.Feedback>
                        </Form.Group>
                      </Col>
                    </Row>

                    <Form.Group className="mb-3">
                      <Form.Label>Asunto</Form.Label>
                      <Form.Control name="asunto" type="text" placeholder="¿Cómo podemos ayudarte?" isInvalid={!!formErrors.asunto} />
                      <Form.Control.Feedback type="invalid">{formErrors.asunto}</Form.Control.Feedback>
                    </Form.Group>

                    <Form.Group className="mb-4">
                      <Form.Label>Mensaje</Form.Label>
                      <Form.Control name="mensaje" as="textarea" rows={5} placeholder="Escribe tu mensaje aquí..." isInvalid={!!formErrors.mensaje} />
                      <Form.Control.Feedback type="invalid">{formErrors.mensaje}</Form.Control.Feedback>
                    </Form.Group>

                    <div className="d-grid">
                      <Button
                        type="submit"
                        style={{
                          backgroundColor: 'var(--primary-color)',
                          borderColor: 'var(--primary-color)'
                        }}
                        size="lg"
                      >
                        Enviar Mensaje
                      </Button>
                    </div>
                  </Form>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Container>
      </section>

      <footer
        className="text-center py-4 mt-5"
        style={{
          backgroundColor: 'var(--bg-color)',
          color: 'var(--font-color)',
          borderTop: '1px solid rgba(255,255,255,0.2)'
        }}
      >
        <Container>
          <p className="mb-0">&copy; {new Date().getFullYear()} Hermes by Prizma. Todos los derechos reservados.</p>
        </Container>
      </footer>

      <a
        href="https://wa.me/573246780067?text=Necesito%20soporte%20de%20Hermes%20Prizma"
        target="_blank"
        rel="noreferrer"
        style={{
          position: 'fixed',
          bottom: '20px',
          right: '20px',
          backgroundColor: '#25D366',
          color: 'white',
          borderRadius: '50%',
          width: '60px',
          height: '60px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          textDecoration: 'none',
        }}
        aria-label="Soporte WhatsApp"
      >
        <FaWhatsapp size={30} style={{ color: 'white' }} />
      </a>

      <style jsx global>{`
        .hover-card {
          transition: transform 0.3s ease;
        }
        .hover-card:hover {
          transform: translateY(-10px);
        }
      `}</style>
    </div>
  );
};

export default AboutPage;
