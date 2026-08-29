import { z } from "zod";

export const passwordSchema = z
  .string()
  .min(8, "At least 8 characters")
  .regex(/[A-Z]/, "At least one uppercase letter")
  .regex(/[a-z]/, "At least one lowercase letter")
  .regex(/[0-9]/, "At least one number")
  .regex(/[^A-Za-z0-9]/, "At least one special character");

export const signUpSchema = z.object({
  full_name: z.string().trim().min(2, "Enter your full name").max(80),
  email: z.string().trim().email("Enter a valid email").max(120),
  password: passwordSchema,
  enrollment_number: z.string().trim().min(3, "Enter your enrollment number").max(40),
  college_name: z.string().trim().min(2, "Enter your college").max(120),
  branch: z.string().trim().min(2, "Enter your branch").max(60),
  semester: z.coerce.number().int().min(1).max(12),
});

export const signInSchema = z.object({
  email: z.string().trim().email("Enter a valid email"),
  password: z.string().min(1, "Enter your password"),
});

export const subjectSchema = z.object({
  name: z.string().trim().min(1, "Subject name is required").max(80),
  semester: z.coerce.number().int().min(1).max(12),
});

export const workSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(140),
  subject_id: z.string().uuid("Choose a subject"),
  description: z.string().trim().max(2000).optional().or(z.literal("")),
  due_date: z.string().optional().or(z.literal("")),
  priority: z.enum(["low", "medium", "high"]),
  status: z.enum(["pending", "in_progress", "submitted", "completed"]),
  teacher_name: z.string().trim().max(80).optional().or(z.literal("")),
});

export type SignUpValues = z.infer<typeof signUpSchema>;
export type SignInValues = z.infer<typeof signInSchema>;
export type SubjectValues = z.infer<typeof subjectSchema>;
export type WorkValues = z.infer<typeof workSchema>;
