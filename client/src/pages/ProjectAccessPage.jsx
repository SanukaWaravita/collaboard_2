import { useEffect, useState } from "react";
import {
  useNavigate,
  useParams,
} from "react-router";
import AccessPageHeader from "../components/AccessPageHeader";
import InviteMemberForm from "../components/InviteMemberForm";
import ProjectMemberList from "../components/ProjectMemberList";
import { INVITATION_STATUS, PROJECT_PERMISSIONS } from "../constants/access";
import { apiRequest, clearSession } from "../services/api";

function ProjectAccessPage() {
  const { workspaceId, projectId } = useParams();
  const navigate = useNavigate();

  const [project, setProject] = useState(null);
  const [members, setMembers] = useState([]);
  const [invitations, setInvitations] = useState([]);
  const [canManageMembers, setCanManageMembers] = useState(false);

  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  const [inviteFormKey, setInviteFormKey] = useState(0);
  const [isInviting, setIsInviting] = useState(false);
  const [inviteError, setInviteError] = useState("");

  const [updatingMemberId, setUpdatingMemberId] = useState(null);
  const [removingMemberId, setRemovingMemberId] = useState(null);
  const [transferringUserId, setTransferringUserId] = useState(null);
  const [cancellingInvitationId, setCancellingInvitationId] = useState(null);
  const [actionError, setActionError] = useState("");

  useEffect(() => {
    let shouldIgnore = false;

    async function loadProjectAccess() {
      setIsLoading(true);
      setLoadError("");

      try {
        const projectData = await apiRequest(`/projects/${projectId}`);

        if (projectData.project.workspaceId !== workspaceId) {
          throw new Error("Project does not belong to this workspace");
        }

        const canManage = projectData.project.permissions.includes(
          PROJECT_PERMISSIONS.MANAGE_MEMBERS,
        );

        if (!canManage) {
          throw new Error(
            "You do not have permission to manage this project's access",
          );
        }

        const [memberData, invitationData] = await Promise.all([
          apiRequest(`/projects/${projectId}/members`),
          apiRequest(`/projects/${projectId}/invitations`),
        ]);

        if (!shouldIgnore) {
          setProject(projectData.project);
          setMembers(memberData.members);
          setCanManageMembers(memberData.canManageMembers);
          setInvitations(invitationData.invitations);
        }
      } catch (requestError) {
        if (shouldIgnore) {
          return;
        }

        if (requestError.status === 401) {
          clearSession();
          navigate("/login", { replace: true });
          return;
        }

        setLoadError(requestError.message);
      } finally {
        if (!shouldIgnore) {
          setIsLoading(false);
        }
      }
    }

    loadProjectAccess();

    return () => {
      shouldIgnore = true;
    };
  }, [workspaceId, projectId, navigate, reloadKey]);

  async function handleInvite(invitationData) {
    setInviteError("");
    setIsInviting(true);

    try {
      const data = await apiRequest(`/projects/${projectId}/invitations`, {
        method: "POST",
        body: invitationData,
      });

      setInvitations((currentInvitations) => [
        data.invitation,
        ...currentInvitations,
      ]);

      setInviteFormKey((currentKey) => currentKey + 1);
    } catch (requestError) {
      if (requestError.status === 401) {
        clearSession();
        navigate("/login", { replace: true });
        return;
      }

      setInviteError(requestError.message);
    } finally {
      setIsInviting(false);
    }
  }

  async function handleRoleChange(member, role) {
    setActionError("");
    setUpdatingMemberId(member.userId);

    try {
      const data = await apiRequest(
        `/projects/${projectId}/members/${member.userId}`,
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
    } catch (requestError) {
      if (requestError.status === 401) {
        clearSession();
        navigate("/login", { replace: true });
        return;
      }

      setActionError(requestError.message);
    } finally {
      setUpdatingMemberId(null);
    }
  }

  async function handleRemoveMember(member) {
    const shouldRemove = window.confirm(
      `Remove "${member.name}" from this project?`,
    );

    if (!shouldRemove) {
      return;
    }

    setActionError("");
    setRemovingMemberId(member.userId);

    try {
      await apiRequest(`/projects/${projectId}/members/${member.userId}`, {
        method: "DELETE",
      });

      setMembers((currentMembers) =>
        currentMembers.filter(
          (currentMember) => currentMember.userId !== member.userId,
        ),
      );
    } catch (requestError) {
      if (requestError.status === 401) {
        clearSession();
        navigate("/login", { replace: true });
        return;
      }

      setActionError(requestError.message);
    } finally {
      setRemovingMemberId(null);
    }
  }

  async function handleTransferOwnership(member) {
    const shouldTransfer = window.confirm(
      `Transfer ownership of "${project.name}" to "${member.name}"?\n\nYou will become a contributor.`,
    );

    if (!shouldTransfer) {
      return;
    }

    setActionError("");
    setTransferringUserId(member.userId);

    try {
      await apiRequest(`/projects/${projectId}/transfer-ownership`, {
        method: "POST",
        body: {
          userId: member.userId,
        },
      });

      navigate(`/workspaces/${workspaceId}/projects/${projectId}`, {
        replace: true,
      });
    } catch (requestError) {
      if (requestError.status === 401) {
        clearSession();
        navigate("/login", { replace: true });
        return;
      }

      setActionError(requestError.message);
      setTransferringUserId(null);
    }
  }

  async function handleCancelInvitation(invitation) {
    const shouldCancel = window.confirm(
      `Cancel the invitation for "${invitation.email}"?`,
    );

    if (!shouldCancel) {
      return;
    }

    setActionError("");
    setCancellingInvitationId(invitation.id);

    try {
      const data = await apiRequest(
        `/projects/${projectId}/invitations/${invitation.id}`,
        {
          method: "DELETE",
        },
      );

      setInvitations((currentInvitations) =>
        currentInvitations.map((currentInvitation) =>
          currentInvitation.id === data.invitation.id
            ? data.invitation
            : currentInvitation,
        ),
      );
    } catch (requestError) {
      if (requestError.status === 401) {
        clearSession();
        navigate("/login", { replace: true });
        return;
      }

      setActionError(requestError.message);
    } finally {
      setCancellingInvitationId(null);
    }
  }

  if (isLoading) {
  return (
    <main className="board-page access-page">
        <p className="page-message" role="status">
          Loading project access...
        </p>
      </main>
    );
  }

if (loadError || !project) {
  return (
    <main className="board-page access-page">
        <section className="page-error">
          <p role="alert">{loadError || "Project not found"}</p>

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
              onClick={() =>
                navigate(`/workspaces/${workspaceId}/projects/${projectId}`)
              }
            >
              Project
            </button>
          </div>
        </section>
      </main>
    );
  }

  const pendingInvitations = invitations.filter(
    (invitation) => invitation.status === INVITATION_STATUS.PENDING,
  );

  const invitationHistory = invitations.filter(
    (invitation) => invitation.status !== INVITATION_STATUS.PENDING,
  );

return (
  <main className="board-page access-page">
      <AccessPageHeader
  title="Project Access"
  countLabel={
    `${members.length} ` +
    `${
      members.length === 1
        ? "Member"
        : "Members"
    }`
  }
  backTo={
    `/workspaces/${workspaceId}` +
    `/projects/${projectId}`
  }
  backLabel={
    `Back to ${project.name}`
  }
  metadata={[
    {
      label: project.projectKey,
      className: "project-header__key",
    },
    {
      label: project.name,
    },
    {
      label: project.visibility,
      className:
        "project-header__visibility",
    },
    {
      label:
        project.currentUserRole ??
        "Member",
      className: "project-header__role",
    },
  ]}
/>

      {actionError && (
        <p className="board-action-error" role="alert">
          {actionError}
        </p>
      )}

      <InviteMemberForm
        key={inviteFormKey}
        onSubmit={handleInvite}
        isSubmitting={isInviting}
        error={inviteError}
      />

      <ProjectMemberList
        project={project}
        members={members}
        canManageMembers={canManageMembers}
        updatingMemberId={updatingMemberId}
        removingMemberId={removingMemberId}
        transferringUserId={transferringUserId}
        onRoleChange={handleRoleChange}
        onRemove={handleRemoveMember}
        onTransferOwnership={handleTransferOwnership}
      />

      <section className="access-panel">
        <header className="access-panel__header">
          <div>
            <p className="task-form__eyebrow">Invitations</p>

            <h2>Pending invitations</h2>
          </div>
        </header>

        {pendingInvitations.length === 0 ? (
          <p className="access-empty">There are no pending invitations.</p>
        ) : (
          <div className="invitation-list">
            {pendingInvitations.map((invitation) => (
              <article key={invitation.id} className="invitation-card">
                <div>
                  <h3>{invitation.email}</h3>

                  <p>
                    {invitation.memberType}
                    {" · "}
                    {invitation.role}
                  </p>
                </div>

                <button
                  type="button"
                  className="button button--danger"
                  onClick={() => handleCancelInvitation(invitation)}
                  disabled={cancellingInvitationId === invitation.id}
                >
                  {cancellingInvitationId === invitation.id
                    ? "Cancelling..."
                    : "Cancel Invitation"}
                </button>
              </article>
            ))}
          </div>
        )}
      </section>

      {invitationHistory.length > 0 && (
        <section className="access-panel">
          <header className="access-panel__header">
            <div>
              <p className="task-form__eyebrow">Previous activity</p>

              <h2>Invitation history</h2>
            </div>
          </header>

          <div className="invitation-list">
            {invitationHistory.map((invitation) => (
              <article key={invitation.id} className="invitation-card">
                <div>
                  <h3>{invitation.email}</h3>

                  <p>
                    {invitation.memberType}
                    {" · "}
                    {invitation.role}
                  </p>
                </div>

                <span className="entity-badge">{invitation.status}</span>
              </article>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}

export default ProjectAccessPage;
