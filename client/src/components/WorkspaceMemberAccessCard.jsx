const permissionLabels = Object.freeze({
  READ_PROJECT: "View Project",
  UPDATE_PROJECT: "Edit Project",
  DELETE_PROJECT: "Delete Project",
  MANAGE_MEMBERS: "Manage Project members",
  CREATE_TASK: "Create Tasks",
  UPDATE_TASK: "Edit and move Tasks",
  DELETE_TASK: "Delete Tasks",
});

function getInitials(name) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
}

function WorkspaceMemberAccessCard({
  member,
  isCurrentUser = false,
  canManageAdminRoles = false,
  activeActionKey,
  onWorkspaceRoleChange,
  onProjectRoleChange,
  onRemoveProjectAccess,
  onRemoveWorkspaceMember,
}) {
  const workspaceActionKey = `workspace:${member.userId}`;

  const isWorkspaceUpdating = activeActionKey === workspaceActionKey;

  const canEditWorkspaceRole =
    member.canChangeWorkspaceRole &&
    !isCurrentUser &&
    (canManageAdminRoles || member.workspaceRole !== "ADMIN");

  const ownedProjectCount = member.projectAccess.filter(
    (access) => access.isProjectOwner,
  ).length;

  const removalRequiresWorkspaceOwner =
    member.workspaceRole === "ADMIN" && !canManageAdminRoles;

  const canRemoveWorkspaceMember =
    member.canRemoveFromWorkspace &&
    !isCurrentUser &&
    ownedProjectCount === 0 &&
    !removalRequiresWorkspaceOwner;

  const removalActionKey = `remove-member:${member.userId}`;

  const isRemovingWorkspaceMember = activeActionKey === removalActionKey;

  return (
    <article className="workspace-member-card">
      <header className="workspace-member-card__header">
        <div className="member-card__identity">
          <div className="member-avatar" aria-hidden="true">
            {getInitials(member.name)}
          </div>

          <div>
            <h2>{member.name}</h2>

            <p>{member.email}</p>

            <div className="member-card__badges">
              <span className="entity-badge">{member.workspaceRole}</span>

              <span
                className={
                  member.memberType === "GUEST"
                    ? "entity-badge entity-badge--private"
                    : "entity-badge entity-badge--open"
                }
              >
                {member.memberType}
              </span>

              {isCurrentUser && <span className="entity-badge">You</span>}
            </div>
          </div>
        </div>

        <div className="workspace-member-card__header-actions">
          <div className="workspace-member-card__summary">
            <strong>
              {member.accessSummary.accessibleProjectCount}
              {" / "}
              {member.accessSummary.totalProjects}
            </strong>

            <span>accessible Projects</span>

            <small>
              {member.accessSummary.explicitProjectCount} explicit ·{" "}
              {member.accessSummary.inheritedProjectCount} inherited
            </small>
          </div>

          {canEditWorkspaceRole && (
            <label className="workspace-role-control">
              <span>Workspace role</span>

              <select
                value={member.workspaceRole}
                onChange={(event) =>
                  onWorkspaceRoleChange(member, event.target.value)
                }
                disabled={Boolean(activeActionKey)}
                aria-label={`Workspace role for ` + `${member.name}`}
              >
                {canManageAdminRoles && <option value="ADMIN">Admin</option>}

                <option value="MEMBER">Member</option>

                <option value="GUEST">Guest</option>
              </select>
            </label>
          )}

          {isWorkspaceUpdating && (
            <span className="workspace-action-progress" role="status">
              Updating Workspace role...
            </span>
          )}
          {canRemoveWorkspaceMember && (
            <button
              type="button"
              className={
                `button button--danger ` +
                `workspace-member-card__remove-button`
              }
              onClick={() => onRemoveWorkspaceMember(member)}
              disabled={Boolean(activeActionKey)}
            >
              {isRemovingWorkspaceMember ? "Removing..." : "Remove Member"}
            </button>
          )}

          {ownedProjectCount > 0 &&
            member.canRemoveFromWorkspace &&
            !isCurrentUser && (
              <span className="workspace-removal-protection">
                Transfer{" "}
                {ownedProjectCount === 1
                  ? "Project ownership"
                  : `${ownedProjectCount} Project ownerships`}{" "}
                before removal
              </span>
            )}

          {removalRequiresWorkspaceOwner && !isCurrentUser && (
            <span className="workspace-removal-protection">
              Workspace Owner action required
            </span>
          )}
        </div>
      </header>

      <div className="workspace-project-access-list">
        {member.projectAccess.map((access) => {
          const projectActionKey =
            `project:${member.userId}:` + `${access.projectId}`;

          const isProjectUpdating = activeActionKey === projectActionKey;

          const canEditProjectAccess = !access.isProjectOwner;

          return (
            <section
              key={access.projectId}
              className={
                `workspace-project-access-row ` +
                `${
                  access.hasAccess ? "" : "workspace-project-access-row--none"
                }`
              }
            >
              <div className="workspace-project-access-row__project">
                <span className="project-key">{access.projectKey}</span>

                <h3>{access.name}</h3>
              </div>

              <div className="workspace-project-access-row__relationship">
                <div className="workspace-project-access-row__badges">
                  <span
                    className={
                      `entity-badge ` + `entity-badge--${access.visibility}`
                    }
                  >
                    {access.visibility}
                  </span>

                  {access.hasAccess ? (
                    <>
                      <span
                        className={
                          `workspace-access-source ` +
                          `workspace-access-source--` +
                          `${access.accessSource.toLowerCase()}`
                        }
                      >
                        {access.accessSource}
                      </span>

                      <span className="entity-badge">{access.projectRole}</span>

                      {access.isProjectOwner && (
                        <span className="entity-badge">Project Owner</span>
                      )}
                    </>
                  ) : (
                    <span className="workspace-access-source workspace-access-source--none">
                      No access
                    </span>
                  )}
                </div>
              </div>

              <div className="workspace-project-access-row__permissions">
                {access.permissions.length === 0 ? (
                  <p>No Project permissions</p>
                ) : (
                  <details>
                    <summary>
                      {access.permissions.length}{" "}
                      {access.permissions.length === 1
                        ? "permission"
                        : "permissions"}
                    </summary>

                    <ul>
                      {access.permissions.map((permission) => (
                        <li key={permission}>
                          {permissionLabels[permission] ?? permission}
                        </li>
                      ))}
                    </ul>
                  </details>
                )}
              </div>

              <div className="workspace-project-access-row__controls">
                {access.isProjectOwner ? (
                  <span className="workspace-protected-access">
                    Ownership protected
                  </span>
                ) : (
                  <>
                    {canEditProjectAccess && (
                      <select
                        value={access.isProjectMember ? access.projectRole : ""}
                        onChange={(event) => {
                          if (!event.target.value) {
                            return;
                          }

                          onProjectRoleChange(
                            member,
                            access,
                            event.target.value,
                          );
                        }}
                        disabled={Boolean(activeActionKey)}
                        aria-label={
                          `Project role for ` +
                          `${member.name} in ` +
                          `${access.name}`
                        }
                      >
                        {!access.isProjectMember && (
                          <option value="">
                            {access.accessSource === "INHERITED"
                              ? "Make explicit..."
                              : "Grant access..."}
                          </option>
                        )}

                        <option value="CONTRIBUTOR">Contributor</option>

                        <option value="REVIEWER">Reviewer</option>
                      </select>
                    )}

                    {access.isProjectMember && (
                      <button
                        type="button"
                        className="button button--danger"
                        onClick={() => onRemoveProjectAccess(member, access)}
                        disabled={Boolean(activeActionKey)}
                      >
                        Remove Access
                      </button>
                    )}
                  </>
                )}

                {isProjectUpdating && (
                  <span className="workspace-action-progress" role="status">
                    Updating...
                  </span>
                )}
              </div>
            </section>
          );
        })}
      </div>
    </article>
  );
}

export default WorkspaceMemberAccessCard;
