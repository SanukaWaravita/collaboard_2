import {
  PROJECT_ROLES,
} from "../constants/access.js";
import {
  ProjectMember,
  Task,
  User,
} from "../models/index.js";

const assignableProjectRoles = [
  PROJECT_ROLES.OWNER,
  PROJECT_ROLES.CONTRIBUTOR,
];

export async function findAssignableDatabaseProjectMember(
  projectId,
  userId,
) {
  if (
    typeof userId !== "string" ||
    !userId.trim()
  ) {
    return null;
  }

  const normalizedUserId =
    userId.trim();

  const membership =
    await ProjectMember.findOne({
      projectId,
      userId: normalizedUserId,

      role: {
        $in: assignableProjectRoles,
      },
    });

  if (!membership) {
    return null;
  }

  const user = await User.findById(
    normalizedUserId,
  );

  if (!user) {
    return null;
  }

  return {
    membership,
    user,
  };
}

export async function findInvalidDatabaseAssigneeId(
  projectId,
  assigneeIds,
) {
  for (const userId of assigneeIds) {
    const member =
      await findAssignableDatabaseProjectMember(
        projectId,
        userId,
      );

    if (!member) {
      return userId;
    }
  }

  return null;
}

export async function removeDatabaseUserFromTaskAssignments(
  projectId,
  userId,
  options = {},
) {
  const {
    session = null,
  } = options;

  const result = await Task.updateMany(
    {
      projectId,
      assigneeIds: userId,
    },
    {
      $pull: {
        assigneeIds: userId,
      },

      $inc: {
        version: 1,
      },
    },
    {
      session,
    },
  );

  return result.modifiedCount;
}