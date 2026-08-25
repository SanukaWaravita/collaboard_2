import { store } from "../data/inMemoryStore.js";

export function presentTask(task) {
  const reporter = store.users.find((user) => user.id === task.reporterId);

  return {
    ...task,

    reporter: reporter
      ? {
          userId: reporter.id,
          name: reporter.name,
          email: reporter.email,
        }
      : null,
  };
}
