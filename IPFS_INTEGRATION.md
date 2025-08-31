# IPFS Integration with Pinata for Green Hydrogen Credits

## Overview

This implementation integrates IPFS (InterPlanetary File System) via Pinata for decentralized storage of hydrogen credit metadata, while storing essential data and IPFS hashes on the blockchain.

## Architecture

### Data Storage Strategy
- **Blockchain**: Stores essential data (producer, quantity, credits, IPFS hash, approval status)
- **IPFS**: Stores complete metadata (production details, verification data, certificates)

### Benefits
- ✅ **Decentralized**: Credit data stored on IPFS, not centralized servers
- ✅ **Immutable**: Once stored, credit data cannot be altered
- ✅ **Cost Efficient**: Large metadata on IPFS, only hash on blockchain
- ✅ **Verifiable**: Anyone can verify credit authenticity via IPFS hash
- ✅ **Scalable**: Unlimited metadata storage without blockchain bloat

## Implementation Components

### 1. IPFS Service (`backend/src/services/ipfs.service.js`)
- Pinata API integration for IPFS storage
- JSON metadata pinning
- File attachment support
- Credit metadata formatting
- Verification hash generation

### 2. Enhanced Smart Contract (`smart-contracts/contracts/HydrogenMarketplaceIPFS.sol`)
- Credit storage with IPFS hash
- Marketplace functionality
- Event emission for IPFS tracking
- Credit verification methods

### 3. Updated Blockchain Service (`backend/src/services/blockchain.service.js`)
- IPFS integration in credit generation
- Metadata storage before blockchain transaction
- Updated credit ID in IPFS after blockchain confirmation

## Credit Metadata Structure

```json
{
  "version": "1.0",
  "type": "green-hydrogen-credit",
  "creditId": "123",
  "producer": {
    "address": "0x...",
    "name": "Producer Name"
  },
  "production": {
    "date": "2025-01-01",
    "quantity": 100,
    "location": "Location",
    "method": "Electrolysis",
    "additionalNotes": "Notes"
  },
  "credits": {
    "amount": 10,
    "generatedAt": "2025-01-01T00:00:00Z",
    "approvedBy": "regulatory-authority",
    "approvedAt": "2025-01-01T00:00:00Z"
  },
  "verification": {
    "submissionId": "sub123",
    "status": "APPROVED",
    "verificationHash": "sha256hash"
  },
  "metadata": {
    "createdAt": "2025-01-01T00:00:00Z",
    "standard": "GH2-Credit-v1.0",
    "network": "sepolia"
  }
}
```

## Setup Instructions

### 1. Pinata Account Setup
1. Create account at [pinata.cloud](https://pinata.cloud)
2. Generate API keys in dashboard
3. Add keys to environment variables

### 2. Environment Configuration
Add to `.env` file:
```bash
# IPFS Configuration (Pinata)
PINATA_API_KEY=your-pinata-api-key
PINATA_SECRET_KEY=your-pinata-secret-key
```

### 3. Smart Contract Deployment
Deploy the new `HydrogenMarketplaceIPFS.sol` contract:
```bash
cd smart-contracts
npx hardhat run scripts/deploy.js --network sepolia
```

### 4. Backend Dependencies
Install required packages:
```bash
cd backend
npm install form-data
```

## Usage Flow

### Credit Generation with IPFS
1. **Regulatory Authority approves submission**
2. **Backend creates metadata object** with production details
3. **Metadata stored to IPFS** via Pinata, returns hash
4. **Smart contract called** with producer address, quantity, and IPFS hash
5. **Credit ID generated** on blockchain
6. **Updated metadata** stored to IPFS with actual credit ID
7. **Final IPFS hash** returned and stored

### Credit Verification
1. **Retrieve IPFS hash** from blockchain
2. **Fetch metadata** from IPFS using hash
3. **Verify data integrity** using verification hash
4. **Display complete credit information**

## API Endpoints

### Retrieve Credit Metadata
```javascript
// Get credit from blockchain
const credit = await blockchainService.getCredit(creditId);

// Fetch metadata from IPFS
const metadata = await IPFSService.getFromIPFS(credit.ipfsHash);
```

### Store Additional Documents
```javascript
// Store certificate or document
const ipfsHash = await IPFSService.pinFileToIPFS(
  fileBuffer, 
  'certificate.pdf', 
  'application/pdf'
);
```

## Security Considerations

- **IPFS Hashes**: Immutable once stored
- **Verification Hashes**: Prevent metadata tampering
- **Access Control**: Only regulatory authority can generate credits
- **Data Integrity**: SHA256 hashes for verification

## Cost Analysis

### Traditional Approach
- All data stored on blockchain
- High gas costs for large metadata
- Limited scalability

### IPFS Approach
- Only hash stored on blockchain (~32 bytes)
- Unlimited metadata size on IPFS
- Significantly lower gas costs
- Better scalability

## Future Enhancements

1. **IPFS Clustering**: Multiple IPFS nodes for redundancy
2. **Encryption**: Encrypt sensitive metadata before IPFS storage
3. **Batch Operations**: Bulk credit generation with IPFS
4. **Document Attachments**: Store certificates, images, reports
5. **Metadata Standards**: Industry-standard credit formats

## Testing

### Local Testing
```bash
# Test IPFS service
node -e "
const IPFSService = require('./src/services/ipfs.service');
IPFSService.pinJSONToIPFS({test: 'data'}, 'test-credit')
  .then(hash => console.log('IPFS Hash:', hash));
"
```

### Verification
```bash
# Verify stored data
curl https://gateway.pinata.cloud/ipfs/YOUR_HASH
```

This integration provides a robust, decentralized, and cost-effective solution for storing hydrogen credit data while maintaining blockchain verification and immutability.
