const DEFAULT_WORKFLOW_STATUS_DEFINITIONS = Object.freeze([
  Object.freeze({
    id: "todo",
    name: "To Do",
    color: "#64748b",
    position: 0,
    isCompleted: false,
  }),
  Object.freeze({
    id: "doing",
    name: "Doing",
    color: "#2563eb",
    position: 1,
    isCompleted: false,
  }),
  Object.freeze({
    id: "done",
    name: "Done",
    color: "#16a34a",
    position: 2,
    isCompleted: true,
  }),
]);

export function createDefaultWorkflowStatuses() {
  return DEFAULT_WORKFLOW_STATUS_DEFINITIONS.map((status) => ({ ...status }));
}

export function getOrderedWorkflowStatuses(project) {
  return [...(project.workflowStatuses ?? [])].sort(
    (firstStatus, secondStatus) => firstStatus.position - secondStatus.position,
  );
}

export function findWorkflowStatus(project, statusId) {
  return (
    project.workflowStatuses?.find((status) => status.id === statusId) ?? null
  );
}

export function getInitialWorkflowStatus(project) {
  const orderedStatuses = getOrderedWorkflowStatuses(project);

  return (
    orderedStatuses.find((status) => !status.isCompleted) ??
    orderedStatuses[0] ??
    null
  );
}
