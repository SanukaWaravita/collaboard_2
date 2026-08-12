import { useState } from "react";
import BoardHeader from "../components/BoardHeader";
import TaskColumn from "../components/TaskColumn";
import TaskForm from "../components/TaskForm";
import { mockTasks } from "../data/mockTasks";

function BoardPage() {
  const [tasks, setTasks] = useState(mockTasks);
  const [isTaskFormOpen, setIsTaskFormOpen] = useState(false);

  function handleCreateTask(taskData) {
    const newTask = {
      id: Date.now(),
      ...taskData,
    };

    setTasks((currentTasks) => [...currentTasks, newTask]);
    setIsTaskFormOpen(false);
  }

  return (
    <main className="board-page">
      <BoardHeader
        boardName="CollabBoard Development"
        taskCount={tasks.length}
        onAddTask={() => setIsTaskFormOpen(true)}
      />

      <div className="task-board">
        <TaskColumn title="To Do" status="todo" tasks={tasks} />
        <TaskColumn title="Doing" status="doing" tasks={tasks} />
        <TaskColumn title="Done" status="done" tasks={tasks} />
      </div>

      {isTaskFormOpen && (
        <TaskForm
          onSubmit={handleCreateTask}
          onCancel={() => setIsTaskFormOpen(false)}
        />
      )}
    </main>
  );
}

export default BoardPage;