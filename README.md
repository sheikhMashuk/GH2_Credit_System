# Green Hydrogen Credit Marketplace

A blockchain-based marketplace for trading Green Hydrogen Credits as NFTs, built on Polygon Mumbai Testnet.

## Overview

This platform enables:
- **Producers** to submit proof of green hydrogen production
- **Verifiers** to review and approve submissions
- **Buyers** to purchase verified Green Hydrogen Credit NFTs

## Workflow

1. Producer signs up and connects crypto wallet
2. Producer submits production proof for verification
3. Verifier reviews and approves submission
4. System mints NFT and lists it for sale automatically
5. Buyers can purchase credits from the marketplace

## Tech Stack

- **Blockchain**: Solidity smart contracts on Polygon Mumbai Testnet
- **Smart Contract Environment**: Hardhat
- **Backend**: Node.js, Express.js, ethers.js
- **Database**: PostgreSQL with Prisma ORM
- **Frontend**: React.js with Vite and TypeScript
- **Styling**: Tailwind CSS
- **Containerization**: Docker & Docker Compose

## Quick Start

1. **Clone and setup environment**:
   ```bash
   git clone <repository-url>
   cd green-hydrogen-marketplace
   cp .env.example .env
   # Edit .env with your configuration
   ```

2. **Start all services**:
   ```bash
   docker-compose up --build
   ```

3. **Access the application**:
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000

## Environment Configuration

Copy `.env.example` to `.env` and configure:

- `DATABASE_URL`: PostgreSQL connection string
- `SERVER_ADMIN_PRIVATE_KEY`: Private key for contract interactions
- `POLYGON_MUMBAI_RPC_URL`: RPC endpoint for Polygon Mumbai
- `SMART_CONTRACT_ADDRESS`: Deployed contract address
- `VERIFIER_ADDRESS`: Ethereum address of the verifier

## Smart Contract Deployment

1. Navigate to smart-contracts directory:
   ```bash
   cd smart-contracts
   npm install
   ```



2. Update `.env` with the deployed contract address

## Development

### Backend Development
```bash
cd backend
npm install
npm run dev
```

### Frontend Development
```bash
cd frontend
npm install
npm run dev
```

### Smart Contract Development
```bash
cd smart-contracts
npm install
npx hardhat compile
npx hardhat test
```

## API Endpoints

- `POST /api/users/signup` - User registration
- `POST /api/submissions` - Submit production proof
- `GET /api/submissions/pending` - Get pending submissions (verifier)
- `POST /api/submissions/:id/verify` - Approve submission (verifier)
- `GET /api/marketplace` - Get active marketplace listings

## Architecture

The system consists of three main components:

1. **Smart Contracts**: Handle NFT minting and marketplace transactions
2. **Backend API**: Manage user data, submissions, and blockchain interactions
3. **Frontend**: User interface for all stakeholders

## Security Features

- Wallet-based authentication
- Role-based access control
- Smart contract ownership patterns
- Secure environment variable management

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

MIT License - see LICENSE file for details
