import { Response } from "express";

export class ApiResponse<T = any> {
  success: boolean;
  statusCode: number;
  message: string;
  data?: T;

  constructor(statusCode: number, data?: T, message: string = "Success") {
    this.success = statusCode < 400;
    this.statusCode = statusCode;
    this.message = message;
    if (data !== undefined) this.data = data;
  }
}

export const sendResponse = <T>(
  res: Response,
  data?: T,
  message: string = "Success",
  statusCode: number = 200
) => {
  return res
    .status(statusCode)
    .json(new ApiResponse(statusCode, data, message));
}