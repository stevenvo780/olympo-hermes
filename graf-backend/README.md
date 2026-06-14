# 🛒 Graf Backend API
## E-commerce Platform - Core Backend Service

<div align="center">

![Graf Backend](https://img.shields.io/badge/Graf-Backend-green?style=for-the-badge&logo=nestjs)
![NestJS](https://img.shields.io/badge/NestJS-E0234E?style=for-the-badge&logo=nestjs&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white)
![Firebase](https://img.shields.io/badge/Firebase-FFCA28?style=for-the-badge&logo=firebase&logoColor=black)

**API robusta y escalable para e-commerce completo**  
*Parte del Ecosistema Humanizar*

</div>

## 🌟 Descripción General

Graf Backend es el núcleo del sistema de e-commerce del **Ecosistema Humanizar**. Esta API moderna y robusta, construida con NestJS y TypeScript, proporciona una plataforma completa para la gestión de tiendas en línea, productos, pedidos, pagos y usuarios. Es el motor que impulsa tanto el panel administrativo como la tienda de clientes finales.

### 🎯 Propósito en el Ecosistema
- **Centro de e-commerce**: API principal para todas las operaciones comerciales
- **Integración con EMW**: Notificaciones de pedidos vía WhatsApp
- **Soporte a MeraVuelta**: Gestión de entregas y domicilios
- **Conexión FIAR**: Sistema de créditos integrado
- **Facturación**: Integración con ApiSigo para SUNAT

## ✨ Características Principales

### 🏪 Gestión Completa de Tienda
- **Multi-tienda**: Soporte para múltiples tiendas por cuenta
- **Catálogo avanzado**: Productos, categorías, variaciones
- **Inventario inteligente**: Control de stock en tiempo real
- **Configuración flexible**: Personalización completa de la tienda
- **SEO optimizado**: URLs amigables y metadatos

### 🛒 Sistema de Pedidos Avanzado
- **Carrito persistente**: Mantiene items entre sesiones
- **Checkout flexible**: Múltiples opciones de pago y entrega
- **Estados de pedidos**: Flujo completo desde creación hasta entrega
- **Facturación automática**: Integración con SUNAT
- **Notificaciones**: Updates automáticos por WhatsApp

### 💰 Pagos y Facturación
- **Wompi Integration**: Pasarela de pagos principal
- **Pagos personalizados**: Transferencias y otros métodos
- **Facturación electrónica**: SUNAT compliance
- **Cupones y descuentos**: Sistema de promociones
- **Suscripciones**: Pagos recurrentes

### 📊 Analytics y Reportes
- **Dashboard ejecutivo**: Métricas clave del negocio
- **Reportes de ventas**: Análisis detallado de performance
- **Estadísticas de productos**: Best sellers y tendencias
- **Customer insights**: Comportamiento de usuarios
- **Financial reports**: Estados financieros

## 🛠️ Stack Tecnológico Avanzado

| Tecnología | Versión | Propósito |
|------------|---------|-----------|
| **NestJS** | ^10.0.0 | Framework backend principal |
| **TypeScript** | ^5.1.3 | Lenguaje de desarrollo |
| **PostgreSQL** | ^8.11.1 | Base de datos principal |
| **TypeORM** | ^0.3.17 | ORM para base de datos |
| **Firebase Admin** | ^12.3.1 | Autenticación y servicios |
| **Swagger** | ^7.4.2 | Documentación automática de API |
| **Jest** | ^29.5.0 | Framework de testing |
| **Class Validator** | ^0.14.0 | Validación de datos |
| **Axios** | ^1.7.5 | Cliente HTTP para integraciones |
| **XLSX** | ^0.18.5 | Procesamiento de archivos Excel |

## 🏗️ Arquitectura del Sistema

### Módulos Principales
```
📦 Graf Backend
├── 🏪 Store Module           # Gestión de tiendas
├── 📦 Product Module         # Productos y catálogo  
├── 📊 Category Module        # Categorías de productos
├── 🛒 Order Module           # Gestión de pedidos
├── 👤 User Module            # Usuarios y autenticación
├── 👥 Customer Module        # Clientes y perfiles
├── 💳 Payment Module         # Pagos y transacciones
├── 🎫 Discount Module        # Cupones y descuentos
├── 🚚 Delivery Module        # Zonas de entrega
├── 📊 Statistics Module      # Analytics y reportes
├── ⚙️ Config Module          # Configuración del sistema
├── 🔐 Auth Module            # Autenticación y autorización
└── 🔗 Firebase Module        # Integración Firebase
```

### Estructura Detallada del Proyecto
```
📁 graf-backend/
├── 📁 src/                           # Código fuente principal
│   ├── 📄 main.ts                    # Punto de entrada de la aplicación
│   ├── 📄 app.module.ts              # Módulo principal
│   ├── 📄 app.controller.ts          # Controlador principal
│   ├── 📄 app.service.ts             # Servicio principal
│   ├── 📁 auth/                      # Módulo de autenticación
│   │   ├── 📄 auth.controller.ts     # Controlador de auth
│   │   ├── 📄 auth.service.ts        # Servicio de auth
│   │   ├── 📄 auth.module.ts         # Módulo de auth
│   │   ├── 📄 firebase-auth.guard.ts # Guard de Firebase
│   │   ├── 📄 api-key-auth.guard.ts  # Guard de API Key
│   │   └── 📄 roles.guard.ts         # Guard de roles
│   ├── 📁 store/                     # Gestión de tiendas
│   │   ├── 📄 store.controller.ts    # Controlador de tiendas
│   │   ├── 📄 store.service.ts       # Servicio de tiendas
│   │   └── 📄 entities/store.entity.ts # Entidad tienda
│   ├── 📁 product/                   # Gestión de productos
│   │   ├── 📄 product.controller.ts  # Controlador de productos
│   │   ├── 📄 product.service.ts     # Servicio de productos
│   │   └── 📄 entities/product.entity.ts # Entidad producto
│   ├── 📁 category/                  # Gestión de categorías
│   ├── 📁 order/                     # Gestión de pedidos
│   ├── 📁 customer/                  # Gestión de clientes
│   ├── 📁 user/                      # Gestión de usuarios
│   ├── 📁 wompi/                     # Integración Wompi
│   ├── 📁 statistics/                # Analytics y estadísticas
│   ├── 📁 discount/                  # Cupones y descuentos
│   ├── 📁 delivery-zone/             # Zonas de entrega
│   ├── 📁 custom-payments/           # Pagos personalizados
│   ├── 📁 tax/                       # Gestión de impuestos
│   ├── 📁 profile/                   # Perfiles de usuario
│   ├── 📁 credentials/               # Credenciales de API
│   ├── 📁 config/                    # Configuración
│   ├── 📁 firebase/                  # Integración Firebase
│   ├── 📁 plugins/                   # Plugins del sistema
│   ├── 📁 gift-coupon/               # Cupones de regalo
│   ├── 📁 utils/                     # Utilidades
│   │   ├── 📄 firebase-admin.config.ts # Config Firebase
│   │   ├── 📄 typeorm.config.ts      # Config TypeORM
│   │   ├── 📄 encrypt.ts             # Utilidades de encriptación
│   │   └── 📄 permissions.ts         # Sistema de permisos
│   ├── 📁 migrations/                # Migraciones de BD
│   └── 📁 test/                      # Tests unitarios e integración
├── 📁 coverage/                      # Reportes de cobertura
├── 📁 dist/                          # Build de producción
├── 📄 package.json                   # Dependencias del proyecto
├── 📄 tsconfig.json                  # Configuración TypeScript
├── 📄 nest-cli.json                  # Configuración NestJS
├── 📄 jest.config.js                 # Configuración Jest
├── 📄 webpack.config.js              # Configuración Webpack
├── 📄 docker-compose.test.yml        # Docker para testing
└── 📄 Dockerfile                     # Imagen Docker
```

## 📡 Documentación de la API

### Swagger/OpenAPI
La documentación completa e interactiva de la API está disponible en:
- **Desarrollo**: [http://localhost:3000/api](http://localhost:3000/api)
- **Producción**: [https://api.graf.humanizar.com/api](https://api.graf.humanizar.com/api)

## 🚀 Instalación y Configuración

### Prerrequisitos
- **Node.js** >= 16.x
- **npm** >= 8.x o **yarn** >= 1.x
- **PostgreSQL** >= 13.x
- **Docker** (opcional)

### 1️⃣ Instalación
```bash
# Clonar repositorio (si es necesario)
cd Graf/graf-backend

# Instalar dependencias
npm install
# o usando yarn
yarn install
```

### 2️⃣ Configuración de Base de Datos
```bash
# Crear base de datos PostgreSQL
createdb graf_db

# O usando psql
psql -U postgres
CREATE DATABASE graf_db;
CREATE USER graf_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE graf_db TO graf_user;
```

### 3️⃣ Variables de Entorno
```bash
# Crear archivo de configuración
cp .env.example .env

# Editar variables según tu configuración
nano .env
```

#### Variables de Entorno Principales
```bash
# Base de Datos
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=graf_user
DB_PASSWORD=your_secure_password
DB_NAME=graf_db
DB_SYNCHRONIZE=false  # true solo en desarrollo

# Firebase Configuration
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_CLIENT_EMAIL=your_client_email
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nyour_private_key\n-----END PRIVATE KEY-----\n"

# Wompi Integration
WOMPI_BASE_URL=https://production.wompi.co
WOMPI_PRIVATE_KEY=prv_prod_your_private_key
WOMPI_PUBLIC_KEY=pub_prod_your_public_key
WOMPI_EVENTS_SECRET=your_events_secret

# Frontend URLs
FRONT_URL=http://localhost:3000
ADMIN_URL=http://localhost:3001
CLIENT_URL=http://localhost:3002

# API Configuration
PORT=3000
NODE_ENV=development
API_VERSION=v1

# Security
JWT_SECRET=your_super_secret_jwt_key
API_KEY_SECRET=your_api_key_secret
ENCRYPTION_KEY=your_32_character_encryption_key

# Integrations
EMW_API_URL=http://localhost:3001
MERAVUELTA_API_URL=http://localhost:3002
APISIGO_URL=http://localhost:3003
ECOSYSTEM_API_KEY=your_ecosystem_key
```

## 🏃‍♂️ Ejecución

### Desarrollo
```bash
# Ejecutar migraciones
npm run migration:run

# Iniciar en modo desarrollo
npm run start:dev

# La API estará disponible en:
# http://localhost:3000
# Swagger UI: http://localhost:3000/api
```

### Producción
```bash
# Construir aplicación
npm run build:prod

# Ejecutar migraciones en producción
npm run migration:run

# Iniciar servidor de producción
npm run start:prod
```

### Con Docker
```bash
# Construir imagen
npm run docker:build

# Ejecutar con docker-compose
docker-compose up -d

# Ver logs
docker-compose logs -f graf-backend
```

## 🧪 Testing Avanzado

### Ejecutar Tests
```bash
# Tests unitarios
npm run test

# Tests con watch mode
npm run test:watch

# Tests de integración
npm run test:integration

# Tests E2E
npm run test:e2e

# Cobertura completa
npm run test:cov

# Cobertura con reporte HTML
npm run test:cov:html
```

### Tests con Docker
```bash
# Ejecutar tests en contenedor
npm run docker:test

# Tests con docker-compose
npm run docker:test:compose

# Tests en modo watch
npm run docker:test:compose:watch
```

### Métricas de Calidad
- **Cobertura objetivo**: 90%+
- **Tests unitarios**: Todos los servicios
- **Tests de integración**: Endpoints críticos
- **Tests E2E**: Flujos completos

## 📡 API Endpoints Principales

### 🔐 Autenticación
```http
POST /auth/login              # Login con Firebase
POST /auth/refresh            # Renovar token
GET  /auth/profile            # Obtener perfil
```

### 🏪 Gestión de Tiendas
```http
GET    /stores                # Listar tiendas
POST   /stores                # Crear tienda
GET    /stores/:id            # Obtener tienda
PUT    /stores/:id            # Actualizar tienda
DELETE /stores/:id            # Eliminar tienda
```

### 📦 Productos
```http
GET    /products              # Listar productos
POST   /products              # Crear producto
GET    /products/:id          # Obtener producto
PUT    /products/:id          # Actualizar producto
DELETE /products/:id          # Eliminar producto
POST   /products/import       # Importar productos Excel
GET    /products/export       # Exportar productos
```

### 📊 Categorías
```http
GET    /categories            # Listar categorías
POST   /categories            # Crear categoría
GET    /categories/:id        # Obtener categoría
PUT    /categories/:id        # Actualizar categoría
DELETE /categories/:id        # Eliminar categoría
```

### 🛒 Pedidos
```http
GET    /orders                # Listar pedidos
POST   /orders                # Crear pedido
GET    /orders/:id            # Obtener pedido
PUT    /orders/:id            # Actualizar pedido
PATCH  /orders/:id/status     # Cambiar estado
GET    /orders/:id/invoice    # Generar factura
```

### 👥 Clientes
```http
GET    /customers             # Listar clientes
POST   /customers             # Crear cliente
GET    /customers/:id         # Obtener cliente
PUT    /customers/:id         # Actualizar cliente
DELETE /customers/:id         # Eliminar cliente
```

### 💳 Pagos Wompi
```http
POST /wompi/create-payment    # Crear pago
POST /wompi/webhook           # Webhook de notificaciones
GET  /wompi/transaction/:id   # Estado de transacción
```

### 🎫 Descuentos
```http
GET    /discounts             # Listar descuentos
POST   /discounts             # Crear descuento
GET    /discounts/:code       # Validar cupón
DELETE /discounts/:id         # Eliminar descuento
```

### 📊 Estadísticas
```http
GET /statistics/dashboard     # Dashboard principal
GET /statistics/sales         # Estadísticas de ventas
GET /statistics/products      # Estadísticas de productos
GET /statistics/customers     # Estadísticas de clientes
```

### ⚙️ Configuración
```http
GET  /config                  # Obtener configuración
PUT  /config                  # Actualizar configuración
GET  /config/store/:id        # Config específica de tienda
```

## 🔧 Configuración Avanzada

### Migraciones de Base de Datos
```bash
# Generar nueva migración
npm run migration:generate -- -n NombreMigracion

# Crear migración vacía
npm run migration:create -- -n NombreMigracion

# Ejecutar migraciones
npm run migration:run

# Revertir última migración
npm run migration:revert

# Ver estado de migraciones
npm run migration:show
```

### Sistema de Permisos
```typescript

enum UserRole {
  SUPER_ADMIN = 'super_admin',
  ADMIN = 'admin',
  MANAGER = 'manager',
  OPERATOR = 'operator',
  CUSTOMER = 'customer'
}


@Roles(UserRole.ADMIN, UserRole.MANAGER)
@UseGuards(FirebaseAuthGuard, RolesGuard)
```

### Integración Firebase
```typescript

const firebaseConfig = {
  projectId: process.env.FIREBASE_PROJECT_ID,
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
};
```

## 🔗 Integraciones del Ecosistema

### EMW (Marketing WhatsApp)
```bash
# Notificaciones automáticas de pedidos
EMW_WEBHOOK_URL=http://localhost:3001/webhook/order-created
EMW_API_KEY=your_emw_api_key

# Templates de mensajes
ORDER_CREATED_TEMPLATE=order_confirmation
ORDER_SHIPPED_TEMPLATE=shipping_notification
```

### MeraVuelta (Entregas)
```bash
# Integración para gestión de entregas
MERAVUELTA_API_URL=http://localhost:3002/api
MERAVUELTA_API_KEY=your_meravuelta_key

# Webhook para updates de estado
MERAVUELTA_WEBHOOK_SECRET=your_webhook_secret
```

### FIAR (Sistema de Créditos)
```bash
# Integración para pagos a crédito
FIAR_API_URL=http://localhost:3004/api
FIAR_API_KEY=your_fiar_key

# Configuración de crédito
DEFAULT_CREDIT_LIMIT=500000
CREDIT_APPROVAL_WEBHOOK=http://localhost:3004/webhook/approval
```

### ApiSigo (Facturación SUNAT)
```bash
# Facturación electrónica
SIGO_API_URL=http://localhost:3003/api
SIGO_API_KEY=your_sigo_key
SIGO_COMPANY_RUC=20123456789

# Configuración automática
AUTO_INVOICE_ON_PAYMENT=true
INVOICE_SERIES=F001
```

## 🚀 Despliegue

### Google Cloud Platform
```bash
# Build para GCP
npm run gcp:build

# Push a Container Registry
npm run gcp:push

# Deploy a Cloud Run
npm run gcp:deploy
```

### Docker Production
```bash
# Build de producción
docker build -f Dockerfile -t graf-backend:prod .

# Ejecutar en producción
docker run -d \
  --name graf-backend \
  -p 3000:3000 \
  --env-file .env.production \
  graf-backend:prod
```

### Variables por Ambiente
```bash
# Desarrollo
cp .env.development .env

# Staging
cp .env.staging .env

# Producción
cp .env.production .env
```

## 📈 Monitoreo y Performance

### Health Checks
```http
GET /health                   # Health check general
GET /health/database          # Estado de la base de datos
GET /health/firebase          # Estado de Firebase
GET /health/wompi             # Estado de Wompi
```

### Métricas Disponibles
- **Response time**: Tiempo de respuesta promedio
- **Throughput**: Requests por segundo
- **Error rate**: Porcentaje de errores
- **Database performance**: Queries más lentas
- **Memory usage**: Uso de memoria
- **CPU usage**: Uso de CPU

### Logging
```bash
# Logs en desarrollo
npm run logs

# Logs estructurados en producción
docker-compose logs -f graf-backend

# Análisis de logs
tail -f logs/application.log | grep ERROR
```

## 🤝 Contribución

### Proceso de Desarrollo
1. **Fork** y clone del repositorio
2. **Branch** específico: `feature/nueva-funcionalidad`
3. **Desarrollo** siguiendo estándares del proyecto
4. **Tests** para nuevas funcionalidades (mínimo 90% cobertura)
5. **Pull request** con descripción detallada

### Estándares de Código
- **TypeScript strict mode**
- **ESLint** para linting
- **Prettier** para formateo
- **Conventional commits**
- **NestJS best practices**

### Code Review Checklist
- [ ] Funcionalidad implementada correctamente
- [ ] Tests agregados con cobertura adecuada
- [ ] Documentación actualizada
- [ ] Performance considerado
- [ ] Security verificada
- [ ] Database migrations incluidas si necesario

## 📞 Soporte y Documentación

### Enlaces Útiles
- [Graf Admin Documentation](../graf-admin/README.md)
- [Graf Client Documentation](../graf-client/README.md)
- [Ecosistema Humanizar](../../README.md)
- [NestJS Documentation](https://docs.nestjs.com)
- [TypeORM Documentation](https://typeorm.io)

### Contacto
- **Maintainer**: Steven Vallejo Ortiz
- **Email**: stevenvallejo780@gmail.com
- **Issues**: GitHub Issues del repositorio

### Troubleshooting Común

#### Error de conexión a base de datos
```bash
# Verificar PostgreSQL
pg_isready -h localhost -p 5432

# Verificar credenciales
psql -h localhost -U graf_user -d graf_db
```

#### Problemas con migraciones
```bash
# Limpiar y regenerar
npm run migration:revert
npm run migration:run

# Verificar estado
npm run migration:show
```

#### Issues con Firebase
```bash
# Verificar configuración
node -e "console.log(process.env.FIREBASE_PROJECT_ID)"

# Test de conectividad
curl -X POST https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=YOUR_API_KEY
```

---

<div align="center">

**Graf Backend API v0.0.1**  
*E-commerce Platform - Ecosistema Humanizar*

![Humanizar](https://img.shields.io/badge/Humanizar-Ecosystem-orange?style=for-the-badge)

</div>