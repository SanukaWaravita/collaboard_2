import { getProjectRoom } from "./projectRooms.js";

export const TASK_REALTIME_EVENTS = {
  CREATED: "task:created",
  UPDATED: "task:updated",
  DELETED: "task:deleted",
};

export function emitTaskEvent(request, eventName, task) {
  const io = request.app.get("io");

  if (!io) {
    return;
  }

  io.to(getProjectRoom(task.projectId)).emit(eventName, {
    projectId: task.projectId,
    taskId: task.id,
    version: task.version,
  });
}
