# Green Hydrogen Marketplace - Deployment Guide

## Overview
Complete deployment guide for the Green Hydrogen Marketplace with fixed pricing, enhanced buyer dashboard, and comprehensive IPFS integration.

## Prerequisites
- Node.js (v16 or higher)
- npm or yarn
- MetaMask wallet
- Pinata account for IPFS storage

## Environment Configuration

### Backend (.env)
```env
# Blockchain Configuration
SERVER_ADMIN_PRIVATE_KEY="your_private_key_here"
ETHEREUM_SEPOLIA_RPC_URL="https://sepolia.infura.io/v3/your_infura_project_id"
SMART_CONTRACT_ADDRESS="your_deployed_contract_address"
VERIFIER_ADDRESS="your_verifier_address"

# Server Configuration
PORT=5000
NODE_ENV=production
USE_MEMORY_STORE=true
JWT_SECRET=your-super-secret-jwt-key-here

# IPFS Configuration (Required for credit lifecycle tracking)
PINATA_API_KEY=your_pinata_api_key
PINATA_SECRET_KEY=your_pinata_secret_key
```

### Frontend (.env)
```env
VITE_API_URL=http://localhost:5000
VITE_SMART_CONTRACT_ADDRESS="your_deployed_contract_address"
VITE_ETHEREUM_SEPOLIA_RPC_URL="https://sepolia.infura.io/v3/your_infura_project_id"
```

## Deployment Steps

### 1. Smart Contract Deployment
```bash
cd smart-contracts
npm install
npx hardhat compile
npx hardhat run scripts/deploy.js --network sepolia
```

### 2. Backend Deployment
```bash
cd backend
npm install
npm start
```

### 3. Frontend Deployment
```bash
cd frontend
npm install
npm run build
npm run preview
```

## Key Features Implemented

### Fixed Credit Pricing
- **Price**: 0.001 ETH per credit (fixed across all transactions)
- **Smart Contract**: `FIXED_PRICE_PER_CREDIT` constant enforces pricing
- **Frontend**: All price displays use fixed pricing with ETH/USD conversion

### Enhanced Buyer Dashboard
- **Purchase History Tab**: Primary view with transaction statistics
- **Marketplace Tab**: Secondary view for browsing available credits
- **Transaction Details**: Full hash display with click-to-copy functionality
- **Status Tracking**: Success, failed, and pending transaction badges

### IPFS Integration (Pinata)
- **Credit Approval**: Automatic IPFS upload on regulatory approval
- **Credit Sales**: Transfer ownership tracking on IPFS
- **Credit Listings**: Status updates when credits are listed for sale
- **Immutable Records**: All credit lifecycle events stored permanently

## Testing

### IPFS Integration Test
```bash
cd backend
node test-ipfs-integration.js
```

### Basic Service Test
```bash
cd backend
node test-ipfs-simple.js
```

## API Endpoints

### Authentication
- `POST /api/users/register` - User registration
- `POST /api/users/login` - User login

### Producer Endpoints
- `POST /api/submissions` - Submit production data
- `GET /api/submissions/my-submissions` - Get producer submissions
- `POST /api/marketplace/list` - List credits for sale

### Buyer Endpoints
- `GET /api/marketplace/listings` - Get marketplace listings
- `POST /api/marketplace/purchase` - Purchase credits
- `GET /api/marketplace/purchase-history` - Get purchase history

### Regulatory Endpoints
- `GET /api/regulatory/submissions/pending` - Get pending submissions
- `PUT /api/regulatory/submissions/:id/approve` - Approve submission

## Security Considerations

### Wallet Integration
- MetaMask required for all blockchain transactions
- Private keys never stored on server
- Transaction verification through blockchain

### IPFS Security
- Pinata API keys secured in environment variables
- Credit metadata encrypted before IPFS upload
- Immutable audit trail for all transactions

### Role-Based Access
- Producer: Submit data, list credits
- Buyer: Purchase credits, view history
- Regulatory: Approve submissions

## Monitoring and Logging

### Backend Logging
- Credit lifecycle events logged with `[CreditLifecycle]` prefix
- IPFS operations logged with `[IPFS]` prefix
- Marketplace transactions logged with `[Marketplace]` prefix

### IPFS Monitoring
- All IPFS uploads return hash for verification
- Failed uploads logged with error details
- Timeout protection (30 seconds) for API calls

## Troubleshooting

### Common Issues

1. **IPFS Upload Failures**
   - Check Pinata API credentials
   - Verify network connectivity
   - Review timeout settings

2. **MetaMask Connection Issues**
   - Ensure correct network (Sepolia testnet)
   - Check contract address configuration
   - Verify sufficient ETH balance

3. **Price Display Issues**
   - Confirm fixed price constant in smart contract
   - Check ETH/USD conversion rate (default: $2000/ETH)
   - Verify frontend price calculations

### Debug Commands
```bash
# Check environment variables
node -e "console.log(process.env.PINATA_API_KEY ? 'SET' : 'MISSING')"

# Test IPFS connection
node test-ipfs-simple.js

# Verify smart contract deployment
npx hardhat verify --network sepolia CONTRACT_ADDRESS
```

## Production Deployment

### Backend (Node.js)
- Use PM2 for process management
- Configure reverse proxy (nginx)
- Enable HTTPS with SSL certificates
- Set up database backups (if using MongoDB)

### Frontend (React)
- Build optimized production bundle
- Deploy to CDN or static hosting
- Configure environment variables
- Enable gzip compression

### Smart Contract
- Deploy to mainnet with proper gas optimization
- Verify contract on Etherscan
- Set up monitoring for contract events
- Configure multi-signature wallet for admin functions

## Support and Maintenance

### Regular Tasks
- Monitor IPFS storage usage on Pinata
- Review transaction logs for errors
- Update smart contract if needed
- Backup user data and transaction history

### Updates
- Frontend updates: `npm run build && deploy`
- Backend updates: Restart server with new code
- Smart contract updates: Deploy new version and update addresses

## Contact Information
For technical support or deployment assistance, refer to the project documentation or contact the development team.
