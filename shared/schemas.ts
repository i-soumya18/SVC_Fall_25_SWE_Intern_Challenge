import { z } from "zod";

// User schema for social qualification form
export const UserSchema = z.object({
  email: z.string().email(),
  phone: z.string().min(10, "Phone number must be at least 10 digits"),
  redditUsername: z.string().min(1, "Reddit username is required"),
  twitterUsername: z.string().optional(),
  youtubeUsername: z.string().optional(),
  facebookUsername: z.string().optional(),
  redditVerified: z.boolean().default(false),
  createdAt: z.date().default(() => new Date()),
  updatedAt: z.date().default(() => new Date()),
});

// Contractor request schema
export const ContractorSchema = z.object({
  userId: z.string(), // Reference to User
  email: z.string().email(),
  companySlug: z.string(),
  companyName: z.string(),
  status: z.enum(["pending", "accepted", "rejected"]).default("pending"),
  joinedSlack: z.boolean().default(false),
  canStartJob: z.boolean().default(false),
  createdAt: z.date().default(() => new Date()),
  updatedAt: z.date().default(() => new Date()),
});

// Form validation schemas
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
  companySlug: z.string(),
  companyName: z.string(),
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
