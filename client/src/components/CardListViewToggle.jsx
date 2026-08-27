const VIEW_OPTIONS = [
  {
    value: "cards",
    label: "Cards",
  },
  {
    value: "list",
    label: "List",
  },
];

function CardListViewToggle({
  activeView,
  onViewChange,
  ariaLabel = "Select view",
  isListAvailable = false,
}) {
  return (
    <div className="project-view-toggle" role="group" aria-label={ariaLabel}>
      {VIEW_OPTIONS.map((viewOption) => {
        const isActive = activeView === viewOption.value;

        const isDisabled = viewOption.value === "list" && !isListAvailable;

        return (
          <button
            key={viewOption.value}
            type="button"
            className={
              "project-view-toggle__button" +
              (isActive ? " project-view-toggle__button--active" : "")
            }
            onClick={() => onViewChange(viewOption.value)}
            disabled={isDisabled}
            aria-pressed={isActive}
            title={isDisabled ? "List view will be added later" : undefined}
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

export default CardListViewToggle;
