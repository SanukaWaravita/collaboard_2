import { MEMBER_TYPES, PROJECT_ROLES } from "../constants/access";

function ProjectMemberList({
  project,
  members,
  canManageMembers,
  updatingMemberId,
  removingMemberId,
  transferringUserId,
  onRoleChange,
  onRemove,
  onTransferOwnership,
}) {
  return (
    <section className="access-panel">
      <header className="access-panel__header">
        <div>
          <p className="task-form__eyebrow">Current access</p>

          <h2>Project members</h2>

          <p>
            {members.length} {members.length === 1 ? "member" : "members"}
          </p>
        </div>
      </header>

      {members.length === 0 ? (
        <p className="access-empty">No project members were found.</p>
      ) : (
        <div className="member-list">
          {members.map((member) => {
            const isOwner = member.projectRole === PROJECT_ROLES.OWNER;

            const isGuest = member.memberType === MEMBER_TYPES.GUEST;

            const canTransferOwnership =
              canManageMembers &&
              project.currentUserRole === PROJECT_ROLES.OWNER &&
              !isOwner &&
              !isGuest;

            const isUpdating = updatingMemberId === member.userId;

            const isRemoving = removingMemberId === member.userId;

            const isTransferring = transferringUserId === member.userId;

            return (
              <article key={member.userId} className="member-card">
                <div className="member-card__identity">
                  <div className="member-avatar">
                    {member.name.charAt(0).toUpperCase()}
                  </div>

                  <div>
                    <h3>{member.name}</h3>
                    <p>{member.email}</p>

                    <div className="member-card__badges">
                      <span className="entity-badge">
                        {member.workspaceRole}
                      </span>

                      <span
                        className={
                          isGuest
                            ? "entity-badge entity-badge--private"
                            : "entity-badge entity-badge--open"
                        }
                      >
                        {member.memberType}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="member-card__controls">
                  {isOwner || !canManageMembers ? (
                    <span className="member-role">{member.projectRole}</span>
                  ) : (
                    <select
                      value={member.projectRole}
                      onChange={(event) =>
                        onRoleChange(member, event.target.value)
                      }
                      disabled={isUpdating || isRemoving || isTransferring}
                      aria-label={`Project role for ${member.name}`}
                    >
                      <option value={PROJECT_ROLES.CONTRIBUTOR}>
                        Contributor
                      </option>

                      <option value={PROJECT_ROLES.REVIEWER}>Reviewer</option>
                    </select>
                  )}

                  {canTransferOwnership && (
                    <button
                      type="button"
                      className="button button--secondary"
                      onClick={() => onTransferOwnership(member)}
                      disabled={isUpdating || isRemoving || isTransferring}
                    >
                      {isTransferring
                        ? "Transferring..."
                        : "Transfer Ownership"}
                    </button>
                  )}

                  {canManageMembers && !isOwner && (
                    <button
                      type="button"
                      className="button button--danger"
                      onClick={() => onRemove(member)}
                      disabled={isUpdating || isRemoving || isTransferring}
                    >
                      {isRemoving ? "Removing..." : "Remove"}
                    </button>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}

export default ProjectMemberList;
