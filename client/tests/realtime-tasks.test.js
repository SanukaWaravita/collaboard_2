import { describe, expect, test } from "@jest/globals";
import {
  reconcileRealtimeTask,
  removeRealtimeTask,
} from "../src/utils/realtimeTasks.js";

describe("real-time Task reconciliation", () => {
  test("adds a Task that is not already present", () => {
    const result = reconcileRealtimeTask(
      [{ id: "task-1", title: "Existing", version: 1 }],
      { id: "task-2", title: "Created remotely", version: 1 },
    );

    expect(result).toHaveLength(2);
    expect(result[1]).toMatchObject({
      id: "task-2",
      title: "Created remotely",
    });
  });

  test("replaces matching Tasks without allowing an older event to win", () => {
    const currentTasks = [
      { id: "task-1", title: "Newest", version: 3 },
    ];

    expect(
      reconcileRealtimeTask(currentTasks, {
        id: "task-1",
        title: "Stale",
        version: 2,
      }),
    ).toBe(currentTasks);

    expect(
      reconcileRealtimeTask(currentTasks, {
        id: "task-1",
        title: "Newer",
        version: 4,
      }),
    ).toEqual([{ id: "task-1", title: "Newer", version: 4 }]);
  });

  test("removes a deleted Task idempotently", () => {
    const tasks = [{ id: "task-1" }, { id: "task-2" }];

    expect(removeRealtimeTask(tasks, "task-1")).toEqual([
      { id: "task-2" },
    ]);
    expect(removeRealtimeTask(tasks, "missing-task")).toEqual(tasks);
  });
});
