import { Pool } from 'pg';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Database setup utilities for local testing
 * Uses Docker PostgreSQL
 */

export interface TestDatabaseConfig {
  host: string;
  port: number;
  database: string;
  username: string;
  password: string;
}
export function createTestDatabaseUrl(config: TestDatabaseConfig): string {
  const { host, port, database, username, password } = config;
  const auth = password ? `${username}:${password}` : username;
  return `postgresql://${auth}@${host}:${port}/${database}`;
}

/**
 * Gets the appropriate test database URL
 * Uses Docker PostgreSQL
 */
export function getTestDatabaseUrl(): string {
  // Use Docker config
  return createTestDatabaseUrl({
    host: 'localhost',
    port: 5432,
    database: 'fairdatause_test',
    username: 'postgres',
    password: 'postgres'
  });
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
 * Ensures PostgreSQL is running (expects it to be started by pretest script)
 */
export async function ensureDatabaseEnvironment(): Promise<void> {
  // Try to connect to the Docker PostgreSQL
  const config = {
    host: 'localhost',
    port: 5432,
    database: 'postgres', // Connect to default database first
    username: 'postgres',
    password: 'postgres'
  };
  
  try {
    const testPool = new Pool({
      host: config.host,
      port: config.port,
      database: config.database,
      user: config.username,
      password: config.password,
      ssl: false,
      connectionTimeoutMillis: 5000
    });
    
    await testPool.query('SELECT 1');
    await testPool.end();
    
    console.log('✅ PostgreSQL connection successful');
  } catch (error: any) {
    console.error('❌ PostgreSQL not running or accessible:', error?.message);
    throw new Error('PostgreSQL database not available. Run `npm run test:db:setup` to start the test database.');
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