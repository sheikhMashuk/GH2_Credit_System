const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔧 Setting up local MongoDB for development...\n');

// Check if MongoDB is already installed
function checkMongoInstallation() {
  return new Promise((resolve) => {
    const mongod = spawn('mongod', ['--version'], { shell: true });
    mongod.on('close', (code) => {
      resolve(code === 0);
    });
    mongod.on('error', () => {
      resolve(false);
    });
  });
}

async function setupLocalMongoDB() {
  const isInstalled = await checkMongoInstallation();
  
  if (!isInstalled) {
    console.log('❌ MongoDB not found. Please install MongoDB Community Server:');
    console.log('   1. Download from: https://www.mongodb.com/try/download/community');
    console.log('   2. Or use Chocolatey: choco install mongodb');
    console.log('   3. Or use winget: winget install MongoDB.Server');
    return;
  }
  
  console.log('✅ MongoDB is installed');
  
  // Create local .env configuration
  const localEnvPath = path.join(__dirname, '../.env.local');
  const envContent = `# Local MongoDB Configuration
MONGODB_URI="mongodb://localhost:27017/hydrogen_marketplace"

# Copy other variables from your main .env file
SERVER_ADMIN_PRIVATE_KEY="your_private_key_here"
ETHEREUM_SEPOLIA_RPC_URL="https://sepolia.infura.io/v3/YOUR_INFURA_PROJECT_ID"
SMART_CONTRACT_ADDRESS="0x..."
VERIFIER_ADDRESS="0x..."

PORT=3001
NODE_ENV=development
`;

  fs.writeFileSync(localEnvPath, envContent);
  console.log('✅ Created .env.local with local MongoDB configuration');
  
  console.log('\n🚀 To use local MongoDB:');
  console.log('   1. Start MongoDB: mongod');
  console.log('   2. Copy your .env file to .env.local and update MONGODB_URI');
  console.log('   3. Restart backend with: npm run dev');
  
  console.log('\n📝 Local MongoDB URI: mongodb://localhost:27017/hydrogen_marketplace');
}

setupLocalMongoDB();
