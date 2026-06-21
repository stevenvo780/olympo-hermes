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
            Esta política de privacidad establece los términos en que <strong>Prizma</strong> utiliza y protege la
            información proporcionada por sus clientes al realizar un pedido en nuestro eCommerce, en cumplimiento de la
            Ley 1581 de 2012, el Decreto 1377 de 2013 y las directrices de la Superintendencia de Industria y Comercio (SIC).
          </p>
        </section>

        <section className="policy-section mb-4">
          <div className="section-header">
            <FaBuilding className="section-icon" />
            <h2 className="section-title">2. Identificación del Responsable</h2>
          </div>
          <div className="section-text">
            <span className="company-badge">Prizma</span>
            <p>
              <strong>Dirección:</strong> Calle 44 #50-135 <br />
              <strong>Correo electrónico:</strong> stevenvallejo780@gmail.com <br />
              <strong>Teléfono:</strong> 3046374368
            </p>
          </div>
        </section>

        <section className="policy-section mb-4">
          <div className="section-header">
            <FaClipboardList className="section-icon" />
            <h2 className="section-title">3. Finalidad del Tratamiento</h2>
          </div>
          <p className="section-text">Los datos personales se utilizan para:</p>
          <ul className="policy-list">
            <li><FaCheck className="list-icon" /> Procesar y gestionar pedidos y entregas.</li>
            <li><FaCheck className="list-icon" /> Generar facturación y comprobantes legales.</li>
            <li><FaCheck className="list-icon" /> Facilitar la atención al cliente.</li>
          </ul>
        </section>

        <section className="policy-section mb-4">
          <div className="section-header">
            <FaUserCog className="section-icon" />
            <h2 className="section-title">4. Datos Personales Recopilados</h2>
          </div>
          <p className="section-text">
            Se recaban únicamente los datos necesarios para cumplir con la finalidad del tratamiento, tales como:
          </p>
          <ul className="policy-list">
            <li><FaCheck className="list-icon" /> Nombre y apellidos.</li>
            <li><FaCheck className="list-icon" /> Dirección de envío (calle, ciudad, departamento, país, referencias).</li>
            <li><FaCheck className="list-icon" /> Teléfono de contacto y correo electrónico.</li>
            <li><FaCheck className="list-icon" /> Información adicional (por ejemplo, número de apartamento o teléfono alternativo), cuando aplique.</li>
          </ul>
        </section>

        <section className="policy-section mb-4">
          <div className="section-header">
            <FaCheck className="section-icon" />
            <h2 className="section-title">5. Consentimiento y Principio de Minimización</h2>
          </div>
          <p className="section-text">
            Al realizar su pedido, usted autoriza expresamente el tratamiento de sus datos para los fines indicados,
            limitándose la recolección a la información estrictamente necesaria.
          </p>
        </section>

        <section className="policy-section mb-4">
          <div className="section-header">
            <FaUserShield className="section-icon" />
            <h2 className="section-title">6. Derechos del Titular</h2>
          </div>
          <p className="section-text">Usted tiene derecho a:</p>
          <ul className="policy-list">
            <li><FaCheck className="list-icon" /> Acceder a sus datos personales.</li>
            <li><FaCheck className="list-icon" /> Solicitar su corrección, actualización o eliminación.</li>
            <li><FaCheck className="list-icon" /> Revocar el consentimiento otorgado.</li>
            <li><FaCheck className="list-icon" /> Conocer el uso dado a su información y presentar quejas ante la SIC.</li>
          </ul>
        </section>

        <section className="policy-section mb-4">
          <div className="section-header">
            <FaLock className="section-icon" />
            <h2 className="section-title">7. Almacenamiento y Seguridad de la Información</h2>
          </div>
          <p className="section-text">
            Los datos se almacenan de forma segura en Google Cloud Platform (GCP) y Firebase. No se guardan contraseñas y se
            implementan medidas técnicas y organizativas para prevenir accesos no autorizados.
          </p>
        </section>

        <section className="policy-section mb-4">
          <div className="section-header">
            <FaGlobe className="section-icon" />
            <h2 className="section-title">8. Transferencias Internacionales</h2>
          </div>
          <p className="section-text">
            En algunos casos, la información podrá ser transmitida a servidores ubicados fuera de Colombia. Estas transferencias
            se efectúan bajo estrictas garantías contractuales que aseguran un nivel adecuado de protección.
          </p>
        </section>

        <section className="policy-section mb-4">
          <div className="section-header">
            <FaInfoCircle className="section-icon" />
            <h2 className="section-title">9. Cambios en la Política de Privacidad</h2>
          </div>
          <p className="section-text">
            Cualquier modificación sustancial a esta política será notificada oportunamente. La versión vigente estará siempre
            disponible en nuestro sitio web.
          </p>
        </section>

        <section className="policy-section mb-4">
          <div className="section-header">
            <FaInfoCircle className="section-icon" />
            <h2 className="section-title">10. Procedimiento para Ejercer Derechos</h2>
          </div>
          <p className="section-text">
            Para realizar consultas, reclamos o ejercer cualquiera de sus derechos (acceso, actualización, rectificación,
            supresión o revocatoria de la autorización), puede enviar su solicitud al correo electrónico 
            <strong> stevenvallejo780@gmail.com</strong> o comunicarse al teléfono <strong>3046374368</strong>. 
            Deberá indicar su nombre completo, número de identificación, descripción clara de la petición y adjuntar 
            los documentos que desee hacer valer. 
          </p>
          <p className="section-text">
            Recibida su petición, Prizma dará respuesta en un plazo máximo de quince (15) días hábiles. En caso de
            que no sea posible dar respuesta en dicho término, se le informará al titular antes del vencimiento del plazo, 
            expresando los motivos de la demora y señalando la fecha en que se atenderá su solicitud.
          </p>
        </section>

        <section className="policy-section mb-4">
          <div className="section-header">
            <FaInfoCircle className="section-icon" />
            <h2 className="section-title">11. Conservación de los Datos y Procedimiento de Quejas</h2>
          </div>
          <p className="section-text">
            Prizma conservará los datos personales únicamente por el tiempo que sea necesario para cumplir con las
            finalidades establecidas en esta política o mientras exista una relación contractual o una obligación legal 
            de conservarlos. Una vez cumplidas las finalidades o finalizada la relación, se procederá a la supresión de 
            la información de acuerdo con la normatividad vigente.
          </p>
          <p className="section-text">
            En caso de que el titular considere que no ha obtenido respuesta a su reclamo o que su solicitud no ha sido 
            atendida debidamente, puede presentar una queja ante la Superintendencia de Industria y Comercio (SIC) a través 
            de los canales oficiales de dicha entidad.
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
