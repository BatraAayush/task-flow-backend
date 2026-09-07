import mongoose, { Document, Model, Schema } from "mongoose";

export type RoleType = "owner" | "admin" | "member";

export interface IProjectMember {
  user: mongoose.Types.ObjectId;
  role: RoleType;
}

export interface IProject extends Document {
  title: string;
  description: string;
  owner: mongoose.Types.ObjectId;
  members: IProjectMember[];
  createdAt: Date;
  updatedAt: Date;
}

const memberSchema = new Schema<IProjectMember>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    role: {
      type: String,
      enum: ["owner", "admin", "member"],
      default: "member",
    },
  },
  { _id: false },
);

const ProjectSchema = new Schema<IProject>(
  {
    title: {
      type: String,
      required: [true, "Title is required"],
      trim: true,
      minLength: 2,
    },
    description: {
      type: String,
      default: "",
      trim: true,
    },
    owner: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    members: [memberSchema],
  },
  {
    timestamps: true,
  },
);

const Project: Model<IProject> = mongoose.model<IProject>(
  "Project",
  ProjectSchema,
);

export default Project;
