import { beforeAll, afterAll, beforeEach, afterEach } from "vitest";
import { Pool } from "pg";
import { setupServer } from "msw/node";
import { http, HttpResponse } from "msw";

// Test database configuration
let testPool: Pool | null = null;

export function getTestDatabase(): Pool {
  if (testPool) {
    return testPool;
  }

  // Use a test database URL or fallback to the main one with a test schema
  const testDatabaseUrl =
    process.env.TEST_DATABASE_URL || process.env.DATABASE_URL;

  if (!testDatabaseUrl) {
    throw new Error(
      "Neither TEST_DATABASE_URL nor DATABASE_URL is set for testing",
    );
  }

  testPool = new Pool({
    connectionString: testDatabaseUrl,
    ssl: testDatabaseUrl.includes("neon.tech")
      ? {
          rejectUnauthorized: false,
        }
      : undefined,
    max: 5, // Smaller pool for tests
    idleTimeoutMillis: 5000,
    connectionTimeoutMillis: 5000,
  });

  return testPool;
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
    // Clean up in reverse order of dependencies
    await db.query("DELETE FROM contractors WHERE email LIKE $1", ["%test%"]);
    await db.query("DELETE FROM users WHERE email LIKE $1", ["%test%"]);
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

  console.log("Backend test environment initialized");
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
