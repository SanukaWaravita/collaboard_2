function CreateBoardForm({ onSubmit, onCancel }) {
  function handleSubmit(event) {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);
    const name = formData.get("name").trim();
    const description = formData.get("description").trim();

    if (!name) {
      return;
    }

    onSubmit({ name, description });
  }

  return (
    <div className="modal-backdrop">
      <form
        className="board-form"
        onSubmit={handleSubmit}
        role="dialog"
        aria-modal="true"
        aria-labelledby="board-form-title"
      >
        <header className="task-form__header">
          <div>
            <p className="task-form__eyebrow">New board</p>
            <h2 id="board-form-title">Create a board</h2>
          </div>

          <button
            type="button"
            className="task-form__close"
            onClick={onCancel}
            aria-label="Close board form"
          >
            ×
          </button>
        </header>

        <div className="task-form__field">
          <label htmlFor="board-name">Board name</label>
          <input
            id="board-name"
            name="name"
            type="text"
            placeholder="For example: Group Assignment"
            required
            autoFocus
          />
        </div>

        <div className="task-form__field">
          <label htmlFor="board-description">Description</label>
          <textarea
            id="board-description"
            name="description"
            placeholder="Describe the purpose of this board"
            rows="4"
          />
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
            Create Board
          </button>
        </div>
      </form>
    </div>
  );
}

export default CreateBoardForm;