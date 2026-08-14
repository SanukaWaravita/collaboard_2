function CreateBoardForm({
  onSubmit,
  onCancel,
  isSubmitting = false,
  error = "",
}) {
  function handleSubmit(event) {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);
    const name = String(formData.get("name")).trim();
    const description = String(
      formData.get("description"),
    ).trim();

    if (!name || isSubmitting) {
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
            disabled={isSubmitting}
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
            disabled={isSubmitting}
          />
        </div>

        <div className="task-form__field">
          <label htmlFor="board-description">Description</label>
          <textarea
            id="board-description"
            name="description"
            placeholder="Describe the purpose of this board"
            rows="4"
            disabled={isSubmitting}
          />
        </div>

        {error && (
          <p className="auth-form__error" role="alert">
            {error}
          </p>
        )}

        <div className="task-form__actions">
          <button
            type="button"
            className="button button--secondary"
            onClick={onCancel}
            disabled={isSubmitting}
          >
            Cancel
          </button>

          <button
            type="submit"
            className="button button--primary"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Creating..." : "Create Board"}
          </button>
        </div>
      </form>
    </div>
  );
}

export default CreateBoardForm;