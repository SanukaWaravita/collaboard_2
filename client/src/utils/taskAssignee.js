export function getAssigneeInitial(name) {
  if (typeof name !== "string") {
    return "?";
  }

  const trimmedName = name.trim();

  return trimmedName
    ? trimmedName.charAt(0).toUpperCase()
    : "?";
}

export function resolveTaskAssignees(
  assigneeIds = [],
  projectMembers = [],
) {
  if (!Array.isArray(assigneeIds)) {
    return [];
  }

  const membersById = new Map(
    projectMembers.map((member) => [
      member.userId,
      member,
    ]),
  );

  return assigneeIds.map((userId) => {
    const member = membersById.get(userId);

    return {
      userId,
      name: member?.name ?? "Unknown assignee",
      email: member?.email ?? null,
      initial: member
        ? getAssigneeInitial(member.name)
        : "?",
    };
  });
}