#!/bin/bash

# Deploy Smart Contracts Script
echo "🚀 Deploying Green Hydrogen Marketplace Smart Contracts..."

# Check if we're in the right directory
if [ ! -f "smart-contracts/package.json" ]; then
    echo "❌ Please run this script from the project root directory"
    exit 1
fi

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo "❌ .env file not found. Please create it from .env.example"
    exit 1
fi

# Load environment variables
source .env

# Check required environment variables
if [ -z "$SERVER_ADMIN_PRIVATE_KEY" ]; then
    echo "❌ SERVER_ADMIN_PRIVATE_KEY not set in .env file"
    exit 1
fi

if [ -z "$POLYGON_MUMBAI_RPC_URL" ]; then
    echo "❌ POLYGON_MUMBAI_RPC_URL not set in .env file"
    exit 1
fi

# Navigate to smart contracts directory
cd smart-contracts

# Install dependencies if not already installed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Compile contracts
echo "🔨 Compiling contracts..."
npx hardhat compile

if [ $? -ne 0 ]; then
    echo "❌ Contract compilation failed"
    exit 1
fi

# Deploy to Sepolia testnet
echo "🚀 Deploying HydrogenMarketplace contract to Ethereum Sepolia..."
npx hardhat run scripts/deploy.js --network sepolia

if [ $? -eq 0 ]; then
    echo "✅ Contracts deployed successfully!"
    echo ""
    echo "📋 Next steps:"
    echo "1. Update SMART_CONTRACT_ADDRESS in your .env file"
    echo "2. Set the verifier address using the setVerifier function"
    echo "3. Restart your backend service to use the new contract address"
else
    echo "❌ Contract deployment failed"
    exit 1
fi
