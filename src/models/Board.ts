import mongoose, { Document, Model, Schema } from "mongoose";

export interface IBoard extends Document {
  title: string;
  projectId: mongoose.Types.ObjectId;
  orderIndex: number;
  createdAt: Date;
  updatedAt: Date;
}

const boardSchema = new mongoose.Schema<IBoard>(
  {
    title: {
      type: String,
      required: [true, "Board column title is required"],
      trim: true,
    },
    projectId: {
      type: Schema.Types.ObjectId,
      ref: "Project",
      required: true,
      index: true,
    },
    orderIndex: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  },
);

const Board: Model<IBoard> = mongoose.model<IBoard>("Board", boardSchema);
export default Board;
