import { MEMBER_TYPES, PROJECT_ROLES } from "../constants/access";

function InviteMemberForm({ onSubmit, isSubmitting = false, error = "" }) {
  function handleSubmit(event) {
    event.preventDefault();

    if (isSubmitting) {
      return;
    }

    const formData = new FormData(event.currentTarget);

    const email = String(formData.get("email") ?? "")
      .trim()
      .toLowerCase();

    const role = String(formData.get("role") ?? PROJECT_ROLES.REVIEWER);

    const memberType = String(
      formData.get("memberType") ?? MEMBER_TYPES.INTERNAL,
    );

    if (!email) {
      return;
    }

    onSubmit({
      email,
      role,
      memberType,
    });
  }

  return (
    <form className="access-panel" onSubmit={handleSubmit}>
      <header className="access-panel__header">
        <div>
          <p className="task-form__eyebrow">Project access</p>

          <h2>Invite a member</h2>

          <p>
            Invite an internal workspace member or a guest user to this project.
          </p>
        </div>
      </header>

      <div className="access-form-grid">
        <div className="task-form__field">
          <label htmlFor="invitation-email">Email address</label>

          <input
            id="invitation-email"
            name="email"
            type="email"
            placeholder="member@example.com"
            required
            disabled={isSubmitting}
          />
        </div>

        <div className="task-form__field">
          <label htmlFor="invitation-role">Project role</label>

          <select
            id="invitation-role"
            name="role"
            defaultValue={PROJECT_ROLES.REVIEWER}
            disabled={isSubmitting}
          >
            <option value={PROJECT_ROLES.CONTRIBUTOR}>Contributor</option>

            <option value={PROJECT_ROLES.REVIEWER}>Reviewer</option>
          </select>
        </div>

        <div className="task-form__field">
          <label htmlFor="invitation-member-type">Member type</label>

          <select
            id="invitation-member-type"
            name="memberType"
            defaultValue={MEMBER_TYPES.INTERNAL}
            disabled={isSubmitting}
          >
            <option value={MEMBER_TYPES.INTERNAL}>Internal member</option>

            <option value={MEMBER_TYPES.GUEST}>Guest user</option>
          </select>
        </div>
      </div>

      <div className="access-role-help">
        <p>
          <strong>Contributor:</strong> Can create, update, and delete tasks.
        </p>

        <p>
          <strong>Reviewer:</strong> Can view the project and its tasks without
          modifying them.
        </p>

        <p>
          <strong>Guest:</strong> Can access only projects to which they are
          explicitly assigned.
        </p>
      </div>

      {error && (
        <p className="auth-form__error" role="alert">
          {error}
        </p>
      )}

      <button
        type="submit"
        className="button button--primary"
        disabled={isSubmitting}
      >
        {isSubmitting ? "Sending Invitation..." : "Send Invitation"}
      </button>
    </form>
  );
}

export default InviteMemberForm;
