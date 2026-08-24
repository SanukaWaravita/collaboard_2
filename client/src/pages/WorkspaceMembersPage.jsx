import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import WorkspaceMemberAccessCard from "../components/WorkspaceMemberAccessCard";
import { apiRequest, clearSession } from "../services/api";

function formatInvitationDate(value) {
  if (!value) {
    return "Unknown date";
  }

  return new Intl.DateTimeFormat(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}
function calculateAccessSummary(projectAccess) {
  return {
    totalProjects: projectAccess.length,

    accessibleProjectCount: projectAccess.filter((access) => access.hasAccess)
      .length,

    explicitProjectCount: projectAccess.filter(
      (access) => access.accessSource === "EXPLICIT",
    ).length,

    inheritedProjectCount: projectAccess.filter(
      (access) => access.accessSource === "INHERITED",
    ).length,
  };
}

function replaceProjectAccess(member, updatedAccess) {
  const projectAccess = member.projectAccess.map((access) =>
    access.projectId === updatedAccess.projectId ? updatedAccess : access,
  );

  return {
    ...member,
    projectAccess,
    accessSummary: calculateAccessSummary(projectAccess),
  };
}

function WorkspaceMembersPage() {
  const { workspaceId } = useParams();
  const navigate = useNavigate();

  const [workspace, setWorkspace] = useState(null);

  const [members, setMembers] = useState([]);

  const [pendingInvitations, setPendingInvitations] = useState([]);

  const [currentUserId, setCurrentUserId] = useState(null);

  const [isLoading, setIsLoading] = useState(true);

  const [loadError, setLoadError] = useState("");

  const [reloadKey, setReloadKey] = useState(0);

  const [activeActionKey, setActiveActionKey] = useState(null);

  const [actionError, setActionError] = useState("");

  const [actionNotice, setActionNotice] = useState("");

  useEffect(() => {
    let shouldIgnore = false;

    async function loadWorkspaceMembers() {
      setIsLoading(true);
      setLoadError("");

      try {
        const data = await apiRequest(`/workspaces/${workspaceId}/members`);

        if (!shouldIgnore) {
          setWorkspace(data.workspace);
          setMembers(data.members);
          setPendingInvitations(data.pendingInvitations);
          setCurrentUserId(data.currentUserId);
        }
      } catch (requestError) {
        if (shouldIgnore) {
          return;
        }

        if (requestError.status === 401) {
          clearSession();

          navigate("/login", {
            replace: true,
          });

          return;
        }

        setLoadError(requestError.message);
      } finally {
        if (!shouldIgnore) {
          setIsLoading(false);
        }
      }
    }

    loadWorkspaceMembers();

    return () => {
      shouldIgnore = true;
    };
  }, [workspaceId, navigate, reloadKey]);

  function handleActionError(requestError) {
    if (requestError.status === 401) {
      clearSession();

      navigate("/login", {
        replace: true,
      });

      return;
    }

    setActionError(requestError.message);
  }

  async function handleWorkspaceRoleChange(member, role) {
    if (role === member.workspaceRole) {
      return;
    }

    if (
      role === "GUEST" &&
      !window.confirm(
        `Convert ${member.name} into a guest? ` +
          "They will lose inherited access to open Projects.",
      )
    ) {
      return;
    }

    const actionKey = `workspace:${member.userId}`;

    setActiveActionKey(actionKey);
    setActionError("");
    setActionNotice("");

    try {
      const data = await apiRequest(
        `/workspaces/${workspaceId}` + `/members/${member.userId}`,
        {
          method: "PATCH",
          body: { role },
        },
      );

      setMembers((currentMembers) =>
        currentMembers.map((currentMember) =>
          currentMember.userId === data.member.userId
            ? data.member
            : currentMember,
        ),
      );

      const gainedCount = data.accessChanges.gainedInheritedAccess.length;

      const lostCount = data.accessChanges.lostInheritedAccess.length;

      setActionNotice(
        `${member.name}'s Workspace role ` +
          `changed from ${data.previousRole} ` +
          `to ${data.member.workspaceRole}. ` +
          `${gainedCount} inherited access gained; ` +
          `${lostCount} lost.`,
      );
    } catch (requestError) {
      handleActionError(requestError);
    } finally {
      setActiveActionKey(null);
    }
  }

  async function handleProjectRoleChange(member, access, role) {
    if (access.isProjectMember && role === access.projectRole) {
      return;
    }

    const actionKey = `project:${member.userId}:` + `${access.projectId}`;

    setActiveActionKey(actionKey);
    setActionError("");
    setActionNotice("");

    try {
      const data = await apiRequest(
        `/workspaces/${workspaceId}` +
          `/members/${member.userId}` +
          `/projects/${access.projectId}`,
        {
          method: "PUT",
          body: { role },
        },
      );

      setMembers((currentMembers) =>
        currentMembers.map((currentMember) =>
          currentMember.userId === member.userId
            ? replaceProjectAccess(currentMember, data.projectAccess)
            : currentMember,
        ),
      );

      const assignmentMessage =
        data.unassignedTaskCount > 0
          ? ` ${data.unassignedTaskCount} Task ` +
            `${
              data.unassignedTaskCount === 1
                ? "assignment was"
                : "assignments were"
            } removed.`
          : "";

      setActionNotice(
        `${member.name}'s access to ` +
          `${access.projectKey} was ` +
          `${data.action.toLowerCase()} as ` +
          `${data.projectAccess.projectRole}.` +
          assignmentMessage,
      );
    } catch (requestError) {
      handleActionError(requestError);
    } finally {
      setActiveActionKey(null);
    }
  }

  async function handleRemoveProjectAccess(member, access) {
    const inheritedWarning =
      access.visibility === "open" && member.memberType === "INTERNAL"
        ? " Read-only inherited access will remain."
        : "";

    const shouldRemove = window.confirm(
      `Remove ${member.name}'s explicit access ` +
        `to ${access.projectKey}?` +
        inheritedWarning,
    );

    if (!shouldRemove) {
      return;
    }

    const actionKey = `project:${member.userId}:` + `${access.projectId}`;

    setActiveActionKey(actionKey);
    setActionError("");
    setActionNotice("");

    try {
      const data = await apiRequest(
        `/workspaces/${workspaceId}` +
          `/members/${member.userId}` +
          `/projects/${access.projectId}`,
        {
          method: "DELETE",
        },
      );

      if (data.workspaceMembershipRemoved) {
        setMembers((currentMembers) =>
          currentMembers.filter(
            (currentMember) => currentMember.userId !== member.userId,
          ),
        );
      } else {
        setMembers((currentMembers) =>
          currentMembers.map((currentMember) =>
            currentMember.userId === member.userId
              ? replaceProjectAccess(currentMember, data.remainingProjectAccess)
              : currentMember,
          ),
        );
      }

      const remainingDescription = data.remainingProjectAccess.hasAccess
        ? "Inherited read-only access remains."
        : "The user can no longer access this Project.";

      const assignmentMessage =
        data.unassignedTaskCount > 0
          ? ` ${data.unassignedTaskCount} Task ` +
            `${
              data.unassignedTaskCount === 1
                ? "assignment was"
                : "assignments were"
            } removed.`
          : "";

      setActionNotice(
        `Explicit access to ${access.projectKey} ` +
          `was removed. ${remainingDescription}` +
          assignmentMessage,
      );
    } catch (requestError) {
      handleActionError(requestError);
    } finally {
      setActiveActionKey(null);
    }
  }

  async function handleRemoveWorkspaceMember(member) {
    const explicitProjects = member.projectAccess.filter(
      (access) => access.isProjectMember,
    );

    const explicitProjectNames = explicitProjects
      .map((access) => `${access.projectKey} (${access.projectRole})`)
      .join(", ");

    const projectDescription =
      explicitProjects.length === 0
        ? "No explicit Project memberships will be removed."
        : `${explicitProjects.length} explicit ` +
          `${
            explicitProjects.length === 1
              ? "Project membership"
              : "Project memberships"
          } will be removed: ` +
          `${explicitProjectNames}.`;

    const shouldRemove = window.confirm(
      `Remove ${member.name} from ` +
        `${workspace.name}?\n\n` +
        `${projectDescription}\n\n` +
        "This will also:\n" +
        "• clear their Task assignments in this Workspace;\n" +
        "• cancel their pending Workspace invitations;\n" +
        "• remove inherited access to open Projects.\n\n" +
        "Their CollaBoard account and memberships in other " +
        "Workspaces will not be deleted.",
    );

    if (!shouldRemove) {
      return;
    }

    const actionKey = `remove-member:${member.userId}`;

    setActiveActionKey(actionKey);
    setActionError("");
    setActionNotice("");

    try {
      const data = await apiRequest(
        `/workspaces/${workspaceId}` + `/members/${member.userId}`,
        {
          method: "DELETE",
        },
      );

      setMembers((currentMembers) =>
        currentMembers.filter(
          (currentMember) => currentMember.userId !== member.userId,
        ),
      );

      if (data.cancelledInvitationCount > 0) {
        setPendingInvitations((currentInvitations) =>
          currentInvitations.filter(
            (invitation) => invitation.email !== data.removedMember.email,
          ),
        );
      }

      const projectMembershipCount = data.removedProjectMemberships.length;

      setActionNotice(
        `${data.removedMember.name} was removed ` +
          `from the Workspace. ` +
          `${projectMembershipCount} ` +
          `${
            projectMembershipCount === 1
              ? "Project membership"
              : "Project memberships"
          } removed; ` +
          `${data.totalUnassignedTaskCount} Task ` +
          `${
            data.totalUnassignedTaskCount === 1 ? "assignment" : "assignments"
          } cleared; ` +
          `${data.cancelledInvitationCount} pending ` +
          `${
            data.cancelledInvitationCount === 1 ? "invitation" : "invitations"
          } cancelled.`,
      );
    } catch (requestError) {
      handleActionError(requestError);
    } finally {
      setActiveActionKey(null);
    }
  }

  if (isLoading) {
    return (
      <main className="access-page">
        <p className="page-message" role="status">
          Loading Workspace members...
        </p>
      </main>
    );
  }

  if (loadError || !workspace) {
    return (
      <main className="access-page">
        <section className="page-error">
          <p role="alert">{loadError || "Workspace not found"}</p>

          <div className="page-error__actions">
            <button
              type="button"
              className="button button--secondary"
              onClick={() => setReloadKey((currentKey) => currentKey + 1)}
            >
              Try Again
            </button>

            <button
              type="button"
              className="button button--primary"
              onClick={() => navigate(`/workspaces/${workspaceId}/projects`)}
            >
              Projects
            </button>
          </div>
        </section>
      </main>
    );
  }

  const currentMember = members.find(
    (member) => member.userId === currentUserId,
  );

  const canManageAdminRoles = currentMember?.workspaceRole === "OWNER";

  return (
    <main className="access-page">
      <header className="boards-header">
        <div>
          <Link
            to={`/workspaces/${workspaceId}` + `/projects`}
            className="project-header__back"
          >
            ← Back to Projects
          </Link>

          <p className="board-header__eyebrow">{workspace.slug}</p>

          <h1>Members & Access</h1>

          <p>
            Review and manage Workspace roles, Project membership, and effective
            permissions.
          </p>
        </div>
      </header>

      {actionError && (
        <p className="board-action-error" role="alert">
          {actionError}
        </p>
      )}

      {actionNotice && (
        <p className="workspace-action-notice" role="status">
          {actionNotice}
        </p>
      )}

      <section className="access-panel workspace-access-overview">
        <header className="access-panel__header">
          <div>
            <p className="task-form__eyebrow">Workspace directory</p>

            <h2>
              {members.length} {members.length === 1 ? "member" : "members"}
            </h2>

            <p>
              Open-Project access may be inherited by internal Workspace
              members.
            </p>
          </div>
        </header>

        {members.length === 0 ? (
          <p className="access-empty">
            This Workspace currently has no members.
          </p>
        ) : (
          <div className="workspace-member-list">
            {members.map((member) => (
              <WorkspaceMemberAccessCard
                key={member.userId}
                member={member}
                isCurrentUser={member.userId === currentUserId}
                canManageAdminRoles={canManageAdminRoles}
                activeActionKey={activeActionKey}
                onWorkspaceRoleChange={handleWorkspaceRoleChange}
                onProjectRoleChange={handleProjectRoleChange}
                onRemoveProjectAccess={handleRemoveProjectAccess}
                onRemoveWorkspaceMember={handleRemoveWorkspaceMember}
              />
            ))}
          </div>
        )}
      </section>
      <section className="access-panel">
        <header className="access-panel__header">
          <div>
            <p className="task-form__eyebrow">Awaiting response</p>

            <h2>Pending Project invitations</h2>

            <p>
              Invitations for internal and guest access within this Workspace.
            </p>
          </div>

          <span className="entity-badge">{pendingInvitations.length}</span>
        </header>

        {pendingInvitations.length === 0 ? (
          <p className="access-empty">
            There are no pending invitations in this Workspace.
          </p>
        ) : (
          <div className="workspace-invitation-list">
            {pendingInvitations.map((invitation) => (
              <article
                key={invitation.id}
                className="workspace-invitation-card"
              >
                <div className="workspace-invitation-card__identity">
                  <h3>{invitation.email}</h3>

                  <p>
                    Invited {formatInvitationDate(invitation.createdAt)}
                    {invitation.invitedBy
                      ? ` by ${invitation.invitedBy.name}`
                      : ""}
                  </p>
                </div>

                <div className="workspace-invitation-card__project">
                  {invitation.project ? (
                    <>
                      <span className="project-key">
                        {invitation.project.projectKey}
                      </span>

                      <strong>{invitation.project.name}</strong>

                      <span
                        className={
                          `entity-badge ` +
                          `entity-badge--` +
                          `${invitation.project.visibility}`
                        }
                      >
                        {invitation.project.visibility}
                      </span>
                    </>
                  ) : (
                    <span>Project unavailable</span>
                  )}
                </div>

                <div className="workspace-invitation-card__access">
                  <span
                    className={
                      invitation.memberType === "GUEST"
                        ? "entity-badge entity-badge--private"
                        : "entity-badge entity-badge--open"
                    }
                  >
                    {invitation.memberType}
                  </span>

                  <span className="entity-badge">{invitation.role}</span>

                  <span className="workspace-access-source workspace-access-source--inherited">
                    Pending
                  </span>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}

export default WorkspaceMembersPage;
