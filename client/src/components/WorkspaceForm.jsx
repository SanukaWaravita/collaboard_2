function WorkspaceForm({
  initialWorkspace = null,
  onSubmit,
  onCancel,
  isSubmitting = false,
  error = "",
}) {
  const isEditing = Boolean(initialWorkspace);

  function handleSubmit(event) {
    event.preventDefault();

    if (isSubmitting) {
      return;
    }

    const formData = new FormData(event.currentTarget);
    const name = String(formData.get("name") ?? "").trim();

    if (!name) {
      return;
    }

    const workspaceData = { name };

    if (!isEditing) {
      const slug = String(formData.get("slug") ?? "")
        .trim()
        .toLowerCase();

      if (slug) {
        workspaceData.slug = slug;
      }
    }

    onSubmit(workspaceData);
  }

  return (
    <div className="modal-backdrop">
      <form
        className="board-form"
        onSubmit={handleSubmit}
        role="dialog"
        aria-modal="true"
        aria-labelledby="workspace-form-title"
      >
        <header className="task-form__header">
          <div>
            <p className="task-form__eyebrow">
              {isEditing ? "Edit workspace" : "New workspace"}
            </p>

            <h2 id="workspace-form-title">
              {isEditing ? "Update workspace" : "Create a workspace"}
            </h2>
          </div>

          <button
            type="button"
            className="task-form__close"
            onClick={onCancel}
            aria-label="Close workspace form"
            disabled={isSubmitting}
          >
            ×
          </button>
        </header>

        <div className="task-form__field">
          <label htmlFor="workspace-name">Workspace name</label>

          <input
            id="workspace-name"
            name="name"
            type="text"
            defaultValue={initialWorkspace?.name ?? ""}
            placeholder="For example: CollaBoard Team"
            required
            autoFocus
            disabled={isSubmitting}
          />
        </div>

        {!isEditing && (
          <div className="task-form__field">
            <label htmlFor="workspace-slug">Workspace slug</label>

            <input
              id="workspace-slug"
              name="slug"
              type="text"
              placeholder="collaboard-team"
              pattern="[a-z0-9-]{2,50}"
              disabled={isSubmitting}
            />

            <small>
              Optional. If omitted, the server generates it from the workspace
              name.
            </small>
          </div>
        )}

        {isEditing && (
          <div className="task-form__field">
            <label htmlFor="workspace-existing-slug">Workspace slug</label>

            <input
              id="workspace-existing-slug"
              type="text"
              value={initialWorkspace.slug}
              disabled
            />

            <small>Workspace slugs cannot be changed after creation.</small>
          </div>
        )}

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
            {isSubmitting
              ? "Saving..."
              : isEditing
                ? "Save Changes"
                : "Create Workspace"}
          </button>
        </div>
      </form>
    </div>
  );
}

export default WorkspaceForm;
