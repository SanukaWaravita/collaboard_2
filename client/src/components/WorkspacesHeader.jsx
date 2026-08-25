function WorkspacesHeader({
  workspaceCount,
  onCreateWorkspace,
}) {
  const workspaceCountLabel =
    `${workspaceCount} ` +
    `${workspaceCount === 1
      ? "Workspace"
      : "Workspaces"}`;

  return (
    <header className="board-header workspaces-header">
      <div className="board-header__identity">
        <div className="board-header__details">
          <div className="project-title-row">
            <h1>My Workspaces</h1>

            <span className="project-task-count">
              {workspaceCountLabel}
            </span>
          </div>

          <div
            className="project-header__metadata"
            aria-label="Workspace collection information"
          >
            <span className="project-header__key">
              Collaboration
            </span>

            <span aria-hidden="true">·</span>

            <span>
              Organize Projects and members
            </span>
          </div>
        </div>
      </div>

      <div className="board-header__actions">
        <button
          type="button"
          className={
            "button button--primary " +
            "workspaces-header__create"
          }
          onClick={() => onCreateWorkspace()}
        >
          <span
            className="board-header__add-icon"
            aria-hidden="true"
          >
            +
          </span>

          <span>Create Workspace</span>
        </button>
      </div>
    </header>
  );
}

export default WorkspacesHeader;