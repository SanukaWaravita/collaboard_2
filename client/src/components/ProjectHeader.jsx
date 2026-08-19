import { Link } from "react-router";

function ProjectHeader({
  project,
  taskCount,
  backTo,
  onAddTask,
  canAddTask = false,
}) {
  return (
    <header className="board-header">
      <div>
        <Link
          to={backTo}
          className="project-header__back"
        >
          ← Back to projects
        </Link>

        <p className="board-header__eyebrow">
          {project.projectKey}
          {" · "}
          {project.visibility}
          {" · "}
          {project.currentUserRole}
        </p>

        <h1>{project.name}</h1>

        <p>
          {taskCount} {taskCount === 1 ? "task" : "tasks"}
        </p>
      </div>

      {canAddTask && (
        <button
          type="button"
          className="button button--primary"
          onClick={onAddTask}
        >
          Add Task
        </button>
      )}
    </header>
  );
}

export default ProjectHeader;