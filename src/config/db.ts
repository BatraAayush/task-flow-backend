import mongoose from "mongoose";

export const connectDB = async (): Promise<void> => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI as string);
    console.log(`[MongoDB] Connected to database: ${conn.connection.name}`);
  } catch (err) {
    console.error(`[MongoDB] Connection error:`, err);
    process.exit(1);
  }
};
