import { useState } from "react";
import { useParams } from "react-router";
import BoardHeader from "../components/BoardHeader";
import TaskColumn from "../components/TaskColumn";
import TaskForm from "../components/TaskForm";
import { mockTasks } from "../data/mockTasks";

const boardNames = {
  "collabboard-development": "CollabBoard Development",
  "m1-planning": "Milestone 1 Planning",
};

function BoardPage() {
  const { boardId } = useParams();

  const [tasks, setTasks] = useState(mockTasks);
  const [isTaskFormOpen, setIsTaskFormOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);

  const boardName = boardNames[boardId] ?? "Team Board";

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

  function handleDeleteTask(task) {
    const shouldDelete = window.confirm(
      `Are you sure you want to delete "${task.title}"?`,
    );

    if (!shouldDelete) {
      return;
    }

    setTasks((currentTasks) =>
      currentTasks.filter(
        (currentTask) => currentTask.id !== task.id,
      ),
    );
  }

  return (
    <main className="board-page">
      <BoardHeader
        boardName={boardName}
        taskCount={tasks.length}
        onAddTask={openCreateTaskForm}
      />

      <div className="task-board">
        <TaskColumn
          title="To Do"
          status="todo"
          tasks={tasks}
          onEditTask={openEditTaskForm}
          onDeleteTask={handleDeleteTask}
        />

        <TaskColumn
          title="Doing"
          status="doing"
          tasks={tasks}
          onEditTask={openEditTaskForm}
          onDeleteTask={handleDeleteTask}
        />

        <TaskColumn
          title="Done"
          status="done"
          tasks={tasks}
          onEditTask={openEditTaskForm}
          onDeleteTask={handleDeleteTask}
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