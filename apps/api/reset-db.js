const { Client } = require('pg');

const adminClient = new Client({
  host: 'localhost',
  port: 5432,
  database: 'postgres',
  user: 'postgres',
  password: 'postgres',
});

async function resetDatabase() {
  try {
    console.log('🔗 Connecting to PostgreSQL as admin...');
    await adminClient.connect();
    console.log('✅ Connected!');

    // Terminate all connections to the 'fars' database
    console.log('🔪 Terminating all connections to "fars" database...');
    await adminClient.query(`
      SELECT pg_terminate_backend(pg_stat_activity.pid)
      FROM pg_stat_activity
      WHERE pg_stat_activity.datname = 'fars'
      AND pid <> pg_backend_pid();
    `);
    console.log('✅ Connections terminated!');

    // Drop the 'fars' database if it exists
    console.log('🗑️  Dropping "fars" database...');
    await adminClient.query('DROP DATABASE IF EXISTS fars;');
    console.log('✅ Database dropped!');

    // Create the 'fars' database
    console.log('🏗️  Creating "fars" database...');
    await adminClient.query('CREATE DATABASE fars;');
    console.log('✅ Database created!');

    console.log('\n✨ Database reset successful!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await adminClient.end();
  }
}

resetDatabase();
