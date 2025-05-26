const { Pool } = require('pg');
const path = require('path');
const dotenv = require('dotenv');
const fs = require('fs').promises;
const bcrypt = require('bcrypt');

// Load .env file from the backend directory
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

// Log database configuration
console.log('Database Configuration:', {
  type: 'PostgreSQL',
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'admin',
  database: process.env.DB_NAME || 'cybersecurity_platform',
});

// Create a PostgreSQL pool with improved configuration
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'admin',
  database: process.env.DB_NAME || 'cybersecurity_platform',
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
  ssl: false
});

// Add error handler for the pool
pool.on('error', (err, client) => {
  console.error('Unexpected error on idle client', err);
  process.exit(-1);
});

// Initialize database schema
async function initializeDatabase() {
  let client;
  try {
    client = await pool.connect();
    console.log('Connected to database, initializing schema...');

    // Read and execute init.sql
    const initSql = await fs.readFile(
      path.resolve(__dirname, '../database/init.sql'),
      'utf8'
    );
    
    await client.query(initSql);
    console.log('Database schema initialized successfully');

    // Check if admin user exists
    const adminCheck = await client.query(
      'SELECT 1 FROM users WHERE username = $1',
      ['admin']
    );

    if (adminCheck.rows.length === 0) {
      console.log('Creating admin user...');
      const hashedPassword = await bcrypt.hash('admin', 10);
      
      await client.query(
        `INSERT INTO users (username, email, password, role)
         VALUES ($1, $2, $3, $4)`,
        ['admin', 'admin@example.com', hashedPassword, 'admin']
      );
      console.log('Admin user created successfully');
    }

    return true;
  } catch (error) {
    console.error('Database initialization failed:', error.message);
    console.error('Error code:', error.code);
    console.error('Error stack:', error.stack);
    return false;
  } finally {
    if (client) {
      client.release();
    }
  }
}

// Test database connection
async function testConnection() {
  let client;
  try {
    client = await pool.connect();
    console.log('PostgreSQL database connection successful');
    
    // Test query to verify database access
    const result = await client.query('SELECT 1 as test');
    console.log('Database query test:', result.rows[0]);
    
    // Verify users table exists
    const tableCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'users'
      );
    `);
    
    if (!tableCheck.rows[0].exists) {
      console.error('Users table does not exist. Initializing database...');
      return await initializeDatabase();
    }
    
    return true;
  } catch (error) {
    console.error('Database connection failed:', error.message);
    console.error('Error code:', error.code);
    console.error('Error stack:', error.stack);
    
    if (error.code === 'ECONNREFUSED') {
      console.error('Could not connect to PostgreSQL. Please ensure PostgreSQL is running.');
    } else if (error.code === '28P01') {
      console.error('Invalid PostgreSQL credentials. Please check your username and password.');
    } else if (error.code === '3D000') {
      console.error('Database does not exist. Please create the database first.');
    }
    
    return false;
  } finally {
    if (client) {
      client.release();
    }
  }
}

module.exports = {
  pool,
  testConnection,
  initializeDatabase
}; 