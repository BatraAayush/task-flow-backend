import express, { Request, Response } from "express";
import dotenv from "dotenv";
import { connectDB } from "./config/db.js";
import cookieParser from "cookie-parser";
import cors from "cors";
import { ApiError } from "./utils/ApiError.js";
import { ErrorHandler } from "./middleware/errorHandler.js";
import authRoutes from "../src/routes/auth.routes.js";
import projectRoutes from "../src/routes/project.routes.js";
import taskRoutes from "../src/routes/task.routes.js";
import userRoutes from "../src/routes/user.routes.js";
import { swaggerDocument } from "./config/swagger.js";
import swaggerUi from "swagger-ui-express";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

connectDB();

app.use(express.json());
app.use(cookieParser());
const allowedOrigins = [
  "http://localhost:5173",
  process.env.CLIENT_URL, // Injected via deployment environment variables
].filter(Boolean);
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Blocked by CORS"));
      }
    },
    credentials: true,
  }),
);
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/projects", projectRoutes);
app.use("/api/v1/projects/:projectId/tasks", taskRoutes);
app.use("/api/v1/tasks", taskRoutes);
app.use("/api/v1/users", userRoutes);
app.get("/", (_req: Request, res: Response) => {
  res.status(200).json({
    message: "Hello World",
  });
});

app.get("/health", (_req: Request, res: Response) => {
  res.status(200).json({
    status: "online",
    timeStamp: new Date().toISOString(),
    uptime: `${Math.floor(process.uptime())}s`,
  });
});

app.get("/test-error", () => {
  throw new ApiError(
    400,
    "This is a test api error to verify our error handler",
  );
});

app.use(ErrorHandler);

app.listen(PORT, () => {
  console.log(`Server runnuning on http://localhost:${PORT}`);
  console.log(`Health check at http://localhost:${PORT}/health`);
});
