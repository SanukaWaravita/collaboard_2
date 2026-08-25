import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";
import ProjectHeader from "../components/ProjectHeader";
import ProjectViewToggle from "../components/ProjectViewToggle";
import TaskColumn from "../components/TaskColumn";
import TaskForm from "../components/TaskForm";
import TaskList from "../components/TaskList";
import WorkflowStatusManager from "../components/WorkflowStatusManager";
import { PROJECT_PERMISSIONS } from "../constants/access";
import { apiRequest, clearSession, getCurrentUser } from "../services/api";

function ProjectPage() {
  const { workspaceId, projectId } = useParams();
  const navigate = useNavigate();
  const currentUser = getCurrentUser();

  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [projectMembers, setProjectMembers] = useState([]);
  const [activeView, setActiveView] = useState("kanban");
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  const [isTaskFormOpen, setIsTaskFormOpen] = useState(false);

  const [editingTask, setEditingTask] = useState(null);

  const [createTaskStatusId, setCreateTaskStatusId] = useState(null);
  const [isSavingTask, setIsSavingTask] = useState(false);
  const [taskFormError, setTaskFormError] = useState("");

  const [deletingTaskId, setDeletingTaskId] = useState(null);
  const [taskActionError, setTaskActionError] = useState("");
  const [draggingTaskId, setDraggingTaskId] = useState(null);

  const [dropTargetStatusId, setDropTargetStatusId] = useState(null);

  const [movingTaskId, setMovingTaskId] = useState(null);
  const [isWorkflowManagerOpen, setIsWorkflowManagerOpen] = useState(false);

  const [isSavingWorkflow, setIsSavingWorkflow] = useState(false);

  const [workflowError, setWorkflowError] = useState("");

  useEffect(() => {
    let shouldIgnore = false;

    async function loadProject() {
      setIsLoading(true);
      setLoadError("");

      try {
        const [projectData, memberData] = await Promise.all([
          apiRequest(`/projects/${projectId}`),
          apiRequest(`/projects/${projectId}/members`),
        ]);

        if (projectData.project.workspaceId !== workspaceId) {
          throw new Error("Project does not belong to this workspace");
        }

        if (!shouldIgnore) {
          setProject(projectData.project);
          setTasks(projectData.tasks);
          setProjectMembers(memberData.members);
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

    loadProject();

    return () => {
      shouldIgnore = true;
    };
  }, [workspaceId, projectId, navigate, reloadKey]);

  const canManageMembers =
    project?.permissions.includes(PROJECT_PERMISSIONS.MANAGE_MEMBERS) ?? false;

  const canManageWorkflow =
    project?.permissions.includes(PROJECT_PERMISSIONS.UPDATE_PROJECT) ?? false;

  const canCreateTask =
    project?.permissions.includes(PROJECT_PERMISSIONS.CREATE_TASK) ?? false;

  const canUpdateTasks =
    project?.permissions.includes(PROJECT_PERMISSIONS.UPDATE_TASK) ?? false;

  const canDeleteTasks =
    project?.permissions.includes(PROJECT_PERMISSIONS.DELETE_TASK) ?? false;

  const assignableProjectMembers = projectMembers.filter(
    (member) => member.canBeAssigned,
  );
  const workflowStatuses = [...(project?.workflowStatuses ?? [])].sort(
    (firstStatus, secondStatus) => firstStatus.position - secondStatus.position,
  );
  function openWorkflowManager() {
    if (!canManageWorkflow) {
      return;
    }

    setWorkflowError("");
    setIsWorkflowManagerOpen(true);
  }

  function closeWorkflowManager() {
    if (isSavingWorkflow) {
      return;
    }

    setIsWorkflowManagerOpen(false);
    setWorkflowError("");
  }

  async function handleCreateWorkflowStatus(statusData) {
    setWorkflowError("");
    setIsSavingWorkflow(true);

    try {
      const data = await apiRequest(`/projects/${projectId}/statuses`, {
        method: "POST",
        body: statusData,
      });

      setProject((currentProject) =>
        currentProject
          ? {
              ...currentProject,
              workflowStatuses: data.workflowStatuses,
            }
          : currentProject,
      );

      return true;
    } catch (requestError) {
      if (requestError.status === 401) {
        clearSession();
        navigate("/login", { replace: true });
        return false;
      }

      setWorkflowError(requestError.message);
      return false;
    } finally {
      setIsSavingWorkflow(false);
    }
  }

  async function handleUpdateWorkflowStatus(statusId, statusData) {
    setWorkflowError("");
    setIsSavingWorkflow(true);

    try {
      const data = await apiRequest(
        `/projects/${projectId}/statuses/${statusId}`,
        {
          method: "PATCH",
          body: statusData,
        },
      );

      setProject((currentProject) =>
        currentProject
          ? {
              ...currentProject,
              workflowStatuses: data.workflowStatuses,
            }
          : currentProject,
      );

      return true;
    } catch (requestError) {
      if (requestError.status === 401) {
        clearSession();
        navigate("/login", { replace: true });
        return false;
      }

      setWorkflowError(requestError.message);
      return false;
    } finally {
      setIsSavingWorkflow(false);
    }
  }

  async function handleReorderWorkflowStatuses(statusIds) {
    setWorkflowError("");
    setIsSavingWorkflow(true);

    try {
      const data = await apiRequest(`/projects/${projectId}/statuses/order`, {
        method: "PUT",
        body: { statusIds },
      });

      setProject((currentProject) =>
        currentProject
          ? {
              ...currentProject,
              workflowStatuses: data.workflowStatuses,
            }
          : currentProject,
      );

      return true;
    } catch (requestError) {
      if (requestError.status === 401) {
        clearSession();
        navigate("/login", { replace: true });
        return false;
      }

      setWorkflowError(requestError.message);
      return false;
    } finally {
      setIsSavingWorkflow(false);
    }
  }

  async function handleDeleteWorkflowStatus(statusId, replacementStatusId) {
    setWorkflowError("");
    setIsSavingWorkflow(true);

    try {
      const data = await apiRequest(
        `/projects/${projectId}/statuses/${statusId}`,
        {
          method: "DELETE",
          body: replacementStatusId ? { replacementStatusId } : {},
        },
      );

      setProject((currentProject) =>
        currentProject
          ? {
              ...currentProject,
              workflowStatuses: data.workflowStatuses,
            }
          : currentProject,
      );

      if (data.replacementStatusId) {
        setTasks((currentTasks) =>
          currentTasks.map((task) =>
            task.status === data.deletedStatusId
              ? {
                  ...task,
                  status: data.replacementStatusId,
                  version: task.version + 1,
                }
              : task,
          ),
        );
      }

      return true;
    } catch (requestError) {
      if (requestError.status === 401) {
        clearSession();
        navigate("/login", { replace: true });
        return false;
      }

      setWorkflowError(requestError.message);
      return false;
    } finally {
      setIsSavingWorkflow(false);
    }
  }

  function openCreateTaskForm(initialStatusId = null) {
    if (!canCreateTask) {
      return;
    }

    const isValidStatus = workflowStatuses.some(
      (workflowStatus) => workflowStatus.id === initialStatusId,
    );

    setEditingTask(null);

    setCreateTaskStatusId(isValidStatus ? initialStatusId : null);

    setTaskFormError("");
    setIsTaskFormOpen(true);
  }

  function openEditTaskForm(task) {
  if (
    !canUpdateTasks &&
    !task.canAssignReporter
  ) {
    return;
  }

    setEditingTask(task);
    setCreateTaskStatusId(null);
    setTaskFormError("");
    setIsTaskFormOpen(true);
  }

  function closeTaskForm() {
    if (isSavingTask) {
      return;
    }

    setIsTaskFormOpen(false);
    setEditingTask(null);
    setCreateTaskStatusId(null);
    setTaskFormError("");
  }

  async function handleSaveTask(taskData) {
    setTaskFormError("");
    setIsSavingTask(true);

    try {
      if (editingTask) {
        const data = await apiRequest(`/tasks/${editingTask.id}`, {
          method: "PATCH",
          body: {
            ...taskData,
            version: editingTask.version,
          },
        });

        setTasks((currentTasks) =>
          currentTasks.map((task) =>
            task.id === data.task.id ? data.task : task,
          ),
        );
      } else {
        const data = await apiRequest(`/projects/${projectId}/tasks`, {
          method: "POST",
          body: taskData,
        });

        setTasks((currentTasks) => [...currentTasks, data.task]);
      }

      setIsTaskFormOpen(false);
      setEditingTask(null);
      setCreateTaskStatusId(null);
    } catch (requestError) {
      if (requestError.status === 401) {
        clearSession();
        navigate("/login", { replace: true });
        return;
      }

      if (requestError.status === 409 && requestError.data?.task) {
        const latestTask = requestError.data.task;

        setTasks((currentTasks) =>
          currentTasks.map((task) =>
            task.id === latestTask.id ? latestTask : task,
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

  function handleTaskDragStart(event, task) {
    if (!canUpdateTasks || movingTaskId) {
      event.preventDefault();
      return;
    }

    event.dataTransfer.effectAllowed = "move";

    event.dataTransfer.setData("text/plain", task.id);

    setTaskActionError("");
    setDraggingTaskId(task.id);
    setDropTargetStatusId(null);
  }

  function handleTaskDragEnd() {
    setDraggingTaskId(null);
    setDropTargetStatusId(null);
  }

  function handleTaskDragOver(event, targetStatusId) {
    if (!canUpdateTasks || !draggingTaskId || movingTaskId) {
      return;
    }

    const draggedTask = tasks.find((task) => task.id === draggingTaskId);

    if (!draggedTask || draggedTask.status === targetStatusId) {
      setDropTargetStatusId(null);
      return;
    }

    event.preventDefault();
    event.dataTransfer.dropEffect = "move";

    setDropTargetStatusId(targetStatusId);
  }

  function handleTaskDragLeave(event, targetStatusId) {
    if (
      event.relatedTarget &&
      event.currentTarget.contains(event.relatedTarget)
    ) {
      return;
    }

    setDropTargetStatusId((currentStatusId) =>
      currentStatusId === targetStatusId ? null : currentStatusId,
    );
  }

  async function handleTaskDrop(event, targetStatusId) {
    event.preventDefault();

    const transferredTaskId = event.dataTransfer.getData("text/plain");

    const taskId = transferredTaskId || draggingTaskId;

    setDraggingTaskId(null);
    setDropTargetStatusId(null);

    if (!canUpdateTasks || !taskId || movingTaskId) {
      return;
    }

    const taskToMove = tasks.find((task) => task.id === taskId);

    if (!taskToMove || taskToMove.status === targetStatusId) {
      return;
    }

    setTaskActionError("");
    setMovingTaskId(taskToMove.id);

    try {
      const data = await apiRequest(`/tasks/${taskToMove.id}`, {
        method: "PATCH",
        body: {
          status: targetStatusId,
          version: taskToMove.version,
        },
      });

      setTasks((currentTasks) =>
        currentTasks.map((task) =>
          task.id === data.task.id ? data.task : task,
        ),
      );
    } catch (requestError) {
      if (requestError.status === 401) {
        clearSession();
        navigate("/login", { replace: true });
        return;
      }

      if (requestError.status === 409 && requestError.data?.task) {
        const latestTask = requestError.data.task;

        setTasks((currentTasks) =>
          currentTasks.map((task) =>
            task.id === latestTask.id ? latestTask : task,
          ),
        );

        setTaskActionError(
          "Another update changed this task. " +
            "The latest version has been loaded. " +
            "Drag it again to move it.",
        );

        return;
      }

      setTaskActionError(requestError.message);
    } finally {
      setMovingTaskId(null);
    }
  }

  async function handleDeleteTask(task) {
    if (!canDeleteTasks) {
      return;
    }

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
        currentTasks.filter((currentTask) => currentTask.id !== task.id),
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
          Loading project...
        </p>
      </main>
    );
  }

  if (loadError || !project) {
    return (
      <main className="board-page">
        <section className="page-error">
          <p role="alert">{loadError || "Project not found"}</p>

          <div className="page-error__actions">
            <button
              type="button"
              className="button button--secondary"
              onClick={() => setReloadKey((currentKey) => currentKey + 1)}
            >
              Try Again
            </button>

            <button
              type="button"
              className="button button--primary"
              onClick={() => navigate(`/workspaces/${workspaceId}/projects`)}
            >
              Projects
            </button>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="board-page">
      <ProjectHeader
        project={project}
        taskCount={tasks.length}
        backTo={`/workspaces/${workspaceId}/projects`}
        manageAccessTo={`/workspaces/${workspaceId}/projects/${projectId}/access`}
        onAddTask={openCreateTaskForm}
        canAddTask={canCreateTask}
        canManageMembers={canManageMembers}
      />

      {taskActionError && (
        <p className="board-action-error" role="alert">
          {taskActionError}
        </p>
      )}

      <section
        className="project-view-toolbar"
        aria-label="Project Task view controls"
      >
        <div className="project-view-toolbar__view">
          <span className="project-view-toolbar__label">View</span>

          <ProjectViewToggle
            activeView={activeView}
            onViewChange={setActiveView}
          />
        </div>

        <div className="project-view-toolbar__actions">
          <span className="project-view-toolbar__summary">
            {workflowStatuses.length}{" "}
            {workflowStatuses.length === 1 ? "Status" : "Statuses"}
            {" · "}
            {tasks.length} {tasks.length === 1 ? "Task" : "Tasks"}
          </span>

          {canManageWorkflow && (
            <button
              type="button"
              className={
                "button button--secondary " + "project-view-toolbar__manage"
              }
              onClick={openWorkflowManager}
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                aria-hidden="true"
              >
                <circle cx="12" cy="12" r="3" />

                <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1-2.8 2.8-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.6v.2h-4V21a1.7 1.7 0 0 0-1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1L4.2 17l.1-.1a1.7 1.7 0 0 0 .3-1.9A1.7 1.7 0 0 0 3 14H2.8v-4H3a1.7 1.7 0 0 0 1.6-1 1.7 1.7 0 0 0-.3-1.9L4.2 7 7 4.2l.1.1A1.7 1.7 0 0 0 9 4.6 1.7 1.7 0 0 0 10 3V2.8h4V3a1.7 1.7 0 0 0 1 1.6 1.7 1.7 0 0 0 1.9-.3l.1-.1L19.8 7l-.1.1a1.7 1.7 0 0 0-.3 1.9 1.7 1.7 0 0 0 1.6 1h.2v4H21a1.7 1.7 0 0 0-1.6 1Z" />
              </svg>

              <span>Manage Statuses</span>
            </button>
          )}
        </div>
      </section>

      {activeView === "kanban" && (
        <section className="kanban-view" aria-label="Project Kanban board">
          {canUpdateTasks && (
            <div className="task-board__instruction">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                aria-hidden="true"
              >
                <path d="M5 9h14" />

                <path d="M5 15h14" />

                <path d="m9 5-4 4 4 4" />

                <path d="m15 11 4 4-4 4" />
              </svg>

              <span>
                Drag Task cards between status columns. Keyboard and touch users
                can change status through Edit.
              </span>
            </div>
          )}

          <div className="task-board">
            {workflowStatuses.map((workflowStatus) => (
              <TaskColumn
                key={workflowStatus.id}
                workflowStatus={workflowStatus}
                tasks={tasks}
                projectMembers={projectMembers}
                onEditTask={openEditTaskForm}
                onDeleteTask={handleDeleteTask}
                onAddTask={openCreateTaskForm}
                onTaskDragStart={handleTaskDragStart}
                onTaskDragEnd={handleTaskDragEnd}
                onTaskDragOver={handleTaskDragOver}
                onTaskDragLeave={handleTaskDragLeave}
                onTaskDrop={handleTaskDrop}
                canAddTasks={canCreateTask}
                canEditTasks={canUpdateTasks}
                canDeleteTasks={canDeleteTasks}
                deletingTaskId={deletingTaskId}
                draggingTaskId={draggingTaskId}
                movingTaskId={movingTaskId}
                dropTargetStatusId={dropTargetStatusId}
              />
            ))}
          </div>
        </section>
      )}

      {activeView === "list" && (
        <TaskList
          tasks={tasks}
          workflowStatuses={workflowStatuses}
          projectMembers={projectMembers}
          onEditTask={openEditTaskForm}
          onDeleteTask={handleDeleteTask}
          canEditTasks={canUpdateTasks}
          canDeleteTasks={canDeleteTasks}
          deletingTaskId={deletingTaskId}
        />
      )}

      {isWorkflowManagerOpen && (
        <WorkflowStatusManager
          workflowStatuses={workflowStatuses}
          tasks={tasks}
          onCreateStatus={handleCreateWorkflowStatus}
          onUpdateStatus={handleUpdateWorkflowStatus}
          onDeleteStatus={handleDeleteWorkflowStatus}
          onReorderStatuses={handleReorderWorkflowStatuses}
          onClose={closeWorkflowManager}
          isSaving={isSavingWorkflow}
          error={workflowError}
        />
      )}

      {isTaskFormOpen && (
        <TaskForm
          key={
            editingTask
              ? `${editingTask.id}-${editingTask.version}`
              : `new-task-${createTaskStatusId ?? "default"}`
          }
          initialTask={editingTask}
          initialStatusId={createTaskStatusId}
          workflowStatuses={workflowStatuses}
          assignees={assignableProjectMembers}
reporters={projectMembers}
currentUser={currentUser}
canEditTaskFields={
  !editingTask ||
  canUpdateTasks
}
canAssignReporter={
  !editingTask ||
  editingTask.canAssignReporter
}
          onSubmit={handleSaveTask}
          onCancel={closeTaskForm}
          isSubmitting={isSavingTask}
          error={taskFormError}
        />
      )}
    </main>
  );
}

export default ProjectPage;
