const VIEW_OPTIONS = [
  {
    value: "cards",
    label: "Cards",
    isDisabled: false,
  },
  {
    value: "list",
    label: "List",
    isDisabled: true,
  },
];

function WorkspaceProjectViewToggle({
  activeView,
  onViewChange,
}) {
  return (
    <div
      className="project-view-toggle"
      role="group"
      aria-label="Select Project view"
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
            disabled={viewOption.isDisabled}
            aria-pressed={isActive}
            title={
              viewOption.isDisabled
                ? "List view will be added later"
                : undefined
            }
          >
            <span
              className="project-view-toggle__indicator"
              aria-hidden="true"
            />

            <span>{viewOption.label}</span>
          </button>
        );
      })}
    </div>
  );
}

export default WorkspaceProjectViewToggle;