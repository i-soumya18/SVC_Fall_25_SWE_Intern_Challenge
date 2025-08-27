import { beforeAll, afterAll, beforeEach, afterEach } from "vitest";
import { Pool } from "pg";
import { setupServer } from "msw/node";
import { http, HttpResponse } from "msw";
import { 
  createTestPool, 
  getTestDatabaseUrl, 
  setupTestDatabase, 
  verifyTestDatabase,
  cleanupTestData as cleanupTestDataUtil,
  ensureDatabaseEnvironment
} from "./test-db-setup";

// Test database configuration
let testPool: Pool | null = null;
let databaseInitialized = false;

export function getTestDatabase(): Pool {
  if (testPool) {
    return testPool;
  }

  try {
    const testDatabaseUrl = getTestDatabaseUrl();
    console.log('🔧 Connecting to test database...');
    testPool = createTestPool(testDatabaseUrl);
    
    // Log the database being used (without credentials)
    const urlObj = new URL(testDatabaseUrl);
    console.log(`📊 Test database: ${urlObj.host}${urlObj.pathname}`);
    
    return testPool;
  } catch (error) {
    console.error('❌ Failed to create test database pool:', error);
    throw new Error(
      'Failed to connect to test database. See test setup documentation for local database setup.'
    );
  }
}

// Mock server for external API calls
export const mockServer = setupServer(
  // Mock Reddit OAuth token endpoint
  http.post("https://www.reddit.com/api/v1/access_token", () => {
    return HttpResponse.json({
      access_token: "mock_reddit_token",
      token_type: "bearer",
      expires_in: 3600,
    });
  }),

  // Mock Reddit user verification endpoint
  http.get("https://oauth.reddit.com/user/:username/about", ({ params }) => {
    const { username } = params;

    // Mock verified users - include real usernames that should be verified
    const verifiedUsers = ["testuser", "validuser", "reddituser", "austrie"];

    if (verifiedUsers.includes(username as string)) {
      return HttpResponse.json({
        kind: "t2",
        data: {
          name: username,
          id: "2_test123",
        },
      });
    }

    // Return 404 for non-existent users
    return new HttpResponse(null, { status: 404 });
  }),
);

// Database cleanup utility
export async function cleanupTestData() {
  const db = getTestDatabase();
  try {
    await cleanupTestDataUtil(db);
  } catch (error) {
    console.warn("Warning: Failed to cleanup test data:", error);
  }
}

// Global test setup
beforeAll(async () => {
  // Start the mock server with permissive configuration
  mockServer.listen({ onUnhandledRequest: "bypass" });

  // Set test environment variables
  process.env.NODE_ENV = "test";
  process.env.REDDIT_CLIENT_ID = "test_client_id";
  process.env.REDDIT_CLIENT_SECRET = "test_client_secret";
  process.env.PING_MESSAGE = "test ping";
  
  // Set database URL for server endpoints
  process.env.TEST_DATABASE_URL = getTestDatabaseUrl();

  // Initialize database if needed
  if (!databaseInitialized) {
    try {
      console.log("🚀 Initializing test database...");
      
      // Automatically ensure database environment is ready
      await ensureDatabaseEnvironment();
      
      const db = getTestDatabase();
      
      // Setup schema if needed (will only run if tables don't exist)
      await setupTestDatabase(db);
      
      // Verify database is ready
      await verifyTestDatabase(db);
      
      databaseInitialized = true;
      console.log("✅ Test database initialization complete");
    } catch (error) {
      console.error("❌ Test database initialization failed:", error);
      console.error("💡 Make sure you have a local PostgreSQL database running.");
      console.error("💡 See tests/TEST_DATABASE_SETUP.md for setup instructions.");
      throw error;
    }
  }

  console.log("🧪 Backend test environment initialized");
});

afterAll(async () => {
  // Close mock server
  mockServer.close();

  // Close database connections
  if (testPool) {
    await testPool.end();
    testPool = null;
  }

  console.log("Backend test environment cleaned up");
});

// Per-test setup
beforeEach(async () => {
  // Reset MSW handlers
  mockServer.resetHandlers();
});

afterEach(async () => {
  // Clean up test data after each test
  await cleanupTestData();
});
