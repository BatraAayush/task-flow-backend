import { Response } from "express";
import { ProjectRequest } from "../middleware/rbacGuard.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import Comment from "../models/Comment.js";
import { sendResponse } from "../utils/ApiResponse.js";
import Task from "../models/Task.js";
import { ApiError } from "../utils/ApiError.js";
import Project from "../models/Project.js";

export const getCommentsByTask = asyncHandler(
  async (req: ProjectRequest, res: Response) => {
    const { taskId } = req.params;
    const comments = await Comment.find({ taskId })
      .populate("author", "name email avatarUrl")
      .sort({ createdAt: 1 });
    return sendResponse(res, comments, "Comments retrieved", 200);
  },
);

export const addComment = asyncHandler(
  async (req: ProjectRequest, res: Response) => {
    const { taskId } = req.params;
    const { content } = req.body;
    const task = await Task.findById(taskId);
    if (!task) {
      throw new ApiError(404, "Task not found");
    }

    const comment = await Comment.create({
      taskId,
      author: req.user!._id,
      content,
    });

    task.activityLogs.push({
      user: req.user!._id as any,
      action: `Commented: "${content.slice(0, 30)}${content.length > 30 ? "..." : ""}"`,
      timestamp: new Date(),
    });

    await task.save();

    const populatedComment = await comment.populate(
      "author",
      "name email avatarUrl",
    );
    const populatedTask = await Task.findById(taskId).populate(
      "assignedTo",
      "name email avatarUrl",
    );
    return sendResponse(
      res,
      { comment: populatedComment, task: populatedTask },
      "Comment added successfully",
      201,
    );
  },
);

export const updateComment = asyncHandler(
  async (req: ProjectRequest, res: Response) => {
    const { taskId, commentId } = req.params;
    const { content } = req.body;
    const userId = req.user!._id;

    const comment = await Comment.findOne({ _id: commentId, taskId });
    if (!comment) {
      throw new ApiError(404, "Comment not found on this task");
    }

    // Only the author can edit
    if (comment.author.toString() !== userId.toString()) {
      throw new ApiError(403, "Forbidden: You can only edit your own comments");
    }

    comment.content = content;
    await comment.save();
    await comment.populate("author", "name email avatarUrl");

    return sendResponse(res, comment, "Comment updated successfully", 200);
  }
);

export const deleteComment = asyncHandler(
  async (req: ProjectRequest, res: Response) => {
    const { taskId, commentId } = req.params;
    const userId = req.user!._id;

    const [comment, task] = await Promise.all([
      Comment.findOne({ _id: commentId, taskId }),
      Task.findById(taskId).select("projectId"),
    ]);

    if (!comment || !task) {
      throw new ApiError(404, "Comment or associated task not found");
    }

    // Fetch project to evaluate RBAC permissions
    const project = await Project.findById(task.projectId);
    if (!project) {
      throw new ApiError(404, "Parent project not found");
    }

    const isAuthor = comment.author.toString() === userId.toString();
    const isOwner = project.owner.toString() === userId.toString();
    const memberRecord = project.members.find(
      (m) => m.user.toString() === userId.toString()
    );
    const isAdmin = memberRecord?.role === "admin";

    // Allow deletion if author, admin, or project owner
    if (!isAuthor && !isOwner && !isAdmin) {
      throw new ApiError(
        403,
        "Forbidden: Only the author or workspace admins can delete this comment"
      );
    }

    await Comment.findByIdAndDelete(commentId);

    return sendResponse(res, { commentId }, "Comment deleted successfully", 200);
  }
);