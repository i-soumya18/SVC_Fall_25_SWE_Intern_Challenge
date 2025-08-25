import { RequestHandler } from "express";
import { MongoClient, Db } from "mongodb";
import { ContractorRequestSchema, ContractorSchema, type ContractorRequestResponse } from "@shared/schemas";

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

export const handleContractorRequest: RequestHandler = async (req, res) => {
  try {
    // Validate request body
    const validatedData = ContractorRequestSchema.parse(req.body);
    
    // Connect to database
    const db = await connectToDatabase();
    const contractorsCollection = db.collection("contractors");
    const usersCollection = db.collection("users");
    
    // Find the user by email
    const user = await usersCollection.findOne({ email: validatedData.email });
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found. Please complete the qualification form first."
      } as ContractorRequestResponse);
    }
    
    // Check if contractor request already exists for this user and company
    const existingContractor = await contractorsCollection.findOne({
      userId: user._id.toString(),
      companySlug: validatedData.companySlug
    });
    
    if (existingContractor) {
      return res.status(400).json({
        success: false,
        message: "You have already requested to join this company. Please check your email for updates."
      } as ContractorRequestResponse);
    }
    
    // Create contractor request document
    const contractorData = {
      userId: user._id.toString(),
      email: validatedData.email,
      companySlug: validatedData.companySlug,
      companyName: validatedData.companyName,
      status: 'pending' as const,
      joinedSlack: true, // Set to true since they clicked join
      canStartJob: false, // Will be set to true when company approves
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    // Validate with schema
    const contractorDoc = ContractorSchema.parse(contractorData);
    
    // Save to database
    const result = await contractorsCollection.insertOne(contractorDoc);
    
    if (!result.acknowledged) {
      throw new Error("Failed to save contractor request to database");
    }
    
    // TODO: In a real app, you would also:
    // 1. Send an email to the company notifying them of the new contractor request
    // 2. Send a confirmation email to the user
    // 3. Add the request to a queue for processing
    
    const response: ContractorRequestResponse = {
      success: true,
      message: "We've just pinged them. You'll be sent an email and text invite within 72 hours."
    };
    
    res.json(response);
    
  } catch (error: any) {
    console.error("Error processing contractor request:", error);
    
    if (error.issues) {
      // Zod validation errors
      return res.status(400).json({
        success: false,
        message: error.issues.map((issue: any) => issue.message).join(", ")
      } as ContractorRequestResponse);
    }
    
    res.status(500).json({
      success: false,
      message: "An internal server error occurred"
    } as ContractorRequestResponse);
  }
};
