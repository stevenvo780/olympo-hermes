# 🎛️ Graf Admin
## E-commerce Administration Dashboard

<div align="center">

![Graf Admin](https://img.shields.io/badge/Graf-Admin-blue?style=for-the-badge&logo=react)
![Next.js](https://img.shields.io/badge/Next.js-000000?style=for-the-badge&logo=nextdotjs&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![Redux](https://img.shields.io/badge/Redux-593D88?style=for-the-badge&logo=redux&logoColor=white)
![Firebase](https://img.shields.io/badge/Firebase-FFCA28?style=for-the-badge&logo=firebase&logoColor=black)

**Panel de administración completo para gestión de e-commerce**  
*Parte del Ecosistema Humanizar*

</div>

## 🌟 Descripción General

Graf Admin es el panel de administración principal para el sistema de e-commerce del **Ecosistema Humanizar**. Esta aplicación web moderna, construida con Next.js 14+ y TypeScript, proporciona una interfaz completa y poderosa para gestionar tiendas, productos, pedidos, clientes y todas las operaciones comerciales del ecosistema.

### 🎯 Propósito en el Ecosistema
- **Centro de control**: Administración completa del e-commerce
- **Multi-tienda**: Gestión de múltiples tiendas desde un solo panel
- **Analytics avanzado**: Reportes y métricas en tiempo real
- **Integración total**: Conecta con todos los servicios del ecosistema

## ✨ Características Principales

### 🏪 Gestión Completa de Tiendas
- **Dashboard ejecutivo**: Métricas clave y KPIs
- **Configuración avanzada**: Personalización completa de tiendas
- **Multi-tienda**: Gestión de múltiples tiendas por usuario
- **Branding personalizado**: Logos, colores, y temas
- **SEO management**: Meta tags y configuración SEO

### 📦 Administración de Productos
- **Catálogo avanzado**: Gestión completa de productos
- **Categorías jerárquicas**: Organización por categorías y subcategorías
- **Variaciones de productos**: Tallas, colores, modelos
- **Gestión de inventario**: Control de stock en tiempo real
- **Importación masiva**: CSV, Excel con validación
- **Optimización de imágenes**: Carga y optimización automática

### 🛒 Gestión de Pedidos
- **Centro de pedidos**: Vista centralizada de todos los pedidos
- **Estados personalizables**: Workflow de estados flexible
- **Facturación automática**: Integración con SUNAT
- **Gestión de envíos**: Integración con MeraVuelta
- **Notificaciones**: WhatsApp automático vía EMW
- **Reportes detallados**: Analytics de ventas

### 👥 Administración de Clientes
- **Base de datos de clientes**: Perfiles completos
- **Segmentación avanzada**: Grupos personalizados
- **Historial de compras**: Tracking completo
- **Comunicación directa**: Integración WhatsApp
- **Programas de fidelidad**: Puntos y recompensas

### 💰 Gestión Financiera
- **Dashboard financiero**: Reportes en tiempo real
- **Análisis de ventas**: Trends y proyecciones
- **Gestión de pagos**: Wompi y métodos personalizados
- **Cupones y descuentos**: Sistema de promociones
- **Reportes fiscales**: Integración SUNAT

### ⚙️ Configuración y Administración
- **Gestión de usuarios**: Roles y permisos
- **Configuración de la tienda**: Personalización completa
- **Integraciones**: APIs y webhooks
- **Backup y restauración**: Gestión de datos
- **Logs y auditoria**: Trazabilidad completa

## 🛠️ Stack Tecnológico

| Tecnología | Versión | Propósito |
|------------|---------|-----------|
| **Next.js** | 14.x | Framework React con App Router |
| **TypeScript** | Latest | Tipado estático |
| **React** | 18.x | Biblioteca de UI |
| **Redux Toolkit** | Latest | Gestión de estado global |
| **Bootstrap** | Latest | Framework CSS |
| **Firebase Auth** | Latest | Autenticación |
| **Chart.js** | Latest | Gráficos y visualizaciones |
| **Axios** | Latest | Cliente HTTP |
| **React Hook Form** | Latest | Gestión de formularios |
| **SCSS** | Latest | Preprocesador CSS |

## 🏗️ Arquitectura de la Aplicación

### Estructura de Directorios
```
📁 graf-admin/
├── 📁 src/
│   ├── 📁 app/                           # App Router (Next.js 14+)
│   │   ├── 📄 layout.tsx                 # Layout principal
│   │   ├── 📄 page.tsx                   # Página de inicio
│   │   ├── 📁 [storeId]/                 # Rutas dinámicas por tienda
│   │   │   ├── 📄 layout.tsx             # Layout de tienda
│   │   │   ├── 📄 page.tsx               # Dashboard de tienda
│   │   │   ├── 📁 products/              # Gestión de productos
│   │   │   │   ├── 📄 page.tsx           # Lista de productos
│   │   │   │   ├── 📄 ProductsClient.tsx # Componente cliente
│   │   │   │   ├── 📄 ProductForm.tsx    # Formulario de producto
│   │   │   │   ├── 📄 VariationModal.tsx # Modal de variaciones
│   │   │   │   ├── 📄 ExcelHandler.tsx   # Importación Excel
│   │   │   │   └── 📁 hooks/
│   │   │   │       └── 📄 useExcelHandler.ts
│   │   │   ├── 📁 categories/            # Gestión de categorías
│   │   │   │   ├── 📄 page.tsx           # Lista de categorías
│   │   │   │   ├── 📄 CategoriesClient.tsx
│   │   │   │   └── 📄 CategoryExcelHandler.tsx
│   │   │   ├── 📁 orders/                # Gestión de pedidos
│   │   │   │   ├── 📄 page.tsx
│   │   │   │   ├── 📄 OrdersClient.tsx
│   │   │   │   ├── 📄 OrderDetail.tsx
│   │   │   │   ├── 📄 OrderFilters.tsx
│   │   │   │   ├── 📄 StatusBadge.tsx
│   │   │   │   └── 📄 CreateOrderModal.tsx
│   │   │   ├── 📁 customers/             # Gestión de clientes
│   │   │   │   ├── 📄 page.tsx
│   │   │   │   └── 📁 hooks/
│   │   │   │       └── 📄 useCustomers.ts
│   │   │   ├── 📁 dashboard/             # Dashboard de tienda
│   │   │   ├── 📁 discounts/             # Gestión de descuentos
│   │   │   │   ├── 📄 page.tsx
│   │   │   │   └── 📄 DiscountsClient.tsx
│   │   │   ├── 📁 delivery/              # Zonas de entrega
│   │   │   │   └── 📄 DeliveryClient.tsx
│   │   │   ├── 📁 taxes/                 # Gestión de impuestos
│   │   │   │   └── 📄 TaxesClient.tsx
│   │   │   ├── 📁 config/                # Configuración de tienda
│   │   │   │   ├── 📄 page.tsx
│   │   │   │   └── 📁 components/
│   │   │   │       ├── 📄 AboutSection.tsx
│   │   │   │       ├── 📄 ContactSection.tsx
│   │   │   │       ├── 📄 SeoSection.tsx
│   │   │   │       ├── 📄 PaymentLinkSection.tsx
│   │   │   │       ├── 📄 CredentialsSection.tsx
│   │   │   │       └── 📄 ColorPaletteSection.tsx
│   │   │   └── 📁 team/                  # Gestión de equipo
│   │   │       ├── 📄 page.tsx
│   │   │       └── 📄 TeamManagementClient.tsx
│   │   ├── 📁 home/                      # Página principal
│   │   │   ├── 📄 AdminHome.tsx
│   │   │   ├── 📄 PlanModal.tsx          # Modal de planes
│   │   │   ├── 📄 StoreModal.tsx         # Modal de tienda
│   │   │   └── 📄 PaymentForm.tsx        # Formulario de pago
│   │   ├── 📁 login/                     # Autenticación
│   │   │   ├── 📄 page.tsx
│   │   │   └── 📄 LoginClient.tsx
│   │   ├── 📁 register/                  # Registro
│   │   │   ├── 📄 page.tsx
│   │   │   └── 📄 RegisterClient/
│   │   ├── 📁 profile/                   # Perfil de usuario
│   │   ├── 📁 about/                     # Información
│   │   └── 📁 privacyPolicies/           # Políticas
│   │       └── 📄 PrivacyNoticeClient.tsx
│   ├── 📁 components/                    # Componentes reutilizables
│   │   ├── 📄 FormattedNumberInput.tsx   # Input de números
│   │   ├── 📄 ImageUploader.tsx          # Subida de imágenes
│   │   ├── 📄 InfoAlert.tsx              # Componente de alertas
│   │   ├── 📁 Header/                    # Header de navegación
│   │   ├── 📁 Dashboard/                 # Componentes de dashboard
│   │   │   ├── 📄 CustomerForm.tsx
│   │   │   ├── 📄 CustomersList.tsx
│   │   │   ├── 📄 ExportModal.tsx
│   │   │   └── 📁 components/
│   │   │       ├── 📄 SalesMetrics.tsx
│   │   │       ├── 📄 ProductMetrics.tsx
│   │   │       └── 📄 CustomerMetrics.tsx
│   │   └── 📁 ClientLayout/              # Layout de cliente
│   ├── 📁 hooks/                         # Custom hooks
│   │   ├── 📄 useCustomers.ts            # Hook de clientes
│   │   └── 📄 useFirebaseAuth.ts         # Hook de autenticación
│   ├── 📁 redux/                         # Estado global
│   │   ├── 📄 store.ts                   # Configuración del store
│   │   ├── 📄 rootReducer.ts             # Root reducer
│   │   ├── 📄 actions.ts                 # Acciones
│   │   ├── 📄 auth.ts                    # Estado de auth
│   │   ├── 📄 commerces.ts               # Estado de tiendas
│   │   ├── 📄 products.ts                # Estado de productos
│   │   ├── 📄 config.ts                  # Configuración
│   │   ├── 📄 ui.ts                      # Estado de UI
│   │   └── 📄 hooks.ts                   # Hooks tipados
│   ├── 📁 services/                      # Servicios de API
│   │   ├── 📄 customerService.ts         # Servicio de clientes
│   │   ├── 📄 orderService.ts            # Servicio de pedidos
│   │   └── 📄 userService.ts             # Servicio de usuarios
│   ├── 📁 types/                         # Definiciones de tipos
│   │   ├── 📄 index.ts                   # Tipos principales
│   │   ├── 📄 dashboard.ts               # Tipos de dashboard
│   │   ├── 📄 order.ts                   # Tipos de pedidos
│   │   ├── 📄 product.ts                 # Tipos de productos
│   │   ├── 📄 product-excel.ts           # Tipos de importación
│   │   ├── 📄 routes.ts                  # Tipos de rutas
│   │   └── 📄 env.d.ts                   # Variables de entorno
│   ├── 📁 utils/                         # Utilidades
│   │   ├── 📄 axios.ts                   # Configuración Axios
│   │   ├── 📄 axiosServer.ts             # Axios servidor
│   │   ├── 📄 firebase.ts                # Configuración Firebase
│   │   ├── 📄 firebaseHelper.ts          # Helpers Firebase
│   │   ├── 📄 formatters.ts              # Formateadores
│   │   ├── 📄 theme.ts                   # Configuración de tema
│   │   └── 📄 uploadHelper.ts            # Helper de subida
│   └── 📁 styles/                        # Estilos
│       └── 📄 bootstrap.css              # Bootstrap personalizado
├── 📁 public/                            # Archivos estáticos
│   ├── 📄 favicon.webp                   # Favicon
│   └── 📁 images/                        # Imágenes
│       ├── 📄 humanizar-logo.png         # Logo Humanizar
│       ├── 📄 login.png                  # Imagen de login
│       └── 📄 logo.svg                   # Logo SVG
├── 📄 next.config.ts                     # Configuración Next.js
├── 📄 tsconfig.json                      # Configuración TypeScript
├── 📄 eslint.config.mjs                  # Configuración ESLint
├── 📄 package.json                       # Dependencias
└── 📄 Dockerfile                         # Imagen Docker
```

## 🚀 Instalación y Configuración

### Prerrequisitos
- **Node.js** >= 16.x
- **npm** >= 8.x o **yarn** >= 1.x
- **Graf Backend** ejecutándose
- **Firebase project** configurado

### 1️⃣ Instalación
```bash
# Navegar al directorio
cd Graf/graf-admin

# Instalar dependencias
npm install
# o
yarn install
```

### 2️⃣ Configuración del Entorno
```bash
# Crear archivo de variables de entorno
cp .env.local.example .env.local

# Editar variables
nano .env.local
```

#### Variables de Entorno
```bash
# API Backend
NEXT_PUBLIC_API_URL=http://localhost:3000/api
NEXT_PUBLIC_BASE_URL=http://localhost:3000

# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

# App Configuration
NEXT_PUBLIC_APP_NAME=Graf Admin
NEXT_PUBLIC_APP_VERSION=1.0.0
NEXT_PUBLIC_ENVIRONMENT=development

# Feature Flags
NEXT_PUBLIC_ENABLE_ANALYTICS=true
NEXT_PUBLIC_ENABLE_MULTI_STORE=true
NEXT_PUBLIC_ENABLE_TEAM_MANAGEMENT=true

# Upload Configuration
NEXT_PUBLIC_MAX_FILE_SIZE=10485760  # 10MB
NEXT_PUBLIC_ALLOWED_IMAGE_TYPES=image/jpeg,image/png,image/webp
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloud_name

# Payment Integration
NEXT_PUBLIC_WOMPI_PUBLIC_KEY=pub_test_your_public_key

# Ecosystem Integration
NEXT_PUBLIC_EMW_URL=http://localhost:3001
NEXT_PUBLIC_MERAVUELTA_URL=http://localhost:3002
NEXT_PUBLIC_FIAR_URL=http://localhost:3004
```

## 🏃‍♂️ Ejecución

### Desarrollo
```bash
# Iniciar servidor de desarrollo
npm run dev
# o
yarn dev

# La aplicación estará disponible en:
# http://localhost:3001
```

### Producción
```bash
# Construir para producción
npm run build
# o
yarn build

# Iniciar servidor de producción
npm start
# o
yarn start
```

### Con Docker
```bash
# Construir imagen Docker
docker build -t graf-admin .

# Ejecutar contenedor
docker run -p 3001:3000 graf-admin
```

## 🎨 Características de la Interfaz

### 📊 Dashboard Principal
- **Métricas en tiempo real**: Ventas, pedidos, clientes
- **Gráficos interactivos**: Tendencias y comparativas
- **Resumen financiero**: Ingresos y gastos
- **Alertas inteligentes**: Notificaciones importantes
- **Quick actions**: Acceso rápido a funciones

### 🏪 Gestión de Tiendas
- **Selector de tienda**: Cambio rápido entre tiendas
- **Configuración visual**: Editor de temas y colores
- **Información básica**: Datos de contacto y dirección
- **Configuración SEO**: Meta tags y descripciones
- **Integración de pagos**: Configuración Wompi

### 📦 Módulo de Productos
- **Vista de tabla/tarjetas**: Múltiples vistas
- **Filtros avanzados**: Por categoría, stock, precio
- **Editor de productos**: Formulario completo
- **Gestión de imágenes**: Upload múltiple con preview
- **Variaciones**: Tallas, colores, modelos
- **Importación CSV/Excel**: Con validación de datos
- **Gestión de stock**: Alertas de inventario bajo

### 🛒 Centro de Pedidos
- **Dashboard de pedidos**: Estados y métricas
- **Filtros por estado**: Pendiente, procesando, enviado
- **Detalle completo**: Información del cliente y productos
- **Cambio de estados**: Workflow personalizable
- **Facturación**: Generación automática
- **Tracking de envío**: Integración MeraVuelta
- **Notificaciones**: WhatsApp automático

### 👥 Gestión de Clientes
- **Base de datos completa**: Perfiles detallados
- **Historial de compras**: Tracking completo
- **Segmentación**: Grupos y etiquetas
- **Comunicación**: WhatsApp directo
- **Análisis de comportamiento**: Insights de compra

### 📊 Analytics y Reportes
- **Dashboard ejecutivo**: KPIs principales
- **Reportes de ventas**: Por período, producto, cliente
- **Análisis de productos**: Best sellers y tendencias
- **Métricas de marketing**: Conversión y ROI
- **Reportes personalizados**: Filtros avanzados
- **Exportación**: PDF, Excel, CSV

## 🔌 Integración con el Ecosistema

### Graf Backend API
```typescript

const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  timeout: 30000
});


apiClient.interceptors.request.use(async (config) => {
  const token = await auth.currentUser?.getIdToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
```

### Firebase Authentication
```typescript

export const useFirebaseAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });
    
    return unsubscribe;
  }, []);
  
  return { user, loading };
};
```

### Redux Store
```typescript

export const store = configureStore({
  reducer: {
    auth: authSlice.reducer,
    commerces: commercesSlice.reducer,
    products: productsSlice.reducer,
    config: configSlice.reducer,
    ui: uiSlice.reducer
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER]
      }
    })
});
```

## 🎯 Funcionalidades Específicas

### Multi-tienda
- **Selector de tienda**: Header con dropdown
- **Configuración independiente**: Cada tienda su configuración
- **Datos separados**: Productos, pedidos, clientes por tienda
- **Permisos granulares**: Acceso específico por tienda

### Gestión de Equipos
- **Invitación de usuarios**: Sistema de invitaciones por email
- **Roles y permisos**: Admin, Manager, Operator
- **Auditoría**: Log de acciones por usuario
- **Configuración de acceso**: Por módulo y tienda

### Importación/Exportación
- **CSV/Excel import**: Productos con validación
- **Template download**: Plantillas pre-configuradas
- **Batch operations**: Operaciones masivas
- **Error handling**: Reportes de errores detallados

### Customización Visual
- **Theme editor**: Colores y tipografías
- **Logo upload**: Gestión de branding
- **Layout options**: Configuración de diseño
- **Preview mode**: Vista previa en tiempo real

## 🧪 Testing y Calidad

### Comandos de Testing
```bash
# Tests unitarios (cuando estén implementados)
npm run test

# Tests de integración
npm run test:integration

# Tests E2E
npm run test:e2e

# Análisis de bundle
npm run analyze
```

### Calidad de Código
```bash
# Linting
npm run lint

# Type checking
npm run type-check

# Formateo
npm run format

# Build check
npm run build
```

## 🚀 Despliegue

### Vercel (Recomendado)
```bash
# Instalar Vercel CLI
npm i -g vercel

# Deploy
vercel

# Configurar variables de entorno en dashboard
```

### Docker Production
```bash
# Build para producción
docker build -f Dockerfile.prod -t graf-admin:prod .

# Run en producción
docker run -p 3001:3000 graf-admin:prod
```

### Ambientes
```bash
# Development
npm run dev

# Staging
npm run build && npm start

# Production
docker-compose up -d graf-admin
```

## 📱 Responsive Design

### Breakpoints
- **Mobile**: < 768px
- **Tablet**: 768px - 1024px
- **Desktop**: > 1024px
- **Large**: > 1440px

### Mobile Features
- **Touch-friendly**: Optimizado para touch
- **Adaptive UI**: Interfaz que se adapta
- **Offline support**: Funcionalidad offline básica
- **PWA ready**: Progressive Web App

## 🤝 Contribución

### Proceso de Desarrollo
1. **Fork** del repositorio
2. **Branch** específico: `feature/nueva-funcionalidad`
3. **Desarrollo** siguiendo estándares
4. **Testing** de funcionalidades
5. **Pull request** con descripción

### Estándares
- **TypeScript strict mode**
- **Component composition** pattern
- **Custom hooks** para lógica
- **SCSS modules** para estilos
- **Accessibility first**

## 📞 Soporte

### Enlaces Útiles
- [Graf Backend Documentation](../graf-backend/README.md)
- [Graf Client Documentation](../graf-client/README.md)
- [Ecosistema Humanizar](../../README.md)
- [Next.js Documentation](https://nextjs.org/docs)

### Contacto
- **Maintainer**: Steven Vallejo Ortiz
- **Email**: stevenvallejo780@gmail.com
- **Issues**: GitHub Issues del repositorio

### Troubleshooting

#### Error de autenticación Firebase
```bash
# Verificar configuración
echo $NEXT_PUBLIC_FIREBASE_PROJECT_ID

# Verificar permisos
firebase auth:export --project your-project-id
```

#### Problemas de build
```bash
# Limpiar caché
rm -rf .next node_modules
npm install

# Verificar tipos
npm run type-check
```

---

<div align="center">

**Graf Admin v1.0.0**  
*Panel de Administración E-commerce - Ecosistema Humanizar*

![Humanizar](https://img.shields.io/badge/Humanizar-Ecosystem-orange?style=for-the-badge)

</div>