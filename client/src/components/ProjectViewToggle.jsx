const VIEW_OPTIONS = [
  {
    value: "kanban",
    label: "Kanban",
  },
  {
    value: "list",
    label: "List",
  },
];

function ProjectViewToggle({
  activeView,
  onViewChange,
}) {
  return (
    <div
      className="project-view-toggle"
      role="group"
      aria-label="Select task view"
    >
      {VIEW_OPTIONS.map((viewOption) => {
        const isActive =
          activeView === viewOption.value;

        return (
          <button
            key={viewOption.value}
            type="button"
            className={
              "project-view-toggle__button" +
              (isActive
                ? " project-view-toggle__button--active"
                : "")
            }
            onClick={() =>
              onViewChange(viewOption.value)
            }
            aria-pressed={isActive}
          >
            {viewOption.label}
          </button>
        );
      })}
    </div>
  );
}

export default ProjectViewToggle;