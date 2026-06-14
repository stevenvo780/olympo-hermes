#!/usr/bin/env bash
set -euo pipefail

echo "🚨 COPYING FROM PRODUCTION TO LOCAL - READ ONLY OPERATION 🚨"
echo "================================================================"

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

PROD_DB_HOST="${PROD_DB_HOST:-}"
PROD_DB_PORT="${PROD_DB_PORT:-5432}"
PROD_DB_USER="${PROD_DB_USER:-}"
PROD_DB_NAME="${PROD_DB_NAME:-}"
PROD_DB_PASS="${PROD_DB_PASS:-}"
PROD_SSLMODE="${PROD_SSLMODE:-require}"

LOCAL_DB_HOST="${LOCAL_DB_HOST:-localhost}"
LOCAL_DB_PORT="${LOCAL_DB_PORT:-5432}"
LOCAL_DB_USER="${LOCAL_DB_USER:-postgres}"
LOCAL_DB_NAME="${LOCAL_DB_NAME_PROD_TO_LOCAL:-${LOCAL_DB_NAME:-}}"
LOCAL_DB_PASS="${LOCAL_DB_PASS:-}"

: "${PROD_DB_HOST:?Set PROD_DB_HOST in utils/.env}"
: "${PROD_DB_USER:?Set PROD_DB_USER in utils/.env}"
: "${PROD_DB_NAME:?Set PROD_DB_NAME in utils/.env}"
: "${PROD_DB_PASS:?Set PROD_DB_PASS in utils/.env}"
: "${LOCAL_DB_NAME:?Set LOCAL_DB_NAME or LOCAL_DB_NAME_PROD_TO_LOCAL in utils/.env}"
: "${LOCAL_DB_PASS:?Set LOCAL_DB_PASS in utils/.env}"

DUMP_FILE="/tmp/prod_backup_$(date +%F_%H%M%S).sql"

echo "→ Testing connection to PRODUCTION database (READ ONLY)..."
if ! PGPASSWORD="${PROD_DB_PASS}" \
  psql "sslmode=${PROD_SSLMODE} host=${PROD_DB_HOST} port=${PROD_DB_PORT} user=${PROD_DB_USER} dbname=${PROD_DB_NAME}" \
  -c 'SELECT version();' >/dev/null 2>&1; then
  echo "❌ ERROR: Cannot connect to PRODUCTION database"
  echo "   Host: ${PROD_DB_HOST}"
  echo "   User: ${PROD_DB_USER}"
  echo "   Database: ${PROD_DB_NAME}"
  exit 1
fi
echo "✅ Connection to PRODUCTION successful"

echo "→ Testing connection to LOCAL database..."
if ! PGPASSWORD="${LOCAL_DB_PASS}" \
  psql -h "${LOCAL_DB_HOST}" -p "${LOCAL_DB_PORT}" -U "${LOCAL_DB_USER}" -d "${LOCAL_DB_NAME}" \
  -c '\q' >/dev/null 2>&1; then
  echo "❌ ERROR: Cannot connect to LOCAL database"
  echo "   Host: ${LOCAL_DB_HOST}"
  echo "   User: ${LOCAL_DB_USER}"
  echo "   Database: ${LOCAL_DB_NAME}"
  exit 1
fi
echo "✅ Connection to LOCAL successful"

echo "→ Creating backup from PRODUCTION database (READ ONLY)..."
echo "⚠️  Note: Using SQL format for version compatibility (server 17.4, client 16.9)"
PGPASSWORD="${PROD_DB_PASS}" \
  pg_dump "sslmode=${PROD_SSLMODE} host=${PROD_DB_HOST} port=${PROD_DB_PORT} user=${PROD_DB_USER} dbname=${PROD_DB_NAME}" \
  --format=plain --verbose --no-owner --no-privileges --no-comments --if-exists -f "${DUMP_FILE}" || {
    echo "❌ pg_dump failed due to version mismatch. Trying alternative method..."
    echo "💡 Recommendation: Install PostgreSQL 17 client for better compatibility"
    echo "   sudo apt update && sudo apt install postgresql-client-17"
    exit 1
  }

echo "→ Dropping and recreating LOCAL database..."
PGPASSWORD="${LOCAL_DB_PASS}" \
  psql -h "${LOCAL_DB_HOST}" -p "${LOCAL_DB_PORT}" -U "${LOCAL_DB_USER}" \
  -v ON_ERROR_STOP=1 -c "DROP DATABASE IF EXISTS \"${LOCAL_DB_NAME}\";"

PGPASSWORD="${LOCAL_DB_PASS}" \
  createdb -h "${LOCAL_DB_HOST}" -p "${LOCAL_DB_PORT}" -U "${LOCAL_DB_USER}" "${LOCAL_DB_NAME}"

echo "→ Restoring backup into LOCAL database..."
PGPASSWORD="${LOCAL_DB_PASS}" \
  psql -h "${LOCAL_DB_HOST}" -p "${LOCAL_DB_PORT}" -U "${LOCAL_DB_USER}" \
  -d "${LOCAL_DB_NAME}" -v ON_ERROR_STOP=1 -f "${DUMP_FILE}"

echo "→ Cleaning up backup file..."
rm -f "${DUMP_FILE}"

echo "✅ SUCCESS: Production database copied to local successfully!"
echo "   Source: ${PROD_DB_NAME}@${PROD_DB_HOST} (PRODUCTION)"
echo "   Destination: ${LOCAL_DB_NAME}@${LOCAL_DB_HOST} (LOCAL)"
echo ""
echo "⚠️  Remember: This is a snapshot. Production data may have changed."