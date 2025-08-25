import { RequestHandler } from "express";
import { MongoClient, Db } from "mongodb";
import { SocialQualifyFormSchema, UserSchema, type SocialQualifyResponse } from "@shared/schemas";

let cachedDb: Db | null = null;

// MongoDB connection
async function connectToDatabase(): Promise<Db> {
  if (cachedDb) {
    return cachedDb;
  }

  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error("MONGODB_URI environment variable is not set");
  }

  const client = new MongoClient(uri);
  await client.connect();
  const db = client.db("fairdatause");
  cachedDb = db;
  return db;
}

// Reddit API integration
async function verifyRedditAccount(username: string): Promise<boolean> {
  try {
    const clientId = process.env.REDDIT_CLIENT_ID;
    const clientSecret = process.env.REDDIT_CLIENT_SECRET;
    
    if (!clientId || !clientSecret) {
      console.error("Reddit API credentials not configured");
      return false;
    }

    // Get Reddit OAuth token
    const authResponse = await fetch('https://www.reddit.com/api/v1/access_token', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`,
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': 'FairDataUse/1.0.0'
      },
      body: 'grant_type=client_credentials'
    });

    if (!authResponse.ok) {
      console.error("Failed to get Reddit OAuth token");
      return false;
    }

    const authData = await authResponse.json();
    const accessToken = authData.access_token;

    // Check if user exists
    const userResponse = await fetch(`https://oauth.reddit.com/user/${username}/about`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'User-Agent': 'FairDataUse/1.0.0'
      }
    });

    return userResponse.ok;
  } catch (error) {
    console.error("Error verifying Reddit account:", error);
    return false;
  }
}

export const handleSocialQualifyForm: RequestHandler = async (req, res) => {
  try {
    // Validate request body
    const validatedData = SocialQualifyFormSchema.parse(req.body);
    
    // Connect to database
    const db = await connectToDatabase();
    const usersCollection = db.collection("users");
    
    // Check if user already exists (email + phone combination)
    const existingUser = await usersCollection.findOne({
      $and: [
        { email: validatedData.email },
        { phone: validatedData.phone }
      ]
    });
    
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "A user with this email and phone number combination already exists."
      } as SocialQualifyResponse);
    }
    
    // Verify Reddit account
    const redditVerified = await verifyRedditAccount(validatedData.redditUsername);
    
    // Create user document
    const userData = {
      ...validatedData,
      redditVerified,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    // Validate with schema
    const userDoc = UserSchema.parse(userData);
    
    // Save to database
    const result = await usersCollection.insertOne(userDoc);
    
    if (!result.acknowledged) {
      throw new Error("Failed to save user to database");
    }
    
    // Always return "rejected" but offer side-gigs marketplace
    const response: SocialQualifyResponse = {
      success: true,
      message: "Application processed successfully",
      data: {
        matchedCompany: {
          name: "Silicon Valley Consulting",
          slug: "silicon-valley-consulting",
          payRate: "$2.00 per hour",
          bonus: "$500"
        }
      }
    };
    
    res.json(response);
    
  } catch (error: any) {
    console.error("Error processing social qualify form:", error);
    
    if (error.issues) {
      // Zod validation errors
      return res.status(400).json({
        success: false,
        message: error.issues.map((issue: any) => issue.message).join(", ")
      } as SocialQualifyResponse);
    }
    
    res.status(500).json({
      success: false,
      message: "An internal server error occurred"
    } as SocialQualifyResponse);
  }
};
