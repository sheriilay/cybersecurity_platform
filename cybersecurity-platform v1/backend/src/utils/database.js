const { Pool } = require('pg');
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');

dotenv.config();

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

async function checkDatabase() {
  try {
    const client = await pool.connect();
    console.log('Database connection successful');
    client.release();
    return true;
  } catch (err) {
    console.error('Database connection error:', err);
    return false;
  }
}

async function initializeDatabase() {
  try {
    const client = await pool.connect();
    
    // Read and execute schema.sql
    const schemaPath = path.join(__dirname, '../../config/schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');
    await client.query(schema);
    
    // Read and execute seed.sql
    const seedPath = path.join(__dirname, '../../config/seed.sql');
    const seed = fs.readFileSync(seedPath, 'utf8');
    await client.query(seed);
    
    console.log('Database initialized successfully');
    client.release();
    return true;
  } catch (err) {
    console.error('Database initialization error:', err);
    return false;
  }
}

async function verifyDatabase() {
  try {
    const client = await pool.connect();
    
    // Check tables
    const tables = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);
    
    // Check users
    const users = await client.query('SELECT COUNT(*) FROM users');
    
    console.log('Database verification results:');
    console.log('Tables found:', tables.rows.map(t => t.table_name).join(', '));
    console.log('User count:', users.rows[0].count);
    
    client.release();
    return true;
  } catch (err) {
    console.error('Database verification error:', err);
    return false;
  }
}

module.exports = {
  pool,
  checkDatabase,
  initializeDatabase,
  verifyDatabase
}; 