/**
 * Cleanup Test Data
 * Removes all test data created by the test suites
 */

import { getPool } from '../config/database';

async function cleanupTestData() {
  const pool = getPool();

  try {
    console.log('Starting cleanup of test data...\n');

    // Delete test data from desks (names containing timestamps or test keywords)
    console.log('Cleaning up desks...');
    await pool.query(`
      DELETE FROM desks 
      WHERE name LIKE 'Test Desk%' 
         OR name LIKE 'Original Name%'
         OR name LIKE 'Updated Name%'
         OR name LIKE 'Desk to Delete%'
         OR name LIKE 'Desk with Teams%'
    `);
    console.log('✓ Desks cleaned\n');

    // Delete test data from users (emails containing test patterns)
    console.log('Cleaning up users...');
    await pool.query(`
      DELETE FROM users 
      WHERE email LIKE 'test%@example.com'
         OR email LIKE 'minimal%@example.com'
         OR email LIKE 'emailtest%@example.com'
         OR email LIKE 'schedule%@example.com'
         OR email LIKE 'delete%@example.com'
         OR email LIKE 'role%@example.com'
    `);
    console.log('✓ Users cleaned\n');

    // Delete test data from programs (titles containing test keywords)
    console.log('Cleaning up programs...');
    await pool.query(`
      DELETE FROM programs 
      WHERE title LIKE 'Test Program%'
         OR title LIKE 'Minimal Program%'
         OR title LIKE 'Update Test%'
         OR title LIKE 'Program to Delete%'
         OR title LIKE 'Program with Episodes%'
         OR title LIKE 'Program with Roles%'
    `);
    console.log('✓ Programs cleaned\n');

    // Delete test data from guests (names containing test keywords)
    console.log('Cleaning up guests...');
    await pool.query(`
      DELETE FROM guests 
      WHERE name = 'Test Guest'
         OR name = 'Minimal Guest'
         OR name = 'Phone Test'
         OR name = 'Guest to Delete'
         OR name LIKE 'Search Test%'
    `);
    console.log('✓ Guests cleaned\n');

    // Delete test data from episodes (titles containing test keywords)
    console.log('Cleaning up episodes...');
    await pool.query(`
      DELETE FROM episodes 
      WHERE title LIKE 'Test Episode%'
         OR title LIKE 'Episode to Delete%'
         OR title LIKE 'Episode with Guests%'
    `);
    console.log('✓ Episodes cleaned\n');

    console.log('✅ All test data cleaned successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error cleaning up test data:', error);
    process.exit(1);
  }
}

cleanupTestData();
