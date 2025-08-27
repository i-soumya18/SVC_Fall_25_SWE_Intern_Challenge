import { z } from "zod";

// User schema for PostgreSQL
export const UserSchema = z.object({
  id: z.number().optional(), // Auto-increment primary key
  email: z.string().email(),
  phone: z.string().min(10, "Phone number must be at least 10 digits"),
  reddit_username: z.string().min(1, "Reddit username is required"),
  twitter_username: z.string().optional(),
  youtube_username: z.string().optional(),
  facebook_username: z.string().optional(),
  reddit_verified: z.boolean().default(false),
  created_at: z.date().optional(), // Will be set by database
  updated_at: z.date().optional(), // Will be set by database
});

// Contractor request schema for PostgreSQL
export const ContractorSchema = z.object({
  id: z.number().optional(), // Auto-increment primary key
  user_id: z.number(), // Reference to User ID
  email: z.string().email(),
  company_slug: z.string(),
  company_name: z.string(),
  status: z.enum(["pending", "accepted", "rejected"]).default("pending"),
  joined_slack: z.boolean().default(false),
  can_start_job: z.boolean().default(false),
  created_at: z.date().optional(), // Will be set by database
  updated_at: z.date().optional(), // Will be set by database
});

// Form validation schemas (keeping camelCase for frontend)
export const SocialQualifyFormSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  phone: z.string().min(10, "Phone number must be at least 10 digits"),
  redditUsername: z.string().min(1, "Reddit username is required"),
  twitterUsername: z.string().optional(),
  youtubeUsername: z.string().optional(),
  facebookUsername: z.string().optional(),
});

export const ContractorRequestSchema = z.object({
  email: z.string().email(),
  companySlug: z.string().min(1, "Company slug is required"),
  companyName: z.string().min(1, "Company name is required"),
});

// TypeScript types
export type User = z.infer<typeof UserSchema>;
export type Contractor = z.infer<typeof ContractorSchema>;
export type SocialQualifyForm = z.infer<typeof SocialQualifyFormSchema>;
export type ContractorRequest = z.infer<typeof ContractorRequestSchema>;

// API Response types
export interface SocialQualifyResponse {
  success: boolean;
  message: string;
  redirect?: string;
  data?: {
    matchedCompany: {
      name: string;
      slug: string;
      payRate: string;
      bonus: string;
    };
  };
}

export interface ContractorRequestResponse {
  success: boolean;
  message: string;
}

export interface CheckUserExistsResponse {
  success: boolean;
  userExists: boolean;
  message?: string;
}
