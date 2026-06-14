# 🛍️ Graf Client
## E-commerce Customer Store Frontend

<div align="center">

![Graf Client](https://img.shields.io/badge/Graf-Client-green?style=for-the-badge&logo=react)
![Next.js](https://img.shields.io/badge/Next.js-000000?style=for-the-badge&logo=nextdotjs&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![Redux](https://img.shields.io/badge/Redux-593D88?style=for-the-badge&logo=redux&logoColor=white)
![SCSS](https://img.shields.io/badge/SCSS-CC6699?style=for-the-badge&logo=sass&logoColor=white)

**Tienda en línea moderna y responsiva para clientes finales**  
*Parte del Ecosistema Humanizar*

</div>

## 🌟 Descripción General

Graf Client es la tienda en línea orientada al cliente final del **Ecosistema Humanizar**. Esta aplicación web moderna, construida con Next.js 14+ y TypeScript, proporciona una experiencia de compra excepcional con diseño responsivo, múltiples layouts de productos, carrito persistente y checkout optimizado.

### 🎯 Propósito en el Ecosistema
- **Tienda principal**: Experiencia de compra para clientes finales
- **Multi-tienda**: Soporte para múltiples tiendas con diseños únicos
- **E-commerce completo**: Desde catálogo hasta checkout y seguimiento
- **Integración total**: Conecta con Graf Backend y servicios del ecosistema

## ✨ Características Principales

### 🛒 Experiencia de Compra Avanzada
- **Catálogo dinámico**: Navegación intuitiva por categorías
- **Múltiples layouts**: Grid, lista, carrusel, featured products
- **Búsqueda avanzada**: Filtros por categoría, precio, disponibilidad
- **Carrito persistente**: Mantiene items entre sesiones
- **Checkout optimizado**: Proceso de compra simplificado
- **Guest checkout**: Compra sin registro obligatorio

### 🎨 Diseño y UX
- **Responsive design**: Optimizado para móvil, tablet y desktop
- **PWA ready**: Progressive Web App con offline support
- **Múltiples temas**: Personalización por tienda
- **Animaciones fluidas**: Transiciones y micro-interacciones
- **Imágenes optimizadas**: Lazy loading y compresión automática
- **SEO optimizado**: Meta tags dinámicos y structured data

### 🏪 Multi-tienda
- **Tiendas independientes**: Cada tienda con su propio dominio/subdominio
- **Configuración única**: Colores, logos, layouts personalizados
- **Productos específicos**: Catálogo independiente por tienda
- **Checkout customizado**: Métodos de pago y entrega por tienda

### 📱 Componentes de Producto
- **ProductCard variaciones**: Grid, List, Compact, Featured, Carousel
- **Modal de detalle**: Vista rápida sin cambiar de página
- **Selector de variaciones**: Tallas, colores, modelos
- **Galería de imágenes**: Zoom y navegación avanzada
- **Reviews y ratings**: Sistema de calificaciones
- **Stock en tiempo real**: Disponibilidad actualizada

### 🛍️ Gestión de Carrito
- **Carrito flotante**: Acceso rápido desde cualquier página
- **Actualización en tiempo real**: Cantidades y precios dinámicos
- **Productos relacionados**: Sugerencias inteligentes
- **Cálculo automático**: Impuestos, descuentos, envío
- **Persistencia**: Mantiene carrito entre sesiones

### 👤 Gestión de Usuario
- **Autenticación Firebase**: Login seguro y rápido
- **Perfil completo**: Información personal y preferencias
- **Historial de pedidos**: Tracking completo de compras
- **Lista de deseos**: Productos favoritos
- **Direcciones múltiples**: Gestión de direcciones de envío

## 🛠️ Stack Tecnológico

| Tecnología | Versión | Propósito |
|------------|---------|-----------|
| **Next.js** | 14.x | Framework React con App Router |
| **TypeScript** | Latest | Tipado estático |
| **React** | 18.x | Biblioteca de UI |
| **Redux Toolkit** | Latest | Gestión de estado global |
| **SCSS** | Latest | Preprocesador CSS |
| **Firebase Auth** | Latest | Autenticación |
| **React Hook Form** | Latest | Gestión de formularios |
| **Axios** | Latest | Cliente HTTP |
| **Date-fns** | Latest | Manipulación de fechas |
| **Framer Motion** | Latest | Animaciones (opcional) |

## 🏗️ Arquitectura de la Aplicación

### Estructura de Directorios
```
📁 graf-client/
├── 📁 src/
│   ├── 📁 app/                           # App Router (Next.js 14+)
│   │   ├── 📄 layout.tsx                 # Layout global
│   │   ├── 📄 page.tsx                   # Página principal
│   │   ├── 📁 [storeId]/                 # Rutas dinámicas por tienda
│   │   │   ├── 📄 layout.tsx             # Layout específico de tienda
│   │   │   ├── 📄 page.tsx               # Home de la tienda
│   │   │   ├── 📁 products/              # Catálogo de productos
│   │   │   │   ├── 📄 ProductsList/      # Lista de productos
│   │   │   │   ├── 📄 ProductFilters/    # Sistema de filtros
│   │   │   │   ├── 📄 CategorySection/   # Sección de categorías
│   │   │   │   ├── 📄 CategorySlider/    # Slider de categorías
│   │   │   │   ├── 📄 ProductDetailModal/ # Modal de detalle
│   │   │   │   └── 📄 VariationSelectorModal/ # Selector de variaciones
│   │   │   ├── 📁 checkout/              # Proceso de checkout
│   │   │   │   ├── 📄 page.tsx
│   │   │   │   └── 📄 CheckoutModalAuth.tsx
│   │   │   ├── 📁 orders/                # Pedidos del usuario
│   │   │   ├── 📁 profile/               # Perfil de usuario
│   │   │   ├── 📁 login/                 # Autenticación
│   │   │   ├── 📁 register/              # Registro
│   │   │   ├── 📁 about/                 # Información de la tienda
│   │   │   │   ├── 📄 page.tsx
│   │   │   │   ├── 📄 GoogleMap.tsx      # Mapa de ubicación
│   │   │   │   └── 📄 styles.scss
│   │   │   ├── 📁 order-success/         # Confirmación de pedido
│   │   │   └── 📁 components/            # Componentes específicos
│   │   │       ├── 📁 ClientLayout/      # Layout de cliente
│   │   │       │   ├── 📄 index.tsx
│   │   │       │   ├── 📄 BottomBar.tsx  # Barra inferior móvil
│   │   │       │   └── 📁 FloatingCart/  # Carrito flotante
│   │   │       │       ├── 📄 index.tsx
│   │   │       │       ├── 📄 CartItem.tsx
│   │   │       │       └── 📄 styles.scss
│   │   │       ├── 📁 ProductCard/       # Componentes de producto
│   │   │       │   ├── 📄 ProductCardGrid/
│   │   │       │   ├── 📄 ProductCardList/
│   │   │       │   ├── 📄 ProductCardCompact/
│   │   │       │   ├── 📄 ProductCardFeatured/
│   │   │       │   ├── 📄 ProductCardCarousel/
│   │   │       │   ├── 📄 ProductCardClothing/
│   │   │       │   ├── 📄 ProductCardWideCard/
│   │   │       │   └── 📄 ProductCardMini/
│   │   │       ├── 📁 Header/            # Header de navegación
│   │   │       ├── 📁 Footer/            # Footer de la tienda
│   │   │       ├── 📁 HorizontalSlider/  # Slider horizontal
│   │   │       ├── 📄 CustomQuestions.tsx # Preguntas personalizadas
│   │   │       ├── 📄 DeliveryZoneModal.tsx # Modal de zona de entrega
│   │   │       ├── 📄 OptimizedImage.tsx # Componente de imagen optimizada
│   │   │       ├── 📄 ProductSchema.tsx  # Schema de producto (SEO)
│   │   │       ├── 📄 StoreNotFound.tsx  # Página de tienda no encontrada
│   │   │       └── 📄 StoreNotConfigured.tsx # Tienda no configurada
│   │   └── 📁 graf/                      # Página estática de Graf
│   │       ├── 📄 layout.tsx
│   │       ├── 📄 page.tsx
│   │       ├── 📁 about/
│   │       ├── 📁 login/
│   │       ├── 📁 register/
│   │       └── 📁 components/
│   ├── 📁 components/                    # Componentes reutilizables
│   │   ├── 📄 InfoAlert.tsx              # Componente de alertas
│   │   ├── 📄 LoginClient.tsx            # Cliente de login
│   │   ├── 📄 OrdersList.tsx             # Lista de pedidos
│   │   ├── 📄 ProfileEditor.tsx          # Editor de perfil
│   │   ├── 📁 RegisterClient/            # Cliente de registro
│   │   └── 📁 SafeHtmlRenderer/          # Renderizador HTML seguro
│   ├── 📁 hooks/                         # Custom hooks
│   │   ├── 📄 useFirebaseAuth.ts         # Hook de autenticación
│   │   ├── 📄 usePagination.ts           # Hook de paginación
│   │   ├── 📄 useProducts.ts             # Hook de productos
│   │   └── 📄 useStoreConfig.ts          # Hook de configuración de tienda
│   ├── 📁 providers/                     # Providers de contexto
│   │   ├── 📄 AuthProvider.tsx           # Provider de autenticación
│   │   ├── 📄 ReduxProvider.tsx          # Provider de Redux
│   │   └── 📄 index.tsx                  # Exports de providers
│   ├── 📁 redux/                         # Estado global
│   │   ├── 📄 store.ts                   # Configuración del store
│   │   ├── 📄 rootReducer.ts             # Root reducer
│   │   ├── 📄 actions.ts                 # Acciones
│   │   ├── 📄 auth.ts                    # Estado de autenticación
│   │   ├── 📄 cart.ts                    # Estado del carrito
│   │   ├── 📄 categories.ts              # Estado de categorías
│   │   ├── 📄 config.ts                  # Configuración
│   │   ├── 📄 orders.ts                  # Estado de pedidos
│   │   ├── 📄 products.ts                # Estado de productos
│   │   ├── 📄 ui.ts                      # Estado de UI
│   │   └── 📄 hooks.ts                   # Hooks tipados
│   ├── 📁 services/                      # Servicios de API
│   │   ├── 📄 orderService.ts            # Servicio de pedidos
│   │   └── 📄 userService.ts             # Servicio de usuarios
│   ├── 📁 types/                         # Definiciones de tipos
│   │   ├── 📄 index.ts                   # Tipos principales
│   │   ├── 📄 routes.ts                  # Tipos de rutas
│   │   └── 📄 env.d.ts                   # Variables de entorno
│   ├── 📁 utils/                         # Utilidades
│   │   ├── 📄 axios.ts                   # Configuración Axios
│   │   ├── 📄 axiosServer.ts             # Axios servidor
│   │   ├── 📄 cartUtils.ts               # Utilidades del carrito
│   │   ├── 📄 firebase.ts                # Configuración Firebase
│   │   ├── 📄 firebaseHelper.ts          # Helpers Firebase
│   │   ├── 📄 formatters.ts              # Formateadores
│   │   ├── 📄 theme.ts                   # Configuración de tema
│   │   └── 📄 uploadHelper.ts            # Helper de subida
│   └── 📁 styles/                        # Estilos globales
│       ├── 📄 globals.scss               # Estilos globales SCSS
│       └── 📄 bootstrap.css              # Bootstrap personalizado
├── 📁 public/                            # Archivos estáticos
│   └── 📁 images/                        # Imágenes y recursos
│       ├── 📄 default-category.png       # Categoría por defecto
│       ├── 📄 no-image.png               # Imagen placeholder
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
cd Graf/graf-client

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
NEXT_PUBLIC_APP_NAME=Graf Store
NEXT_PUBLIC_APP_VERSION=1.0.0
NEXT_PUBLIC_ENVIRONMENT=development

# Store Configuration
NEXT_PUBLIC_DEFAULT_STORE_ID=default-store
NEXT_PUBLIC_ENABLE_GUEST_CHECKOUT=true
NEXT_PUBLIC_ENABLE_WISHLIST=true
NEXT_PUBLIC_ENABLE_REVIEWS=true

# Payment Integration
NEXT_PUBLIC_WOMPI_PUBLIC_KEY=pub_test_your_public_key
NEXT_PUBLIC_ENABLE_CREDIT_PAYMENT=true

# Image Optimization
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloud_name
NEXT_PUBLIC_IMAGE_QUALITY=80
NEXT_PUBLIC_ENABLE_WEBP=true

# SEO Configuration
NEXT_PUBLIC_SITE_NAME=Graf Store
NEXT_PUBLIC_SITE_DESCRIPTION=Tu tienda en línea favorita
NEXT_PUBLIC_DEFAULT_OG_IMAGE=/images/og-default.jpg

# Features
NEXT_PUBLIC_ENABLE_PWA=true
NEXT_PUBLIC_ENABLE_OFFLINE=true
NEXT_PUBLIC_ENABLE_NOTIFICATIONS=true

# Analytics
NEXT_PUBLIC_GA_TRACKING_ID=GA_MEASUREMENT_ID
NEXT_PUBLIC_ENABLE_ANALYTICS=true

# Map Integration (para página About)
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_google_maps_key
```

## 🏃‍♂️ Ejecución

### Desarrollo
```bash
# Iniciar servidor de desarrollo
npm run dev
# o
yarn dev

# La aplicación estará disponible en:
# http://localhost:3002
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
docker build -t graf-client .

# Ejecutar contenedor
docker run -p 3002:3000 graf-client
```

## 🎨 Características de la Interfaz

### 🏠 Página Principal
- **Hero section**: Banner principal personalizable
- **Productos destacados**: Carrusel de productos principales
- **Categorías populares**: Navegación rápida por categorías
- **Ofertas especiales**: Sección de promociones
- **Testimonios**: Reviews de clientes
- **Newsletter**: Suscripción a novedades

### 📱 Navegación Móvil
- **Bottom navigation**: Barra inferior con accesos rápidos
- **Carrito flotante**: Acceso rápido al carrito
- **Menú hamburguesa**: Navegación completa
- **Búsqueda rápida**: Search bar con autocompletado
- **Filtros móviles**: Sidebar deslizante con filtros

### 🛍️ Catálogo de Productos
- **Vista grid/lista**: Toggle entre vistas
- **Filtros avanzados**: Por categoría, precio, marca, disponibilidad
- **Ordenamiento**: Por precio, popularidad, novedad, ratings
- **Paginación**: Carga por páginas o scroll infinito
- **Búsqueda**: Search con filtros inteligentes
- **Breadcrumbs**: Navegación contextual

### 🔍 Detalle de Producto
- **Galería de imágenes**: Zoom, navegación, thumbnails
- **Información completa**: Descripción, especificaciones, reviews
- **Selector de variaciones**: Tallas, colores, modelos
- **Stock en tiempo real**: Disponibilidad actualizada
- **Productos relacionados**: Sugerencias inteligentes
- **Social sharing**: Compartir en redes sociales

### 🛒 Carrito de Compras
- **Vista completa**: Lista detallada de productos
- **Carrito flotante**: Mini cart con acceso rápido
- **Actualización dinámica**: Cantidades y precios en tiempo real
- **Cupones de descuento**: Aplicación de códigos promocionales
- **Cálculo de envío**: Estimación automática
- **Productos sugeridos**: Cross-selling inteligente

### 💳 Proceso de Checkout
- **Checkout de una página**: Proceso simplificado
- **Guest checkout**: Compra sin registro
- **Múltiples direcciones**: Selección de dirección de envío
- **Métodos de pago**: Wompi, transferencias, crédito FIAR
- **Resumen de pedido**: Desglose completo de costos
- **Confirmación**: Página de éxito con tracking

### 👤 Área de Usuario
- **Dashboard personal**: Resumen de actividad
- **Historial de pedidos**: Tracking completo de compras
- **Lista de deseos**: Productos favoritos guardados
- **Direcciones**: Gestión de direcciones de envío
- **Configuración**: Preferencias y notificaciones
- **Soporte**: Sistema de tickets y chat

## 🔌 Integración con el Ecosistema

### Graf Backend API
```typescript

const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  timeout: 30000
});


apiClient.interceptors.request.use((config) => {
  const storeId = getStoreIdFromUrl();
  if (storeId) {
    config.headers['X-Store-ID'] = storeId;
  }
  return config;
});
```

### Redux Store para E-commerce
```typescript

export const store = configureStore({
  reducer: {
    auth: authSlice.reducer,
    cart: cartSlice.reducer,
    products: productsSlice.reducer,
    categories: categoriesSlice.reducer,
    orders: ordersSlice.reducer,
    config: configSlice.reducer,
    ui: uiSlice.reducer
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER]
      }
    }).concat(cartPersistMiddleware)
});
```

### Carrito Persistente
```typescript

export const useCart = () => {
  const dispatch = useAppDispatch();
  const cart = useAppSelector(state => state.cart);
  
  const addToCart = useCallback((product, quantity = 1) => {
    dispatch(addItemToCart({ product, quantity }));

    persistCart(cart);
  }, [dispatch, cart]);
  
  return { cart, addToCart, removeFromCart, updateQuantity };
};
```

## 🎯 Funcionalidades Específicas

### Multi-tienda
- **Routing dinámico**: `[storeId]` para cada tienda
- **Configuración única**: Temas, colores, logos por tienda
- **Catálogo independiente**: Productos específicos por tienda
- **SEO personalizado**: Meta tags únicos por tienda

### SEO y Performance
- **Server-Side Rendering**: Next.js SSR para mejor SEO
- **Structured Data**: Schema.org para productos
- **Meta tags dinámicos**: Por producto y categoría
- **Image optimization**: Next.js Image con lazy loading
- **Code splitting**: Carga dinámica de componentes

### PWA Features
- **Service Worker**: Offline functionality
- **App-like experience**: Instalable en dispositivos
- **Push notifications**: Notificaciones de ofertas
- **Background sync**: Sincronización offline

### Accessibility (A11y)
- **ARIA labels**: Etiquetas semánticas completas
- **Keyboard navigation**: Navegación completa por teclado
- **Screen reader support**: Compatible con lectores de pantalla
- **Color contrast**: Cumple estándares WCAG
- **Focus management**: Gestión adecuada del foco

## 📱 Responsive Design

### Breakpoints
- **Mobile**: < 768px
- **Tablet**: 768px - 1024px
- **Desktop**: 1024px - 1440px
- **Large Desktop**: > 1440px

### Mobile-First Features
- **Touch gestures**: Swipe, pinch-to-zoom
- **Thumb-friendly**: Botones accesibles con el pulgar
- **Fast loading**: Optimizado para conexiones móviles
- **App-like navigation**: Experiencia nativa

## 🧪 Testing y Calidad

### Comandos de Testing
```bash
# Tests unitarios
npm run test

# Tests de integración
npm run test:integration

# Tests E2E con Cypress
npm run test:e2e

# Visual regression tests
npm run test:visual

# Performance testing
npm run test:lighthouse
```

### Métricas de Performance
- **Core Web Vitals**: LCP, FID, CLS optimizados
- **Page Speed**: Optimización para velocidad
- **Bundle analysis**: Análisis de tamaño de bundles
- **Accessibility score**: Puntuación A11y alta

## 🚀 Despliegue

### Vercel (Recomendado)
```bash
# Deploy automático
vercel

# Preview deployments
vercel --preview

# Production deployment
vercel --prod
```

### Docker Production
```bash
# Multi-stage build para producción
docker build -f Dockerfile.prod -t graf-client:prod .

# Run con nginx
docker run -p 80:80 graf-client:prod
```

### CDN y Performance
- **Static assets**: CDN para imágenes y assets
- **Edge caching**: Caching de páginas estáticas
- **Image optimization**: Cloudinary o similar
- **Bundle optimization**: Tree shaking y minification

## 🔧 Configuración Avanzada

### Temas Personalizados
```scss

:root[data-store="tienda1"] {
  --primary-color: #ff6b6b;
  --secondary-color: #4ecdc4;
  --accent-color: #45b7d1;
}

:root[data-store="tienda2"] {
  --primary-color: #6c5ce7;
  --secondary-color: #a29bfe;
  --accent-color: #fd79a8;
}
```

### Layouts de Producto
```typescript

const productLayouts = {
  grid: ProductCardGrid,
  list: ProductCardList,
  compact: ProductCardCompact,
  featured: ProductCardFeatured,
  carousel: ProductCardCarousel,
  clothing: ProductCardClothing,
  wide: ProductCardWideCard,
  mini: ProductCardMini
};
```

## 🤝 Contribución

### Proceso de Desarrollo
1. **Fork** del repositorio
2. **Branch** específico: `feature/nueva-funcionalidad`
3. **Desarrollo** siguiendo estándares
4. **Testing** completo de funcionalidades
5. **Pull request** con descripción detallada

### Estándares de Código
- **TypeScript strict mode**
- **SCSS modules** para estilos
- **Component composition**
- **Custom hooks** para lógica
- **Accessibility first**

## 📞 Soporte

### Enlaces Útiles
- [Graf Backend Documentation](../graf-backend/README.md)
- [Graf Admin Documentation](../graf-admin/README.md)
- [Ecosistema Humanizar](../../README.md)
- [Next.js Documentation](https://nextjs.org/docs)

### Contacto
- **Maintainer**: Steven Vallejo Ortiz
- **Email**: stevenvallejo780@gmail.com
- **Issues**: GitHub Issues del repositorio

### Troubleshooting

#### Problemas de renderizado
```bash
# Limpiar caché de Next.js
rm -rf .next

# Verificar tipos
npm run type-check

# Regenerar build
npm run build
```

#### Issues con el carrito
```bash
# Limpiar localStorage
localStorage.clear()

# Verificar Redux DevTools
.cart)
```

---

<div align="center">

**Graf Client v1.0.0**  
*Tienda E-commerce para Clientes - Ecosistema Humanizar*

![Humanizar](https://img.shields.io/badge/Humanizar-Ecosystem-orange?style=for-the-badge)

</div>