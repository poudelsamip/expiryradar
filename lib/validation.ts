import { z } from 'zod';

export const loginSchema = z.object({
  email: z.email('Enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export type LoginFormData = z.infer<typeof loginSchema>;

export const signupSchema = z
  .object({
    name: z.string().min(1, 'Name is required'),
    email: z.email('Enter a valid email address'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    confirmPassword: z.string().min(6, 'Password must be at least 6 characters'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });

export type SignupFormData = z.infer<typeof signupSchema>;

export const itemSchema = z.object({
  name: z.string().min(1, 'Name is required').max(80, 'Keep it under 80 characters'),
  key_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Use the format YYYY-MM-DD')
    .refine((v) => !Number.isNaN(new Date(v).getTime()), 'Enter a valid date'),
  notes: z.string().max(500, 'Keep notes under 500 characters').optional(),
  quantity: z
    .string()
    .optional()
    .refine((v) => !v || /^\d+$/.test(v), 'Quantity must be a whole number'),
});

export type ItemFormData = z.infer<typeof itemSchema>;
