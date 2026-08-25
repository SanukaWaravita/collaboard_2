import { useEffect, useState } from "react";
import {
  useLocation,
  useNavigate,
} from "react-router";
import AccessPageHeader from "../components/AccessPageHeader";
import { apiRequest, clearSession } from "../services/api";

function resolveInvitationReturnTo(
  search,
) {
  const requestedReturnTo =
    new URLSearchParams(search).get(
      "returnTo",
    );

  const isValidWorkspacePath =
    requestedReturnTo === "/workspaces" ||
    requestedReturnTo?.startsWith(
      "/workspaces/",
    );

  return isValidWorkspacePath
    ? requestedReturnTo
    : "/workspaces";
}

function InvitationsPage() {
  const location = useLocation();
  const navigate = useNavigate();

  const returnTo =
    resolveInvitationReturnTo(
      location.search,
    );

  const [invitations, setInvitations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  const [respondingInvitationId, setRespondingInvitationId] = useState(null);
  const [actionError, setActionError] = useState("");

  useEffect(() => {
    let shouldIgnore = false;

    async function loadInvitations() {
      setIsLoading(true);
      setLoadError("");

      try {
        const data = await apiRequest("/invitations");

        if (!shouldIgnore) {
          setInvitations(data.invitations);
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

    loadInvitations();

    return () => {
      shouldIgnore = true;
    };
  }, [navigate, reloadKey]);

  async function handleAccept(invitation) {
    setActionError("");
    setRespondingInvitationId(invitation.id);

    try {
      await apiRequest(`/invitations/${invitation.id}/accept`, {
        method: "POST",
      });

      navigate("/workspaces");
    } catch (requestError) {
      if (requestError.status === 401) {
        clearSession();
        navigate("/login", { replace: true });
        return;
      }

      setActionError(requestError.message);
      setRespondingInvitationId(null);
    }
  }

  async function handleDecline(invitation) {
    const shouldDecline = window.confirm(
      `Decline the invitation to "${invitation.project?.name}"?`,
    );

    if (!shouldDecline) {
      return;
    }

    setActionError("");
    setRespondingInvitationId(invitation.id);

    try {
      await apiRequest(`/invitations/${invitation.id}/decline`, {
        method: "POST",
      });

      setInvitations((currentInvitations) =>
        currentInvitations.filter(
          (currentInvitation) => currentInvitation.id !== invitation.id,
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
      setRespondingInvitationId(null);
    }
  }

  return (
  <main className="board-page access-page">
      <AccessPageHeader
  title="My Invitations"
  countLabel={
    isLoading
      ? "Loading"
      : `${invitations.length} ${
          invitations.length === 1
            ? "Invitation"
            : "Invitations"
        }`
  }
  backTo={returnTo}
  backLabel="Back to previous CollaBoard page"
  metadata={[
    {
      label: "Project invitations",
      className: "project-header__key",
    },
    {
      label:
        "Accept or decline invitations " +
        "sent to your account",
    },
  ]}
/>

      {actionError && (
        <p className="board-action-error" role="alert">
          {actionError}
        </p>
      )}

      {isLoading && (
        <p className="page-message" role="status">
          Loading invitations...
        </p>
      )}

      {!isLoading && loadError && (
        <section className="page-error">
          <p role="alert">{loadError}</p>

          <button
            type="button"
            className="button button--secondary"
            onClick={() => setReloadKey((currentKey) => currentKey + 1)}
          >
            Try Again
          </button>
        </section>
      )}

      {!isLoading && !loadError && invitations.length === 0 && (
        <section className="empty-state">
          <h2>No pending invitations</h2>

          <p>
            Project invitations sent to your email address will appear here.
          </p>
        </section>
      )}

      {!isLoading && !loadError && invitations.length > 0 && (
        <section className="invitation-list">
          {invitations.map((invitation) => (
            <article
              key={invitation.id}
              className="invitation-card invitation-card--received"
            >
              <div>
                <span className="project-key">
                  {invitation.project?.projectKey ?? "PROJECT"}
                </span>

                <h2>{invitation.project?.name ?? "Unavailable project"}</h2>

                <p>
                  Workspace:{" "}
                  {invitation.workspace?.name ?? "Unavailable workspace"}
                </p>

                <p>
                  Invited as <strong>{invitation.role}</strong>
                  {" · "}
                  {invitation.memberType}
                </p>

                {invitation.invitedBy && (
                  <p>Invited by {invitation.invitedBy.name}</p>
                )}
              </div>

              <div className="invitation-card__actions">
                <button
                  type="button"
                  className="button button--secondary"
                  onClick={() => handleDecline(invitation)}
                  disabled={respondingInvitationId === invitation.id}
                >
                  Decline
                </button>

                <button
                  type="button"
                  className="button button--primary"
                  onClick={() => handleAccept(invitation)}
                  disabled={respondingInvitationId === invitation.id}
                >
                  {respondingInvitationId === invitation.id
                    ? "Responding..."
                    : "Accept Invitation"}
                </button>
              </div>
            </article>
          ))}
        </section>
      )}
    </main>
  );
}

export default InvitationsPage;
