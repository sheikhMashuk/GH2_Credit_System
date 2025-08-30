const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Create a sample verifier user
  const verifier = await prisma.user.upsert({
    where: { walletAddress: '0x742d35Cc6634C0532925a3b8D8C0532925a3b8D8' },
    update: {},
    create: {
      name: 'Sample Verifier',
      walletAddress: '0x742d35Cc6634C0532925a3b8D8C0532925a3b8D8',
      role: 'VERIFIER',
    },
  });

  console.log('Created verifier:', verifier);

  // Create a sample producer user
  const producer = await prisma.user.upsert({
    where: { walletAddress: '0x8ba1f109551bD432803012645Hac136c0532925a3' },
    update: {},
    create: {
      name: 'Green Energy Co.',
      walletAddress: '0x8ba1f109551bD432803012645Hac136c0532925a3',
      role: 'PRODUCER',
    },
  });

  console.log('Created producer:', producer);

  console.log('Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
