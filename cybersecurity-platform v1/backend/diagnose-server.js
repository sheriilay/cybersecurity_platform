/**
 * Server Diagnostics Script
 * 
 * This script helps diagnose issues with Express router configuration
 * and middleware setup that might cause the "Router.use() requires a middleware function but got a Object" error.
 */

const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

console.log('Starting server diagnostic tool...');

// Function to check if a value is a valid middleware
function isValidMiddleware(middleware) {
  // Could be a function
  if (typeof middleware === 'function') {
    return { valid: true };
  }
  
  // Could be an array of middleware functions
  if (Array.isArray(middleware)) {
    for (let i = 0; i < middleware.length; i++) {
      if (typeof middleware[i] !== 'function') {
        return { 
          valid: false, 
          reason: `Item at index ${i} is not a function but a ${typeof middleware[i]}`,
          value: middleware[i]
        };
      }
    }
    return { valid: true };
  }
  
  // Not a valid middleware
  return { 
    valid: false, 
    reason: `Not a function or array but a ${typeof middleware}`,
    value: middleware
  };
}

// Check route files
async function analyzeRouteFiles() {
  console.log('\n--- Analyzing route files ---');
  
  const routesDir = path.join(__dirname, 'src', 'routes');
  try {
    const files = fs.readdirSync(routesDir);
    
    for (const file of files) {
      if (file.endsWith('.js')) {
        console.log(`\nChecking ${file}...`);
        
        try {
          // Clear require cache to ensure we get a fresh copy
          delete require.cache[require.resolve(path.join(routesDir, file))];
          
          // Import the router
          const router = require(path.join(routesDir, file));
          
          // Check if it's a valid router
          if (!router || typeof router !== 'function' || !router.use) {
            console.error(` ${file} does not export a valid Express router!`);
            console.error(`   Type: ${typeof router}`);
            console.error(`   Value:`, router);
          } else {
            console.log(` ${file} exports valid Express router`);
            
            // Try to access internal stack (implementation detail, but helpful for diagnosis)
            if (router.stack) {
              console.log(`   - Router contains ${router.stack.length} routes/middleware`);
            }
          }
        } catch (err) {
          console.error(` Error importing ${file}:`, err.message);
        }
      }
    }
  } catch (err) {
    console.error('Error reading routes directory:', err.message);
  }
}

// Check middleware directory
async function analyzeMiddlewareFiles() {
  console.log('\n--- Analyzing middleware files ---');
  
  const middlewareDir = path.join(__dirname, 'src', 'middleware');
  try {
    if (fs.existsSync(middlewareDir)) {
      const files = fs.readdirSync(middlewareDir);
      
      for (const file of files) {
        if (file.endsWith('.js')) {
          console.log(`\nChecking ${file}...`);
          
          try {
            // Clear require cache
            delete require.cache[require.resolve(path.join(middlewareDir, file))];
            
            // Import the middleware
            const middleware = require(path.join(middlewareDir, file));
            
            // Check the exports
            for (const [key, value] of Object.entries(middleware)) {
              const check = isValidMiddleware(value);
              
              if (check.valid) {
                console.log(` ${key} is valid middleware`);
              } else {
                console.error(` ${key} is NOT valid middleware: ${check.reason}`);
                if (check.value !== undefined) {
                  console.error(`   Value:`, check.value);
                }
              }
            }
          } catch (err) {
            console.error(` Error importing ${file}:`, err.message);
          }
        }
      }
    } else {
      console.log('Middleware directory not found');
    }
  } catch (err) {
    console.error('Error reading middleware directory:', err.message);
  }
}

// Check main app setup
async function analyzeAppSetup() {
  console.log('\n--- Analyzing main app setup ---');
  
  const indexPath = path.join(__dirname, 'src', 'index.js');
  
  try {
    // Read the file as text for analysis
    const indexContent = fs.readFileSync(indexPath, 'utf8');
    
    // Look for route registrations (app.use)
    const routeRegex = /app\.use\((['"].*?['"]),\s*(.*?)\)/g;
    let match;
    
    console.log('Route registrations:');
    let found = false;
    
    while ((match = routeRegex.exec(indexContent)) !== null) {
      found = true;
      const path = match[1];
      const handler = match[2].trim();
      
      console.log(`- Path: ${path}, Handler: ${handler}`);
      
      // Check for common issues
      if (handler.includes('{') || handler.includes('[')) {
        console.error(`   WARNING: Handler looks suspicious - might be an object or array literal`);
      }
      
      // Check for potential typos in router import variables
      if (!indexContent.includes(`const ${handler} = require(`) && 
          !indexContent.includes(`let ${handler} = require(`) &&
          !indexContent.includes(`var ${handler} = require(`)) {
        console.error(`   WARNING: Could not find a require statement for "${handler}"`);
      }
    }
    
    if (!found) {
      console.log('No route registrations found using regex pattern.');
    }
    
  } catch (err) {
    console.error('Error analyzing app setup:', err.message);
  }
}

// Run all diagnostics
async function runDiagnostics() {
  try {
    await analyzeAppSetup();
    await analyzeRouteFiles();
    await analyzeMiddlewareFiles();
    
    console.log('\n--- Diagnostic complete ---');
    console.log('If you see any warnings or errors above, they might be causing your middleware issue.');
    console.log('\nCommon solutions:');
    console.log('1. Make sure you\'re exporting the router correctly (module.exports = router)');
    console.log('2. Check that all middleware functions are actual functions');
    console.log('3. Ensure route handlers are properly imported and defined');
    console.log('4. Verify middleware array syntax if you\'re using multiple middleware');
    
  } catch (error) {
    console.error('Diagnostic failed:', error);
  }
}

runDiagnostics(); 
