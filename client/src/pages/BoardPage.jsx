import { useEffect, useState } from "react";
import {
  useNavigate,
  useParams,
} from "react-router";
import BoardHeader from "../components/BoardHeader";
import TaskColumn from "../components/TaskColumn";
import TaskForm from "../components/TaskForm";
import {
  apiRequest,
  clearSession,
} from "../services/api";

function BoardPage() {
  const { boardId } = useParams();
  const navigate = useNavigate();

  const [board, setBoard] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  const [isTaskFormOpen, setIsTaskFormOpen] =
    useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [isSavingTask, setIsSavingTask] = useState(false);
  const [taskFormError, setTaskFormError] = useState("");

  const [deletingTaskId, setDeletingTaskId] =
    useState(null);
  const [taskActionError, setTaskActionError] =
    useState("");

  useEffect(() => {
    let shouldIgnore = false;

    async function loadBoard() {
      setIsLoading(true);
      setLoadError("");

      try {
        const data = await apiRequest(
          `/boards/${boardId}`,
        );

        if (!shouldIgnore) {
          setBoard(data.board);
          setTasks(data.tasks);
        }
      } catch (requestError) {
        if (shouldIgnore) {
          return;
        }

        if (requestError.status === 401) {
          clearSession();
          navigate("/login", { replace: true });
          return;
        }

        setLoadError(requestError.message);
      } finally {
        if (!shouldIgnore) {
          setIsLoading(false);
        }
      }
    }

    loadBoard();

    return () => {
      shouldIgnore = true;
    };
  }, [boardId, navigate, reloadKey]);

  function openCreateTaskForm() {
    setEditingTask(null);
    setTaskFormError("");
    setIsTaskFormOpen(true);
  }

  function openEditTaskForm(task) {
    setEditingTask(task);
    setTaskFormError("");
    setIsTaskFormOpen(true);
  }

  function closeTaskForm() {
    if (isSavingTask) {
      return;
    }

    setIsTaskFormOpen(false);
    setEditingTask(null);
    setTaskFormError("");
  }

  async function handleSaveTask(taskData) {
    setTaskFormError("");
    setIsSavingTask(true);

    try {
      if (editingTask) {
        const data = await apiRequest(
          `/tasks/${editingTask.id}`,
          {
            method: "PATCH",
            body: {
              ...taskData,
              version: editingTask.version,
            },
          },
        );

        setTasks((currentTasks) =>
          currentTasks.map((task) =>
            task.id === data.task.id
              ? data.task
              : task,
          ),
        );
      } else {
        const data = await apiRequest(
          `/boards/${boardId}/tasks`,
          {
            method: "POST",
            body: taskData,
          },
        );

        setTasks((currentTasks) => [
          ...currentTasks,
          data.task,
        ]);
      }

      setIsTaskFormOpen(false);
      setEditingTask(null);
    } catch (requestError) {
      if (requestError.status === 401) {
        clearSession();
        navigate("/login", { replace: true });
        return;
      }

      if (
        requestError.status === 409 &&
        requestError.data?.task
      ) {
        const latestTask = requestError.data.task;

        setTasks((currentTasks) =>
          currentTasks.map((task) =>
            task.id === latestTask.id
              ? latestTask
              : task,
          ),
        );

        setEditingTask(latestTask);
        setTaskFormError(
          "Another update changed this task. " +
            "The latest version has been loaded. " +
            "Review it and submit your changes again.",
        );

        return;
      }

      setTaskFormError(requestError.message);
    } finally {
      setIsSavingTask(false);
    }
  }

  async function handleDeleteTask(task) {
    const shouldDelete = window.confirm(
      `Are you sure you want to delete "${task.title}"?`,
    );

    if (!shouldDelete) {
      return;
    }

    setTaskActionError("");
    setDeletingTaskId(task.id);

    try {
      await apiRequest(`/tasks/${task.id}`, {
        method: "DELETE",
      });

      setTasks((currentTasks) =>
        currentTasks.filter(
          (currentTask) => currentTask.id !== task.id,
        ),
      );
    } catch (requestError) {
      if (requestError.status === 401) {
        clearSession();
        navigate("/login", { replace: true });
        return;
      }

      setTaskActionError(requestError.message);
    } finally {
      setDeletingTaskId(null);
    }
  }

  if (isLoading) {
    return (
      <main className="board-page">
        <p className="page-message" role="status">
          Loading board...
        </p>
      </main>
    );
  }

  if (loadError || !board) {
    return (
      <main className="board-page">
        <section className="page-error">
          <p role="alert">
            {loadError || "Board not found"}
          </p>

          <div className="page-error__actions">
            <button
              type="button"
              className="button button--secondary"
              onClick={() =>
                setReloadKey(
                  (currentKey) => currentKey + 1,
                )
              }
            >
              Try Again
            </button>

            <button
              type="button"
              className="button button--primary"
              onClick={() => navigate("/boards")}
            >
              My Boards
            </button>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="board-page">
      <BoardHeader
        boardName={board.name}
        taskCount={tasks.length}
        onAddTask={openCreateTaskForm}
      />

      {taskActionError && (
        <p className="board-action-error" role="alert">
          {taskActionError}
        </p>
      )}

      <div className="task-board">
        <TaskColumn
          title="To Do"
          status="todo"
          tasks={tasks}
          onEditTask={openEditTaskForm}
          onDeleteTask={handleDeleteTask}
          deletingTaskId={deletingTaskId}
        />

        <TaskColumn
          title="Doing"
          status="doing"
          tasks={tasks}
          onEditTask={openEditTaskForm}
          onDeleteTask={handleDeleteTask}
          deletingTaskId={deletingTaskId}
        />

        <TaskColumn
          title="Done"
          status="done"
          tasks={tasks}
          onEditTask={openEditTaskForm}
          onDeleteTask={handleDeleteTask}
          deletingTaskId={deletingTaskId}
        />
      </div>

      {isTaskFormOpen && (
        <TaskForm
          key={
            editingTask
              ? `${editingTask.id}-${editingTask.version}`
              : "new-task"
          }
          initialTask={editingTask}
          onSubmit={handleSaveTask}
          onCancel={closeTaskForm}
          isSubmitting={isSavingTask}
          error={taskFormError}
        />
      )}
    </main>
  );
}

export default BoardPage;