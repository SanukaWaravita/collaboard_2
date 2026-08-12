import { useState } from "react";

function TaskForm({ initialTask = null, onSubmit, onCancel }) {
  const [title, setTitle] = useState(initialTask?.title ?? "");
  const [description, setDescription] = useState(
    initialTask?.description ?? "",
  );
  const [status, setStatus] = useState(initialTask?.status ?? "todo");

  const isEditing = Boolean(initialTask);

  function handleSubmit(event) {
    event.preventDefault();

    const trimmedTitle = title.trim();

    if (!trimmedTitle) {
      return;
    }

    onSubmit({
      title: trimmedTitle,
      description: description.trim(),
      status,
    });
  }

  return (
    <div className="modal-backdrop">
      <form
        className="task-form"
        onSubmit={handleSubmit}
        role="dialog"
        aria-modal="true"
        aria-labelledby="task-form-title"
      >
        <header className="task-form__header">
          <div>
            <p className="task-form__eyebrow">
              {isEditing ? "Edit task" : "New task"}
            </p>

            <h2 id="task-form-title">
              {isEditing ? "Update task" : "Create a task"}
            </h2>
          </div>

          <button
            type="button"
            className="task-form__close"
            onClick={onCancel}
            aria-label="Close task form"
          >
            ×
          </button>
        </header>

        <div className="task-form__field">
          <label htmlFor="task-title">Title</label>
          <input
            id="task-title"
            type="text"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Enter a task title"
            required
            autoFocus
          />
        </div>

        <div className="task-form__field">
          <label htmlFor="task-description">Description</label>
          <textarea
            id="task-description"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="Describe the task"
            rows="4"
          />
        </div>

        <div className="task-form__field">
          <label htmlFor="task-status">Status</label>
          <select
            id="task-status"
            value={status}
            onChange={(event) => setStatus(event.target.value)}
          >
            <option value="todo">To Do</option>
            <option value="doing">Doing</option>
            <option value="done">Done</option>
          </select>
        </div>

        <div className="task-form__actions">
          <button
            type="button"
            className="button button--secondary"
            onClick={onCancel}
          >
            Cancel
          </button>

          <button type="submit" className="button button--primary">
            {isEditing ? "Save Changes" : "Create Task"}
          </button>
        </div>
      </form>
    </div>
  );
}

export default TaskForm;