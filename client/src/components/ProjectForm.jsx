function ProjectForm({
  initialProject = null,
  onSubmit,
  onCancel,
  isSubmitting = false,
  error = "",
}) {
  const isEditing = Boolean(initialProject);

  function handleSubmit(event) {
    event.preventDefault();

    if (isSubmitting) {
      return;
    }

    const formData = new FormData(event.currentTarget);

    const name = String(formData.get("name") ?? "").trim();

    const description = String(formData.get("description") ?? "").trim();

    const visibility = String(formData.get("visibility") ?? "private");

    if (!name) {
      return;
    }

    const projectData = {
      name,
      description,
      visibility,
    };

    if (!isEditing) {
      const projectKey = String(formData.get("projectKey") ?? "")
        .trim()
        .toUpperCase();

      if (projectKey) {
        projectData.projectKey = projectKey;
      }
    }

    onSubmit(projectData);
  }

  return (
    <div className="modal-backdrop">
      <form
        className="board-form"
        onSubmit={handleSubmit}
        role="dialog"
        aria-modal="true"
        aria-labelledby="project-form-title"
      >
        <header className="task-form__header">
          <div>
            <p className="task-form__eyebrow">
              {isEditing ? "Edit project" : "New project"}
            </p>

            <h2 id="project-form-title">
              {isEditing ? "Update project" : "Create a project"}
            </h2>
          </div>

          <button
            type="button"
            className="task-form__close"
            onClick={onCancel}
            aria-label="Close project form"
            disabled={isSubmitting}
          >
            ×
          </button>
        </header>

        <div className="task-form__field">
          <label htmlFor="project-name">Project name</label>

          <input
            id="project-name"
            name="name"
            type="text"
            defaultValue={initialProject?.name ?? ""}
            placeholder="For example: Milestone 3"
            required
            autoFocus
            disabled={isSubmitting}
          />
        </div>

        {!isEditing && (
          <div className="task-form__field">
            <label htmlFor="project-key">Project key</label>

            <input
              id="project-key"
              name="projectKey"
              type="text"
              placeholder="For example: M3"
              minLength="2"
              maxLength="10"
              pattern="[A-Za-z][A-Za-z0-9]{1,9}"
              disabled={isSubmitting}
            />

            <small>
              Optional. It must contain 2–10 letters or numbers and begin with a
              letter.
            </small>
          </div>
        )}

        {isEditing && (
          <div className="task-form__field">
            <label htmlFor="existing-project-key">Project key</label>

            <input
              id="existing-project-key"
              type="text"
              value={initialProject.projectKey}
              disabled
            />

            <small>Project keys cannot be changed after creation.</small>
          </div>
        )}

        <div className="task-form__field">
          <label htmlFor="project-description">Description</label>

          <textarea
            id="project-description"
            name="description"
            defaultValue={initialProject?.description ?? ""}
            placeholder="Describe the purpose of this project"
            rows="4"
            disabled={isSubmitting}
          />
        </div>

        <div className="task-form__field">
          <label htmlFor="project-visibility">Visibility</label>

          <select
            id="project-visibility"
            name="visibility"
            defaultValue={initialProject?.visibility ?? "private"}
            disabled={isSubmitting}
          >
            <option value="private">Private</option>
            <option value="open">Open</option>
          </select>

          <small>
            Open projects can be viewed by ordinary workspace members. Private
            projects require explicit membership.
          </small>
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
            {isSubmitting
              ? "Saving..."
              : isEditing
                ? "Save Changes"
                : "Create Project"}
          </button>
        </div>
      </form>
    </div>
  );
}

export default ProjectForm;
