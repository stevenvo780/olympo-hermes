'use client';
import React from 'react';
import { Container } from 'react-bootstrap';
import { 
  FaShieldAlt,
  FaBuilding,
  FaClipboardList,
  FaUserCog,
  FaCheck,
  FaUserShield,
  FaLock,
  FaGlobe,
  FaInfoCircle
} from 'react-icons/fa';
import './styles.scss';

const PrivacyPolicyView: React.FC = () => {
  return (
    <Container className="privacy-policy-container my-5">
      <div className="privacy-policy-content">

        <div className="policy-header text-center mb-4">
          <h1 className="policy-title">
            <FaShieldAlt className="me-2" /> Política de Privacidad
          </h1>
          <hr className="policy-divider" />
        </div>

        <section className="policy-section mb-4">
          <div className="section-header">
            <FaInfoCircle className="section-icon" />
            <h2 className="section-title">1. Introducción</h2>
          </div>
          <p className="section-text">
            Esta política de privacidad describe cómo <strong>Cauce</strong> recopila, utiliza, almacena y protege
            los datos personales de: (i) los clientes que realizan pedidos en nuestro eCommerce; y (ii) los usuarios
            administradores (propietarios o socios) que crean y gestionan tiendas dentro de la plataforma. Nos regimos
            por la Ley 1581 de 2012, el Decreto 1377 de 2013 y las directrices de la Superintendencia de Industria y
            Comercio (SIC) de Colombia.
          </p>
        </section>

        <section className="policy-section mb-4">
          <div className="section-header">
            <FaBuilding className="section-icon" />
            <h2 className="section-title">2. Identificación del Responsable del Tratamiento</h2>
          </div>
          <div className="section-text">
            <span className="company-badge">Cauce</span>
            <p>
              <strong>Dirección:</strong> Calle 44 #50-135<br />
              <strong>Correo electrónico:</strong> soporte@cauce.app<br />
              <strong>Teléfono:</strong> 3046374368
            </p>
            <p>
              <strong>Ámbito de Aplicación:</strong> Esta política aplica a todos los datos personales recolectados,
              procesados y almacenados por Cauce en su eCommerce y plataforma de administración de tiendas.
            </p>
          </div>
        </section>

        <section className="policy-section mb-4">
          <div className="section-header">
            <FaUserCog className="section-icon" />
            <h2 className="section-title">3. Datos Personales Recopilados</h2>
          </div>
          <p className="section-text">
            Recopilamos únicamente la información necesaria para cumplir con las finalidades descritas en esta política.
          </p>
          <ul className="policy-list">
            <li>
              <FaCheck className="list-icon" />
              <strong>Datos de Clientes:</strong> Nombre y apellidos, dirección de envío (calle, ciudad, departamento,
              país, referencias), teléfono de contacto, correo electrónico y cualquier información adicional (por
              ejemplo, teléfono alternativo) que facilite la entrega de pedidos.
            </li>
            <li>
              <FaCheck className="list-icon" />
              <strong>Datos de Administradores (Propietarios o Socios):</strong> Nombre, correo electrónico (obligatorios),
              teléfono de contacto (opcional), ID único de la tienda y metadatos necesarios para su gestión (por ejemplo,
              dirección comercial o número de tienda para envío de notificaciones).
            </li>
          </ul>
        </section>

        <section className="policy-section mb-4">
          <div className="section-header">
            <FaClipboardList className="section-icon" />
            <h2 className="section-title">4. Finalidad del Tratamiento</h2>
          </div>
          <p className="section-text">Los datos se tratan con las siguientes finalidades específicas:</p>
          <ul className="policy-list">
            <li>
              <FaCheck className="list-icon" />
              <strong>Clientes:</strong> Procesar y gestionar pedidos y entregas; generar facturación y comprobantes
              legales; y brindar soporte al cliente.
            </li>
            <li>
              <FaCheck className="list-icon" />
              <strong>Administradores:</strong> Registrar y gestionar la cuenta de cada propietario o socio de tienda;
              habilitar la administración y configuración de tiendas; asegurar la legitimidad de los negocios creados;
              y enviar notificaciones de soporte o seguridad.
            </li>
          </ul>
        </section>

        <section className="policy-section mb-4">
          <div className="section-header">
            <FaCheck className="section-icon" />
            <h2 className="section-title">5. Consentimiento y Principio de Minimización</h2>
          </div>
          <p className="section-text">
            Al realizar un pedido o registrarse como administrador, usted autoriza expresamente el tratamiento de
            sus datos para los fines descritos. Únicamente se recolecta la información estrictamente necesaria para
            brindar el servicio y cumplir con las obligaciones legales.
          </p>
        </section>

        <section className="policy-section mb-4">
          <div className="section-header">
            <FaUserShield className="section-icon" />
            <h2 className="section-title">6. Derechos del Titular</h2>
          </div>
          <p className="section-text">
            Conforme a la Ley 1581 de 2012, los titulares de los datos tienen derecho a:
          </p>
          <ul className="policy-list">
            <li><FaCheck className="list-icon" /> Conocer, actualizar y rectificar sus datos personales.</li>
            <li><FaCheck className="list-icon" /> Solicitar prueba de la autorización otorgada.</li>
            <li><FaCheck className="list-icon" /> Ser informado del uso que se da a sus datos personales.</li>
            <li><FaCheck className="list-icon" /> Revocar la autorización y/o solicitar la supresión de sus datos.</li>
            <li><FaCheck className="list-icon" /> Presentar quejas ante la SIC cuando considere que se ha vulnerado
              la protección de sus datos.</li>
          </ul>
        </section>

        <section className="policy-section mb-4">
          <div className="section-header">
            <FaUserShield className="section-icon" />
            <h2 className="section-title">7. Conservación y Eliminación de Datos</h2>
          </div>
          <p className="section-text">
            Al eliminar una tienda, la información asociada (productos, pedidos, configuraciones, etc.) se eliminará de
            forma permanente de nuestra plataforma, sin requerir una solicitud adicional de supresión de datos. No
            obstante, si existiere una obligación legal de conservar ciertos registros (por ejemplo, facturas o
            comprobantes de pago), dicha información se mantendrá bloqueada durante el tiempo exigido por la ley.
          </p>
        </section>

        <section className="policy-section mb-4">
          <div className="section-header">
            <FaLock className="section-icon" />
            <h2 className="section-title">8. Almacenamiento y Seguridad de la Información</h2>
          </div>
          <p className="section-text">
            Implementamos medidas de seguridad técnicas y organizativas para proteger los datos contra acceso no
            autorizado, pérdida, alteración o destrucción. La información se almacena de forma segura en Google Cloud
            Platform (GCP) y Firebase, evitando el uso de contraseñas en texto plano y asegurando protocolos cifrados.
          </p>
        </section>

        <section className="policy-section mb-4">
          <div className="section-header">
            <FaGlobe className="section-icon" />
            <h2 className="section-title">9. Transferencias Internacionales</h2>
          </div>
          <p className="section-text">
            En algunos casos, los datos podrán ser procesados o almacenados en servidores ubicados fuera de Colombia.
            Tales transferencias se realizan bajo estrictas garantías contractuales que aseguran un nivel adecuado
            de protección, respetando las normas de la Ley 1581 de 2012.
          </p>
        </section>

        <section className="policy-section mb-4">
          <div className="section-header">
            <FaInfoCircle className="section-icon" />
            <h2 className="section-title">10. Cambios en la Política de Privacidad</h2>
          </div>
          <p className="section-text">
            Nos reservamos el derecho de modificar esta política en cualquier momento. Cualquier cambio sustancial
            será notificado a los usuarios y administradores, y la versión vigente estará disponible en nuestro sitio web.
          </p>
        </section>

        <section className="policy-section mb-4">
          <div className="section-header">
            <FaInfoCircle className="section-icon" />
            <h2 className="section-title">11. Contacto</h2>
          </div>
          <p className="section-text">
            Para ejercer sus derechos o realizar consultas sobre el tratamiento de sus datos personales, puede
            escribirnos a <strong>soporte@cauce.app</strong> o llamar al número <strong>3046374368</strong>.
          </p>
        </section>

        <div className="policy-footer text-center mt-5">
          <div className="effective-date">Fecha de vigencia: 30 de marzo de 2025</div>
        </div>
      </div>
    </Container>
  );
};

export default PrivacyPolicyView;
