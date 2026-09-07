import mongoose, { Document, Model, Schema } from "mongoose";

export type TaskStatus = "todo" | "in_progress" | "done";
export type TaskPriority = "low" | "medium" | "high" | "urgent";

export interface IActivityLog {
  user: mongoose.Types.ObjectId;
  action: string;
  timestamp: Date;
}

export interface ITask extends Document {
  title: string;
  description: string;
  projectId: mongoose.Types.ObjectId;
  boardId: mongoose.Types.ObjectId;
  status: TaskStatus;
  priority: TaskPriority;
  assignedTo: mongoose.Types.ObjectId | null;
  dueDate?: Date | null;
  orderIndex: number;
  activityLogs: IActivityLog[];
  createdAt: Date;
  updatedAt: Date;
}

const activityLogSchema = new Schema<IActivityLog>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    action: {
      type: String,
      required: true,
    },
    timestamp: {
      type: Date,
      default: Date.now(),
    },
  },
  {
    _id: false,
  },
);

const taskSchema = new Schema<ITask>(
  {
    title: {
      type: String,
      required: [true, "  Task title is required"],
      trim: true,
      minLength: 2,
    },
    description: {
      type: String,
      default: "",
      trim: true,
    },
    projectId: {
      type: Schema.Types.ObjectId,
      ref: "Project",
      required: true,
      index: true,
    },
    boardId: {
      type: Schema.Types.ObjectId,
      ref: "Board",
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ["todo", "in_progress", "done"],
      default: "todo",
      index: true,
    },
    priority: {
      type: String,
      enum: ["low", "medium", "high", "urgent"],
      default: "medium",
      index: true,
    },
    assignedTo: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true,
    },
    dueDate: {
      type: Date,
      default: null,
    },
    orderIndex: {
      type: Number,
      default: 0,
    },
    activityLogs: [activityLogSchema],
  },
  {
    timestamps: true,
  },
);

taskSchema.index({ title: "text", description: "text" });

const Task: Model<ITask> = mongoose.model<ITask>("Task", taskSchema);

export default Task;
