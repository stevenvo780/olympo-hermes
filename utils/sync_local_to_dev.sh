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

LOCAL_DB_HOST="${LOCAL_DB_HOST:-localhost}"
LOCAL_DB_PORT="${LOCAL_DB_PORT:-5432}"
LOCAL_DB_USER="${LOCAL_DB_USER:-postgres}"
LOCAL_DB_NAME="${LOCAL_DB_NAME_LOCAL_TO_DEV:-${LOCAL_DB_NAME:-}}"
LOCAL_DB_PASS="${LOCAL_DB_PASS:-}"

DEV_DB_HOST="${DEV_DB_HOST:-}"
DEV_DB_PORT="${DEV_DB_PORT:-5432}"
DEV_DB_USER="${DEV_DB_USER:-}"
DEV_DB_NAME="${DEV_DB_NAME:-}"
DEV_DB_PASS="${DEV_DB_PASS:-}"
DEV_SSLMODE="${DEV_SSLMODE:-require}"

: "${LOCAL_DB_NAME:?Set LOCAL_DB_NAME or LOCAL_DB_NAME_LOCAL_TO_DEV in utils/.env}"
: "${LOCAL_DB_PASS:?Set LOCAL_DB_PASS in utils/.env}"
: "${DEV_DB_HOST:?Set DEV_DB_HOST in utils/.env}"
: "${DEV_DB_USER:?Set DEV_DB_USER in utils/.env}"
: "${DEV_DB_NAME:?Set DEV_DB_NAME in utils/.env}"
: "${DEV_DB_PASS:?Set DEV_DB_PASS in utils/.env}"

DUMP_FILE="/tmp/${LOCAL_DB_NAME}_to_gcp_$(date +%F_%H%M%S).dump"

echo "Checking local database connection..."
PGPASSWORD="${LOCAL_DB_PASS}" \
  psql -h "${LOCAL_DB_HOST}" -p "${LOCAL_DB_PORT}" -U "${LOCAL_DB_USER}" -d "${LOCAL_DB_NAME}" \
  -c '\q' >/dev/null

echo "Checking remote GCP database connection..."
if ! PGPASSWORD="${DEV_DB_PASS}" \
  psql "sslmode=${DEV_SSLMODE} host=${DEV_DB_HOST} port=${DEV_DB_PORT} user=${DEV_DB_USER} dbname=${DEV_DB_NAME}" \
  -c '\q' >/dev/null 2>&1; then
  echo "ERROR: Cannot connect to remote database. Please verify:"
  echo "  - Host: ${DEV_DB_HOST}"
  echo "  - Port: ${DEV_DB_PORT}"
  echo "  - User: ${DEV_DB_USER}"
  echo "  - Database: ${DEV_DB_NAME}"
  echo "  - Password and SSL settings"
  exit 1
fi

echo "→ Dumping local database ${LOCAL_DB_NAME}@${LOCAL_DB_HOST} ..."
PGPASSWORD="${LOCAL_DB_PASS}" \
  pg_dump -h "${LOCAL_DB_HOST}" -p "${LOCAL_DB_PORT}" -U "${LOCAL_DB_USER}" -d "${LOCAL_DB_NAME}" \
  -Fc -v -f "${DUMP_FILE}"

echo "→ Dropping & recreating remote GCP database ..."
PGPASSWORD="${DEV_DB_PASS}" \
  psql "sslmode=${DEV_SSLMODE} host=${DEV_DB_HOST} port=${DEV_DB_PORT} user=${DEV_DB_USER} dbname=postgres" \
  -v ON_ERROR_STOP=1 -c "DROP DATABASE IF EXISTS \"${DEV_DB_NAME}\";"

PGPASSWORD="${DEV_DB_PASS}" \
  psql "sslmode=${DEV_SSLMODE} host=${DEV_DB_HOST} port=${DEV_DB_PORT} user=${DEV_DB_USER} dbname=postgres" \
  -v ON_ERROR_STOP=1 -c "CREATE DATABASE \"${DEV_DB_NAME}\";"

echo "→ Restoring into remote GCP database ${DEV_DB_NAME}@${DEV_DB_HOST} ..."
PGPASSWORD="${DEV_DB_PASS}" \
  pg_restore --host="${DEV_DB_HOST}" --port="${DEV_DB_PORT}" --username="${DEV_DB_USER}" --dbname="${DEV_DB_NAME}" \
  --no-owner --verbose "${DUMP_FILE}"

echo "→ Cleaning up dump file..."
rm -f "${DUMP_FILE}"

echo "✓ Database sync from local to GCP completed successfully!"
echo "  Source: ${LOCAL_DB_NAME}@${LOCAL_DB_HOST}"
echo "  Destination: ${DEV_DB_NAME}@${DEV_DB_HOST}"