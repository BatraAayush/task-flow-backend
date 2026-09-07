import { Router } from "express";
import {
  getTasks,
  createTask,
  updateTaskStatusAndOrder,
  updateTask,
  deleteTask,
} from "../controllers/task.controller.js";
import {
  getCommentsByTask,
  addComment,
  updateComment,
  deleteComment,
} from "../controllers/comment.controller.js";
import { authGuard } from "../middleware/authGuard.js";
import { rbacGuard } from "../middleware/rbacGuard.js";
import { validate } from "../middleware/validate.js";
import {
  createTaskSchema,
  updateTaskStatusSchema,
  updateTaskSchema,
  createCommentSchema,
} from "../validators/task.validator.js";

const router = Router({ mergeParams: true });

router.use(authGuard);

// Project-level task routes: /api/v1/projects/:projectId/tasks
router
  .route("/")
  .get(rbacGuard(["member", "admin", "owner"]), getTasks)
  .post(
    rbacGuard(["member", "admin", "owner"]),
    validate(createTaskSchema),
    createTask,
  );

// Direct task operations: /api/v1/tasks/:taskId
router.patch(
  "/:taskId/status",
  validate(updateTaskStatusSchema),
  updateTaskStatusAndOrder,
);
router
  .route("/:taskId")
  .patch(validate(updateTaskSchema), updateTask)
  .delete(deleteTask);

// Comments nested under tasks: /api/v1/tasks/:taskId/comments
router
  .route("/:taskId/comments")
  .get(getCommentsByTask)
  .post(validate(createCommentSchema), addComment);

// Edit and Delete specific comment: /api/v1/tasks/:taskId/comments/:commentId
router
  .route("/:taskId/comments/:commentId")
  .patch(validate(createCommentSchema), updateComment)
  .delete(deleteComment);

export default router;
