#!/bin/sh
set -eu

secret="${BETTER_AUTH_SECRET:-}"
if [ "${#secret}" -lt 32 ]; then
  echo "BETTER_AUTH_SECRET must be at least 32 characters long; refusing to start." >&2
  exit 1
fi

cd "$(dirname "$0")/../apps/api"

if [ "${RUN_MIGRATIONS:-false}" = "true" ]; then
  echo "Applying migrations to ${DATABASE_URL:-the default database}"
  bun node_modules/.bin/prisma migrate deploy
fi

exec bun src/main.ts
