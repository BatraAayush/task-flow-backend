import { Response } from "express";
import { ProjectRequest } from "../middleware/rbacGuard.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import Task from "../models/Task.js";
import { sendResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import { formatSnakeToNormal } from "../helpers/stringHelper.js";

export const getTasks = asyncHandler(
  async (req: ProjectRequest, res: Response) => {
    const { projectId } = req.params;
    const {
      status,
      priority,
      assignedTo,
      search,
      page = "1",
      limit = "50",
    } = req.query;

    const query: any = { projectId };
    if (status) query.status = status;
    if (priority) query.priority = priority;
    if (assignedTo) query.assignedTo = assignedTo;

    if (search) {
      query.$or = [
        { title: { $regex: search as string, $options: "i" } },
        { description: { $regex: search as string, $options: "i" } },
      ];
    }

    const p = Math.max(1, parseInt(page as string, 10));
    const l = Math.max(1, parseInt(limit as string, 10));

    const total = await Task.countDocuments(query);
    const tasks = await Task.find(query)
      .populate("assignedTo", "name email avatarUrl")
      .populate("activityLogs.user", "name email avatarUrl")
      .sort({ orderIndex: 1, createdAt: -1 })
      .skip((p - 1) * l)
      .limit(l);

    return sendResponse(
      res,
      {
        tasks,
        pagination: {
          total,
          page: p,
          limit: l,
          totalPages: Math.ceil(total / l),
        },
      },
      "Tasks retrieved successfully",
      200,
    );
  },
);

export const createTask = asyncHandler(
  async (req: ProjectRequest, res: Response) => {
    const { projectId } = req.params;
    const {
      title,
      description,
      boardId,
      priority,
      status,
      assignedTo,
      dueDate,
    } = req.body;

    const count = await Task.countDocuments({ boardId });
    const task = await Task.create({
      title,
      description: description || "",
      projectId,
      boardId,
      priority: priority || "medium",
      status: status || "todo",
      assignedTo: assignedTo || null,
      dueDate: dueDate ? new Date(dueDate) : null,
      orderIndex: count,
      activityLogs: [
        {
          user: req.user!._id as any,
          action: `Task created by ${req.user!.name}`,
          timestamp: new Date(),
        },
      ],
    });

    const populated = await Task.findById(task._id)
      .populate("assignedTo", "name email avatarUrl")
      .populate("activityLogs.user", "name email avatarUrl");

    return sendResponse(res, populated, "Task created successfully", 201);
  },
);

export const updateTaskStatusAndOrder = asyncHandler(
  async (req: ProjectRequest, res: Response) => {
    const { taskId } = req.params;
    const { status, boardId, orderIndex } = req.body;
    const userName = req.user!.name || "Member";

    const task = await Task.findById(taskId);
    if (!task) {
      throw new ApiError(404, "Task not found");
    }

    const oldStatus = task.status;
    const oldBoardId = task.boardId?.toString();
    const oldOrder = task.orderIndex;

    const isStatusChanged = status && status !== oldStatus;
    const isBoardChanged = boardId && boardId.toString() !== oldBoardId;
    const isOrderChanged = orderIndex !== undefined && orderIndex !== oldOrder;

    // Apply updates
    if (status) task.status = status;
    if (boardId) task.boardId = boardId;
    if (orderIndex !== undefined) task.orderIndex = orderIndex;

    // Log status or column move
    if (isStatusChanged || isBoardChanged) {
      task.activityLogs.push({
        user: req.user!._id as any,
        action: `Moved status from ${formatSnakeToNormal(oldStatus)} to ${formatSnakeToNormal(status || oldStatus)} by ${userName}`,
        timestamp: new Date(),
      });
    } else if (isOrderChanged) {
      // Log drag-and-drop reorder within the same column
      task.activityLogs.push({
        user: req.user!._id as any,
        action: `Reordered in column (position ${oldOrder + 1} → ${orderIndex + 1}) by ${userName}`,
        timestamp: new Date(),
      });
    }

    await task.save();

    const populated = await Task.findById(taskId)
      .populate("assignedTo", "name email avatarUrl")
      .populate("activityLogs.user", "name email avatarUrl");

    return sendResponse(res, populated, "Task status/position updated", 200);
  },
);

export const updateTask = asyncHandler(
  async (req: ProjectRequest, res: Response) => {
    const { taskId } = req.params;
    const updates = req.body;
    const userId = req.user!._id;
    const userName = req.user!.name || "Member";

    const task = await Task.findById(taskId);
    if (!task) {
      throw new ApiError(404, "Task not found");
    }

    const changes: string[] = [];

    // Title change
    if (updates.title && updates.title !== task.title) {
      changes.push(`renamed title to "${updates.title}"`);
    }

    // Priority change
    if (updates.priority && updates.priority !== task.priority) {
      changes.push(
        `changed priority from "${task.priority}" to "${updates.priority}"`,
      );
    }

    // Due Date change
    if (updates.dueDate !== undefined) {
      const oldDue = task.dueDate
        ? new Date(task.dueDate).toISOString().split("T")[0]
        : "none";
      const newDue = updates.dueDate
        ? new Date(updates.dueDate).toISOString().split("T")[0]
        : "none";
      if (oldDue !== newDue) {
        changes.push(
          newDue === "none" ? "removed due date" : `set due date to ${newDue}`,
        );
      }
    }

    // Assignee change
    if (updates.assignedTo !== undefined) {
      const currentAssignedId = task.assignedTo
        ? task.assignedTo.toString()
        : null;
      const newAssignedId = updates.assignedTo
        ? String(updates.assignedTo)
        : null;

      if (currentAssignedId !== newAssignedId) {
        changes.push(newAssignedId ? "Reassigned task" : "unassigned task");
      }
    }

    // Description change
    if (
      updates.description !== undefined &&
      updates.description !== task.description
    ) {
      changes.push("Updated description");
    }

    Object.assign(task, updates);

    if (changes.length > 0) {
      task.activityLogs.push({
        user: userId as any,
        action: `${changes.join(", ")} by ${userName}`,
        timestamp: new Date(),
      });
    }

    await task.save();

    const populated = await Task.findById(taskId)
      .populate("assignedTo", "name email avatarUrl")
      .populate("activityLogs.user", "name email avatarUrl");

    return sendResponse(res, populated, "Task updated successfully", 200);
  },
);

export const deleteTask = asyncHandler(
  async (_req: ProjectRequest, res: Response) => {
    const { taskId } = _req.params;
    const task = await Task.findByIdAndDelete(taskId);

    if (!task) {
      throw new ApiError(404, "Task not found");
    }

    return sendResponse(res, null, "Task deleted successfully", 200);
  },
);
