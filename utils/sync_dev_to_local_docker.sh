#!/usr/bin/env bash
set -euo pipefail

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

DEV_DB_HOST="${DEV_DB_HOST:-}"
DEV_DB_PORT="${DEV_DB_PORT:-5432}"
DEV_DB_USER="${DEV_DB_USER:-}"
DEV_DB_NAME="${DEV_DB_NAME:-}"
DEV_DB_PASS="${DEV_DB_PASS:-}"
DEV_SSLMODE="${DEV_SSLMODE:-require}"

LOCAL_DB_HOST="${LOCAL_DB_HOST:-localhost}"
LOCAL_DB_PORT="${LOCAL_DB_PORT:-5432}"
LOCAL_DB_USER="${LOCAL_DB_USER:-postgres}"
LOCAL_DB_PASS="${LOCAL_DB_PASS:-}"
LOCAL_DB_NAME="${LOCAL_DB_NAME_DEV_TO_LOCAL:-${LOCAL_DB_NAME:-}}"
LOCAL_DB_CONTAINER_NAME="${LOCAL_DB_CONTAINER_NAME:-graf-postgres}"

: "${DEV_DB_HOST:?Set DEV_DB_HOST in utils/.env}"
: "${DEV_DB_USER:?Set DEV_DB_USER in utils/.env}"
: "${DEV_DB_NAME:?Set DEV_DB_NAME in utils/.env}"
: "${DEV_DB_PASS:?Set DEV_DB_PASS in utils/.env}"
: "${LOCAL_DB_NAME:?Set LOCAL_DB_NAME or LOCAL_DB_NAME_DEV_TO_LOCAL in utils/.env}"
: "${LOCAL_DB_PASS:?Set LOCAL_DB_PASS in utils/.env}"

DUMP_FILE="/tmp/dev_to_docker_$(date +%F_%H%M%S).sql"

echo "→ Verificando conexión a base de datos de DESARROLLO (GCP)..."
if ! PGPASSWORD="${DEV_DB_PASS}" \
  psql "sslmode=${DEV_SSLMODE} host=${DEV_DB_HOST} port=${DEV_DB_PORT} user=${DEV_DB_USER} dbname=${DEV_DB_NAME}" \
  -c 'SELECT version();' >/dev/null 2>&1; then
  echo "❌ ERROR: No se puede conectar a la base de datos de DESARROLLO"
  echo "   Host: ${DEV_DB_HOST}"
  echo "   User: ${DEV_DB_USER}"
  echo "   Database: ${DEV_DB_NAME}"
  echo "   SSL Mode: ${DEV_SSLMODE}"
  exit 1
fi
echo "✅ Conexión a DESARROLLO exitosa"

echo "→ Verificando que Docker PostgreSQL esté corriendo..."
if ! docker ps | grep -q "${LOCAL_DB_CONTAINER_NAME}"; then
  echo "❌ ERROR: El contenedor ${LOCAL_DB_CONTAINER_NAME} no está corriendo"
  echo "   Ejecuta: docker compose up -d postgres"
  exit 1
fi
echo "✅ Docker PostgreSQL está corriendo"

echo "→ Verificando conexión a PostgreSQL local (Docker)..."
if ! PGPASSWORD="${LOCAL_DB_PASS}" \
  psql -h "${LOCAL_DB_HOST}" -p "${LOCAL_DB_PORT}" -U "${LOCAL_DB_USER}" -d "${LOCAL_DB_NAME}" \
  -c '\q' >/dev/null 2>&1; then
  echo "❌ ERROR: No se puede conectar a PostgreSQL local"
  echo "   Host: ${LOCAL_DB_HOST}"
  echo "   User: ${LOCAL_DB_USER}"
  echo "   Database: ${LOCAL_DB_NAME}"
  echo "   ¿Está corriendo el contenedor? docker compose ps"
  exit 1
fi
echo "✅ Conexión a PostgreSQL local exitosa"

echo "→ Creando backup desde DESARROLLO (GCP)..."
echo "⚠️  Usando Docker PostgreSQL 17 para compatibilidad de versiones"
docker run --rm \
  -e PGPASSWORD="${DEV_DB_PASS}" \
  postgres:17-alpine \
  pg_dump "sslmode=${DEV_SSLMODE} host=${DEV_DB_HOST} port=${DEV_DB_PORT} user=${DEV_DB_USER} dbname=${DEV_DB_NAME}" \
  --format=plain --verbose --no-owner --no-privileges --clean --if-exists > "${DUMP_FILE}"

echo "→ Eliminando y recreando la base de datos local..."
PGPASSWORD="${LOCAL_DB_PASS}" \
  psql -h "${LOCAL_DB_HOST}" -p "${LOCAL_DB_PORT}" -U "${LOCAL_DB_USER}" \
  -v ON_ERROR_STOP=1 -c "DROP DATABASE IF EXISTS \"${LOCAL_DB_NAME}\";"

PGPASSWORD="${LOCAL_DB_PASS}" \
  createdb -h "${LOCAL_DB_HOST}" -p "${LOCAL_DB_PORT}" -U "${LOCAL_DB_USER}" "${LOCAL_DB_NAME}"

echo "→ Restaurando backup en PostgreSQL local..."
echo "⚠️  Filtrando configuraciones incompatibles..."
# Filtrar líneas problemáticas antes de restaurar
grep -v "transaction_timeout" "${DUMP_FILE}" > "${DUMP_FILE}.filtered"
PGPASSWORD="${LOCAL_DB_PASS}" \
  psql -h "${LOCAL_DB_HOST}" -p "${LOCAL_DB_PORT}" -U "${LOCAL_DB_USER}" \
  -d "${LOCAL_DB_NAME}" -v ON_ERROR_STOP=1 -f "${DUMP_FILE}.filtered"

echo "→ Limpiando archivo de backup..."
rm -f "${DUMP_FILE}" "${DUMP_FILE}.filtered"

echo ""
echo "✅ SINCRONIZACIÓN COMPLETADA EXITOSAMENTE!"
echo "================================================"
echo "   Origen: ${DEV_DB_NAME}@${DEV_DB_HOST} (DESARROLLO GCP)"
echo "   Destino: ${LOCAL_DB_NAME}@${LOCAL_DB_HOST} (DOCKER LOCAL)"
echo ""
echo "🔗 Tu aplicación Graf ahora puede usar los datos de desarrollo:"
echo "   - Backend Graf: http://localhost:8080"
echo "   - Admin Panel: http://localhost:3001"
echo "   - Client Store: http://localhost:5000"
echo "   - PostgreSQL: localhost:5432"
echo ""
echo "⚠️  Nota: Este es un snapshot. Los datos en desarrollo pueden cambiar."
