#!/bin/bash

# Script para generar la firma correcta del webhook
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Load env vars from utils/.env (ignored by git) or utils/.env.local when present
for env_file in "${SCRIPT_DIR}/.env" "${SCRIPT_DIR}/.env.local"; do
  if [ -f "${env_file}" ]; then
    set -a
    # shellcheck source=/dev/null
    . "${env_file}"
    set +a
  fi
done

WEBHOOK_SECRET="${WEBHOOK_SECRET:-}"
GRAF_WEBHOOK_URL="${GRAF_WEBHOOK_URL:-http://localhost:3007/api/v1/webhooks/graf}"

: "${WEBHOOK_SECRET:?Set WEBHOOK_SECRET in utils/.env}"

# Crear el payload
PAYLOAD='{
  "event_type": "order.paid",
  "data": {
    "order_id": 1001,
    "store_id": 1,
    "customer_id": 456,
    "user_id": 789,
    "amount": 95000,
    "currency": "COP",
    "items": [
      {
        "product_id": 1,
        "product_name": "Producto desde Graf REAL con firma",
        "quantity": 1,
        "unit_price": 95000,
        "total": 95000
      }
    ],
    "paid_at": "2024-01-15T10:30:00.000Z",
    "created_at": "2024-01-15T09:00:00.000Z",
    "updated_at": "2024-01-15T10:30:00.000Z"
  }
}'

# Generar la firma
SIGNATURE=$(echo -n "$PAYLOAD" | openssl dgst -sha256 -hmac "$WEBHOOK_SECRET" | cut -d' ' -f2)

echo "🔐 Enviando webhook con firma HMAC-SHA256 correcta..."
echo "Signature: sha256=$SIGNATURE"
echo ""

# Enviar el webhook
curl -X POST "${GRAF_WEBHOOK_URL}" \
  -H "Content-Type: application/json" \
  -H "x-graf-signature: sha256=$SIGNATURE" \
  -d "$PAYLOAD"

echo ""
echo ""
echo "✅ Webhook enviado. Verifica los logs del Hub Central."
