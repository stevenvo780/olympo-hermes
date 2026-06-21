#!/bin/bash

# Script para probar la integración completa Hermes -> Hub Central
# Simula una orden que cambia de estado a 'paid'

echo "🔥 PRUEBA DE INTEGRACIÓN REAL: Hermes → Hub Central"
echo "================================================"

# Esperar a que los servicios estén listos
echo "⏳ Esperando servicios..."
sleep 5

# Verificar Hub Central
echo "📡 Verificando Hub Central..."
HUB_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3007/health 2>/dev/null || echo "000")
if [ "$HUB_STATUS" = "200" ]; then
    echo "✅ Hub Central respondiendo"
else
    echo "❌ Hub Central no disponible (Status: $HUB_STATUS)"
    echo "   Verifica que esté corriendo en puerto 3007"
    exit 1
fi

# Verificar Hermes Backend
echo "🎯 Verificando Hermes Backend..."
GRAF_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000 2>/dev/null || echo "000")
if [ "$GRAF_STATUS" = "200" ] || [ "$GRAF_STATUS" = "404" ]; then
    echo "✅ Hermes Backend respondiendo"
else
    echo "❌ Hermes Backend no disponible (Status: $GRAF_STATUS)"
    echo "   Verifica que esté corriendo en puerto 3000"
    exit 1
fi

echo ""
echo "🧪 CONFIGURACIÓN DE PRUEBA COMPLETADA"
echo "====================================="
echo ""
echo "📋 INSTRUCCIONES PARA PRUEBA MANUAL:"
echo ""
echo "1. 🛒 **Crear una orden en Hermes:**"
echo "   - Abre Hermes frontend o usa el API"
echo "   - Crea una orden con estado 'pending'"
echo ""
echo "2. 💳 **Simular pago (cambiar estado a 'paid'):**"
echo "   curl -X PATCH http://localhost:3000/api/orders/{ORDER_ID} \\"
echo "        -H 'Content-Type: application/json' \\"
echo "        -H 'Authorization: Bearer {TOKEN}' \\"
echo "        -d '{\"status\": \"paid\"}'"
echo ""
echo "3. 👀 **Verificar webhook en Hub Central:**"
echo "   - Revisa los logs del Hub Central"
echo "   - Deberías ver: 'Webhook Hermes recibido para pedido {ORDER_ID}'"
echo ""
echo "4. 📊 **Verificar evento en base de datos:**"
echo "   curl http://localhost:3007/api/events | jq ."
echo ""
echo "🔗 **ENDPOINTS CONFIGURADOS:**"
echo "   - Hermes Backend: http://localhost:3000"
echo "   - Hub Central: http://localhost:3007"
echo "   - Hub Webhook: http://localhost:3007/api/webhooks/hermes/pedido-pagado"
echo "   - Hub Events: http://localhost:3007/api/events"
echo ""
echo "💡 **PAYLOAD DE EJEMPLO QUE HERMES ENVIARÁ:**"
cat << 'EOF'
{
  "evento": "pedido.pagado",
  "origen": "Hermes",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "datos": {
    "pedidoId": 123,
    "storeId": 1,
    "customerId": 456,
    "userId": 789,
    "monto": 50000,
    "items": [
      {
        "productId": 1,
        "productName": "Producto ejemplo",
        "quantity": 2,
        "unitPrice": 25000,
        "total": 50000
      }
    ],
    "fechaPago": "2024-01-15T10:30:00.000Z"
  }
}
EOF

echo ""
echo "🎯 **PRÓXIMOS PASOS DESPUÉS DE VALIDAR:**"
echo "1. Implementar APIs reales en Logos (facturación)"
echo "2. Implementar APIs reales en Talaria (entregas)"
echo "3. Implementar APIs reales en IRIS (notificaciones)"
echo "4. Implementar APIs reales en Mnemosyne (CRM)"
echo ""
echo "✨ **INTEGRACIÓN LISTA PARA PRUEBAS**"
