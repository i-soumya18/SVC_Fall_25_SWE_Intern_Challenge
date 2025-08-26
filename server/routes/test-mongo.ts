import { RequestHandler } from "express";

export const handleTestMongo: RequestHandler = async (req, res) => {
  console.log("==================== TEST MONGO URI ====================");
  console.log("MONGODB_URI:", process.env.MONGODB_URI);
  console.log("REDDIT_CLIENT_ID:", process.env.REDDIT_CLIENT_ID);
  console.log("REDDIT_CLIENT_SECRET:", process.env.REDDIT_CLIENT_SECRET);
  console.log("========================================================");
  
  res.json({
    mongoConfigured: !!process.env.MONGODB_URI,
    mongoUri: process.env.MONGODB_URI,
    redditConfigured: !!(process.env.REDDIT_CLIENT_ID && process.env.REDDIT_CLIENT_SECRET)
  });
};
