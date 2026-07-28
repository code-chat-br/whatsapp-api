#!/bin/bash

# WhatsApp API Setup Script
# This script will set up and start the WhatsApp API with PostgreSQL

echo "🚀 WhatsApp API Setup Script"
echo "=============================="
echo ""

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker and try again."
    exit 1
fi

echo "✅ Docker is running"
echo ""

# Step 1: Start PostgreSQL
echo "📦 Step 1: Setting up PostgreSQL..."
echo ""

# Check if container already exists
if docker ps -a | grep -q whatsapp-postgres; then
    echo "   PostgreSQL container already exists."
    # Check if it's running
    if docker ps | grep -q whatsapp-postgres; then
        echo "   ✅ PostgreSQL is already running"
    else
        echo "   🔄 Starting existing PostgreSQL container..."
        docker start whatsapp-postgres
        sleep 2
    fi
else
    echo "   🆕 Creating new PostgreSQL container..."
    docker run --name whatsapp-postgres \
      -e POSTGRES_PASSWORD=whatsapp123 \
      -e POSTGRES_DB=whatsapp \
      -p 5432:5432 \
      -d postgres:15

    echo "   ⏳ Waiting for PostgreSQL to be ready..."
    sleep 5
fi

echo "   ✅ PostgreSQL is ready on port 5432"
echo ""

# Step 2: Update .env
echo "📝 Step 2: Updating .env configuration..."

if [ ! -f .env ]; then
    echo "   Copying .env.dev to .env..."
    cp .env.dev .env
fi

# Update DATABASE_URL in .env
if grep -q "DATABASE_URL=postgres://\[USER\]" .env; then
    echo "   Updating DATABASE_URL..."
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        sed -i '' 's|DATABASE_URL=postgres://\[USER\]:\[PASS\]@\[HOST\]:\[PORT\]/DATABASE|DATABASE_URL=postgres://postgres:whatsapp123@localhost:5432/whatsapp|' .env
    else
        # Linux
        sed -i 's|DATABASE_URL=postgres://\[USER\]:\[PASS\]@\[HOST\]:\[PORT\]/DATABASE|DATABASE_URL=postgres://postgres:whatsapp123@localhost:5432/whatsapp|' .env
    fi
    echo "   ✅ DATABASE_URL updated"
else
    echo "   ✅ DATABASE_URL already configured"
fi

echo ""

# Step 3: Install dependencies
echo "📦 Step 3: Installing dependencies..."
if [ ! -d "node_modules" ]; then
    npm install
    echo "   ✅ Dependencies installed"
else
    echo "   ✅ Dependencies already installed"
fi
echo ""

# Step 4: Run migrations
echo "🗄️  Step 4: Setting up database schema..."
npx prisma migrate deploy
echo "   ✅ Database schema ready"
echo ""

# Step 5: Start server
echo "🎉 Step 5: Starting WhatsApp API server..."
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  WhatsApp API will start on: http://localhost:8084"
echo "  Swagger docs: http://localhost:8084/docs"
echo "  Press Ctrl+C to stop the server"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "💡 Next steps after server starts:"
echo "   1. Create an instance: See QUICK_SETUP.md Step 5"
echo "   2. Connect to WhatsApp: See QUICK_SETUP.md Step 6"
echo "   3. Set up webhook: See QUICK_SETUP.md Step 8"
echo "   4. Start coordinator: npm run whatsapp-coordinator"
echo ""
echo "Starting server in 3 seconds..."
sleep 3

npm run start:dev
