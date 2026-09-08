import express, { Request, Response } from "express";
import dotenv from "dotenv";
import { connectDB } from "./config/db.js";
import cookieParser from "cookie-parser";
import cors from "cors";
import { ApiError } from "./utils/ApiError.js";
import { ErrorHandler } from "./middleware/errorHandler.js";
import authRoutes from "./routes/auth.routes.js";
import projectRoutes from "./routes/project.routes.js";
import taskRoutes from "./routes/task.routes.js";
import userRoutes from "./routes/user.routes.js";
import { swaggerDocument } from "./config/swagger.js";
import swaggerUi from "swagger-ui-express";

dotenv.config();

const app = express();

// Allowed origins
const allowedOrigins = [
  "https://task-flow-ab.netlify.app",
  "http://localhost:5173",
  process.env.CLIENT_URL,
].filter(Boolean) as string[];

// 1. Comprehensive CORS setup with explicit preflight handling
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (curl, postman, server-to-server)
      if (!origin) return callback(null, true);

      const isAllowed =
        allowedOrigins.includes(origin) ||
        origin.endsWith(".netlify.app") ||
        origin.endsWith(".vercel.app");

      if (isAllowed) {
        callback(null, true);
      } else {
        callback(new Error(`Origin ${origin} blocked by CORS`));
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
    optionsSuccessStatus: 200, // Legacy browser support for 204
  }),
);

// Explicitly handle all preflight OPTIONS requests immediately
app.options("*", cors());

app.use(express.json());
app.use(cookieParser());

// 2. Ensure Database connection before handling requests in serverless
app.use(async (_req, _res, next) => {
  try {
    await connectDB();
    next();
  } catch (err) {
    next(err);
  }
});

// Routes
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

// 3. ONLY listen when running locally, NEVER on Vercel
if (process.env.NODE_ENV !== "production") {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log(`Health check at http://localhost:${PORT}/health`);
  });
}

export default app;
