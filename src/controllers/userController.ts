import { Request, Response } from "express";
import User from "../models/User.js";
import { sendResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const getAllUsers = asyncHandler(async (req: Request, res: Response) => {
  const users = await User.find({}, "name email avatarUrl");
  return sendResponse(res, users, "Users retrieved successfully", 200);
});
