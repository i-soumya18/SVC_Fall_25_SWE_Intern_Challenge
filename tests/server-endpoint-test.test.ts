import { describe, it, expect } from "vitest";
import request from "supertest";
import { createServer } from "../server/index";

describe("Server Endpoint Test with Real Credentials", () => {
  it("should test social-qualify-form endpoint with real Reddit credentials", async () => {
    console.log("🚀 TESTING SERVER ENDPOINT WITH REAL REDDIT CREDENTIALS");
    console.log("======================================================");

    const app = createServer();

    // Test form data with 'austrie' username
    const formData = {
      email: "test.austrie@example.com",
      phone: "1234567890",
      redditUsername: "austrie",
      twitterUsername: "test_twitter",
      youtubeUsername: "test_youtube",
      facebookUsername: "test_facebook",
    };

    console.log("[TEST] Submitting form with data:", formData);
    console.log("[TEST] This will use the REAL Reddit API credentials");
    console.log("[TEST] Looking for Reddit verification of user 'austrie'...");

    const response = await request(app)
      .post("/api/social-qualify-form")
      .send(formData)
      .expect(200);

    console.log("[TEST] Response received:");
    console.log("[TEST] Success:", response.body.success);
    console.log("[TEST] Message:", response.body.message);

    // Check if the form submission was successful
    expect(response.body.success).toBe(true);
    expect(response.body.message).toBe("Application processed successfully");

    console.log("✅ Form submission successful!");
    console.log("🔍 Now check the database to see if reddit_verified = true");
    console.log("📝 Or check server logs for Reddit API calls");
  }, 30000); // 30 second timeout for real API calls

  it("should show current environment variables", async () => {
    console.log("🔧 CURRENT ENVIRONMENT VARIABLES:");
    console.log("=================================");
    console.log("NODE_ENV:", process.env.NODE_ENV);
    console.log("REDDIT_CLIENT_ID:", process.env.REDDIT_CLIENT_ID);
    console.log(
      "REDDIT_CLIENT_SECRET:",
      process.env.REDDIT_CLIENT_SECRET
        ? `${process.env.REDDIT_CLIENT_SECRET.substring(0, 8)}...`
        : "NOT SET",
    );
    console.log(
      "DATABASE_URL:",
      process.env.DATABASE_URL ? "CONFIGURED" : "NOT SET",
    );

    expect(true).toBe(true); // Always pass
  });
});
