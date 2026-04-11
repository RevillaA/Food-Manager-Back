#!/bin/sh
set -eu

DB_HOST="postgres"
DB_USER="${POSTGRES_USER:-postgres}"
DB_NAME="${POSTGRES_DB:-restaurant_db}"
export PGPASSWORD="${POSTGRES_PASSWORD:-123456}"

printf 'Waiting for PostgreSQL at %s...\n' "$DB_HOST"
until pg_isready -h "$DB_HOST" -U "$DB_USER" -d "$DB_NAME" >/dev/null 2>&1; do
  sleep 2
done
printf 'PostgreSQL is ready. Running migrations...\n'

psql -h "$DB_HOST" -U "$DB_USER" -d "$DB_NAME" -v ON_ERROR_STOP=1 -c "
CREATE TABLE IF NOT EXISTS public.schema_migrations (
  filename VARCHAR(255) PRIMARY KEY,
  applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
"

for migration_file in /migrations/*.sql; do
  [ -f "$migration_file" ] || continue

  migration_name="$(basename "$migration_file")"
  already_applied="$(psql -h "$DB_HOST" -U "$DB_USER" -d "$DB_NAME" -tAc "SELECT 1 FROM public.schema_migrations WHERE filename='${migration_name}'")"

  if [ "$already_applied" = "1" ]; then
    printf 'Skipping migration (already applied): %s\n' "$migration_name"
    continue
  fi

  printf 'Applying migration: %s\n' "$migration_name"
  psql -h "$DB_HOST" -U "$DB_USER" -d "$DB_NAME" -v ON_ERROR_STOP=1 -f "$migration_file"
  psql -h "$DB_HOST" -U "$DB_USER" -d "$DB_NAME" -v ON_ERROR_STOP=1 -c "INSERT INTO public.schema_migrations (filename) VALUES ('${migration_name}');"
done

printf 'Migrations completed successfully.\n'
