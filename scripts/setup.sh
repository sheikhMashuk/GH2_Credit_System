#!/bin/bash

# Green Hydrogen Credit Marketplace - Setup Script
echo "🌱 Setting up Green Hydrogen Credit Marketplace..."

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    echo "📝 Creating .env file from template..."
    cp .env.example .env
    echo "⚠️  Please edit .env file with your configuration before continuing."
    echo "   Required: SERVER_ADMIN_PRIVATE_KEY, SMART_CONTRACT_ADDRESS, VERIFIER_ADDRESS"
    read -p "Press Enter after updating .env file..."
fi

# Install smart contract dependencies
echo "📦 Installing smart contract dependencies..."
cd smart-contracts
npm install
cd ..

# Install backend dependencies
echo "📦 Installing backend dependencies..."
cd backend
npm install
cd ..

# Install frontend dependencies
echo "📦 Installing frontend dependencies..."
cd frontend
npm install
cd ..

echo "✅ Dependencies installed successfully!"

# Build and start services
echo "🚀 Building and starting services..."
docker-compose up --build -d

echo "⏳ Waiting for services to start..."
sleep 10

# Check if services are running
echo "🔍 Checking service status..."
docker-compose ps

echo ""
echo "🎉 Setup complete!"
echo ""
echo "📋 Next steps:"
echo "1. Deploy smart contracts: cd smart-contracts && npm run deploy:sepolia"
echo "2. Update SMART_CONTRACT_ADDRESS in .env file"
echo "3. Run database migrations: docker-compose exec backend npx prisma db push"
echo "4. Access the application:"
echo "   - Frontend: http://localhost:3000"
echo "   - Backend API: http://localhost:5000"
echo ""
echo "🔧 Useful commands:"
echo "   - View logs: docker-compose logs -f"
echo "   - Stop services: docker-compose down"
echo "   - Restart services: docker-compose restart"
