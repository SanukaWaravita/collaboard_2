function BoardHeader({ boardName, taskCount, onAddTask }) {
  return (
    <header className="board-header">
      <div>
        <p className="board-header__eyebrow">Current board</p>
        <h1>{boardName}</h1>
        <p>
          {taskCount} {taskCount === 1 ? "task" : "tasks"}
        </p>
      </div>

      <button
        type="button"
        className="button button--primary"
        onClick={onAddTask}
      >
        Add Task
      </button>
    </header>
  );
}

export default BoardHeader;