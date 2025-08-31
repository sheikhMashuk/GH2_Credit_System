# Green Hydrogen Marketplace - Testing Guide

## Overview
Comprehensive testing guide for the Green Hydrogen Marketplace with fixed pricing, IPFS integration, and enhanced buyer dashboard functionality.

## Test Environment Setup

### Prerequisites
- Backend server running on `http://localhost:5000`
- Frontend development server on `http://localhost:3000`
- MetaMask extension installed and configured
- Sepolia testnet ETH for transactions

### Environment Configuration
Ensure `.env` files are properly configured with:
- Pinata API credentials for IPFS testing
- Smart contract addresses
- RPC URLs for blockchain interaction

## Testing Scenarios

### 1. User Registration and Authentication

#### Producer Registration
```bash
# Test endpoint
POST http://localhost:5000/api/users/register
Content-Type: application/json

{
  "name": "Test Producer",
  "email": "producer@test.com",
  "password": "password123",
  "role": "PRODUCER",
  "walletAddress": "0x1234567890abcdef1234567890abcdef12345678"
}
```

#### Buyer Registration
```bash
# Test endpoint
POST http://localhost:5000/api/users/register
Content-Type: application/json

{
  "name": "Test Buyer",
  "email": "buyer@test.com", 
  "password": "password123",
  "role": "BUYER",
  "walletAddress": "0xabcdef1234567890abcdef1234567890abcdef12"
}
```

#### Regulatory Authority Registration
```bash
# Test endpoint
POST http://localhost:5000/api/users/register
Content-Type: application/json

{
  "name": "Test Authority",
  "email": "authority@test.com",
  "password": "password123", 
  "role": "REGULATORY_AUTHORITY",
  "walletAddress": "0x9876543210fedcba9876543210fedcba98765432"
}
```

### 2. Producer Workflow Testing

#### Submit Production Data
1. Login as producer
2. Navigate to producer dashboard
3. Submit production data:
   - Production Date: Recent date
   - Quantity: 10 kg (generates 100 credits)
   - Location: Test facility
   - Method: Electrolysis
   - Evidence: Upload test documents

#### Expected Results
- Submission created with status "PENDING"
- Credits calculated as quantity × 10
- Submission appears in producer dashboard

### 3. Regulatory Authority Testing

#### Approve Submissions
1. Login as regulatory authority
2. Navigate to regulatory dashboard
3. View pending submissions
4. Approve submission

#### Expected Results
- Submission status changes to "APPROVED"
- Credits generated on blockchain
- **IPFS Update**: Credit metadata uploaded to Pinata
- Producer's total credits updated

#### IPFS Verification
```bash
# Run IPFS test
cd backend
node test-ipfs-integration.js
```

Expected output:
```
✓ Credit lifecycle test result: SUCCESS
IPFS Hash: QmXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
```

### 4. Marketplace Listing Testing

#### Create Individual Listing
1. Login as producer
2. Navigate to marketplace section
3. Create listing:
   - Select approved credit
   - Credits to sell: 50
   - Price automatically set to 0.001 ETH per credit

#### Create Bulk Listing
1. Select multiple approved submissions
2. Set total credits to sell
3. Price calculated automatically

#### Expected Results
- Listing created with fixed pricing (0.001 ETH per credit)
- **IPFS Update**: Credit status updated to "listed_for_sale"
- Total price calculated correctly (credits × 0.001 ETH)

### 5. Buyer Dashboard Testing

#### Purchase History Tab (Primary)
1. Login as buyer
2. Navigate to buyer dashboard
3. Verify purchase history displays:
   - Transaction statistics (success, failed, pending, total)
   - Detailed transaction list with:
     - Status badges (color-coded)
     - Credits purchased
     - USD price (calculated from fixed ETH price)
     - Transaction hash with click-to-copy
     - Wallet addresses (from/to) with click-to-copy

#### Marketplace Tab (Secondary)
1. Switch to marketplace tab
2. Verify marketplace listings display:
   - Available credits
   - Fixed price per credit (0.001 ETH)
   - USD equivalent pricing
   - Producer information

### 6. Credit Purchase Testing

#### MetaMask Purchase Flow
1. Login as buyer
2. Browse marketplace listings
3. Select credits to purchase
4. Click "Purchase Credits"
5. Confirm MetaMask transaction

#### Expected Results
- MetaMask popup with correct ETH amount (credits × 0.001 ETH)
- Transaction submitted to blockchain
- **IPFS Update**: Credit transfer recorded with new ownership
- Purchase appears in buyer's purchase history
- Seller's available credits reduced

#### Purchase Verification
```bash
# Check transaction in purchase history
GET http://localhost:5000/api/marketplace/purchase-history
Authorization: Bearer <buyer_jwt_token>
```

Expected response includes:
- Transaction hash
- IPFS hash for transfer record
- Correct credit amount and USD price

### 7. Click-to-Copy Functionality Testing

#### Transaction Hash Copy
1. Navigate to transaction history or purchase history
2. Click copy button next to transaction hash
3. Verify:
   - Full hash copied to clipboard
   - Toast notification appears
   - Visual feedback (checkmark icon)

#### Wallet Address Copy
1. Click copy button next to wallet addresses
2. Verify clipboard contains full address
3. Check toast notification appears

### 8. Fixed Pricing Verification

#### Frontend Price Display
- All marketplace listings show 0.001 ETH per credit
- USD conversion uses $2000/ETH rate
- Total prices calculated correctly
- No price input fields visible

#### Smart Contract Verification
```bash
# Check contract constant
npx hardhat console --network sepolia
> const contract = await ethers.getContractAt("HydrogenMarketplace", "CONTRACT_ADDRESS")
> await contract.FIXED_PRICE_PER_CREDIT()
# Should return: 1000000000000000 (0.001 ETH in wei)
```

### 9. IPFS Integration Testing

#### Comprehensive IPFS Test
```bash
cd backend
node test-ipfs-integration.js
```

Expected test results:
1. ✓ Environment variables check
2. ✓ Direct IPFS service test
3. ✓ Credit lifecycle test (approval)
4. ✓ Credit transfer test (sale)
5. ✓ Credit status change test (listing)

#### Manual IPFS Verification
1. Complete a full credit lifecycle (submit → approve → list → purchase)
2. Check backend logs for IPFS hashes
3. Verify each step generates unique IPFS hash
4. Confirm metadata updates reflect current state

### 10. Error Handling Testing

#### Invalid Transactions
- Attempt purchase with insufficient ETH
- Try to purchase more credits than available
- Test with invalid wallet addresses

#### Network Issues
- Disconnect from internet during IPFS upload
- Test MetaMask rejection scenarios
- Verify graceful error handling

#### Expected Error Behaviors
- Clear error messages displayed
- No partial state updates
- Proper rollback on failed transactions

## Performance Testing

### Load Testing
- Multiple simultaneous purchases
- Bulk listing creation
- Concurrent IPFS uploads

### Response Time Verification
- API endpoints respond within 2 seconds
- IPFS uploads complete within 30 seconds
- MetaMask transactions process normally

## Security Testing

### Authentication
- JWT token validation
- Role-based access control
- Wallet address verification

### Transaction Security
- Blockchain payment verification
- IPFS hash integrity
- No sensitive data exposure

## Test Data Cleanup

### Reset Test Environment
```bash
# Clear in-memory data (restart backend)
# Reset MetaMask account nonce if needed
# Clear browser localStorage for frontend
```

### Fresh Test Setup
1. Restart backend server
2. Clear browser cache
3. Reset MetaMask account
4. Create new test users

## Automated Testing

### Backend API Tests
```bash
cd backend
npm test
```

### Frontend Component Tests
```bash
cd frontend
npm test
```

### Integration Tests
```bash
# Run full integration test suite
npm run test:integration
```

## Test Checklist

- [ ] User registration (all roles)
- [ ] Producer submission workflow
- [ ] Regulatory approval with IPFS
- [ ] Marketplace listing creation
- [ ] Buyer purchase flow with MetaMask
- [ ] Purchase history display
- [ ] Click-to-copy functionality
- [ ] Fixed pricing enforcement
- [ ] IPFS integration for all lifecycle events
- [ ] Error handling and edge cases
- [ ] Performance under load
- [ ] Security and authentication

## Troubleshooting Test Issues

### Common Problems
1. **IPFS timeouts**: Check Pinata API credentials
2. **MetaMask errors**: Verify network and gas settings
3. **Price discrepancies**: Confirm fixed price constant
4. **Missing transactions**: Check blockchain confirmation

### Debug Tools
- Browser developer console
- Backend server logs
- MetaMask transaction history
- Pinata IPFS dashboard

## Test Reporting
Document all test results including:
- Pass/fail status for each scenario
- Performance metrics
- Error logs and screenshots
- IPFS hash verification
- Blockchain transaction confirmations
