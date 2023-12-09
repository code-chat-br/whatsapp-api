echo "Deploying database..."
echo "DATABASE_URL=$DATABASE_URL"
npx prisma migrate deploy
npx prisma generate
