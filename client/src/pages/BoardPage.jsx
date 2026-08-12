import { useState } from "react";
import BoardHeader from "../components/BoardHeader";
import TaskColumn from "../components/TaskColumn";
import TaskForm from "../components/TaskForm";
import { mockTasks } from "../data/mockTasks";

function BoardPage() {
  const [tasks, setTasks] = useState(mockTasks);
  const [isTaskFormOpen, setIsTaskFormOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);

  function openCreateTaskForm() {
    setEditingTask(null);
    setIsTaskFormOpen(true);
  }

  function openEditTaskForm(task) {
    setEditingTask(task);
    setIsTaskFormOpen(true);
  }

  function closeTaskForm() {
    setIsTaskFormOpen(false);
    setEditingTask(null);
  }

  function handleSaveTask(taskData) {
    if (editingTask) {
      setTasks((currentTasks) =>
        currentTasks.map((task) =>
          task.id === editingTask.id
            ? { ...task, ...taskData }
            : task,
        ),
      );
    } else {
      const newTask = {
        id: Date.now(),
        ...taskData,
      };

      setTasks((currentTasks) => [...currentTasks, newTask]);
    }

    closeTaskForm();
  }

  return (
    <main className="board-page">
      <BoardHeader
        boardName="CollabBoard Development"
        taskCount={tasks.length}
        onAddTask={openCreateTaskForm}
      />

      <div className="task-board">
        <TaskColumn
          title="To Do"
          status="todo"
          tasks={tasks}
          onEditTask={openEditTaskForm}
        />

        <TaskColumn
          title="Doing"
          status="doing"
          tasks={tasks}
          onEditTask={openEditTaskForm}
        />

        <TaskColumn
          title="Done"
          status="done"
          tasks={tasks}
          onEditTask={openEditTaskForm}
        />
      </div>

      {isTaskFormOpen && (
        <TaskForm
          key={editingTask?.id ?? "new-task"}
          initialTask={editingTask}
          onSubmit={handleSaveTask}
          onCancel={closeTaskForm}
        />
      )}
    </main>
  );
}

export default BoardPage;