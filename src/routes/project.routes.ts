import { Router } from "express";
import { validate } from "../middleware/validate.js";
import {
  createProjectSchema,
  inviteMemberSchema,
} from "../validators/project.validator.js";
import {
  createProject,
  deleteProject,
  getMyProjects,
  getProjectDetails,
  inviteMember,
  updateProject,
} from "../controllers/project.controller.js";
import { rbacGuard } from "../middleware/rbacGuard.js";
import { authGuard } from "../middleware/authGuard.js";

const router = Router();

router.use(authGuard);

router
  .route("/")
  .post(validate(createProjectSchema), createProject)
  .get(getMyProjects);

router
  .route("/:projectId")
  .get(rbacGuard(["member", "admin", "owner"]), getProjectDetails)
  .patch(rbacGuard(["admin", "owner"]), updateProject)
  .delete(rbacGuard(["owner"]), deleteProject);

router.post(
  "/:projectId/invite",
  rbacGuard(["admin", "owner"]),
  validate(inviteMemberSchema),
  inviteMember,
);

export default router;
