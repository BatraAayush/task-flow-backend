import z from "zod";
import { email } from "zod/v4";

export const createProjectSchema = z.object({
  title: z.string().min(2, "Project title must be at least 2 characters"),
  description: z.string().optional(),
});

export const inviteMemberSchema = z.object({
  email: z.string().email("Valid user email is required to invite"),
  role: z.enum(["admin", "member"]).default("member"),
});
