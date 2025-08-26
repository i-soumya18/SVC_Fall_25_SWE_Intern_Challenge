import { describe, it, expect } from "vitest";

// Direct test to verify Reddit API functionality
describe("Reddit API Debug Tests", () => {
  it("should verify real Reddit user austrie exists", async () => {
    // Skip if no credentials (in test environment)
    const clientId = process.env.REDDIT_CLIENT_ID;
    const clientSecret = process.env.REDDIT_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      console.log("Skipping Reddit API test - no credentials configured");
      return;
    }

    try {
      // Test OAuth token generation
      console.log("[TEST] Testing Reddit OAuth token...");
      const authResponse = await fetch(
        "https://www.reddit.com/api/v1/access_token",
        {
          method: "POST",
          headers: {
            Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`,
            "Content-Type": "application/x-www-form-urlencoded",
            "User-Agent": "FairDataUse/1.0.0",
          },
          body: "grant_type=client_credentials",
        },
      );

      console.log("[TEST] OAuth response status:", authResponse.status);
      expect(authResponse.ok).toBe(true);

      const authData = await authResponse.json();
      expect(authData.access_token).toBeDefined();
      console.log("[TEST] OAuth token received successfully");

      // Test user verification for 'austrie'
      console.log("[TEST] Testing user verification for austrie...");
      const userResponse = await fetch(
        "https://oauth.reddit.com/user/austrie/about",
        {
          headers: {
            Authorization: `Bearer ${authData.access_token}`,
            "User-Agent": "FairDataUse/1.0.0",
          },
        },
      );

      console.log(
        "[TEST] User verification response status:",
        userResponse.status,
      );
      console.log(
        "[TEST] User verification response headers:",
        Object.fromEntries(userResponse.headers),
      );

      if (!userResponse.ok) {
        const errorText = await userResponse.text();
        console.log("[TEST] Error response:", errorText);
      }

      // The user should exist if this is a real Reddit username
      expect(userResponse.ok).toBe(true);

      const userData = await userResponse.json();
      console.log("[TEST] User data received:", userData);
    } catch (error) {
      console.error("[TEST] Reddit API test failed:", error);
      throw error;
    }
  });

  it("should test public Reddit API access for austrie", async () => {
    // Test the public API without OAuth
    try {
      console.log("[TEST] Testing public Reddit API...");
      const response = await fetch("https://www.reddit.com/user/austrie.json", {
        headers: {
          "User-Agent": "FairDataUse/1.0.0",
        },
      });

      console.log("[TEST] Public API response status:", response.status);

      if (response.ok) {
        const data = await response.json();
        console.log("[TEST] Public API data:", data.data?.name);
        expect(data.data?.name).toBe("austrie");
      } else {
        const errorText = await response.text();
        console.log("[TEST] Public API error:", errorText);
        // If 404, the user might not exist
        console.log("[TEST] User austrie may not exist on Reddit");
      }
    } catch (error) {
      console.error("[TEST] Public Reddit API test failed:", error);
    }
  });
});
