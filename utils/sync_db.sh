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

REMOTE_DB_HOST="${REMOTE_DB_HOST:-}"
REMOTE_DB_PORT="${REMOTE_DB_PORT:-5432}"
REMOTE_DB_USER="${REMOTE_DB_USER:-}"
REMOTE_DB_NAME="${REMOTE_DB_NAME:-}"
REMOTE_DB_PASS="${REMOTE_DB_PASS:-}"
REMOTE_SSLMODE="${REMOTE_SSLMODE:-require}"

LOCAL_DB_HOST="${LOCAL_DB_HOST:-localhost}"
LOCAL_DB_PORT="${LOCAL_DB_PORT:-5432}"
LOCAL_DB_USER="${LOCAL_DB_USER:-postgres}"
LOCAL_DB_NAME="${LOCAL_DB_NAME:-}"
LOCAL_DB_PASS="${LOCAL_DB_PASS:-}"

: "${REMOTE_DB_HOST:?Set REMOTE_DB_HOST in utils/.env}"
: "${REMOTE_DB_USER:?Set REMOTE_DB_USER in utils/.env}"
: "${REMOTE_DB_NAME:?Set REMOTE_DB_NAME in utils/.env}"
: "${REMOTE_DB_PASS:?Set REMOTE_DB_PASS in utils/.env}"
: "${LOCAL_DB_NAME:?Set LOCAL_DB_NAME in utils/.env}"
: "${LOCAL_DB_PASS:?Set LOCAL_DB_PASS in utils/.env}"

DUMP_FILE="/tmp/${REMOTE_DB_NAME}_$(date +%F_%H%M%S).dump"

echo "Checking remote credentials..."
PGPASSWORD="${REMOTE_DB_PASS}" \
  psql "sslmode=${REMOTE_SSLMODE} host=${REMOTE_DB_HOST} port=${REMOTE_DB_PORT} user=${REMOTE_DB_USER} dbname=${REMOTE_DB_NAME}" \
  -c '\q' >/dev/null

echo "→ Dumping ${REMOTE_DB_NAME}@${REMOTE_DB_HOST} ..."
PGPASSWORD="${REMOTE_DB_PASS}" \
  pg_dump "sslmode=${REMOTE_SSLMODE} host=${REMOTE_DB_HOST} port=${REMOTE_DB_PORT} user=${REMOTE_DB_USER} dbname=${REMOTE_DB_NAME}" \
  -Fc -v -f "${DUMP_FILE}"

echo "→ Dropping & recreating local DB ..."
PGPASSWORD="${LOCAL_DB_PASS}" \
  psql  -h "${LOCAL_DB_HOST}" -p "${LOCAL_DB_PORT}" -U "${LOCAL_DB_USER}" \
  -v ON_ERROR_STOP=1 -c "DROP DATABASE IF EXISTS \"${LOCAL_DB_NAME}\";"
PGPASSWORD="${LOCAL_DB_PASS}" \
  createdb -h "${LOCAL_DB_HOST}" -p "${LOCAL_DB_PORT}" -U "${LOCAL_DB_USER}" "${LOCAL_DB_NAME}"

echo "→ Restoring into ${LOCAL_DB_NAME}@${LOCAL_DB_HOST} ..."
PGPASSWORD="${LOCAL_DB_PASS}" \
  pg_restore -h "${LOCAL_DB_HOST}" -p "${LOCAL_DB_PORT}" -U "${LOCAL_DB_USER}" \
  -d "${LOCAL_DB_NAME}" --no-owner --verbose "${DUMP_FILE}"

echo "✓ Sync finished."
