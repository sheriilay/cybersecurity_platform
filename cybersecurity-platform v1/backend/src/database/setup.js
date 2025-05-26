const readline = require('readline');
const fs = require('fs');
const path = require('path');
const { Client } = require('pg');
const bcrypt = require('bcrypt');
const { exec } = require('child_process');

function checkPostgresInPath() {
  return new Promise((resolve) => {
    exec('where psql', (error, stdout, stderr) => {
      resolve(!error && stdout.trim().length > 0);
    });
  });
}

async function validatePostgres() {
  console.log('Checking PostgreSQL installation...');
  
  const isInPath = await checkPostgresInPath();
  if (!isInPath) {
    console.log('\nWARNING: PostgreSQL is not found in PATH!');
    console.log('Please add PostgreSQL to your system PATH:');
    console.log('1. Right-click Start -> System');
    console.log('2. Advanced system settings -> Environment Variables');
    console.log('3. Under System variables, find and edit \'Path\'');
    console.log('4. Add: C:\\Program Files\\PostgreSQL\\16\\bin');
    console.log('\nAfter adding to PATH, please restart your terminal and run this script again.');
    
    const proceed = await question('Do you want to continue anyway? (y/N): ');
    if (proceed.toLowerCase() !== 'y') {
      process.exit(1);
    }
  }
}

function question(query) {
  return new Promise(resolve => {
    rl.question(query, resolve);
  });
}

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

async function setupDatabase() {
  try {
    console.log('=== Cybersecurity Platform Database Setup ===');
    
    // Validate PostgreSQL installation first
    await validatePostgres();
    
    // Get PostgreSQL credentials
    const host = await question('Enter PostgreSQL host (default: localhost): ') || 'localhost';
    const port = await question('Enter PostgreSQL port (default: 5432): ') || '5432';
    const user = await question('Enter PostgreSQL username (default: postgres): ') || 'postgres';
    const password = await question('Enter PostgreSQL password: ') || 'admin';
    const dbName = await question('Enter database name (default: cybersecurity_platform): ') || 'cybersecurity_platform';
    
    console.log('\nTesting connection...');
    
    // First connect to postgres database to create our database
    let client = new Client({
      host,
      port,
      user,
      password,
      database: 'postgres' // Connect to default database first
    });
    
    try {
      await client.connect();
      console.log('Connected to PostgreSQL successfully!');
      
      // Check if our database exists
      const checkResult = await client.query(
        "SELECT 1 FROM pg_database WHERE datname = $1",
        [dbName]
      );
      
      // Create database if it doesn't exist
      if (checkResult.rows.length === 0) {
        console.log(`Creating database '${dbName}'...`);
        await client.query(`CREATE DATABASE "${dbName}"`);
        console.log(`Database '${dbName}' created`);
      } else {
        console.log(`Database '${dbName}' already exists`);
      }
      
      // Disconnect from postgres database
      await client.end();
      
      // Connect to our database
      client = new Client({
        host,
        port,
        user,
        password,
        database: dbName
      });
      await client.connect();
      
      // Create tables
      await createTables(client);
      
      // Create admin user
      await createAdminUser(client);
      
      // List users
      await listUsers(client);
      
      // Create .env file
      await createEnvFile(host, port, user, password, dbName);
      
      console.log('\nDatabase setup completed successfully!');
      
    } catch (error) {
      console.error('Error during database setup:', error);
      throw error;
    } finally {
      await client.end();
      rl.close();
    }
  } catch (error) {
    console.error('Fatal error:', error);
    process.exit(1);
  }
}

async function createTables(client) {
  // Create users table
  await client.query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      username VARCHAR(50) UNIQUE NOT NULL,
      email VARCHAR(100) UNIQUE NOT NULL,
      password VARCHAR(255) NOT NULL,
      role VARCHAR(10) DEFAULT 'user' CHECK (role IN ('admin', 'user')),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
  
  // Create security_events table
  await client.query(`
    CREATE TABLE IF NOT EXISTS security_events (
      id SERIAL PRIMARY KEY,
      event_type VARCHAR(50) NOT NULL,
      description TEXT,
      severity VARCHAR(20) CHECK (severity IN ('low', 'medium', 'high', 'critical')),
      status VARCHAR(20) DEFAULT 'open' CHECK (status IN ('open', 'investigating', 'resolved', 'closed')),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
  
  // Create compliance_records table
  await client.query(`
    CREATE TABLE IF NOT EXISTS compliance_records (
      id SERIAL PRIMARY KEY,
      standard VARCHAR(50) NOT NULL,
      requirement TEXT NOT NULL,
      status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'compliant', 'non-compliant')),
      evidence TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
}

async function createAdminUser(client) {
  const adminPassword = 'admin';
  const hashedPassword = await bcrypt.hash(adminPassword, 10);
  
  try {
    const existingAdminResult = await client.query(
      'SELECT id FROM users WHERE username = $1',
      ['admin']
    );
    
    if (existingAdminResult.rows.length === 0) {
      console.log('Creating admin user...');
      await client.query(`
        INSERT INTO users (username, email, password, role) 
        VALUES ($1, $2, $3, $4)
      `, ['admin', 'admin@example.com', hashedPassword, 'admin']);
      console.log('Admin user created');
    } else {
      console.log('Updating admin user...');
      await client.query(`
        UPDATE users SET password = $1 WHERE username = $2
      `, [hashedPassword, 'admin']);
      console.log('Admin user password updated');
    }
  } catch (err) {
    console.error('Error creating/updating admin user:', err.message);
    throw err;
  }
}

async function listUsers(client) {
  try {
    const usersResult = await client.query('SELECT id, username, email, role, created_at FROM users');
    console.log('\nUsers in the database:');
    console.table(usersResult.rows);
  } catch (error) {
    console.error('Could not fetch users:', error.message);
  }
}

async function createEnvFile(host, port, user, password, dbName) {
  const envContent = `# Server Configuration
PORT=3001
NODE_ENV=development

# Database Configuration
DB_TYPE=postgres
DB_HOST=${host}
DB_PORT=${port}
DB_USER=${user}
DB_PASSWORD=${password}
DB_NAME=${dbName}

# JWT Configuration
JWT_SECRET=your-secret-key-here
JWT_EXPIRES_IN=24h

# Security Configuration
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
`;

  const envPath = path.join(__dirname, '../../.env');
  fs.writeFileSync(envPath, envContent);
  console.log('\nCreated .env file with database configuration');
}

// Run the setup
setupDatabase(); 