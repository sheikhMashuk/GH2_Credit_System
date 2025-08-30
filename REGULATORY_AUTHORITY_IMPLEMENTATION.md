# Regulatory Authority Implementation

## Overview
This document outlines the complete implementation of the regulatory authority system for the Green Hydrogen Marketplace, including JWT authentication, submission review, and NFT minting functionality.

## Features Implemented

### 1. JWT Authentication System
- **Login Endpoint**: `POST /api/users/login`
- **JWT Token Expiry**: 24 hours (1 day)
- **Default Credentials**:
  - Email: `admin@greenregulator.gov`
  - Password: `RegAuth2024!`

### 2. Regulatory Authority Dashboard
- **Dashboard Statistics**: `GET /api/regulatory/dashboard`
- **View All Submissions**: `GET /api/regulatory/submissions`
- **View Pending Submissions**: `GET /api/regulatory/submissions/pending`
- **View Approved Submissions**: `GET /api/regulatory/submissions/approved`
- **View Rejected Submissions**: `GET /api/regulatory/submissions/rejected`

### 3. Submission Review & Approval
- **Approve Submission**: `PUT /api/regulatory/submissions/:id/approve`
- **Reject Submission**: `PUT /api/regulatory/submissions/:id/reject`
- **NFT Minting**: Automatic NFT minting upon approval using producer's MetaMask wallet

### 4. NFT Integration
- **Smart Contract**: `HydrogenMarketplace.sol`
- **Minting Process**: NFTs are minted from producer's wallet address
- **Marketplace Integration**: Approved credits automatically available for purchase
- **Metadata**: Includes production data, approval details, and verification information

## API Endpoints

### Authentication
```
POST /api/users/login
Content-Type: application/json

{
  "email": "admin@greenregulator.gov",
  "password": "RegAuth2024!"
}

Response:
{
  "message": "Login successful",
  "token": "jwt_token_here",
  "user": {
    "id": "1",
    "name": "Green Energy Regulatory Authority",
    "email": "admin@greenregulator.gov",
    "role": "REGULATORY_AUTHORITY"
  }
}
```

### Dashboard
```
GET /api/regulatory/dashboard
Authorization: Bearer <jwt_token>

Response:
{
  "message": "Dashboard data retrieved successfully",
  "stats": {
    "total": 5,
    "pending": 2,
    "approved": 2,
    "rejected": 1
  },
  "recentSubmissions": [...]
}
```

### View Submissions
```
GET /api/regulatory/submissions/pending
Authorization: Bearer <jwt_token>

Response:
{
  "message": "Pending submissions retrieved successfully",
  "submissions": [
    {
      "id": "1",
      "status": "PENDING",
      "productionData": {
        "productionDate": "2025-08-07",
        "quantity": 1,
        "location": "1",
        "additionalNotes": "df"
      },
      "price": "1",
      "createdAt": "2025-08-30T13:27:34.453Z",
      "producer": {
        "id": "2",
        "name": "User 0x2157...5101",
        "walletAddress": "0x215768f2a31f30fb62a53999238bb52039c95101"
      }
    }
  ],
  "total": 1
}
```

### Approve Submission
```
PUT /api/regulatory/submissions/1/approve
Authorization: Bearer <jwt_token>

Response:
{
  "message": "Submission approved and NFT minted successfully",
  "submission": {
    "id": "1",
    "status": "APPROVED",
    "tokenId": "1234",
    "verifiedBy": "Green Energy Regulatory Authority",
    "verifiedAt": "2025-08-30T19:13:26.000Z",
    "transactionHash": "0xabc123...",
    "producer": {
      "id": "2",
      "name": "User 0x2157...5101",
      "walletAddress": "0x215768f2a31f30fb62a53999238bb52039c95101"
    }
  },
  "nft": {
    "tokenId": "1234",
    "transactionHash": "0xabc123...",
    "blockNumber": 123456
  }
}
```

### Reject Submission
```
PUT /api/regulatory/submissions/1/reject
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "reason": "Insufficient documentation provided"
}

Response:
{
  "message": "Submission rejected successfully",
  "submission": {
    "id": "1",
    "status": "REJECTED",
    "verifiedBy": "Green Energy Regulatory Authority",
    "verifiedAt": "2025-08-30T19:13:26.000Z",
    "rejectionReason": "Insufficient documentation provided",
    "producer": {
      "id": "2",
      "name": "User 0x2157...5101",
      "walletAddress": "0x215768f2a31f30fb62a53999238bb52039c95101"
    }
  }
}
```

## Frontend Components

### 1. Regulatory Login (`RegulatoryLogin.tsx`)
- Email/password authentication form
- JWT token handling
- Error display and loading states

### 2. Regulatory Dashboard (`RegulatoryDashboard.tsx`)
- Tabbed interface (Pending, Approved, Rejected)
- Real-time submission updates (30-second polling)
- Approve/Reject buttons for pending submissions
- Detailed submission information display

### 3. Regulatory Page (`RegulatoryPage.tsx`)
- Route protection for regulatory authority users
- Conditional rendering based on authentication status

## File Structure

### Backend Files
```
backend/src/
├── api/
│   ├── controllers/
│   │   ├── regulatory.controller.js     # New dedicated controller
│   │   ├── submission.controller.js     # Updated for NFT minting
│   │   └── user.controller.js          # JWT login implementation
│   └── routes/
│       └── regulatory.routes.js        # Updated routes
├── middleware/
│   └── auth.js                        # JWT authentication middleware
├── models/
│   ├── InMemoryUser.js               # User storage with regulatory support
│   └── InMemorySubmission.js         # Submission storage
├── services/
│   └── blockchain.service.js         # NFT minting service
└── data/
    ├── users.json                    # Includes regulatory authority user
    └── submissions.json              # Submission data
```

### Frontend Files
```
frontend/src/
├── components/
│   ├── RegulatoryLogin.tsx           # Login component
│   └── RegulatoryDashboard.tsx       # Dashboard component
├── pages/
│   └── RegulatoryPage.tsx           # Main regulatory page
├── context/
│   └── AuthContext.tsx              # Updated with JWT support
└── utils/
    └── api.ts                       # API service with JWT headers
```

## Security Features

1. **JWT Token Validation**: All regulatory endpoints require valid JWT tokens
2. **Role-Based Access Control**: Only users with `REGULATORY_AUTHORITY` role can access endpoints
3. **Token Expiry**: JWT tokens expire after 24 hours
4. **Secure Password Storage**: Passwords are hashed using bcrypt
5. **Input Validation**: All inputs are validated before processing

## NFT Minting Process

1. **Submission Approval**: Regulatory authority approves a pending submission
2. **Producer Wallet Retrieval**: System fetches producer's MetaMask wallet address
3. **Metadata Creation**: NFT metadata includes production data and approval details
4. **Smart Contract Interaction**: NFT is minted using `verifyAndMintToListing` function
5. **Marketplace Listing**: Approved NFT is automatically listed for sale
6. **Database Update**: Submission status updated with NFT details

## Usage Instructions

### For Regulatory Authority:

1. **Login**:
   - Navigate to `/regulatory` page
   - Use credentials: `admin@greenregulator.gov` / `RegAuth2024!`
   - JWT token valid for 24 hours

2. **Review Submissions**:
   - View pending submissions in dashboard
   - See producer details including wallet address
   - Review production data and pricing

3. **Approve/Reject**:
   - Click "Approve" to mint NFT and list in marketplace
   - Click "Reject" to decline with optional reason
   - View approved/rejected submissions in respective tabs

4. **Monitor Activity**:
   - Dashboard shows real-time statistics
   - Recent submissions displayed with status
   - Automatic refresh every 30 seconds

### For Producers:
- Submit production credits via producer dashboard
- Receive NFT in MetaMask wallet upon approval
- NFT automatically listed in marketplace for sale

### For Buyers:
- Browse approved credits in marketplace
- Purchase NFTs directly from smart contract
- Payment goes to producer's wallet address

## Testing

The system includes a test script (`test-regulatory-flow.js`) that validates:
- JWT token generation and validation
- Submission retrieval and filtering
- Producer information lookup
- NFT minting simulation
- Database updates
- Dashboard statistics

## Environment Variables

Ensure the following environment variables are set:
```
JWT_SECRET=your-secret-key
DEFAULT_PRODUCER_ADDRESS=0x... (fallback wallet address)
```

## Deployment Notes

1. **Database**: Currently uses in-memory storage with file persistence
2. **Blockchain**: Configured for Ethereum Sepolia testnet
3. **Smart Contract**: Deployed HydrogenMarketplace contract required
4. **MetaMask**: Required for producer wallet integration

This implementation provides a complete regulatory authority system with secure authentication, comprehensive submission management, and seamless NFT minting integration.
