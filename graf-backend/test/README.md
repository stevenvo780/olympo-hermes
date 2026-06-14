# Tests E2E

Los tests E2E (End-to-End) prueban la funcionalidad completa de los endpoints contra una base de datos PostgreSQL real, no mocks.

## Prerrequisitos

1. **Docker** instalado y funcionando

## Configuración

### 1. Iniciar la base de datos de test

```bash
docker-compose -f docker-compose.e2e.yml up -d
```

Esto iniciará un contenedor PostgreSQL en el puerto **5433** con:
- Usuario: `test_user`
- Contraseña: `test_password`
- Base de datos: `graf_test_e2e`

### 2. Ejecutar los tests E2E

```bash
npm run test:e2e
```

### 3. Detener la base de datos de test

```bash
docker-compose -f docker-compose.e2e.yml down
```

Para eliminar también los datos:
```bash
docker-compose -f docker-compose.e2e.yml down -v
```

## Estructura de los Tests

Los tests E2E se encuentran en `/test/`:

- `product-category-order.e2e-spec.ts` - Tests para el ordenamiento de productos en categorías
  - GET `/products/category-order/category/:categoryId` 
  - PATCH `/products/category-order/category`
  - Tests de integridad de base de datos (unique constraints, cascade delete, concurrencia)

## Características

✅ **Tests de integración reales** - Sin mocks, prueban contra PostgreSQL real
✅ **Aislamiento** - Cada test crea y limpia sus propios datos
✅ **Concurrencia** - Prueba operaciones concurrentes
✅ **Integridad** - Valida constraints de la base de datos

## Variables de Entorno

El setup de tests (`test/setup-e2e.ts`) configura automáticamente:

| Variable | Valor |
|----------|-------|
| `DB_HOST` | localhost |
| `DB_PORT` | 5433 |
| `DB_USERNAME` | test_user |
| `DB_PASSWORD` | test_password |
| `DB_NAME` | graf_test_e2e |
| `DB_SYNCHRONIZE` | true |

## Agregar Nuevos Tests E2E

1. Crear archivo `test/<module>.e2e-spec.ts`
2. Importar `AppModule` y usar `Test.createTestingModule`
3. Override de guards (FirebaseAuthGuard, RolesGuard)
4. Crear datos de prueba en `beforeEach`
5. Limpiar datos en `afterEach` y `afterAll`

Ejemplo:
```typescript
describe('MyController (e2e)', () => {
  let app: INestApplication;
  
  beforeAll(async () => {
    const moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideGuard(FirebaseAuthGuard)
      .useValue({ canActivate: () => true })
      .compile();
      
    app = moduleFixture.createNestApplication();
    await app.init();
  });
  
  // ... tests ...
});
```
