# 🚀 Graf - Sistema de E-commerce

Sistema completo de e-commerce con administración de productos, categorías, órdenes y múltiples tiendas.

## 📋 Tabla de Contenidos

- [Arquitectura](#arquitectura)
- [Requisitos](#requisitos)
- [Instalación](#instalación)
- [Configuración](#configuración)
- [Desarrollo](#desarrollo)
- [Despliegue](#despliegue)
- [Testing](#testing)
- [API Documentation](#api-documentation)
- [Troubleshooting](#troubleshooting)

## 🏗️ Arquitectura

El sistema está compuesto por:

- **graf-client**: Frontend Next.js 15 con TypeScript y Redux
- **graf-backend**: Backend NestJS con TypeScript y PostgreSQL
- **graf-admin**: Panel de administración (Next.js)
- **PostgreSQL**: Base de datos principal
- **Firebase**: Autenticación y almacenamiento de archivos

### Tecnologías Principales

#### Frontend (graf-client)
- Next.js 15.4.5
- TypeScript
- Redux Toolkit
- Bootstrap 5.3.3
- React Bootstrap
- Axios

#### Backend (graf-backend)
- NestJS
- TypeScript
- PostgreSQL
- TypeORM
- Firebase Admin SDK
- Swagger/OpenAPI

## 📋 Requisitos

### Requisitos del Sistema
- Node.js 20+ 
- NPM 10+
- PostgreSQL 15+
- Docker & Docker Compose (opcional, recomendado)

### Cuentas de Servicios
- Firebase Project (para autenticación y storage)
- PostgreSQL Database

## ⚡ Instalación Rápida

### 1. Clonar el Repositorio
```bash
git clone [repository-url]
cd Graf
```

### 2. Instalación Automática
```bash
# Script de verificación completa
./scripts/check-deployment-readiness.sh

# O instalación manual:
cd graf-client && npm install
cd ../graf-backend && npm install
```

### 3. Configuración de Variables de Entorno
```bash
cp .env.example .env
# Editar .env con tus configuraciones
```

### 4. Desarrollo Local
```bash
# Usando Docker (recomendado)
./scripts/deploy.sh dev

# O manual:
# Terminal 1: Backend
cd graf-backend && npm run start:dev

# Terminal 2: Frontend  
cd graf-client && npm run start:dev
```

## ⚙️ Configuración

### Variables de Entorno (.env)

```env
# Environment
NODE_ENV=development
PORT=3000

# Database
DB_HOST=postgres
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=postgres
DB_NAME=totalpedidosv2
DB_SYNCHRONIZE=false

# Security
ENCRYPTION_KEY=your-32-character-encryption-key

# Firebase
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=your-service-account-email
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nyour-private-key\n-----END PRIVATE KEY-----"
FIREBASE_DATABASE_URL=https://your-project.firebaseio.com/
```

### Configuración de Firebase

1. Crear proyecto en Firebase Console
2. Generar Service Account Key
3. Habilitar Authentication y Storage
4. Configurar las variables en `.env`

## 🛠️ Desarrollo

### Comandos Principales

#### Frontend (graf-client)
```bash
npm run start:dev    # Desarrollo con hot-reload
npm run build        # Build para producción
npm run start        # Servidor de producción
npm run lint         # Linting
```

#### Backend (graf-backend)
```bash
npm run start:dev    # Desarrollo con hot-reload
npm run build        # Build para producción
npm run start:prod   # Servidor de producción
npm run lint         # Linting
npm run test         # Tests unitarios
npm run test:e2e     # Tests E2E
```

### Estructura del Proyecto

```
Graf/
├── graf-client/          # Frontend Next.js
│   ├── src/
│   │   ├── app/         # App Router pages
│   │   ├── components/  # Componentes reutilizables
│   │   ├── redux/       # Estado global
│   │   ├── types/       # Tipos TypeScript
│   │   └── utils/       # Utilidades
│   ├── public/          # Archivos estáticos
│   └── package.json
├── graf-backend/         # Backend NestJS
│   ├── src/
│   │   ├── auth/        # Autenticación
│   │   ├── category/    # Gestión de categorías
│   │   ├── product/     # Gestión de productos
│   │   ├── order/       # Gestión de órdenes
│   │   └── common/      # Módulos compartidos
│   └── package.json
├── scripts/             # Scripts de automatización
├── docker-compose.yml   # Orquestación Docker
└── .env                # Variables de entorno
```

## 🚀 Despliegue

### Script de Despliegue Automatizado

```bash
# Desarrollo local
./scripts/deploy.sh dev

# Solo build
./scripts/deploy.sh build-only

# Con limpieza
./scripts/deploy.sh dev --clean

# Ver ayuda
./scripts/deploy.sh --help
```

### Despliegue Manual

#### 1. Build
```bash
cd graf-client && npm run build
cd ../graf-backend && npm run build
```

#### 2. Docker Compose
```bash
docker-compose up --build -d
```

#### 3. Verificación
- Frontend: http://localhost:3000
- Backend: http://localhost:3001
- Database: localhost:5433

### Despliegue en Producción

1. **Preparación**
   ```bash
   ./scripts/check-deployment-readiness.sh
   ```

2. **Variables de Entorno**
   - Configurar variables para producción
   - Verificar conexiones a servicios externos

3. **Base de Datos**
   - Ejecutar migraciones
   - Verificar backup

4. **Despliegue**
   ```bash
   ./scripts/deploy.sh prod
   ```

## 🧪 Testing

### Frontend
```bash
cd graf-client
npm run lint          # Linting
# Tests no configurados actualmente
```

### Backend
```bash
cd graf-backend
npm run lint          # Linting
npm run test          # Tests unitarios
npm run test:e2e      # Tests E2E
npm run test:cov      # Coverage
```

### Verificación Completa
```bash
./scripts/check-deployment-readiness.sh
```

## 📚 API Documentation

El backend incluye documentación automática con Swagger:

- **Desarrollo**: http://localhost:3001/api
- **Endpoints principales**:
  - `/auth` - Autenticación
  - `/products` - Gestión de productos
  - `/categories` - Gestión de categorías
  - `/orders` - Gestión de órdenes
  - `/stores` - Gestión de tiendas

## 🔧 Troubleshooting

### Problemas Comunes

#### 1. Error de Build
```bash
# Limpiar y reinstalar
rm -rf node_modules package-lock.json
npm install
npm run build
```

#### 2. Error de Base de Datos
```bash
# Verificar conexión
docker-compose logs postgres

# Reiniciar servicios
docker-compose restart postgres
```

#### 3. Error de Variables de Entorno
- Verificar formato de `.env`
- Verificar variables de Firebase
- Verificar permisos de service account

#### 4. Problemas de Docker
```bash
# Limpiar Docker
docker-compose down --volumes
docker system prune -f
docker-compose up --build
```

### Logs

#### Ver logs de servicios
```bash
# Todos los servicios
docker-compose logs -f

# Servicio específico
docker-compose logs -f graf-backend
docker-compose logs -f graf-client
```

#### Logs de aplicación
- Frontend: Consola del navegador
- Backend: Terminal o logs de Docker

## 📊 Estado del Proyecto

### ✅ Completado
- Configuración completa de TypeScript
- Linting sin errores
- Build exitoso en frontend y backend
- Limpieza de código (sin console.log)
- Scripts de automatización
- Documentación completa

### 🔄 En Progreso
- Tests unitarios (configuración pendiente)
- Documentación de API detallada

### 📋 Por Hacer
- Tests E2E completos
- Pipeline CI/CD
- Monitoreo y logging avanzado

## 🤝 Contribución

1. Fork el repositorio
2. Crear rama feature (`git checkout -b feature/nueva-funcionalidad`)
3. Commit changes (`git commit -m 'Agregar nueva funcionalidad'`)
4. Push a la rama (`git push origin feature/nueva-funcionalidad`)
5. Crear Pull Request

## 📄 Licencia

[Agregar información de licencia]

## 👥 Autores

- Steven Vallejo Ortiz - stevenvallejo780@gmail.com

---

## 🆘 Soporte

Para soporte, crear un issue en el repositorio o contactar al equipo de desarrollo.

### Enlaces Útiles

- [Documentación de Next.js](https://nextjs.org/docs)
- [Documentación de NestJS](https://docs.nestjs.com/)
- [Documentación de Firebase](https://firebase.google.com/docs)
- [Documentación de PostgreSQL](https://www.postgresql.org/docs/)

---

**Última actualización**: $(date +%Y-%m-%d)
**Versión**: 1.0.0
