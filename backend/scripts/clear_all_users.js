import dotenv from 'dotenv';
dotenv.config();

// Construct DATABASE_URL if not set but individual PG vars are available
if (!process.env.DATABASE_URL && process.env.PGHOST) {
  const user = process.env.PGUSER || 'postgres';
  const password = process.env.PGPASSWORD || '';
  const host = process.env.PGHOST || 'localhost';
  const port = process.env.PGPORT || '5432';
  const database = process.env.PGDATABASE || 'todo_db';
  process.env.DATABASE_URL = `postgresql://${user}:${password}@${host}:${port}/${database}?schema=public`;
}

import prisma from '../prisma/client.js';

async function clearAllUsers() {
  try {
    console.log('🗑️  Starting to clear all user data...\n');

    // First, let's see what we're deleting
    const userCount = await prisma.profile.count();
    console.log(`Found ${userCount} user(s) in the database\n`);

    if (userCount === 0) {
      console.log('✅ No users found. Database is already empty.');
      return;
    }

    // Delete all profiles (this will cascade delete related data)
    // Due to foreign key constraints with CASCADE, this will also delete:
    // - All tasks
    // - All projects
    // - All AI events
    // - All AI tool calls
    console.log('Deleting all users and related data...');
    
    const result = await prisma.profile.deleteMany({});
    
    console.log(`\n✅ Successfully deleted ${result.count} user(s) and all related data!`);
    console.log('\n📊 Summary:');
    console.log('   - All profiles deleted');
    console.log('   - All tasks deleted (cascade)');
    console.log('   - All projects deleted (cascade)');
    console.log('   - All AI events deleted (cascade)');
    console.log('   - All AI tool calls deleted (cascade)');
    console.log('\n✨ Database is now clean and ready for new users!');
    
  } catch (error) {
    console.error('❌ Error clearing users:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
clearAllUsers()
  .then(() => {
    console.log('\n✅ Script completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Script failed:', error);
    process.exit(1);
  });

