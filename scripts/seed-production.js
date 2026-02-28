#!/usr/bin/env node
/**
 * Seed Production Database
 * Creates demo accounts for testing the mobile app
 * Run: node scripts/seed-production.js
 */

const axios = require('axios');

const API_URL = process.env.API_URL || 'https://pythagore-init.com/api';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@school.com';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'Password123!';

const demoAccounts = [
  { email: 'admin@school.com', password: 'Password123!', firstName: 'Admin', lastName: 'User', role: 'admin' },
  { email: 'teacher1@school.com', password: 'Password123!', firstName: 'John', lastName: 'Smith', role: 'teacher' },
  { email: 'teacher2@school.com', password: 'Password123!', firstName: 'Jane', lastName: 'Doe', role: 'teacher' },
  { email: 'parent1@school.com', password: 'Password123!', firstName: 'Bob', lastName: 'Parent', role: 'parent' },
  { email: 'student1@school.com', password: 'Password123!', firstName: 'Alice', lastName: 'Student', role: 'student' },
];

async function seed() {
  console.log('🌱 Seeding production database...');
  console.log(`API URL: ${API_URL}`);
  
  try {
    // Register admin first
    console.log('\n📌 Creating admin account...');
    try {
      await axios.post(`${API_URL}/auth/register`, demoAccounts[0]);
      console.log('✅ Admin created');
    } catch (e) {
      if (e.response?.status === 409) {
        console.log('ℹ️ Admin already exists');
      } else {
        console.log('❌ Admin creation failed:', e.response?.data?.message || e.message);
      }
    }

    // Login as admin
    console.log('\n🔑 Logging in as admin...');
    const loginRes = await axios.post(`${API_URL}/auth/login`, {
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
    });
    const token = loginRes.data.accessToken;
    console.log('✅ Admin logged in');

    // Create other accounts
    console.log('\n👥 Creating demo accounts...');
    for (const account of demoAccounts.slice(1)) {
      try {
        await axios.post(`${API_URL}/users`, account, {
          headers: { Authorization: `Bearer ${token}` }
        });
        console.log(`✅ ${account.role}: ${account.email}`);
      } catch (e) {
        if (e.response?.status === 409) {
          console.log(`ℹ️ ${account.email} already exists`);
        } else {
          console.log(`❌ ${account.email}:`, e.response?.data?.message || e.message);
        }
      }
    }

    console.log('\n✨ Seeding complete!');
    console.log('\nDemo accounts ready:');
    demoAccounts.forEach(acc => {
      console.log(`  ${acc.role}: ${acc.email} / ${acc.password}`);
    });

  } catch (error) {
    console.error('\n❌ Seeding failed:', error.message);
    if (error.response) {
      console.error('Response:', error.response.data);
    }
    process.exit(1);
  }
}

seed();
