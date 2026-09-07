import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { generateTokens } from "../utils/jwt.js";
import { sendResponse } from "../utils/ApiResponse.js";
import { AuthenticatedRequest } from "../middleware/authGuard.js";

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
};

export const register = asyncHandler(async (req: Request, res: Response) => {
  const { name, email, password } = req.body;

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw new ApiError(400, "User with this email already exists");
  }

  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);

  const user = await User.create({ name, email, password: hashedPassword });

  const { accessToken, refreshToken } = generateTokens(user._id.toString());

  const saltRefresh = await bcrypt.genSalt(10);
  user.refreshTokenHash = await bcrypt.hash(refreshToken, saltRefresh);
  await user.save();

  res.cookie("refreshToken", refreshToken, COOKIE_OPTIONS);

  return sendResponse(
    res,
    {
      user: { _id: user._id, name: user.name, email: user.email },
      accessToken,
    },
    "User registered successfully",
    201
  );
});

export const login = asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email });
  if (!user) {
    throw new ApiError(401, "Invalid email or password");
  }

  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) {
    throw new ApiError(401, "Invalid email or password");
  }

  const { accessToken, refreshToken } = generateTokens(user._id.toString());

  const saltRefresh = await bcrypt.genSalt(10);
  user.refreshTokenHash = await bcrypt.hash(refreshToken, saltRefresh);
  await user.save();

  res.cookie("refreshToken", refreshToken, COOKIE_OPTIONS);

  return sendResponse(
    res,
    {
      user: { _id: user._id, name: user.name, email: user.email },
      accessToken,
    },
    "Logged in successfully",
    200
  );
});

export const refresh = asyncHandler(async (req: Request, res: Response) => {
  const incomingRefreshToken = req.cookies?.refreshToken;
  if (!incomingRefreshToken) {
    throw new ApiError(401, "Refresh token missing from cookies");
  }

  try {
    const decoded = jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET as string
    ) as { userId: string };

    const user = await User.findById(decoded.userId);
    if (!user || !user.refreshTokenHash) {
      throw new ApiError(401, "Invalid refresh session");
    }

    const isValid = await bcrypt.compare(incomingRefreshToken, user.refreshTokenHash);
    if (!isValid) {
      throw new ApiError(401, "Refresh token reused or invalidated");
    }

    const { accessToken, refreshToken: newRefreshToken } = generateTokens(
      user._id.toString()
    );

    const saltRefresh = await bcrypt.genSalt(10);
    user.refreshTokenHash = await bcrypt.hash(newRefreshToken, saltRefresh);
    await user.save();

    res.cookie("refreshToken", newRefreshToken, COOKIE_OPTIONS);

    return sendResponse(
      res,
      {
        accessToken,
        user: { _id: user._id, name: user.name, email: user.email },
      },
      "Token refreshed successfully",
      200
    );
  } catch {
    throw new ApiError(401, "Expired or invalid refresh token");
  }
});

export const logout = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    if (req.user?._id) {
      await User.findByIdAndUpdate(req.user._id, {
        $set: { refreshTokenHash: null },
      });
    }
    res.clearCookie("refreshToken", COOKIE_OPTIONS);
    return sendResponse(res, null, "Logged out successfully", 200);
  }
);

export const getMe = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const user = await User.findById(req.user?._id).select("-password");
    if (!user) {
      throw new ApiError(404, "User not found");
    }
    return sendResponse(res, user, "Current user retrieved", 200);
  }
);