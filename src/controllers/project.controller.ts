import { Response } from "express";
import { ProjectRequest } from "../middleware/rbacGuard.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import Board from "../models/Board.js";
import Project from "../models/Project.js";
import { sendResponse } from "../utils/ApiResponse.js";
import User from "../models/User.js";
import { ApiError } from "../utils/ApiError.js";
import Task from "../models/Task.js";
import Comment from "../models/Comment.js";

export const createProject = asyncHandler(
  async (req: ProjectRequest, res: Response) => {
    const { title, description } = req.body;

    const project = await Project.create({
      title,
      description: description || "",
      owner: req.user!._id,
      members: [
        {
          user: req.user!._id,
          role: "owner",
        },
      ],
    });

    const defaultBoards = [
      { title: "To Do", projectId: project._id, orderIndex: 0 },
      { title: "In Progress", projectId: project._id, orderIndex: 1 },
      { title: "Done", projectId: project._id, orderIndex: 2 },
    ];
    const boards = await Board.insertMany(defaultBoards);

    // 3. Populate owner and member details before sending response
    const populatedProject = await Project.findById(project._id)
      .populate("owner", "name email avatarUrl")
      .populate("members.user", "name email avatarUrl");

    return sendResponse(
      res,
      { project: populatedProject, boards },
      "Project created successfully",
      201
    );
  }
);

export const updateProject = asyncHandler(
  async (req: ProjectRequest, res: Response) => {
    const { title, description } = req.body;
    const project = req.project!; // Attached by rbacGuard

    if (title) project.title = title;
    if (description !== undefined) project.description = description;

    await project.save();
    await project.populate("owner", "name email avatarUrl");
    await project.populate("members.user", "name email avatarUrl");

    return sendResponse(res, project, "Project updated successfully", 200);
  },
);

export const deleteProject = asyncHandler(
  async (req: ProjectRequest, res: Response) => {
    const projectId = req.project!._id;

    // 1. Find all task IDs belonging to this project to delete comments
    const tasks = await Task.find({ projectId }).select("_id");
    const taskIds = tasks.map((t) => t._id);

    // 2. Cascade delete comments, tasks, boards, and the project
    await Promise.all([
      Comment.deleteMany({ taskId: { $in: taskIds } }),
      Task.deleteMany({ projectId }),
      Board.deleteMany({ projectId }),
      Project.findByIdAndDelete(projectId),
    ]);

    return sendResponse(
      res,
      null,
      "Project and all associated data deleted successfully",
      200,
    );
  },
);

export const getMyProjects = asyncHandler(
  async (req: ProjectRequest, res: Response) => {
    const userId = req.user!._id;

    const projects = await Project.find({ "members.user": userId })
      .populate("owner", "name email avatarUrl")
      .populate("members.user", "name email avatarUrl")
      .sort({ updatedAt: -1 });

    return sendResponse(res, projects, "user projects retrived", 200);
  },
);

export const getProjectDetails = asyncHandler(
  async (req: ProjectRequest, res: Response) => {
    const project = req.project!;
    await project.populate("members.user", "name email avatarUrl");
    await project.populate("owner", "name email avatarUrl");

    const boards = await Board.find({ projectId: project._id }).sort({
      orderIndex: 1,
    });

    return sendResponse(
      res,
      { project, boards },
      "Project details retrieved",
      200,
    );
  },
);

export const inviteMember = asyncHandler(
  async (req: ProjectRequest, res: Response) => {
    const { email, role = "member" } = req.body;
    const project = req.project!;

    const invitee = await User.findOne({ email });
    if (!invitee) {
      throw new ApiError(404, "User with this email does not exist");
    }
    const isAlreadyMember = project.members.find(
      (m) => m.user.toString() === invitee._id.toString(),
    );
    if (isAlreadyMember) {
      throw new ApiError(400, "User is already a member of this project");
    }

    project.members.push({ user: invitee._id as any, role });
    await project.save();

    await project.populate("members.user", "name email avatarUrl");

    return sendResponse(
      res,
      project,
      `User ${invitee.name} added to project`,
      200,
    );
  },
);
