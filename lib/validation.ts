import { z } from 'zod';

/**
 * Centralized Zod validation schemas
 * Ensures consistent validation across API endpoints
 */

// Auth Schemas
export const SignupSchema = z.object({
  user_id: z.string().optional(),
  email: z.string().email('Invalid email address'),
  username: z.string().min(3, 'Username must be at least 3 characters').max(20, 'Username must be less than 20 characters'),
  phone_number: z.string().refine(
    (phone) => {
      // Remove spaces, dashes, and parentheses, then check if at least 10 digits remain
      const digitsOnly = phone.replace(/[\s\-()]/g, '');
      return /^\d{10,}$/.test(digitsOnly);
    },
    'Phone number must contain at least 10 digits'
  ),
  password: z.string().min(8, 'Password must be at least 8 characters').optional(),
  subscription_tier: z.enum(['free', 'basic', 'standard', 'pro']).optional().default('free'),
});

export const LoginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const ResetPasswordRequestSchema = z.object({
  email: z.string().email('Invalid email address'),
});

export const ResetPasswordConfirmSchema = z.object({
  email: z.string().email('Invalid email address'),
  token: z.string().min(1, 'Reset token is required'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

// Tool Schemas
export const CreateToolSchema = z.object({
  name: z.string().min(2, 'Tool name must be at least 2 characters').max(100, 'Tool name must be less than 100 characters'),
  description: z.string().max(1000, 'Description must be less than 1000 characters').optional().default(''),
  category: z.string().min(1, 'Category is required'),
  condition: z.string().transform(v => v.toLowerCase()),
  daily_rate: z.number().min(0.5, 'Daily rate must be at least £0.50').max(500, 'Daily rate must be less than £500'),
  tool_value: z.number().min(1, 'Tool value must be at least £1').max(500, 'Tool value must be less than £500').optional(),
  images: z.array(z.string().url()).optional().default([]),
  image_url: z.string().url().optional(),
});

export const UpdateToolSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  description: z.string().max(1000).optional(),
  category: z.string().min(1).optional(),
  condition: z.string().optional(),
  daily_rate: z.number().min(0.5).max(500).optional(),
  tool_value: z.number().min(1).max(500).optional(),
  postcode: z.string().max(10).optional(),
  image_url: z.string().url().optional(),
});

// Borrow Request Schemas
export const BorrowRequestSchema = z.object({
  tool_id: z.string().uuid('Invalid tool ID'),
  start_date: z.string().refine(
    (date) => new Date(date) > new Date(),
    'Start date must be in the future'
  ),
  end_date: z.string().refine(
    (date) => new Date(date) > new Date(),
    'End date must be in the future'
  ),
}).refine(
  (data) => new Date(data.end_date) > new Date(data.start_date),
  {
    message: 'End date must be after start date',
    path: ['end_date'],
  }
).refine(
  (data) => {
    const days = (new Date(data.end_date).getTime() - new Date(data.start_date).getTime()) / (1000 * 60 * 60 * 24);
    return days <= 30;
  },
  {
    message: 'Borrow period cannot exceed 30 days',
    path: ['end_date'],
  }
);

// Profile Schemas
export const UpdateProfileSchema = z.object({
  username: z.string().min(3).max(20).optional(),
  phone_number: z.string().regex(/^\d{10,}$/, 'Phone number must contain at least 10 digits').optional(),
  postcode: z.string().min(2).max(10).optional(),
});

// Subscription Schemas
export const CheckoutSessionSchema = z.object({
  tier: z.enum(['basic', 'standard', 'pro']),
});

// Export types
export type SignupInput = z.infer<typeof SignupSchema>;
export type LoginInput = z.infer<typeof LoginSchema>;
export type CreateToolInput = z.infer<typeof CreateToolSchema>;
export type BorrowRequestInput = z.infer<typeof BorrowRequestSchema>;
export type UpdateProfileInput = z.infer<typeof UpdateProfileSchema>;
