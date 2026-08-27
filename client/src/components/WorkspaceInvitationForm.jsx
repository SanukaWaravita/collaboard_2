import { useState } from "react";
import { MEMBER_TYPES, PROJECT_ROLES } from "../constants/access";

function WorkspaceInvitationForm({
  projects = [],
  onSubmit,
  isSubmitting = false,
  error = "",
  result = null,
}) {
  const [email, setEmail] = useState("");
  const [memberType, setMemberType] = useState(MEMBER_TYPES.INTERNAL);

  const [projectSelections, setProjectSelections] = useState({});

  const [selectionError, setSelectionError] = useState("");

  const selectedProjectCount = Object.keys(projectSelections).length;

  function toggleProject(projectId) {
    setSelectionError("");

    setProjectSelections((currentSelections) => {
      const nextSelections = {
        ...currentSelections,
      };

      if (nextSelections[projectId]) {
        delete nextSelections[projectId];
      } else {
        nextSelections[projectId] = PROJECT_ROLES.REVIEWER;
      }

      return nextSelections;
    });
  }

  function changeProjectRole(projectId, role) {
    setProjectSelections((currentSelections) => ({
      ...currentSelections,
      [projectId]: role,
    }));
  }

  function handleSubmit(event) {
    event.preventDefault();

    if (isSubmitting) {
      return;
    }

    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedEmail) {
      return;
    }

    const selectedProjects = projects
      .filter((project) => projectSelections[project.id])
      .map((project) => ({
        projectId: project.id,
        role: projectSelections[project.id],
      }));

    if (selectedProjects.length === 0) {
      setSelectionError("Select at least one Project.");

      return;
    }

    setSelectionError("");

    onSubmit({
      email: normalizedEmail,
      memberType,
      projects: selectedProjects,
    });
  }

  const submitLabel =
    selectedProjectCount === 0
      ? "Send Invitations"
      : selectedProjectCount === 1
        ? "Send 1 Invitation"
        : `Send ${selectedProjectCount} Invitations`;

  return (
    <section className="access-panel">
      <header className="access-panel__header">
        <div>
          <p className="task-form__eyebrow">Workspace invitations</p>

          <h2>Invite a member</h2>

          <p>
            Invite an internal member or guest and choose the Projects they can
            access.
          </p>
        </div>
      </header>

      <form className="workspace-invitation-form" onSubmit={handleSubmit}>
        <div className="access-form-grid">
          <div className="task-form__field">
            <label htmlFor="workspace-invitation-email">Email address</label>

            <input
              id="workspace-invitation-email"
              name="email"
              type="email"
              value={email}
              placeholder="member@example.com"
              autoComplete="email"
              required
              disabled={isSubmitting}
              onChange={(event) => {
                setEmail(event.target.value);
                setSelectionError("");
              }}
            />
          </div>

          <div className="task-form__field">
            <label htmlFor="workspace-invitation-member-type">
              Member type
            </label>

            <select
              id="workspace-invitation-member-type"
              name="memberType"
              value={memberType}
              disabled={isSubmitting}
              onChange={(event) => setMemberType(event.target.value)}
            >
              <option value={MEMBER_TYPES.INTERNAL}>Internal member</option>

              <option value={MEMBER_TYPES.GUEST}>Guest user</option>
            </select>
          </div>
        </div>

        <div className="access-role-help">
          {memberType === MEMBER_TYPES.INTERNAL ? (
            <p>
              <strong>Internal member:</strong> Automatically receives inherited
              Reviewer access to open Projects. Selecting an open Project below
              creates explicit access.
            </p>
          ) : (
            <p>
              <strong>Guest user:</strong> Can access only the Projects
              explicitly selected below.
            </p>
          )}

          <p>
            Each selected Project can use a different Contributor or Reviewer
            role.
          </p>
        </div>

        <fieldset
          className="workspace-invitation-projects"
          disabled={isSubmitting}
        >
          <legend className="workspace-invitation-projects__legend">
            Project access
          </legend>

          <div className="workspace-invitation-projects__heading">
            <p>Select at least one Project and assign the intended role.</p>

            <span className="entity-badge">
              {selectedProjectCount} selected
            </span>
          </div>

          {projects.length === 0 ? (
            <p className="access-empty">
              This Workspace has no Projects available for invitation.
            </p>
          ) : (
            <div className="workspace-invitation-project-list">
              {projects.map((project) => {
                const selectedRole = projectSelections[project.id];

                const isSelected = Boolean(selectedRole);

                const checkboxId = `workspace-invitation-project-` + project.id;

                const roleId = `workspace-invitation-role-` + project.id;

                return (
                  <article
                    key={project.id}
                    className={
                      `workspace-invitation-project ` +
                      `${
                        isSelected
                          ? "workspace-invitation-project--selected"
                          : ""
                      }`
                    }
                  >
                    <label
                      className="workspace-invitation-project__selection"
                      htmlFor={checkboxId}
                    >
                      <input
                        id={checkboxId}
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleProject(project.id)}
                      />

                      <span className="workspace-invitation-project__details">
                        <span className="workspace-invitation-project__title">
                          <span className="project-key">
                            {project.projectKey}
                          </span>

                          <strong>{project.name}</strong>
                        </span>

                        <span className="workspace-invitation-project__metadata">
                          {project.visibility === "open"
                            ? "Open Project"
                            : "Private Project"}
                        </span>
                      </span>
                    </label>

                    <div className="workspace-invitation-project__role">
                      <label htmlFor={roleId}>Project role</label>

                      <select
                        id={roleId}
                        value={selectedRole ?? PROJECT_ROLES.REVIEWER}
                        disabled={!isSelected || isSubmitting}
                        onChange={(event) =>
                          changeProjectRole(project.id, event.target.value)
                        }
                      >
                        <option value={PROJECT_ROLES.CONTRIBUTOR}>
                          Contributor
                        </option>

                        <option value={PROJECT_ROLES.REVIEWER}>Reviewer</option>
                      </select>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </fieldset>

        {(selectionError || error) && (
          <p className="auth-form__error" role="alert">
            {selectionError || error}
          </p>
        )}

        {result && (
          <div className="workspace-invitation-result" role="status">
            <strong>{result.message}</strong>

            {result.skippedProjects?.length > 0 && (
              <div>
                <p>The following Project selections were skipped:</p>

                <ul>
                  {result.skippedProjects.map((project) => (
                    <li key={project.projectId}>
                      <strong>{project.projectKey}</strong>
                      {": "}
                      {project.message}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        <div className="workspace-invitation-form__actions">
          <button
            type="submit"
            className="button button--primary"
            disabled={isSubmitting || projects.length === 0}
          >
            {isSubmitting ? "Sending Invitations..." : submitLabel}
          </button>
        </div>
      </form>
    </section>
  );
}

export default WorkspaceInvitationForm;
