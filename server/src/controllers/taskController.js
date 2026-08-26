import {
  PROJECT_PERMISSIONS,
} from "../constants/access.js";
import {
  Project,
  Task,
} from "../models/index.js";
import {
  getDatabaseProjectAccess,
  hasDatabaseProjectPermission,
} from "../utils/databaseProjectAccess.js";
import {
  findInvalidDatabaseAssigneeId,
} from "../utils/databaseTaskAssignee.js";
import {
  canAssignDatabaseTaskReporter,
  findEligibleDatabaseTaskReporter,
  presentDatabaseTask,
} from "../utils/databaseTaskReporter.js";
import {
  isValidAssigneeIdsValue,
  normalizeAssigneeIds,
} from "../utils/taskAssignee.js";
import {
  isValidDueDate,
  normalizeDueDate,
} from "../utils/taskDueDate.js";
import {
  findWorkflowStatus,
  getInitialWorkflowStatus,
} from "../utils/workflowStatuses.js";

async function findTaskAndProject(taskId) {
  const task = await Task.findById(
    taskId,
  );

  if (!task) {
    return null;
  }

  const project = await Project.findById(
    task.projectId,
  );

  return project
    ? {
        task,
        project,
      }
    : null;
}

export async function createTask(
  request,
  response,
) {
  const project = await Project.findById(
    request.params.projectId,
  );

  if (
    !project ||
    !(await getDatabaseProjectAccess(
      project,
      request.user.id,
    ))
  ) {
    return response.status(404).json({
      message: "Project not found",
    });
  }

  if (
    !(await hasDatabaseProjectPermission(
      project,
      request.user.id,
      PROJECT_PERMISSIONS.CREATE_TASK,
    ))
  ) {
    return response.status(403).json({
      message:
        "You cannot create tasks in this project",
    });
  }

  const {
    title,
    description = "",
    status,
    dueDate = null,
    assigneeIds = [],
    reporterId,
    createdById,
  } = request.body ?? {};

  if (createdById !== undefined) {
    return response.status(400).json({
      message:
        "Task creator is assigned automatically from the authenticated user",
    });
  }

  if (
    typeof title !== "string" ||
    !title.trim()
  ) {
    return response.status(400).json({
      message: "Task title is required",
    });
  }

  if (typeof description !== "string") {
    return response.status(400).json({
      message:
        "Task description must be text",
    });
  }

  if (!isValidDueDate(dueDate)) {
    return response.status(400).json({
      message:
        "Due date must use YYYY-MM-DD format or be null",
    });
  }

  if (
    !isValidAssigneeIdsValue(
      assigneeIds,
    )
  ) {
    return response.status(400).json({
      message:
        "Assignee IDs must be a duplicate-free array of user IDs or null",
    });
  }

  const normalizedAssigneeIds =
    normalizeAssigneeIds(assigneeIds);

  const invalidAssigneeId =
    await findInvalidDatabaseAssigneeId(
      project.id,
      normalizedAssigneeIds,
    );

  if (invalidAssigneeId) {
    return response.status(400).json({
      message:
        "Every Assignee must be an owner or contributor in this project",
    });
  }

  const selectedReporter =
    await findEligibleDatabaseTaskReporter(
      project.id,
      reporterId ??
        request.user.id,
    );

  if (!selectedReporter) {
    return response.status(400).json({
      message:
        "Reporter must be a current Project member",
    });
  }

  const selectedStatus =
    status === undefined
      ? getInitialWorkflowStatus(project)
      : findWorkflowStatus(
          project,
          status,
        );

  if (!selectedStatus) {
    return response.status(400).json({
      message:
        status === undefined
          ? "Project does not have a workflow status"
          : "Task status does not exist in this project",
    });
  }

  const task = new Task({
    projectId: project.id,
    title: title.trim(),
    description:
      description.trim(),
    status: selectedStatus.id,
    dueDate:
      normalizeDueDate(dueDate),
    assigneeIds:
      normalizedAssigneeIds,
    createdById:
      request.user.id,
    reporterId:
      selectedReporter.user.id,
    version: 1,
  });

  await task.save();

  return response.status(201).json({
    task:
      await presentDatabaseTask(
        task,
        request.user.id,
        project,
      ),
  });
}

export async function getTask(
  request,
  response,
) {
  const result =
    await findTaskAndProject(
      request.params.taskId,
    );

  if (
    !result ||
    !(await hasDatabaseProjectPermission(
      result.project,
      request.user.id,
      PROJECT_PERMISSIONS.READ_PROJECT,
    ))
  ) {
    return response.status(404).json({
      message: "Task not found",
    });
  }

  return response.status(200).json({
    task:
      await presentDatabaseTask(
        result.task,
        request.user.id,
        result.project,
      ),
  });
}

export async function updateTask(
  request,
  response,
) {
  const result =
    await findTaskAndProject(
      request.params.taskId,
    );

  if (!result) {
    return response.status(404).json({
      message: "Task not found",
    });
  }

  const {
    task,
    project,
  } = result;

  const {
    title,
    description,
    status,
    dueDate,
    assigneeIds,
    reporterId,
    createdById,
    version,
  } = request.body ?? {};

  if (createdById !== undefined) {
    return response.status(400).json({
      message:
        "A Task creator cannot be changed",
    });
  }

  const containsTaskFieldUpdate =
    title !== undefined ||
    description !== undefined ||
    status !== undefined ||
    dueDate !== undefined ||
    assigneeIds !== undefined;

  if (
    containsTaskFieldUpdate &&
    !(await hasDatabaseProjectPermission(
      project,
      request.user.id,
      PROJECT_PERMISSIONS.UPDATE_TASK,
    ))
  ) {
    return response.status(403).json({
      message:
        "You cannot edit tasks in this project",
    });
  }

  let normalizedReporterId;

  if (reporterId !== undefined) {
    const selectedReporter =
      await findEligibleDatabaseTaskReporter(
        project.id,
        reporterId,
      );

    if (!selectedReporter) {
      return response.status(400).json({
        message:
          "Reporter must be a current Project member",
      });
    }

    normalizedReporterId =
      selectedReporter.user.id;
  }

  const changesReporter =
    normalizedReporterId !== undefined &&
    normalizedReporterId !==
      task.reporterId;

  if (
    changesReporter &&
    !(await canAssignDatabaseTaskReporter(
      task,
      project,
      request.user.id,
    ))
  ) {
    return response.status(403).json({
      message:
        "You cannot assign the Reporter for this Task",
    });
  }

  const containsUpdate =
    containsTaskFieldUpdate ||
    changesReporter;

  if (!containsUpdate) {
    return response.status(400).json({
      message:
        "Provide a title, description, status, Due Date, Assignees, or a different Reporter to update",
    });
  }

  if (
    !Number.isInteger(version) ||
    version < 1
  ) {
    return response.status(400).json({
      message:
        "A valid task version is required",
    });
  }

  if (version !== task.version) {
    return response.status(409).json({
      message:
        "Task was modified by another request",

      task:
        await presentDatabaseTask(
          task,
          request.user.id,
          project,
        ),
    });
  }

  if (
    title !== undefined &&
    (
      typeof title !== "string" ||
      !title.trim()
    )
  ) {
    return response.status(400).json({
      message:
        "Task title cannot be empty",
    });
  }

  if (
    description !== undefined &&
    typeof description !== "string"
  ) {
    return response.status(400).json({
      message:
        "Task description must be text",
    });
  }

  if (
    dueDate !== undefined &&
    !isValidDueDate(dueDate)
  ) {
    return response.status(400).json({
      message:
        "Due date must use YYYY-MM-DD format or be null",
    });
  }

  let normalizedAssigneeIds;

  if (assigneeIds !== undefined) {
    if (
      !isValidAssigneeIdsValue(
        assigneeIds,
      )
    ) {
      return response.status(400).json({
        message:
          "Assignee IDs must be a duplicate-free array of user IDs or null",
      });
    }

    normalizedAssigneeIds =
      normalizeAssigneeIds(
        assigneeIds,
      );

    const invalidAssigneeId =
      await findInvalidDatabaseAssigneeId(
        project.id,
        normalizedAssigneeIds,
      );

    if (invalidAssigneeId) {
      return response.status(400).json({
        message:
          "Every Assignee must be an owner or contributor in this project",
      });
    }
  }

  if (
    status !== undefined &&
    !findWorkflowStatus(
      project,
      status,
    )
  ) {
    return response.status(400).json({
      message:
        "Task status does not exist in this project",
    });
  }

  const changedFields = {};

  if (title !== undefined) {
    changedFields.title =
      title.trim();
  }

  if (description !== undefined) {
    changedFields.description =
      description.trim();
  }

  if (status !== undefined) {
    changedFields.status = status;
  }

  if (dueDate !== undefined) {
    changedFields.dueDate =
      normalizeDueDate(dueDate);
  }

  if (assigneeIds !== undefined) {
    changedFields.assigneeIds =
      normalizedAssigneeIds;
  }

  if (changesReporter) {
    changedFields.reporterId =
      normalizedReporterId;
  }

  const updatedTask =
    await Task.findOneAndUpdate(
      {
        _id: task.id,
        version,
      },
      {
        $set: changedFields,

        $inc: {
          version: 1,
        },
      },
      {
        new: true,
        runValidators: true,
      },
    );

  if (!updatedTask) {
    const latestTask =
      await Task.findById(task.id);

    if (!latestTask) {
      return response.status(404).json({
        message: "Task not found",
      });
    }

    return response.status(409).json({
      message:
        "Task was modified by another request",

      task:
        await presentDatabaseTask(
          latestTask,
          request.user.id,
          project,
        ),
    });
  }

  return response.status(200).json({
    task:
      await presentDatabaseTask(
        updatedTask,
        request.user.id,
        project,
      ),
  });
}

export async function deleteTask(
  request,
  response,
) {
  const result =
    await findTaskAndProject(
      request.params.taskId,
    );

  if (!result) {
    return response.status(404).json({
      message: "Task not found",
    });
  }

  const {
    task,
    project,
  } = result;

  if (
    !(await hasDatabaseProjectPermission(
      project,
      request.user.id,
      PROJECT_PERMISSIONS.DELETE_TASK,
    ))
  ) {
    return response.status(403).json({
      message:
        "You cannot delete tasks in this project",
    });
  }

  await Task.deleteOne({
    _id: task.id,
  });

  return response.status(204).send();
}