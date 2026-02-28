#!/bin/sh
set -e

echo "🔄 Running database migrations..."
# Try to deploy migrations, if it fails due to failed migrations, resolve them
npx prisma migrate deploy || (
  echo "⚠️ Migration deploy failed, attempting to resolve..."
  # Mark any failed migrations as rolled back and try db push
  npx prisma db push --accept-data-loss || true
)

echo "🌱 Seeding database with demo data..."
node dist/seed.js || echo "⚠️ Seed failed or already seeded"

echo "🚀 Starting application..."
exec "$@"
