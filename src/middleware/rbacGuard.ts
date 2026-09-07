import { NextFunction, Request, Response } from "express";
import { AuthenticatedRequest } from "./authGuard.js";
import Project, { IProject, RoleType } from "../models/Project.js";
import { ApiError } from "../utils/ApiError.js";

export interface ProjectRequest extends AuthenticatedRequest {
  project?: IProject;
  userRole?: RoleType;
}

export const rbacGuard = (allowedRoles: RoleType[] = ['member', 'admin', 'owner']) => {
  return async (req: ProjectRequest, _res: Response, next: NextFunction) => {
    const projectId = req.params.projectId || req.body.projectId;
    if (!projectId) {
      return next(new ApiError(400, 'Project ID is required for access verification'));
    }

    const project = await Project.findById(projectId);
    if (!project) {
      return next(new ApiError(404, 'Project not found'));
    }

    const currentUserId = req.user?._id;
    const membership = project.members.find(
      (m) => m.user.toString() === currentUserId
    );

    if (!membership) {
      return next(new ApiError(403, 'Forbidden: You are not a member of this project'));
    }

    if (!allowedRoles.includes(membership.role)) {
      return next(new ApiError(403, `Forbidden: Requires [${allowedRoles.join(', ')}] permissions`));
    }

    // Attach project and role to request for downstream controller use
    req.project = project;
    req.userRole = membership.role;
    next();
  };
};
