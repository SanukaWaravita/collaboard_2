export function reconcileRealtimeTask(currentTasks, incomingTask) {
  const currentTask = currentTasks.find(
    (task) => task.id === incomingTask.id,
  );

  if (!currentTask) {
    return [...currentTasks, incomingTask];
  }

  if (
    Number.isInteger(currentTask.version) &&
    Number.isInteger(incomingTask.version) &&
    incomingTask.version < currentTask.version
  ) {
    return currentTasks;
  }

  return currentTasks.map((task) =>
    task.id === incomingTask.id ? incomingTask : task,
  );
}

export function removeRealtimeTask(currentTasks, taskId) {
  return currentTasks.filter((task) => task.id !== taskId);
}
