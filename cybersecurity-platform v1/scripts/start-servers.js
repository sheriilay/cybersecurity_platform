const { spawn } = require('child_process');
const path = require('path');
const { checkDatabase, initializeDatabase, verifyDatabase } = require('../backend/src/utils/database');

async function startServers() {
  console.log('Starting servers...');
  
  // Check database connection
  const dbConnected = await checkDatabase();
  if (!dbConnected) {
    console.error('Database connection failed. Please check your database configuration.');
    process.exit(1);
  }
  
  // Initialize database if needed
  const dbInitialized = await initializeDatabase();
  if (!dbInitialized) {
    console.error('Database initialization failed.');
    process.exit(1);
  }
  
  // Verify database
  const dbVerified = await verifyDatabase();
  if (!dbVerified) {
    console.error('Database verification failed.');
    process.exit(1);
  }
  
  // Start backend server
  const backend = spawn('node', ['src/index.js'], {
    cwd: path.join(__dirname, '../backend'),
    stdio: 'inherit'
  });
  
  // Start frontend server
  const frontend = spawn('npm', ['start'], {
    cwd: path.join(__dirname, '../frontend'),
    stdio: 'inherit'
  });
  
  // Handle process termination
  process.on('SIGINT', () => {
    console.log('\nShutting down servers...');
    backend.kill();
    frontend.kill();
    process.exit();
  });
  
  // Handle errors
  backend.on('error', (err) => {
    console.error('Backend server error:', err);
    process.exit(1);
  });
  
  frontend.on('error', (err) => {
    console.error('Frontend server error:', err);
    process.exit(1);
  });
}

startServers().catch(console.error); 