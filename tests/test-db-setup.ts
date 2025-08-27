import { Pool } from 'pg';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Database setup utilities for local testing
 * Handles both Docker PostgreSQL and native PostgreSQL installations
 */

export interface TestDatabaseConfig {
  host: string;
  port: number;
  database: string;
  username: string;
  password: string;
}

// Default local database configurations
export const DEFAULT_TEST_DB_CONFIGS = {
  // Docker PostgreSQL (recommended)
  docker: {
    host: 'localhost',
    port: 5432,
    database: 'fairdatause_test',
    username: 'postgres',
    password: 'postgres'
  },
  
  // Native PostgreSQL installation
  native: {
    host: 'localhost',
    port: 5432,
    database: 'fairdatause_test',
    username: process.env.USER || 'postgres',
    password: ''
  }
};

/**
 * Creates a test database connection string from config
 */
export function createTestDatabaseUrl(config: TestDatabaseConfig): string {
  const { host, port, database, username, password } = config;
  const auth = password ? `${username}:${password}` : username;
  return `postgresql://${auth}@${host}:${port}/${database}`;
}

/**
 * Gets the appropriate test database URL
 * Priority: TEST_DATABASE_URL > Docker config > Native config
 */
export function getTestDatabaseUrl(): string {
  // 1. Check for explicit test database URL
  if (process.env.TEST_DATABASE_URL) {
    return process.env.TEST_DATABASE_URL;
  }

  // 2. Check for production DATABASE_URL in test mode (use with caution)
  if (process.env.DATABASE_URL && process.env.NODE_ENV === 'test') {
    console.warn('⚠️  Using production DATABASE_URL for tests. Make sure this is a test database!');
    return process.env.DATABASE_URL;
  }

  // 3. Default to Docker config
  return createTestDatabaseUrl(DEFAULT_TEST_DB_CONFIGS.docker);
}

/**
 * Creates a connection pool for the test database
 */
export function createTestPool(databaseUrl?: string): Pool {
  const url = databaseUrl || getTestDatabaseUrl();
  
  return new Pool({
    connectionString: url,
    max: 5, // Small pool for tests
    idleTimeoutMillis: 10000,
    connectionTimeoutMillis: 5000,
    // SSL configuration - disable for local testing
    ssl: url.includes('neon.tech') ? { rejectUnauthorized: false } : false
  });
}

/**
 * Ensures PostgreSQL is installed and running, creates database if needed
 */
export async function ensureDatabaseEnvironment(): Promise<void> {
  // First, try to check if PostgreSQL is accessible
  let needsInstallation = false;
  
  try {
    // Try to connect to the default postgres database
    const config = DEFAULT_TEST_DB_CONFIGS.docker;
    const testPool = new Pool({
      host: config.host,
      port: config.port,
      database: 'postgres',
      user: config.username, 
      password: config.password,
      ssl: false,
      connectionTimeoutMillis: 3000
    });
    
    await testPool.query('SELECT 1');
    await testPool.end();
    
    console.log('✅ PostgreSQL connection successful');
  } catch (error: any) {
    if (error?.code === '28000') {
      // Role doesn't exist - we have PostgreSQL but need to set it up
      console.log('🔧 PostgreSQL found but needs user setup...');
      await ensurePostgreSQLUser();
    } else if (error?.code === 'ECONNREFUSED') {
      // Connection refused - PostgreSQL not running or not installed
      needsInstallation = true;
    } else {
      console.warn('Database connection issue:', error?.message);
      needsInstallation = true;
    }
  }
  
  if (needsInstallation) {
    await installPostgreSQL();
    await ensurePostgreSQLUser();
  }
  
  // Ensure test database exists
  await ensureTestDatabase();
}

/**
 * Automatically installs PostgreSQL if not available
 */
async function installPostgreSQL(): Promise<void> {
  console.log('📦 PostgreSQL not found, attempting to install...');
  
  const os = require('os');
  const { execSync } = require('child_process');
  
  try {
    if (os.platform() === 'darwin') {
      // macOS - try homebrew
      console.log('🍺 Installing PostgreSQL via Homebrew...');
      execSync('brew install postgresql@15', { stdio: 'inherit' });
      execSync('brew services start postgresql@15', { stdio: 'inherit' });
      
      // Wait a moment for service to start
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      console.log('✅ PostgreSQL installed and started');
    } else if (os.platform() === 'linux') {
      // Linux - try apt
      console.log('🐧 Installing PostgreSQL via apt...');
      execSync('sudo apt-get update && sudo apt-get install -y postgresql postgresql-contrib', { stdio: 'inherit' });
      execSync('sudo systemctl start postgresql', { stdio: 'inherit' });
      
      console.log('✅ PostgreSQL installed and started');
    } else {
      throw new Error('Automatic PostgreSQL installation not supported on this platform');
    }
  } catch (error) {
    console.warn('⚠️  Could not auto-install PostgreSQL:', error);
    throw new Error('Please install PostgreSQL manually or use Docker: npm run test:db:setup');
  }
}

/**
 * Ensures the postgres user exists and can create databases
 */
async function ensurePostgreSQLUser(): Promise<void> {
  const os = require('os');
  const { execSync } = require('child_process');
  
  try {
    if (os.platform() === 'darwin') {
      // macOS - create postgres user if needed
      console.log('👤 Setting up PostgreSQL user...');
      
      // Find PostgreSQL installation
      let createUserCmd = 'createuser';
      let createDbCmd = 'createdb';
      
      try {
        // Try to find PostgreSQL via Homebrew
        const pgPath = execSync('brew --prefix postgresql@15', { encoding: 'utf8' }).trim();
        createUserCmd = `${pgPath}/bin/createuser`;
        createDbCmd = `${pgPath}/bin/createdb`;
      } catch {
        // Fallback to system PATH
        console.log('Using system PostgreSQL commands');
      }
      
      try {
        // Try to create postgres role
        execSync(`${createUserCmd} -s postgres`, { stdio: 'pipe' });
        console.log('✅ postgres user created');
      } catch (error: any) {
        // User might already exist
        if (error.stderr?.includes('already exists')) {
          console.log('✅ postgres user already exists');
        } else {
          console.warn('User creation issue:', error.message);
        }
      }
      
      try {
        // Try to create database if it doesn't exist
        execSync(`${createDbCmd} postgres`, { stdio: 'pipe' });
        console.log('✅ postgres database created');
      } catch (error: any) {
        // Database might already exist
        if (error.stderr?.includes('already exists')) {
          console.log('✅ postgres database already exists');
        } else {
          console.warn('Database creation issue:', error.message);
        }
      }
      
    } else if (os.platform() === 'linux') {
      // Linux - usually postgres user is created automatically
      console.log('👤 PostgreSQL user should be available on Linux');
    }
  } catch (error) {
    console.warn('⚠️  Could not setup PostgreSQL user:', error);
    console.log('💡 You may need to manually run: createuser -s postgres');
  }
}

/**
 * Creates the test database if it doesn't exist
 */
async function ensureTestDatabase(): Promise<void> {
  const config = DEFAULT_TEST_DB_CONFIGS.docker;
  
  // Try to connect to postgres database first to create our test database
  const adminPool = new Pool({
    host: config.host,
    port: config.port,
    database: 'postgres', // Connect to default postgres database
    user: config.username,
    password: config.password,
    ssl: false
  });

  try {
    // Check if test database exists
    const result = await adminPool.query(
      "SELECT 1 FROM pg_database WHERE datname = $1",
      [config.database]
    );

    if (result.rows.length === 0) {
      console.log(`🏗️  Creating test database: ${config.database}`);
      await adminPool.query(`CREATE DATABASE "${config.database}"`);
      console.log('✅ Test database created successfully');
    }
  } finally {
    await adminPool.end();
  }
}

/**
 * Sets up the database schema for testing
 */
export async function setupTestDatabase(pool: Pool): Promise<void> {
  const sqlFilePath = path.join(__dirname, 'database-setup.sql');
  
  if (!fs.existsSync(sqlFilePath)) {
    throw new Error(`Schema file not found: ${sqlFilePath}`);
  }

  const schema = fs.readFileSync(sqlFilePath, 'utf8');
  
  try {
    console.log('🗄️  Setting up test database schema...');
    await pool.query(schema);
    console.log('✅ Test database schema setup complete');
  } catch (error) {
    console.error('❌ Failed to setup test database schema:', error);
    throw error;
  }
}

/**
 * Cleans up test data between tests
 */
export async function cleanupTestData(pool: Pool): Promise<void> {
  try {
    // Clean up in reverse order of dependencies
    await pool.query("DELETE FROM contractors WHERE email LIKE '%test%' OR email LIKE '%@example.com'");
    await pool.query("DELETE FROM users WHERE email LIKE '%test%' OR email LIKE '%@example.com'");
  } catch (error) {
    console.warn('Warning: Failed to cleanup test data:', error);
  }
}

/**
 * Verifies database connection and schema
 */
export async function verifyTestDatabase(pool: Pool): Promise<void> {
  try {
    // Test connection
    await pool.query('SELECT NOW()');
    
    // Verify tables exist using pg_tables (works in all PostgreSQL versions)
    const tablesResult = await pool.query(`
      SELECT tablename 
      FROM pg_tables 
      WHERE schemaname = 'public' 
      AND tablename IN ('users', 'contractors')
      ORDER BY tablename
    `);
    
    const tables = tablesResult.rows.map(row => row.tablename);
    
    if (!tables.includes('users')) {
      throw new Error('users table not found');
    }
    
    if (!tables.includes('contractors')) {
      throw new Error('contractors table not found');
    }
    
    console.log('✅ Database verification passed');
    console.log('📊 Available tables:', tables.join(', '));
    
  } catch (error) {
    console.error('❌ Database verification failed:', error);
    throw error;
  }
}

/**
 * Gets database statistics for monitoring
 */
export async function getDatabaseStats(pool: Pool): Promise<any> {
  try {
    const stats = await pool.query(`
      SELECT 
        schemaname,
        relname as tablename,
        n_tup_ins as inserts,
        n_tup_upd as updates,
        n_tup_del as deletes,
        n_live_tup as live_rows
      FROM pg_stat_user_tables 
      WHERE relname IN ('users', 'contractors')
    `);
    
    return stats.rows;
  } catch (error) {
    console.warn('Could not retrieve database stats:', error);
    return [];
  }
}