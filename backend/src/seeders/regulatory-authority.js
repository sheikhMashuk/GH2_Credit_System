const mongoose = require('mongoose');
const User = require('../models/User');
const InMemoryUser = require('../models/InMemoryUser');
require('dotenv').config({ path: '../../.env' });

const seedRegulatoryAuthority = async () => {
  try {
    const userData = {
      name: 'Green Energy Regulatory Authority',
      email: 'admin@greenregulator.gov',
      password: 'RegAuth2024!',
      role: 'REGULATORY_AUTHORITY'
    };

    // Always use in-memory store for simplicity
    console.log('Creating regulatory authority in memory store...');
    
    // Check if already exists
    const existingUser = await InMemoryUser.findOne({ email: userData.email });
    if (existingUser) {
      console.log('Regulatory Authority already exists:', existingUser.email);
      return existingUser;
    }

    const user = await InMemoryUser.create(userData);
    console.log('Regulatory Authority created:', user.email);
    return user;

  } catch (error) {
    console.error('Error seeding regulatory authority:', error.message);
    throw error;
  }
};

module.exports = { seedRegulatoryAuthority };

// Run if called directly
if (require.main === module) {
  seedRegulatoryAuthority()
    .then(() => {
      console.log('Seeding completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Seeding failed:', error);
      process.exit(1);
    });
}
