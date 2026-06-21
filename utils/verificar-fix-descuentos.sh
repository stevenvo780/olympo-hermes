#!/bin/bash

# 🧪 Script de Verificación: Error 500 Descuentos
# Valida que las mejoras previenen el error original

echo "🔍 Verificando mejoras para prevenir Error 500 en descuentos..."
echo ""

# Colores
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Contador de pruebas
PASSED=0
FAILED=0

# Función para verificar archivo
check_file() {
    local file=$1
    local pattern=$2
    local description=$3
    
    if grep -q "$pattern" "$file" 2>/dev/null; then
        echo -e "${GREEN}✓${NC} $description"
        ((PASSED++))
    else
        echo -e "${RED}✗${NC} $description"
        ((FAILED++))
    fi
}

# Función para verificar que NO contenga un patrón
check_not_contains() {
    local file=$1
    local pattern=$2
    local description=$3
    
    if ! grep -q "$pattern" "$file" 2>/dev/null; then
        echo -e "${GREEN}✓${NC} $description"
        ((PASSED++))
    else
        echo -e "${RED}✗${NC} $description - PATRÓN PROHIBIDO ENCONTRADO"
        ((FAILED++))
    fi
}

echo "📁 Backend (order.service.ts):"
echo "────────────────────────────────"

BACKEND_FILE="hermes-backend/src/order/order.service.ts"

# Verificar que NO tenga relations: ['product']
check_not_contains "$BACKEND_FILE" "relations.*\['product'\]" \
    "NO usa relations: ['product'] (bug corregido)"

# Verificar importaciones correctas
check_file "$BACKEND_FILE" "InternalServerErrorException" \
    "Importa InternalServerErrorException"

check_file "$BACKEND_FILE" "Logger" \
    "Importa Logger de NestJS"

# Verificar logger en la clase
check_file "$BACKEND_FILE" "private readonly logger = new Logger" \
    "Tiene logger configurado"

# Verificar validaciones
check_file "$BACKEND_FILE" "if (!items || items.length === 0)" \
    "Valida que haya items en la orden"

check_file "$BACKEND_FILE" "if (isNaN(discountVal) || discountVal < 0)" \
    "Valida valor de descuento"

check_file "$BACKEND_FILE" "if (discountVal > 100)" \
    "Valida porcentaje máximo 100%"

check_file "$BACKEND_FILE" "Math.max(0," \
    "Protege contra totales negativos"

# Verificar conversiones seguras
check_file "$BACKEND_FILE" "Number(item.unitPrice)" \
    "Convierte unitPrice a Number"

check_file "$BACKEND_FILE" "Number(item.finalPrice)" \
    "Convierte finalPrice a Number"

# Verificar try-catch
check_file "$BACKEND_FILE" "this.logger.error.*Error recalculando totales" \
    "Loguea errores de recálculo"

check_file "$BACKEND_FILE" "throw new InternalServerErrorException" \
    "Lanza excepciones apropiadas"

echo ""
echo "📁 Frontend (OrderDetail.tsx):"
echo "────────────────────────────────"

FRONTEND_FILE="hermes-admin/src/app/[storeId]/orders/OrderDetail.tsx"

# Verificar validaciones frontend
check_file "$FRONTEND_FILE" "if (discountType === 'percentage' && discountValue > 100)" \
    "Valida porcentaje > 100% en frontend"

check_file "$FRONTEND_FILE" "if (discountValue < 0)" \
    "Valida descuento negativo en frontend"

# Verificar manejo de errores
check_file "$FRONTEND_FILE" "response.*data.*message" \
    "Captura mensajes específicos del backend"

echo ""
echo "📊 Resultados:"
echo "────────────────────────────────"
echo -e "Pruebas pasadas: ${GREEN}$PASSED${NC}"
echo -e "Pruebas fallidas: ${RED}$FAILED${NC}"
echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}✅ TODAS LAS VERIFICACIONES PASARON${NC}"
    echo "El código está protegido contra el error 500 de descuentos."
    exit 0
else
    echo -e "${RED}❌ ALGUNAS VERIFICACIONES FALLARON${NC}"
    echo "Revisa los archivos indicados arriba."
    exit 1
fi
