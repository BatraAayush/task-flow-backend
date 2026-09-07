import z from "zod";

const dateSchema = z
  .string()
  .refine((val) => !isNaN(Date.parse(val)), {
    message: "Invalid date format",
  })
  .nullable()
  .optional();

export const createTaskSchema = z.object({
  title: z.string().min(2, "Task title must be atleast 2 characters"),
  description: z.string().optional(),
  boardId: z.string().regex(/^[0-9a-fA-F]{24}$/, "Valid boardId is required"),
  status: z.enum(["todo", "in_progress", "done"]).optional(),
  priority: z.enum(["low", "medium", "high", "urgent"]).optional(),
  assignedTo: z
    .string()
    .regex(/^[0-9a-fA-F]{24}$/, "Invalid user ID")
    .nullable()
    .optional(),
  dueDate: dateSchema,
});

export const updateTaskStatusSchema = z.object({
  status: z.enum(["todo", "in_progress", "done"]),
  boardId: z
    .string()
    .regex(/^[0-9a-fA-F]{24}$/, "Valid boardId is required")
    .optional(),
  orderIndex: z.number().nonnegative().optional(),
});

export const updateTaskSchema = z.object({
  title: z
    .string()
    .min(2, "Task title must be atleast 2 characters")
    .optional(),
  description: z.string().optional(),
  priority: z.enum(["low", "medium", "high", "urgent"]).optional(),
  assignedTo: z
    .string()
    .regex(/^[0-9a-fA-F]{24}$/, "Invalid user ID")
    .nullable()
    .optional(),
  dueDate: dateSchema,
});

export const createCommentSchema = z.object({
  content: z.string().min(1, "Comment text can not be empty"),
});
