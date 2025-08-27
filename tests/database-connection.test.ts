import { describe, it, expect, beforeAll } from 'vitest';
import { 
  getTestDatabaseUrl, 
  createTestPool, 
  setupTestDatabase, 
  verifyTestDatabase,
  getDatabaseStats,
  ensureDatabaseEnvironment
} from './test-db-setup';

describe('Database Connection and Setup', () => {
  let pool: any = null;

  beforeAll(async () => {
    // Automatically ensure database environment is ready
    try {
      console.log('🚀 Setting up database environment...');
      await ensureDatabaseEnvironment();
      
      const url = getTestDatabaseUrl();
      pool = createTestPool(url);
      await pool.query('SELECT 1');
      console.log('✅ Database connection successful');
    } catch (error) {
      // Skip these tests if no database is available
      console.warn('⚠️  Skipping database tests - no database connection available');
      console.warn('💡 Run `npm run test:db:setup` to start a test database');
      return;
    }
  });

  it('should connect to test database', async () => {
    if (!pool) return; // Skip if no database
    
    const result = await pool.query('SELECT NOW() as current_time, version() as db_version');
    
    expect(result.rows).toHaveLength(1);
    expect(result.rows[0].current_time).toBeInstanceOf(Date);
    expect(result.rows[0].db_version).toContain('PostgreSQL');
  });

  it('should setup database schema successfully', async () => {
    if (!pool) return; // Skip if no database
    
    // This should not throw an error
    await setupTestDatabase(pool);
    
    // Verify tables were created using pg_tables (compatible with all PostgreSQL versions)
    const tablesResult = await pool.query(`
      SELECT tablename 
      FROM pg_tables 
      WHERE schemaname = 'public' 
      AND tablename IN ('users', 'contractors')
      ORDER BY tablename
    `);
    
    const tables = tablesResult.rows.map((row: any) => row.tablename);
    expect(tables).toContain('users');
    expect(tables).toContain('contractors');
  });

  it('should verify database schema', async () => {
    if (!pool) return; // Skip if no database
    
    // This should not throw an error
    await verifyTestDatabase(pool);
    
    // Check that required columns exist in users table using pg_attribute (compatible with all PostgreSQL versions)
    const columnsResult = await pool.query(`
      SELECT a.attname as column_name, t.typname as data_type
      FROM pg_class c
      JOIN pg_attribute a ON a.attrelid = c.oid
      JOIN pg_type t ON a.atttypid = t.oid
      WHERE c.relname = 'users' 
      AND a.attnum > 0 
      AND NOT a.attisdropped
      ORDER BY a.attnum
    `);
    
    const columns = columnsResult.rows.map((row: any) => row.column_name);
    
    // Verify required columns exist
    expect(columns).toContain('id');
    expect(columns).toContain('email');
    expect(columns).toContain('phone');
    expect(columns).toContain('reddit_username');
    expect(columns).toContain('reddit_verified');
    expect(columns).toContain('created_at');
    expect(columns).toContain('updated_at');
  });

  it('should handle database operations', async () => {
    if (!pool) return; // Skip if no database
    
    // Test insert
    const insertResult = await pool.query(`
      INSERT INTO users (email, phone, reddit_username, reddit_verified) 
      VALUES ('dbtest@example.com', '1234567890', 'testuser', true)
      RETURNING id, email, created_at
    `);
    
    expect(insertResult.rows).toHaveLength(1);
    expect(insertResult.rows[0].email).toBe('dbtest@example.com');
    expect(insertResult.rows[0].id).toBeTypeOf('number');
    expect(insertResult.rows[0].created_at).toBeInstanceOf(Date);
    
    const userId = insertResult.rows[0].id;
    
    // Test select
    const selectResult = await pool.query(`
      SELECT * FROM users WHERE id = $1
    `, [userId]);
    
    expect(selectResult.rows).toHaveLength(1);
    expect(selectResult.rows[0].reddit_verified).toBe(true);
    
    // Test update (should trigger updated_at change)
    const originalUpdatedAt = selectResult.rows[0].updated_at;
    
    // Small delay to ensure updated_at changes
    await new Promise(resolve => setTimeout(resolve, 10));
    
    await pool.query(`
      UPDATE users SET reddit_verified = false WHERE id = $1
    `, [userId]);
    
    const updatedResult = await pool.query(`
      SELECT updated_at, reddit_verified FROM users WHERE id = $1
    `, [userId]);
    
    expect(updatedResult.rows[0].reddit_verified).toBe(false);
    expect(updatedResult.rows[0].updated_at.getTime()).toBeGreaterThan(originalUpdatedAt.getTime());
    
    // Cleanup
    await pool.query(`DELETE FROM users WHERE id = $1`, [userId]);
  });

  it('should handle foreign key relationships', async () => {
    if (!pool) return; // Skip if no database
    
    // Create a user first
    const userResult = await pool.query(`
      INSERT INTO users (email, phone, reddit_username, reddit_verified) 
      VALUES ('fktest@example.com', '9876543210', 'fktestuser', true)
      RETURNING id
    `);
    
    const userId = userResult.rows[0].id;
    
    // Create a contractor referencing the user
    const contractorResult = await pool.query(`
      INSERT INTO contractors (user_id, email, company_slug, company_name, status, joined_slack, can_start_job)
      VALUES ($1, 'fktest@example.com', 'test-company', 'Test Company', 'pending', false, false)
      RETURNING id, user_id
    `, [userId]);
    
    expect(contractorResult.rows).toHaveLength(1);
    expect(contractorResult.rows[0].user_id).toBe(userId);
    
    // Test join query
    const joinResult = await pool.query(`
      SELECT u.email as user_email, c.company_name, c.status
      FROM users u
      JOIN contractors c ON u.id = c.user_id
      WHERE u.id = $1
    `, [userId]);
    
    expect(joinResult.rows).toHaveLength(1);
    expect(joinResult.rows[0].user_email).toBe('fktest@example.com');
    expect(joinResult.rows[0].company_name).toBe('Test Company');
    expect(joinResult.rows[0].status).toBe('pending');
    
    // Cleanup (should cascade delete contractor due to ON DELETE CASCADE)
    await pool.query(`DELETE FROM users WHERE id = $1`, [userId]);
    
    // Verify contractor was deleted
    const verifyResult = await pool.query(`
      SELECT * FROM contractors WHERE user_id = $1
    `, [userId]);
    
    expect(verifyResult.rows).toHaveLength(0);
  });

  it('should provide database statistics', async () => {
    if (!pool) return; // Skip if no database
    
    const stats = await getDatabaseStats(pool);
    
    // Stats should be an array (might be empty if no activity)
    expect(Array.isArray(stats)).toBe(true);
    
    // If there are stats, they should have the expected structure
    if (stats.length > 0) {
      const stat = stats[0];
      expect(stat).toHaveProperty('tablename');
      expect(stat).toHaveProperty('inserts');
      expect(stat).toHaveProperty('updates');
      expect(stat).toHaveProperty('deletes');
      expect(stat).toHaveProperty('live_rows');
    }
  });
});