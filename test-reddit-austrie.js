// Test script to verify Reddit function for user 'austrie'
import "dotenv/config";

// Reddit API integration function (copied from server)
async function verifyRedditAccount(username) {
  console.log(`[REDDIT] Verifying Reddit account: ${username}`);

  try {
    const clientId = process.env.REDDIT_CLIENT_ID;
    const clientSecret = process.env.REDDIT_CLIENT_SECRET;

    console.log("[REDDIT] Client ID configured:", clientId ? "YES" : "NO");
    console.log("[REDDIT] Client ID value:", clientId);
    console.log(
      "[REDDIT] Client Secret configured:",
      clientSecret ? "YES" : "NO",
    );
    console.log(
      "[REDDIT] Client Secret value:",
      clientSecret ? `${clientSecret.substring(0, 8)}...` : "NOT SET",
    );

    if (!clientId || !clientSecret) {
      console.error("[REDDIT] ❌ REDDIT API CREDENTIALS NOT CONFIGURED ❌");
      console.error(
        "[REDDIT] Missing:",
        !clientId ? "REDDIT_CLIENT_ID" : "",
        !clientSecret ? "REDDIT_CLIENT_SECRET" : "",
      );
      return false;
    }

    // Get Reddit OAuth token
    console.log("[REDDIT] Requesting OAuth token from Reddit...");
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

    console.log("[REDDIT] OAuth response status:", authResponse.status);
    console.log(
      "[REDDIT] OAuth response headers:",
      Object.fromEntries(authResponse.headers),
    );

    if (!authResponse.ok) {
      const errorText = await authResponse.text();
      console.error("[REDDIT] Failed to get Reddit OAuth token:", errorText);
      return false;
    }

    const authData = await authResponse.json();
    const accessToken = authData.access_token;
    console.log("[REDDIT] OAuth token received:", accessToken ? "YES" : "NO");
    console.log("[REDDIT] OAuth response data:", authData);

    // Check if user exists
    console.log(`[REDDIT] Checking if user '${username}' exists...`);
    const userResponse = await fetch(
      `https://oauth.reddit.com/user/${username}/about`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "User-Agent": "FairDataUse/1.0.0",
        },
      },
    );

    console.log(
      `[REDDIT] User verification response status: ${userResponse.status}`,
    );
    console.log(
      "[REDDIT] User verification response headers:",
      Object.fromEntries(userResponse.headers),
    );

    if (!userResponse.ok) {
      const errorText = await userResponse.text();
      console.error("[REDDIT] User verification failed:", errorText);
    } else {
      const userData = await userResponse.json();
      console.log(
        "[REDDIT] User data received:",
        JSON.stringify(userData, null, 2),
      );
    }

    const verified = userResponse.ok;
    console.log(
      `[REDDIT] User '${username}' verification result: ${verified ? "VERIFIED" : "NOT FOUND"}`,
    );
    return verified;
  } catch (error) {
    console.error(
      `[REDDIT] Error verifying Reddit account '${username}':`,
      error,
    );
    return false;
  }
}

// Test the function
async function testRedditVerification() {
  console.log("🧪 TESTING REDDIT VERIFICATION FOR USER 'austrie'");
  console.log("================================================");

  const result = await verifyRedditAccount("austrie");

  console.log("================================================");
  console.log("🎯 FINAL RESULT:");
  console.log(`   Username: austrie`);
  console.log(`   Verified: ${result}`);
  console.log(`   Status: ${result ? "✅ SUCCESS" : "❌ FAILED"}`);
  console.log("================================================");

  return result;
}

// Run the test
testRedditVerification().catch(console.error);
