# Deployment Guide

This guide walks you through deploying the Green Hydrogen Credit Marketplace.

## Prerequisites

- Node.js 18+ installed
- Docker and Docker Compose installed
- MetaMask wallet with Polygon Mumbai testnet configured
- Test MATIC tokens for deployment and transactions

## Quick Start

1. **Clone and Setup**
   ```bash
   git clone <repository-url>
   cd green-hydrogen-marketplace
   ./scripts/setup.sh
   ```

2. **Configure Environment**

3. **Deploy Smart Contracts**
   ```bash
   ./scripts/deploy-contracts.sh
   ```

4. **Start Services**
   ```bash
   docker-compose up --build
   ```

## Configuration

### Required Environment Variables

```env
# Database
DATABASE_URL="postgresql://postgres:password@db:5432/hydrogen_marketplace"

# Blockchain Configuration
SERVER_ADMIN_PRIVATE_KEY="your_private_key_here"
POLYGON_MUMBAI_RPC_URL="https://rpc-mumbai.maticvigil.com"
SMART_CONTRACT_ADDRESS="0x..." # Set after deployment
VERIFIER_ADDRESS="0x..." # Wallet address of the verifier

# Server
PORT=5000
NODE_ENV=development

# Frontend
VITE_API_URL=http://localhost:5000
VITE_SMART_CONTRACT_ADDRESS="0x..." # Same as SMART_CONTRACT_ADDRESS
VITE_POLYGON_MUMBAI_RPC_URL="https://rpc-mumbai.maticvigil.com"
```

### Getting Test MATIC

1. Visit [Polygon Faucet](https://faucet.polygon.technology/)
2. Select Mumbai network
3. Enter your wallet address
4. Request test MATIC tokens

## Step-by-Step Deployment

### 1. Smart Contract Deployment

```bash
cd smart-contracts
npm install
npx hardhat compile
npx hardhat run scripts/deploy.js --network mumbai
```

Note the deployed contract address and update your `.env` file.

### 2. Database Setup

```bash
# Start database
docker-compose up -d db

# Run migrations
cd backend
npm install
npx prisma db push

# Optional: Seed database
npx prisma db seed
```

### 3. Backend Deployment

```bash
cd backend
npm install
npm start
```

The API will be available at `http://localhost:5000`

### 4. Frontend Deployment

```bash
cd frontend
npm install
npm run build
npm run preview
```

The frontend will be available at `http://localhost:3000`

## Docker Deployment

For production deployment using Docker:

```bash
# Build and start all services
docker-compose up --build -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

## Verification

1. **Check API Health**
   ```bash
   curl http://localhost:5000/health
   ```

2. **Check Frontend**
   - Open http://localhost:3000
   - Connect MetaMask wallet
   - Ensure you're on Mumbai testnet

3. **Test Blockchain Connection**
   ```bash
   curl http://localhost:5000/api/marketplace/connection/status
   ```

## Setting Up Roles

### Creating a Verifier

1. Connect wallet as admin
2. Use the API to update user role:
   ```bash
   curl -X PUT http://localhost:5000/api/users/{user-id}/role \
     -H "Content-Type: application/json" \
     -d '{"role": "VERIFIER"}'
   ```

### Setting Verifier Address in Contract

```bash
cd smart-contracts
npx hardhat console --network mumbai

# In the console:
const contract = await ethers.getContractAt("HydrogenMarketplace", "CONTRACT_ADDRESS");
await contract.setVerifier("VERIFIER_WALLET_ADDRESS");
```

## Troubleshooting

### Common Issues

1. **Contract deployment fails**
   - Check you have enough test MATIC
   - Verify RPC URL is correct
   - Ensure private key is valid

2. **Database connection fails**
   - Check PostgreSQL is running
   - Verify DATABASE_URL is correct
   - Run `docker-compose up db` first

3. **Frontend can't connect to MetaMask**
   - Ensure MetaMask is installed
   - Switch to Mumbai testnet
   - Check contract address is set

4. **API returns 500 errors**
   - Check backend logs: `docker-compose logs backend`
   - Verify environment variables
   - Ensure database is migrated

### Logs and Debugging

```bash
# View all service logs
docker-compose logs -f

# View specific service logs
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f db

# Access database
docker-compose exec db psql -U postgres -d hydrogen_marketplace
```

## Production Considerations

1. **Security**
   - Use strong passwords for database
   - Store private keys securely (consider using AWS Secrets Manager)
   - Enable HTTPS
   - Set up proper CORS policies

2. **Scalability**
   - Use managed database service
   - Implement Redis for caching
   - Set up load balancers
   - Use CDN for frontend assets

3. **Monitoring**
   - Set up application monitoring (e.g., Sentry)
   - Monitor blockchain transactions
   - Set up alerts for failed transactions

4. **Backup**
   - Regular database backups
   - Backup private keys securely
   - Document recovery procedures

## Support

For issues and questions:
1. Check the troubleshooting section
2. Review application logs
3. Verify environment configuration
4. Test individual components separately
